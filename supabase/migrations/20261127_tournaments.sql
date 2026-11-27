-- Tornei (2026-11-27).
-- L'amministratore crea il torneo; i giocatori si iscrivono finché le iscrizioni sono aperte;
-- a ogni turno l'amministratore genera i tavoli: ogni tavolo è una normale partita privata.
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 3 AND 80),
  status text NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'running', 'finished')),
  rounds_planned integer NOT NULL DEFAULT 3 CHECK (rounds_planned BETWEEN 1 AND 10),
  current_round integer NOT NULL DEFAULT 0 CHECK (current_round >= 0),
  game_length text NOT NULL DEFAULT 'breve' CHECK (game_length IN ('breve', 'media', 'lunga')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.tournament_players (
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.tournament_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL CHECK (round >= 1),
  table_no integer NOT NULL CHECK (table_no >= 1),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  seats jsonb NOT NULL,              -- [{ "player_id": uuid, "faction": "Iran" }, …]
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round, table_no)
);
CREATE INDEX IF NOT EXISTS tournament_tables_tournament_idx ON public.tournament_tables (tournament_id, round);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_tables ENABLE ROW LEVEL SECURITY;

-- Lettura: tutti gli utenti registrati vedono tornei, iscritti e tavoli.
DROP POLICY IF EXISTS tournaments_select ON public.tournaments;
CREATE POLICY tournaments_select ON public.tournaments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS tournament_players_select ON public.tournament_players;
CREATE POLICY tournament_players_select ON public.tournament_players FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS tournament_tables_select ON public.tournament_tables;
CREATE POLICY tournament_tables_select ON public.tournament_tables FOR SELECT TO authenticated USING (true);

-- Gestione dei tornei: solo l'amministratore.
DROP POLICY IF EXISTS tournaments_admin_write ON public.tournaments;
CREATE POLICY tournaments_admin_write ON public.tournaments FOR ALL TO authenticated
  USING ((SELECT public.is_linea_rossa_admin())) WITH CHECK ((SELECT public.is_linea_rossa_admin()));
DROP POLICY IF EXISTS tournament_tables_admin_write ON public.tournament_tables;
CREATE POLICY tournament_tables_admin_write ON public.tournament_tables FOR ALL TO authenticated
  USING ((SELECT public.is_linea_rossa_admin())) WITH CHECK ((SELECT public.is_linea_rossa_admin()));

-- Iscrizione: ognuno iscrive o ritira solo sé stesso, e solo a iscrizioni aperte. L'amministratore sempre.
DROP POLICY IF EXISTS tournament_players_join ON public.tournament_players;
CREATE POLICY tournament_players_join ON public.tournament_players FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_linea_rossa_admin()) OR (player_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.status = 'registration')));
DROP POLICY IF EXISTS tournament_players_leave ON public.tournament_players;
CREATE POLICY tournament_players_leave ON public.tournament_players FOR DELETE TO authenticated
  USING ((SELECT public.is_linea_rossa_admin()) OR (player_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.status = 'registration')));

-- Crea il tavolo di un turno: una partita privata con i giocatori già seduti alla loro potenza.
-- I posti senza giocatore diventano BOT quando l'amministratore avvia la partita.
CREATE OR REPLACE FUNCTION public.tournament_create_table(p_tournament uuid, p_round integer, p_table integer, p_seats jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  t public.tournaments%ROWTYPE;
  planned public.tournament_tables%ROWTYPE;
  v_game uuid;
  v_code text;
  seat jsonb;
  i integer := 0;
BEGIN
  IF NOT public.is_linea_rossa_admin() THEN RAISE EXCEPTION 'Solo l''amministratore gestisce i tornei' USING ERRCODE = '42501'; END IF;
  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Torneo inesistente'; END IF;
  -- Ripresa di un avvio interrotto: il tavolo già pianificato conserva i suoi posti.
  SELECT * INTO planned FROM public.tournament_tables WHERE tournament_id = p_tournament AND round = p_round AND table_no = p_table;
  IF FOUND AND planned.game_id IS NOT NULL THEN RETURN planned.game_id; END IF;
  IF FOUND THEN p_seats := planned.seats; END IF;
  IF jsonb_typeof(p_seats) <> 'array' OR jsonb_array_length(p_seats) NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Da 1 a 5 giocatori per tavolo'; END IF;
  FOR seat IN SELECT * FROM jsonb_array_elements(p_seats) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.tournament_players WHERE tournament_id = p_tournament AND player_id = (seat->>'player_id')::uuid) THEN
      RAISE EXCEPTION 'Giocatore non iscritto al torneo';
    END IF;
  END LOOP;
  LOOP
    v_code := 'TR' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.games WHERE code = v_code);
  END LOOP;
  INSERT INTO public.games (code, name, created_by, is_public, allow_join, game_length, max_turns, track_limit)
  VALUES (v_code, left(t.name, 50) || ' · Turno ' || p_round || ' · Tavolo ' || p_table, auth.uid(), false, false, t.game_length,
          CASE t.game_length WHEN 'breve' THEN 30 WHEN 'media' THEN 60 ELSE 80 END,
          CASE t.game_length WHEN 'breve' THEN 30 WHEN 'media' THEN 60 ELSE 80 END)
  RETURNING id INTO v_game;
  FOR seat IN SELECT * FROM jsonb_array_elements(p_seats) LOOP
    i := i + 1;
    INSERT INTO public.game_players (game_id, faction, player_id, is_bot, is_ready, turn_order)
    VALUES (v_game, seat->>'faction', (seat->>'player_id')::uuid, false, true,
            array_position(ARRAY['Iran','Coalizione','Russia','Cina','Europa'], seat->>'faction'));
  END LOOP;
  IF planned.id IS NOT NULL THEN
    UPDATE public.tournament_tables SET game_id = v_game WHERE id = planned.id;
  ELSE
    INSERT INTO public.tournament_tables (tournament_id, round, table_no, game_id, seats)
    VALUES (p_tournament, p_round, p_table, v_game, p_seats);
  END IF;
  RETURN v_game;
END $$;
REVOKE ALL ON FUNCTION public.tournament_create_table(uuid, integer, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tournament_create_table(uuid, integer, integer, jsonb) TO authenticated;

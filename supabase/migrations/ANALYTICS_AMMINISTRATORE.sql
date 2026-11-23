-- Statistiche amministratore Linea Rossa.
-- Le sessioni di accesso sono raccolte da questa installazione in avanti.

CREATE TABLE IF NOT EXISTS public.user_access_sessions (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  timezone text NOT NULL DEFAULT 'UTC',
  CONSTRAINT user_access_sessions_time_order
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS user_access_sessions_user_started_idx
  ON public.user_access_sessions (user_id, started_at DESC);

ALTER TABLE public.user_access_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_access_sessions FROM anon, authenticated;
GRANT SELECT ON public.user_access_sessions TO authenticated;

CREATE OR REPLACE FUNCTION public.is_linea_rossa_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'sdaddino@yahoo.it';
$$;

REVOKE ALL ON FUNCTION public.is_linea_rossa_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_linea_rossa_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_game_started_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active'
    AND OLD.status IS DISTINCT FROM 'active'
    AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS games_set_started_at ON public.games;
CREATE TRIGGER games_set_started_at
  BEFORE UPDATE OF status ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.set_game_started_at();

DROP POLICY IF EXISTS "Admin legge le sessioni di accesso" ON public.user_access_sessions;
CREATE POLICY "Admin legge le sessioni di accesso"
  ON public.user_access_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_linea_rossa_admin());

CREATE OR REPLACE FUNCTION public.start_user_access_session(
  p_session_id uuid,
  p_timezone text DEFAULT 'UTC'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_timezone text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta';
  END IF;
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'ID sessione mancante';
  END IF;

  SELECT name INTO v_timezone
  FROM pg_timezone_names
  WHERE name = p_timezone
  LIMIT 1;

  INSERT INTO public.user_access_sessions (session_id, user_id, started_at, last_seen_at, timezone)
  VALUES (p_session_id, v_user_id, now(), now(), coalesce(v_timezone, 'UTC'))
  ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = now(),
        timezone = excluded.timezone
    WHERE public.user_access_sessions.user_id = v_user_id
      AND public.user_access_sessions.ended_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_user_access_session(
  p_session_id uuid,
  p_timezone text DEFAULT 'UTC'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_timezone text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta';
  END IF;

  SELECT name INTO v_timezone
  FROM pg_timezone_names
  WHERE name = p_timezone
  LIMIT 1;

  UPDATE public.user_access_sessions
  SET last_seen_at = now(),
      timezone = coalesce(v_timezone, 'UTC')
  WHERE session_id = p_session_id
    AND user_id = v_user_id
    AND ended_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_user_access_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta';
  END IF;

  UPDATE public.user_access_sessions
  SET ended_at = now(),
      last_seen_at = now()
  WHERE session_id = p_session_id
    AND user_id = v_user_id
    AND ended_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.start_user_access_session(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.heartbeat_user_access_session(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.end_user_access_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_user_access_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_user_access_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_user_access_session(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.game_player_results (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  faction text NOT NULL,
  final_score integer NOT NULL,
  final_position integer NOT NULL,
  is_winner boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, player_id)
);

ALTER TABLE public.game_player_results
  ADD COLUMN IF NOT EXISTS is_winner boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS game_player_results_player_idx
  ON public.game_player_results (player_id, recorded_at DESC);

ALTER TABLE public.game_player_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin legge i risultati individuali" ON public.game_player_results;
CREATE POLICY "Admin legge i risultati individuali"
  ON public.game_player_results
  FOR SELECT
  TO authenticated
  USING (public.is_linea_rossa_admin());

REVOKE ALL ON public.game_player_results FROM anon, authenticated;
GRANT SELECT ON public.game_player_results TO authenticated;

CREATE OR REPLACE FUNCTION public.capture_game_player_results(p_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH game_context AS (
    SELECT
      g.id AS game_id,
      g.winner_faction,
      coalesce(gs.special_uses -> 'tabletop_v3' -> 'state', '{}'::jsonb) AS tabletop_state,
      coalesce(gs.nucleare, 0)::numeric AS nucleare,
      coalesce(gs.sanzioni, 0)::numeric AS sanzioni,
      coalesce(gs.risorse_iran, 0)::numeric AS risorse_iran,
      coalesce(gs.risorse_coalizione, 0)::numeric AS risorse_coalizione,
      coalesce(gs.influenza_militare_russia, 0)::numeric AS influenza_militare_russia,
      coalesce(gs.stabilita_russia, 0)::numeric AS stabilita_russia,
      coalesce(gs.opinione, 0)::numeric AS opinione,
      coalesce(gs.influenza_commerciale_cina, 0)::numeric AS influenza_commerciale_cina,
      coalesce(gs.stabilita_rotte_cina, 0)::numeric AS stabilita_rotte_cina,
      coalesce(gs.defcon, 0)::numeric AS defcon,
      coalesce(sum(t.inf_iran), 0)::numeric AS inf_iran,
      coalesce(sum(t.inf_coalizione), 0)::numeric AS inf_coalizione,
      coalesce(sum(t.inf_russia), 0)::numeric AS inf_russia,
      coalesce(sum(t.inf_cina), 0)::numeric AS inf_cina,
      coalesce(sum(t.inf_europa), 0)::numeric AS inf_europa
    FROM public.games g
    LEFT JOIN LATERAL (
      SELECT s.*
      FROM public.game_state s
      WHERE s.game_id = g.id
      ORDER BY s.updated_at DESC NULLS LAST
      LIMIT 1
    ) gs ON true
    LEFT JOIN public.territories t ON t.game_id = g.id
    WHERE g.id = p_game_id
      AND g.status = 'finished'
      AND gs.id IS NOT NULL
    GROUP BY g.id, g.winner_faction, gs.special_uses, gs.nucleare, gs.sanzioni,
      gs.risorse_iran, gs.risorse_coalizione, gs.influenza_militare_russia,
      gs.stabilita_russia, gs.opinione, gs.influenza_commerciale_cina,
      gs.stabilita_rotte_cina, gs.defcon
  ),
  faction_scores AS (
    SELECT
      gc.game_id,
      gc.winner_faction,
      gc.tabletop_state,
      gp.player_id,
      gp.faction,
      coalesce((gc.tabletop_state -> 'players' -> gp.faction ->> 'neutral')::boolean, false) AS is_neutral,
      CASE
        WHEN jsonb_typeof(gc.tabletop_state -> 'result' -> 'scores') = 'object'
          AND (gc.tabletop_state -> 'result' -> 'scores') ? gp.faction
          THEN floor(((gc.tabletop_state -> 'result' -> 'scores' ->> gp.faction)::numeric) + 0.5)::integer
        ELSE CASE gp.faction
          WHEN 'Iran' THEN floor(gc.nucleare * 2 + gc.risorse_iran * 2.5 - gc.sanzioni / 3 + gc.inf_iran + 0.5)::integer
          WHEN 'Coalizione' THEN floor(gc.sanzioni * 2 + gc.risorse_coalizione * 2 - gc.nucleare / 3 + gc.inf_coalizione + 0.5)::integer
          WHEN 'Russia' THEN floor(gc.influenza_militare_russia * 2.5 + gc.stabilita_russia * 2 - gc.opinione / 2 + gc.inf_russia + 0.5)::integer
          WHEN 'Cina' THEN floor(gc.influenza_commerciale_cina * 2.5 + gc.stabilita_rotte_cina * 2 - gc.sanzioni / 4 + gc.inf_cina + 0.5)::integer
          WHEN 'Europa' THEN floor(gc.defcon * 3 + gc.opinione * 3.5 - gc.nucleare / 2 + gc.inf_europa + 0.5)::integer
          ELSE 0
        END
      END AS final_score,
      CASE
        WHEN jsonb_typeof(gc.tabletop_state -> 'result' -> 'winners') = 'array'
          THEN (gc.tabletop_state -> 'result' -> 'winners') ? gp.faction
        ELSE coalesce(gc.winner_faction = gp.faction, false)
      END AS is_winner
    FROM game_context gc
    JOIN public.game_players gp ON gp.game_id = gc.game_id
  ),
  ranked AS (
    SELECT
      game_id,
      player_id,
      faction,
      final_score,
      is_winner,
      is_neutral,
      rank() OVER (
        ORDER BY
          is_winner DESC,
          final_score DESC
      )::integer AS final_position
    FROM faction_scores
    WHERE NOT is_neutral
  )
  INSERT INTO public.game_player_results (
    game_id, player_id, faction, final_score, final_position, is_winner, recorded_at
  )
  SELECT game_id, player_id, faction, final_score, final_position, is_winner, now()
  FROM ranked
  WHERE player_id IS NOT NULL
  ON CONFLICT (game_id, player_id) DO UPDATE
    SET faction = excluded.faction,
        final_score = excluded.final_score,
        final_position = excluded.final_position,
        is_winner = excluded.is_winner,
        recorded_at = excluded.recorded_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_game_finished_capture_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.capture_game_player_results(NEW.id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_game_player_results(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.on_game_finished_capture_results() FROM PUBLIC;

DROP TRIGGER IF EXISTS games_capture_player_results ON public.games;
CREATE TRIGGER games_capture_player_results
  AFTER UPDATE OF status ON public.games
  FOR EACH ROW
  WHEN (NEW.status = 'finished' AND OLD.status IS DISTINCT FROM 'finished')
  EXECUTE FUNCTION public.on_game_finished_capture_results();

-- Recupera gli esiti storici per le partite concluse il cui stato finale è ancora presente.
DO $$
DECLARE
  v_game_id uuid;
BEGIN
  FOR v_game_id IN SELECT id FROM public.games WHERE status = 'finished' LOOP
    PERFORM public.capture_game_player_results(v_game_id);
  END LOOP;
END;
$$;

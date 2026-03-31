-- ================================================================
--  LINEA ROSSA — DATABASE COMPLETO
--  ✅ Unico file da incollare nel SQL Editor di Supabase
--  ✅ Sicuro da rieseguire: IF NOT EXISTS / OR REPLACE / ON CONFLICT
--  ✅ Include: schema + colonne + RLS + funzioni + 75 obiettivi segreti
--
--  Come usarlo:
--    1. Supabase → SQL Editor → New query
--    2. Copia-incolla tutto il file
--    3. Clicca ▶  Run
--    4. Attendi il messaggio finale "DATABASE LINEA ROSSA PRONTO ✅"
-- ================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- SEZIONE 1 — TABELLE BASE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  avatar_color  TEXT DEFAULT '#00ff88',
  games_played  INTEGER DEFAULT 0,
  games_won     INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.games (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  name             TEXT,
  status           TEXT DEFAULT 'lobby' CHECK (status IN ('lobby','active','finished')),
  current_turn     INTEGER DEFAULT 1,
  max_turns        INTEGER DEFAULT 20,
  winner_faction   TEXT,
  winner_condition TEXT,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ
);

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
  ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_game_mode_check;
  ALTER TABLE public.games ADD CONSTRAINT games_game_mode_check
    CHECK (game_mode IN ('classic','unified'));
END $$;

CREATE INDEX IF NOT EXISTS idx_games_public_lobby ON public.games (is_public, status)
  WHERE status IN ('lobby','active');

CREATE TABLE IF NOT EXISTS public.game_players (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id        UUID REFERENCES public.games(id) ON DELETE CASCADE,
  faction        TEXT NOT NULL,
  player_id      UUID REFERENCES public.profiles(id),
  is_bot         BOOLEAN DEFAULT FALSE,
  bot_difficulty TEXT DEFAULT 'normal' CHECK (bot_difficulty IN ('easy','normal','hard')),
  turn_order     INTEGER NOT NULL,
  is_ready       BOOLEAN DEFAULT FALSE,
  UNIQUE (game_id, faction)
);

CREATE TABLE IF NOT EXISTS public.game_state (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id  UUID REFERENCES public.games(id) ON DELETE CASCADE UNIQUE,
  nucleare  INTEGER DEFAULT 1  CHECK (nucleare  BETWEEN 1 AND 15),
  sanzioni  INTEGER DEFAULT 5  CHECK (sanzioni  BETWEEN 1 AND 10),
  opinione  INTEGER DEFAULT 0  CHECK (opinione  BETWEEN -10 AND 10),
  defcon    INTEGER DEFAULT 5  CHECK (defcon    BETWEEN 1 AND 5),
  risorse_iran        INTEGER DEFAULT 5 CHECK (risorse_iran        BETWEEN 1 AND 10),
  risorse_coalizione  INTEGER DEFAULT 5 CHECK (risorse_coalizione  BETWEEN 1 AND 15),
  risorse_russia      INTEGER DEFAULT 5 CHECK (risorse_russia      BETWEEN 1 AND 10),
  risorse_cina        INTEGER DEFAULT 5 CHECK (risorse_cina        BETWEEN 1 AND 12),
  risorse_europa      INTEGER DEFAULT 5 CHECK (risorse_europa      BETWEEN 1 AND 10),
  stabilita_iran        INTEGER DEFAULT 5 CHECK (stabilita_iran        BETWEEN 1 AND 10),
  stabilita_coalizione  INTEGER DEFAULT 5 CHECK (stabilita_coalizione  BETWEEN 1 AND 10),
  stabilita_russia      INTEGER DEFAULT 5 CHECK (stabilita_russia      BETWEEN 1 AND 10),
  stabilita_cina        INTEGER DEFAULT 5 CHECK (stabilita_cina        BETWEEN 1 AND 10),
  stabilita_europa      INTEGER DEFAULT 5 CHECK (stabilita_europa      BETWEEN 1 AND 10),
  active_faction TEXT DEFAULT 'Iran',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS forze_militari_iran        INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_coalizione  INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_russia      INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_cina        INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_europa      INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS units_iran        JSONB DEFAULT '{"Convenzionale":3,"IRGC":2,"Proxy":4,"MissileiBalistici":1,"NavaleGolfo":2,"CyberIran":1}',
  ADD COLUMN IF NOT EXISTS units_coalizione  JSONB DEFAULT '{"Convenzionale":2,"ForzeSpeciali":2,"AviazioneTattica":2,"DroniPrecisione":3,"ScudoMissilistico":1}',
  ADD COLUMN IF NOT EXISTS units_russia      JSONB DEFAULT '{"Convenzionale":3,"ArmataCorazzata":2,"SottomariniAKULA":2,"GuerraIbrida":2,"WagnerGroup":3,"SystemsS400":1}',
  ADD COLUMN IF NOT EXISTS units_cina        JSONB DEFAULT '{"Convenzionale":3,"EsercitoRegolare":2,"DroniCina":2,"NavalePLA":2,"GuerraEconomica":1,"CyberCina":1}',
  ADD COLUMN IF NOT EXISTS units_europa      JSONB DEFAULT '{"Convenzionale":2,"Peacekeeping":3,"ForzaRapidaEU":1,"SanzioniBCE":1,"MissioneAddestr":2}',
  ADD COLUMN IF NOT EXISTS special_uses      JSONB DEFAULT '{"veto_russia":3,"hormuz_iran":false,"superiorita_aerea":false}',
  ADD COLUMN IF NOT EXISTS active_alliances  JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_event_turn   INTEGER,
  ADD COLUMN IF NOT EXISTS last_event_id     TEXT,
  ADD COLUMN IF NOT EXISTS tecnologia_nucleare_iran          INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS influenza_diplomatica_coalizione  INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS tecnologia_avanzata_coalizione    INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS supporto_pubblico_coalizione      INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS influenza_militare_russia         INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS veto_onu_russia                   INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stabilita_economica_russia        INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS influenza_commerciale_cina        INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS cyber_warfare_cina                INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stabilita_rotte_cina              INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS influenza_diplomatica_europa      INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS aiuti_umanitari_europa            INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS coesione_ue_europa                INTEGER NOT NULL DEFAULT 7;

CREATE TABLE IF NOT EXISTS public.cards_deck (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id         UUID REFERENCES public.games(id) ON DELETE CASCADE,
  faction         TEXT NOT NULL,
  card_id         TEXT NOT NULL,
  card_name       TEXT NOT NULL,
  card_type       TEXT NOT NULL,
  op_points       INTEGER DEFAULT 1,
  deck_type       TEXT DEFAULT 'base' CHECK (deck_type IN ('base','speciale')),
  status          TEXT DEFAULT 'available' CHECK (status IN ('available','in_hand','played','discarded')),
  held_by_faction TEXT,
  played_at_turn  INTEGER,
  position        INTEGER NOT NULL,
  UNIQUE (game_id, card_id)
);

ALTER TABLE public.cards_deck
  ADD COLUMN IF NOT EXISTS owner_faction TEXT,
  ADD COLUMN IF NOT EXISTS play_mode     TEXT;

CREATE TABLE IF NOT EXISTS public.moves_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id         UUID REFERENCES public.games(id) ON DELETE CASCADE,
  turn_number     INTEGER NOT NULL,
  faction         TEXT NOT NULL,
  player_id       UUID REFERENCES public.profiles(id),
  is_bot_move     BOOLEAN DEFAULT FALSE,
  card_id         TEXT NOT NULL,
  card_name       TEXT NOT NULL,
  card_type       TEXT NOT NULL,
  delta_nucleare  INTEGER DEFAULT 0,
  delta_sanzioni  INTEGER DEFAULT 0,
  delta_opinione  INTEGER DEFAULT 0,
  delta_defcon    INTEGER DEFAULT 0,
  delta_risorse   INTEGER DEFAULT 0,
  delta_stabilita INTEGER DEFAULT 0,
  stato_nucleare  INTEGER,
  stato_sanzioni  INTEGER,
  stato_opinione  INTEGER,
  stato_defcon    INTEGER,
  description     TEXT,
  bot_reason      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moves_log
  ADD COLUMN IF NOT EXISTS is_market_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS market_op_spent    INTEGER,
  ADD COLUMN IF NOT EXISTS market_resources   INTEGER;

CREATE TABLE IF NOT EXISTS public.territories (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id        UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  territory      TEXT NOT NULL,
  inf_iran        INTEGER NOT NULL DEFAULT 0 CHECK (inf_iran        BETWEEN 0 AND 5),
  inf_coalizione  INTEGER NOT NULL DEFAULT 0 CHECK (inf_coalizione  BETWEEN 0 AND 5),
  inf_russia      INTEGER NOT NULL DEFAULT 0 CHECK (inf_russia      BETWEEN 0 AND 5),
  inf_cina        INTEGER NOT NULL DEFAULT 0 CHECK (inf_cina        BETWEEN 0 AND 5),
  inf_europa      INTEGER NOT NULL DEFAULT 0 CHECK (inf_europa      BETWEEN 0 AND 5),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, territory)
);

CREATE TABLE IF NOT EXISTS public.military_units (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id    UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  faction    TEXT NOT NULL,
  territory  TEXT NOT NULL,
  unit_type  TEXT NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, faction, territory, unit_type)
);

CREATE TABLE IF NOT EXISTS public.combat_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id         UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  turn_number     INTEGER NOT NULL,
  attacker        TEXT NOT NULL,
  defender        TEXT NOT NULL,
  territory       TEXT NOT NULL,
  unit_types_used TEXT[],
  attack_force    INTEGER NOT NULL,
  defense_force   INTEGER NOT NULL,
  result          TEXT NOT NULL,
  inf_change_atk  INTEGER NOT NULL DEFAULT 0,
  inf_change_def  INTEGER NOT NULL DEFAULT 0,
  defcon_change   INTEGER NOT NULL DEFAULT 0,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cards_library (
  card_id     TEXT PRIMARY KEY,
  card_name   TEXT NOT NULL,
  faction     TEXT NOT NULL DEFAULT 'Neutrale',
  card_type   TEXT NOT NULL DEFAULT 'Evento',
  deck_type   TEXT NOT NULL DEFAULT 'base',
  op_points   INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  delta_nucleare INTEGER DEFAULT 0, delta_sanzioni INTEGER DEFAULT 0,
  delta_defcon   INTEGER DEFAULT 0, delta_opinione  INTEGER DEFAULT 0,
  delta_risorse  INTEGER DEFAULT 0, delta_stabilita INTEGER DEFAULT 0,
  linked_card_id TEXT,
  linked_delta_nucleare INTEGER DEFAULT 0, linked_delta_sanzioni INTEGER DEFAULT 0,
  linked_delta_defcon   INTEGER DEFAULT 0, linked_delta_opinione  INTEGER DEFAULT 0,
  linked_delta_risorse  INTEGER DEFAULT 0, linked_delta_stabilita INTEGER DEFAULT 0,
  linked_description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.cards_library
  ADD COLUMN IF NOT EXISTS categoria_tni   TEXT,
  ADD COLUMN IF NOT EXISTS linked_effect   TEXT,
  ADD COLUMN IF NOT EXISTS iran_risorse_eco INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS iran_forze_mil     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iran_stab_int    INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS iran_tech_nucleare INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iran_asse_resist INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS coal_risorse_mil   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coal_infl_dipl   INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS coal_tech_avanz    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coal_supp_pubblico INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS coal_alleanze     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_infl_dipl   INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS ue_aiuti_uman   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_stab_energ  INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS ue_coesione_int  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_pol_multilat INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS cina_pot_eco      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cina_infl_comm INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS cina_cyber        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cina_stab_rotte INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS cina_progetti_bri INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_infl_mil INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS russia_energia    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_veto_onu INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS russia_stab_eco   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_op_spec  INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_cards_library_faction   ON public.cards_library(faction);
CREATE INDEX IF NOT EXISTS idx_cards_library_card_type ON public.cards_library(card_type);

CREATE TABLE IF NOT EXISTS public.bot_cards (
  id             TEXT PRIMARY KEY,
  faction        TEXT NOT NULL,
  deck_priority  INT  NOT NULL,
  deck_name      TEXT NOT NULL,
  deck_condition TEXT NOT NULL,
  card_condition TEXT NOT NULL,
  priority_1     TEXT NOT NULL,
  priority_2     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_cards_faction       ON public.bot_cards(faction);
CREATE INDEX IF NOT EXISTS idx_bot_cards_deck_priority ON public.bot_cards(faction, deck_priority);

CREATE TABLE IF NOT EXISTS public.objectives (
  obj_id            TEXT PRIMARY KEY,
  faction           TEXT NOT NULL,
  nome              TEXT NOT NULL,
  descrizione       TEXT,
  punti             INTEGER NOT NULL DEFAULT 5,
  difficolta        TEXT NOT NULL DEFAULT 'media',
  condizione_tipo   TEXT,
  condizione_campo  TEXT,
  condizione_op     TEXT,
  condizione_valore INTEGER,
  condizione_note   TEXT,
  attivo            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_objectives (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  faction    TEXT NOT NULL,
  obj_id     TEXT NOT NULL REFERENCES public.objectives(obj_id),
  completato BOOLEAN DEFAULT false,
  punteggio  INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, faction, obj_id)
);


-- ──────────────────────────────────────────────────────────────────────────────
-- SEZIONE 2 — ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards_deck      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.military_units  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards_library   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_objectives ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_select') THEN
    CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_insert') THEN
    CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_update') THEN
    CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='games' AND policyname='games_select') THEN
    CREATE POLICY "games_select" ON public.games FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='games' AND policyname='games_insert') THEN
    CREATE POLICY "games_insert" ON public.games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='games' AND policyname='games_update') THEN
    CREATE POLICY "games_update" ON public.games FOR UPDATE USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_players' AND policyname='gp_select') THEN
    CREATE POLICY "gp_select" ON public.game_players FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_players' AND policyname='gp_insert') THEN
    CREATE POLICY "gp_insert" ON public.game_players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_players' AND policyname='gp_update') THEN
    CREATE POLICY "gp_update" ON public.game_players FOR UPDATE USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_state' AND policyname='gs_select') THEN
    CREATE POLICY "gs_select" ON public.game_state FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_state' AND policyname='gs_insert') THEN
    CREATE POLICY "gs_insert" ON public.game_state FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_state' AND policyname='gs_update') THEN
    CREATE POLICY "gs_update" ON public.game_state FOR UPDATE USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_deck' AND policyname='cd_select') THEN
    CREATE POLICY "cd_select" ON public.cards_deck FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_deck' AND policyname='cd_insert') THEN
    CREATE POLICY "cd_insert" ON public.cards_deck FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_deck' AND policyname='cd_update') THEN
    CREATE POLICY "cd_update" ON public.cards_deck FOR UPDATE USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='moves_log' AND policyname='ml_select') THEN
    CREATE POLICY "ml_select" ON public.moves_log FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='moves_log' AND policyname='ml_insert') THEN
    CREATE POLICY "ml_insert" ON public.moves_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territories' AND policyname='territories_read') THEN
    CREATE POLICY "territories_read"  ON public.territories FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territories' AND policyname='territories_write') THEN
    CREATE POLICY "territories_write" ON public.territories FOR ALL USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='military_units' AND policyname='mu_read') THEN
    CREATE POLICY "mu_read"  ON public.military_units FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='military_units' AND policyname='mu_write') THEN
    CREATE POLICY "mu_write" ON public.military_units FOR ALL USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='combat_log' AND policyname='cl_read') THEN
    CREATE POLICY "cl_read"  ON public.combat_log FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='combat_log' AND policyname='cl_write') THEN
    CREATE POLICY "cl_write" ON public.combat_log FOR ALL USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_library' AND policyname='lib_select') THEN
    CREATE POLICY "lib_select" ON public.cards_library FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_library' AND policyname='lib_insert') THEN
    CREATE POLICY "lib_insert" ON public.cards_library FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_library' AND policyname='lib_update') THEN
    CREATE POLICY "lib_update" ON public.cards_library FOR UPDATE USING (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cards_library' AND policyname='lib_delete') THEN
    CREATE POLICY "lib_delete" ON public.cards_library FOR DELETE USING (auth.uid() IS NOT NULL); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bot_cards' AND policyname='bc_select') THEN
    CREATE POLICY "bc_select" ON public.bot_cards FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bot_cards' AND policyname='bc_insert') THEN
    CREATE POLICY "bc_insert" ON public.bot_cards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bot_cards' AND policyname='bc_update') THEN
    CREATE POLICY "bc_update" ON public.bot_cards FOR UPDATE USING (auth.uid() IS NOT NULL); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bot_cards' AND policyname='bc_delete') THEN
    CREATE POLICY "bc_delete" ON public.bot_cards FOR DELETE USING (auth.uid() IS NOT NULL); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objectives' AND policyname='obj_read') THEN
    CREATE POLICY "obj_read"  ON public.objectives FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objectives' AND policyname='obj_write') THEN
    CREATE POLICY "obj_write" ON public.objectives FOR ALL USING (true); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_objectives' AND policyname='go_read') THEN
    CREATE POLICY "go_read"  ON public.game_objectives FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_objectives' AND policyname='go_write') THEN
    CREATE POLICY "go_write" ON public.game_objectives FOR ALL USING (true); END IF;
END $$;


-- ──────────────────────────────────────────────────────────────────────────────
-- SEZIONE 3 — FUNZIONI, TRIGGER E RPC
-- ──────────────────────────────────────────────────────────────────────────────

-- Crea profilo automaticamente al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Genera codice partita univoco (es. GULF-42)
CREATE OR REPLACE FUNCTION public.generate_game_code()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['GULF','IRAN','ATOM','NUKE','HAWK','DOVE','SAND','SILK','BRIC','NATO'];
  new_code TEXT;
  already_exists BOOLEAN;
BEGIN
  LOOP
    new_code := prefixes[floor(random() * array_length(prefixes,1) + 1)]
                || '-' || floor(random()*90+10)::TEXT;
    SELECT EXISTS(SELECT 1 FROM public.games g WHERE g.code = new_code) INTO already_exists;
    EXIT WHEN NOT already_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Timestamp automatico su game_state
CREATE OR REPLACE FUNCTION public.update_game_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_game_state_ts ON public.game_state;
CREATE TRIGGER update_game_state_ts
  BEFORE UPDATE ON public.game_state
  FOR EACH ROW EXECUTE FUNCTION public.update_game_state_timestamp();

-- Timestamp su cards_library
CREATE OR REPLACE FUNCTION public.update_cards_library_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cards_library_updated ON public.cards_library;
CREATE TRIGGER trg_cards_library_updated
  BEFORE UPDATE ON public.cards_library
  FOR EACH ROW EXECUTE FUNCTION public.update_cards_library_timestamp();

-- Timestamp su bot_cards
CREATE OR REPLACE FUNCTION public.update_bot_cards_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bot_cards_updated ON public.bot_cards;
CREATE TRIGGER trg_bot_cards_updated
  BEFORE UPDATE ON public.bot_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_bot_cards_timestamp();

-- RPC: assegna N obiettivi casuali a una fazione per una partita
CREATE OR REPLACE FUNCTION public.assign_objectives_to_faction(
  p_game_id  UUID,
  p_faction  TEXT,
  p_num_draw INTEGER DEFAULT 3
) RETURNS SETOF public.game_objectives AS $$
DECLARE v_obj public.objectives%ROWTYPE;
BEGIN
  DELETE FROM public.game_objectives WHERE game_id = p_game_id AND faction = p_faction;
  FOR v_obj IN
    SELECT * FROM public.objectives WHERE faction = p_faction AND attivo = true
    ORDER BY random() LIMIT p_num_draw
  LOOP
    INSERT INTO public.game_objectives (game_id, faction, obj_id, completato, punteggio)
    VALUES (p_game_id, p_faction, v_obj.obj_id, false, 0)
    ON CONFLICT (game_id, faction, obj_id) DO NOTHING;
  END LOOP;
  RETURN QUERY SELECT * FROM public.game_objectives WHERE game_id = p_game_id AND faction = p_faction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: assegna obiettivi a tutte le 5 fazioni in una volta
CREATE OR REPLACE FUNCTION public.assign_all_objectives(
  p_game_id  UUID,
  p_num_draw INTEGER DEFAULT 3
) RETURNS void AS $$
DECLARE
  v_faction TEXT;
  v_factions TEXT[] := ARRAY['Iran','Coalizione Occidentale','Russia','Cina','Unione Europea'];
BEGIN
  FOREACH v_faction IN ARRAY v_factions LOOP
    PERFORM public.assign_objectives_to_faction(p_game_id, v_faction, p_num_draw);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista: obiettivi con dettagli completi (utile per le query lato client)
CREATE OR REPLACE VIEW public.v_game_objectives AS
  SELECT go.id, go.game_id, go.faction, go.completato, go.punteggio,
         o.obj_id, o.nome, o.descrizione, o.punti, o.difficolta,
         o.condizione_tipo, o.condizione_campo, o.condizione_op,
         o.condizione_valore, o.condizione_note
  FROM public.game_objectives go
  JOIN public.objectives o ON go.obj_id = o.obj_id;

-- ──────────────────────────────────────────────────────────────────────────────
-- SEZIONE 4 — REALTIME (pubsub per aggiornamenti live)
-- ──────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.moves_log;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.game_objectives;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


-- ──────────────────────────────────────────────────────────────────────────────
-- SEZIONE 5 — 75 OBIETTIVI SEGRETI
-- Distribuiti: Iran×15, Coalizione Occidentale×15, Russia×15, Cina×15, UE×15
-- ✅ ON CONFLICT DO UPDATE: idempotente, rieseguire non sovrascrive partite attive
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO public.objectives
  (obj_id, faction, nome, descrizione, punti, difficolta,
   condizione_tipo, condizione_campo, condizione_op, condizione_valore, condizione_note, attivo)
VALUES
  ('OBJ_IRAN_01', 'Iran', 'Soglia Nucleare', 'Porta il tracciato Nucleare Iraniano al livello 10 o superiore entro la fine della partita.', 7, 'difficile', 'tracciato', 'nucleare', '>=', 10, 'Controlla il valore del tracciato Nucleare Iraniano a fine partita. Deve essere ≥ 10.', true),
  ('OBJ_IRAN_02', 'Iran', 'Breakout Imminente', 'Mantieni il tracciato Nucleare tra 12 e 15 per almeno 3 turni consecutivi.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica il log dei turni: il tracciato Nucleare deve essere stato ≥ 12 per 3 turni di fila.', true),
  ('OBJ_IRAN_03', 'Iran', 'Proxy Invincibile', 'Schiera almeno 4 unità Proxy sul campo (in qualsiasi territorio) a fine partita.', 6, 'media', 'tracciato', 'forze_militari_iran', '>=', 4, 'Conta le unità Proxy attive sul tabellone a fine partita. Devono essere almeno 4.', true),
  ('OBJ_IRAN_04', 'Iran', 'Sanzioni Infrante', 'Riduci il tracciato Sanzioni a 2 o meno.', 6, 'media', 'tracciato', 'sanzioni', '<=', 2, 'Controlla il tracciato Sanzioni a fine partita. Deve essere ≤ 2.', true),
  ('OBJ_IRAN_05', 'Iran', 'Dominanza nel Golfo', 'Raggiungi influenza 4 o superiore in almeno 3 territori del Golfo Persico.', 8, 'difficile', 'territorio', NULL, NULL, NULL, 'Conta i territori del Golfo (Iraq, Yemen, Bahrein, Kuwait, Emirati) dove l''Iran ha influenza ≥ 4. Ne servono almeno 3.', true),
  ('OBJ_IRAN_06', 'Iran', 'Asse della Resistenza', 'Mantieni alleanze attive con almeno 2 proxy regionali (Libano, Yemen, Iraq) per 4 turni.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica il log: l''Iran deve aver mantenuto alleanze con Hezbollah (Libano), Houthi (Yemen) o Hashd (Iraq) per 4 turni.', true),
  ('OBJ_IRAN_07', 'Iran', 'Destabilizzare il Nemico', 'Riduci la Stabilità della Coalizione Occidentale a 3 o meno.', 6, 'media', 'tracciato', 'stabilita_coalizione', '<=', 3, 'Controlla il tracciato Stabilità Coalizione a fine partita. Deve essere ≤ 3.', true),
  ('OBJ_IRAN_08', 'Iran', 'Isolamento Rotto', 'Porta il tracciato Opinione Globale tra -2 e +2 (neutralità internazionale).', 5, 'media', 'tracciato', 'opinione', '>=', -2, 'Controlla che il tracciato Opinione Globale sia compreso tra -2 e +2 a fine partita.', true),
  ('OBJ_IRAN_09', 'Iran', 'Guerra Cyber', 'Usa la carta Cyber Iran almeno 3 volte durante la partita.', 5, 'facile', 'carta', NULL, NULL, NULL, 'Conta nel log delle mosse quante volte è stata giocata la carta CyberIran. Devono essere almeno 3.', true),
  ('OBJ_IRAN_10', 'Iran', 'Deterrenza Missilistica', 'Schiera almeno 3 unità MissileiBalistici durante la partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Controlla nel log militare quante unità MissileiBalistici sono state schierate. Devono essere ≥ 3.', true),
  ('OBJ_IRAN_11', 'Iran', 'Chiudere lo Stretto', 'Attiva l''abilità speciale Hormuz almeno una volta.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Verifica nel log se la capacità speciale ''hormuz_iran'' è stata attivata almeno una volta.', true),
  ('OBJ_IRAN_12', 'Iran', 'Resistenza Economica', 'Mantieni le Risorse dell''Iran a 6 o superiore per almeno 5 turni.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui il tracciato Risorse Iran era ≥ 6. Devono essere almeno 5.', true),
  ('OBJ_IRAN_13', 'Iran', 'DEFCON al Limite', 'Porta il DEFCON a 2 o inferiore almeno una volta durante la partita.', 7, 'difficile', 'tracciato', 'defcon', '<=', 2, 'Controlla il log: il DEFCON deve aver raggiunto valore ≤ 2 almeno per un turno.', true),
  ('OBJ_IRAN_14', 'Iran', 'Stabilità Interna', 'Mantieni la Stabilità dell''Iran a 7 o superiore a fine partita.', 4, 'facile', 'tracciato', 'stabilita_iran', '>=', 7, 'Controlla il tracciato Stabilità Iran a fine partita. Deve essere ≥ 7.', true),
  ('OBJ_IRAN_15', 'Iran', 'Narrazione Globale', 'Porta il tracciato Opinione Globale a +5 o superiore.', 7, 'difficile', 'tracciato', 'opinione', '>=', 5, 'Controlla il tracciato Opinione Globale a fine partita. Deve essere ≥ 5.', true),
  ('OBJ_COAL_01', 'Coalizione Occidentale', 'Nucleare Bloccato', 'Mantieni il tracciato Nucleare Iraniano sotto al 5 fino alla fine della partita.', 7, 'difficile', 'tracciato', 'nucleare', '<=', 4, 'Controlla il tracciato Nucleare Iraniano a fine partita. Deve essere ≤ 4.', true),
  ('OBJ_COAL_02', 'Coalizione Occidentale', 'Sanzioni Massime', 'Porta il tracciato Sanzioni a 8 o superiore.', 6, 'media', 'tracciato', 'sanzioni', '>=', 8, 'Controlla il tracciato Sanzioni a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_COAL_03', 'Coalizione Occidentale', 'DEFCON Stabile', 'Mantieni il DEFCON a 4 o superiore per tutta la partita.', 5, 'media', 'tracciato', 'defcon', '>=', 4, 'Verifica nel log che il DEFCON non sia mai sceso sotto 4 durante la partita.', true),
  ('OBJ_COAL_04', 'Coalizione Occidentale', 'Superiorità Aerea', 'Attiva la capacità Superiorità Aerea e usala in almeno 2 attacchi.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica nel log dei combattimenti che la capacità ''superiorita_aerea'' sia stata usata in almeno 2 attacchi.', true),
  ('OBJ_COAL_05', 'Coalizione Occidentale', 'Influenza Diplomatica', 'Porta il tracciato Influenza Diplomatica della Coalizione a 8 o superiore.', 6, 'media', 'tracciato', 'influenza_diplomatica_coalizione', '>=', 8, 'Controlla il tracciato Influenza Diplomatica Coalizione a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_COAL_06', 'Coalizione Occidentale', 'Opinione Favorevole', 'Porta il tracciato Opinione Globale a -5 o inferiore (narrativa anti-Iran).', 7, 'difficile', 'tracciato', 'opinione', '<=', -5, 'Controlla il tracciato Opinione Globale a fine partita. Deve essere ≤ -5.', true),
  ('OBJ_COAL_07', 'Coalizione Occidentale', 'Droni in Azione', 'Usa unità DroniPrecisione in almeno 4 attacchi durante la partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta nel log dei combattimenti quante volte sono stati usati DroniPrecisione. Devono essere ≥ 4.', true),
  ('OBJ_COAL_08', 'Coalizione Occidentale', 'Tecnologia Avanzata', 'Porta il tracciato Tecnologia Avanzata Coalizione a 7 o superiore.', 5, 'media', 'tracciato', 'tecnologia_avanzata_coalizione', '>=', 7, 'Controlla il tracciato Tecnologia Avanzata Coalizione a fine partita. Deve essere ≥ 7.', true),
  ('OBJ_COAL_09', 'Coalizione Occidentale', 'Supporto Pubblico Alto', 'Mantieni il tracciato Supporto Pubblico Coalizione a 8 o superiore per 4 turni.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui Supporto Pubblico Coalizione era ≥ 8. Devono essere ≥ 4.', true),
  ('OBJ_COAL_10', 'Coalizione Occidentale', 'Destabilizza Russia', 'Riduci la Stabilità della Russia a 3 o meno.', 7, 'difficile', 'tracciato', 'stabilita_russia', '<=', 3, 'Controlla il tracciato Stabilità Russia a fine partita. Deve essere ≤ 3.', true),
  ('OBJ_COAL_11', 'Coalizione Occidentale', 'Scudo Missilistico Attivo', 'Schiera almeno 2 unità ScudoMissilistico entro il turno 10.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Controlla nel log militare che almeno 2 unità ScudoMissilistico siano state schierate entro il turno 10.', true),
  ('OBJ_COAL_12', 'Coalizione Occidentale', 'Alleanza Solida', 'Mantieni un''alleanza attiva con l''Unione Europea per almeno 5 turni.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Verifica nel log che l''alleanza Coalizione-EU sia stata attiva per ≥ 5 turni.', true),
  ('OBJ_COAL_13', 'Coalizione Occidentale', 'Risorse Militari', 'Mantieni le Risorse della Coalizione a 10 o superiore per 3 turni consecutivi.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Conta i turni consecutivi in cui Risorse Coalizione era ≥ 10. Devono essere ≥ 3 di fila.', true),
  ('OBJ_COAL_14', 'Coalizione Occidentale', 'Operazioni Speciali', 'Usa le ForzeSpeciali in almeno 3 azioni di combattimento o influenza.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte sono state usate ForzeSpeciali. Devono essere ≥ 3.', true),
  ('OBJ_COAL_15', 'Coalizione Occidentale', 'Accordo Nucleare', 'Porta il tracciato Nucleare a 4 e il tracciato Sanzioni a 7 simultaneamente a fine partita.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Controlla a fine partita: tracciato Nucleare ≤ 4 E tracciato Sanzioni ≥ 7. Entrambe le condizioni devono essere vere.', true),
  ('OBJ_RUSS_01', 'Russia', 'Veto Determinante', 'Usa il Veto ONU almeno 2 volte durante la partita.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte è stato usato il Veto ONU Russia. Devono essere ≥ 2.', true),
  ('OBJ_RUSS_02', 'Russia', 'Wagner sul Campo', 'Schiera almeno 4 unità WagnerGroup durante la partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta nel log militare quante unità WagnerGroup sono state schierate. Devono essere ≥ 4.', true),
  ('OBJ_RUSS_03', 'Russia', 'Influenza Militare Massima', 'Porta il tracciato Influenza Militare Russia a 9 o superiore.', 7, 'difficile', 'tracciato', 'influenza_militare_russia', '>=', 9, 'Controlla il tracciato Influenza Militare Russia a fine partita. Deve essere ≥ 9.', true),
  ('OBJ_RUSS_04', 'Russia', 'Destabilizzare l''Occidente', 'Riduci il Supporto Pubblico della Coalizione a 4 o meno.', 7, 'difficile', 'tracciato', 'supporto_pubblico_coalizione', '<=', 4, 'Controlla il tracciato Supporto Pubblico Coalizione a fine partita. Deve essere ≤ 4.', true),
  ('OBJ_RUSS_05', 'Russia', 'Energia come Arma', 'Mantieni le Risorse Russia (energia) a 8 o superiore per 4 turni.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui Risorse Russia era ≥ 8. Devono essere almeno 4.', true),
  ('OBJ_RUSS_06', 'Russia', 'Guerra Ibrida', 'Usa le unità GuerraIbrida in almeno 3 azioni durante la partita.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte sono state usate unità GuerraIbrida. Devono essere ≥ 3.', true),
  ('OBJ_RUSS_07', 'Russia', 'S-400 in Posizione', 'Schiera almeno 2 unità SystemsS400 in territori strategici.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta nel log militare quante unità SystemsS400 sono state schierate. Devono essere ≥ 2.', true),
  ('OBJ_RUSS_08', 'Russia', 'Stabilità Economica', 'Porta il tracciato Stabilità Economica Russia a 8 o superiore.', 5, 'media', 'tracciato', 'stabilita_economica_russia', '>=', 8, 'Controlla il tracciato Stabilità Economica Russia a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_RUSS_09', 'Russia', 'DEFCON Teso', 'Porta il DEFCON a 2 o 3 per almeno 2 turni.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui il DEFCON era ≤ 3. Devono essere almeno 2.', true),
  ('OBJ_RUSS_10', 'Russia', 'Sottomarini in Missione', 'Usa le unità SottomariniAKULA in almeno 2 azioni navali.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte sono state usate unità SottomariniAKULA. Devono essere ≥ 2.', true),
  ('OBJ_RUSS_11', 'Russia', 'Alleanza con Iran', 'Mantieni un''alleanza attiva con l''Iran per almeno 4 turni.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Verifica nel log che l''alleanza Russia-Iran sia stata attiva per ≥ 4 turni.', true),
  ('OBJ_RUSS_12', 'Russia', 'Isolamento NATO', 'Riduci l''Influenza Diplomatica della Coalizione a 3 o meno.', 7, 'difficile', 'tracciato', 'influenza_diplomatica_coalizione', '<=', 3, 'Controlla il tracciato Influenza Diplomatica Coalizione a fine partita. Deve essere ≤ 3.', true),
  ('OBJ_RUSS_13', 'Russia', 'Controllo Narrativo', 'Porta il tracciato Opinione Globale tra -3 e +3 (equilibrio strategico).', 5, 'media', 'tracciato', 'opinione', '>=', -3, 'Controlla che il tracciato Opinione Globale sia compreso tra -3 e +3 a fine partita.', true),
  ('OBJ_RUSS_14', 'Russia', 'Stabilità Iran Alleato', 'Mantieni la Stabilità dell''Iran a 5 o superiore per 3 turni.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui Stabilità Iran era ≥ 5. Devono essere almeno 3.', true),
  ('OBJ_RUSS_15', 'Russia', 'Armata Corazzata', 'Porta il tracciato Forze Militari Russia a 8 o superiore.', 6, 'media', 'tracciato', 'forze_militari_russia', '>=', 8, 'Controlla il tracciato Forze Militari Russia a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_CINA_01', 'Cina', 'Potenza Economica', 'Porta le Risorse Cina (potenza economica) a 10 o superiore.', 6, 'media', 'tracciato', 'risorse_cina', '>=', 10, 'Controlla il tracciato Risorse Cina a fine partita. Deve essere ≥ 10.', true),
  ('OBJ_CINA_02', 'Cina', 'Via della Seta Securizzata', 'Porta il tracciato Stabilità Rotte Cina a 9 o superiore.', 6, 'media', 'tracciato', 'stabilita_rotte_cina', '>=', 9, 'Controlla il tracciato Stabilità Rotte Cina a fine partita. Deve essere ≥ 9.', true),
  ('OBJ_CINA_03', 'Cina', 'Influenza Commerciale', 'Porta il tracciato Influenza Commerciale Cina a 8 o superiore.', 6, 'media', 'tracciato', 'influenza_commerciale_cina', '>=', 8, 'Controlla il tracciato Influenza Commerciale Cina a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_CINA_04', 'Cina', 'Cyber Superiorità', 'Porta il tracciato Cyber Warfare Cina a 8 o superiore.', 7, 'difficile', 'tracciato', 'cyber_warfare_cina', '>=', 8, 'Controlla il tracciato Cyber Warfare Cina a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_CINA_05', 'Cina', 'Neutralità Strategica', 'Non partecipare ad alcuna alleanza per almeno 5 turni.', 5, 'media', 'manuale', NULL, NULL, NULL, 'Verifica nel log che la Cina non abbia avuto alleanze attive per almeno 5 turni.', true),
  ('OBJ_CINA_06', 'Cina', 'BRI nel Golfo', 'Ottieni influenza ≥ 3 in almeno 2 territori del Golfo o dell''Asia Centrale.', 7, 'difficile', 'territorio', NULL, NULL, NULL, 'Conta i territori del Golfo/Asia Centrale dove la Cina ha influenza ≥ 3. Ne servono almeno 2.', true),
  ('OBJ_CINA_07', 'Cina', 'Flotta PLA', 'Schiera almeno 3 unità NavalePLA durante la partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta nel log militare quante unità NavalePLA sono state schierate. Devono essere ≥ 3.', true),
  ('OBJ_CINA_08', 'Cina', 'Droni Cina in Azione', 'Usa le unità DroniCina in almeno 3 azioni.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte sono state usate unità DroniCina. Devono essere ≥ 3.', true),
  ('OBJ_CINA_09', 'Cina', 'DEFCON sotto Controllo', 'Mantieni il DEFCON a 3 o superiore per tutta la partita.', 5, 'media', 'tracciato', 'defcon', '>=', 3, 'Verifica nel log che il DEFCON non sia mai sceso sotto 3 durante tutta la partita.', true),
  ('OBJ_CINA_10', 'Cina', 'Guerra Economica Vinta', 'Usa la carta GuerraEconomica almeno 2 volte.', 5, 'facile', 'carta', NULL, NULL, NULL, 'Conta nel log quante volte è stata giocata la carta GuerraEconomica. Devono essere ≥ 2.', true),
  ('OBJ_CINA_11', 'Cina', 'Destabilizza Europa', 'Riduci la Coesione UE a 4 o meno.', 7, 'difficile', 'tracciato', 'coesione_ue_europa', '<=', 4, 'Controlla il tracciato Coesione UE a fine partita. Deve essere ≤ 4.', true),
  ('OBJ_CINA_12', 'Cina', 'Mediatore di Pace', 'Usa almeno 2 carte diplomatiche per ridurre il DEFCON in un turno in cui era ≤ 2.', 8, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica nel log: almeno 2 carte diplomatiche devono essere state usate in turni in cui DEFCON era ≤ 2.', true),
  ('OBJ_CINA_13', 'Cina', 'Esercito Regolare Forte', 'Porta il tracciato Forze Militari Cina a 8 o superiore.', 5, 'media', 'tracciato', 'forze_militari_cina', '>=', 8, 'Controlla il tracciato Forze Militari Cina a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_CINA_14', 'Cina', 'Progetto BRI Completato', 'Usa almeno 3 carte con effetto economia positiva per la Cina.', 6, 'media', 'carta', NULL, NULL, NULL, 'Conta nel log quante carte hanno aumentato Risorse o Influenza Commerciale Cina. Devono essere ≥ 3.', true),
  ('OBJ_CINA_15', 'Cina', 'Stabilità Regionale', 'Mantieni la Stabilità di almeno 3 fazioni a 5 o superiore a fine partita.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Controlla i tracciati Stabilità di tutte le fazioni a fine partita. Almeno 3 fazioni (inclusa eventualmente la Cina) devono avere Stabilità ≥ 5.', true),
  ('OBJ_EU_01', 'Unione Europea', 'Diplomazia Attiva', 'Porta il tracciato Influenza Diplomatica Europa a 9 o superiore.', 7, 'difficile', 'tracciato', 'influenza_diplomatica_europa', '>=', 9, 'Controlla il tracciato Influenza Diplomatica Europa a fine partita. Deve essere ≥ 9.', true),
  ('OBJ_EU_02', 'Unione Europea', 'Aiuti Umanitari', 'Porta il tracciato Aiuti Umanitari Europa a 8 o superiore.', 5, 'media', 'tracciato', 'aiuti_umanitari_europa', '>=', 8, 'Controlla il tracciato Aiuti Umanitari Europa a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_EU_03', 'Unione Europea', 'Coesione Interna', 'Mantieni la Coesione UE a 8 o superiore per 4 turni.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui Coesione UE era ≥ 8. Devono essere almeno 4.', true),
  ('OBJ_EU_04', 'Unione Europea', 'Sanzioni Moderate', 'Mantieni il tracciato Sanzioni tra 4 e 7 per almeno 5 turni (pressione senza escalation).', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta i turni in cui Sanzioni era compreso tra 4 e 7. Devono essere almeno 5.', true),
  ('OBJ_EU_05', 'Unione Europea', 'DEFCON Verde', 'Porta il DEFCON a 5 per almeno 2 turni.', 5, 'facile', 'tracciato', 'defcon', '>=', 5, 'Controlla nel log quante volte il DEFCON era 5. Devono essere almeno 2 turni.', true),
  ('OBJ_EU_06', 'Unione Europea', 'Accord Diplomatico', 'Negozia un accordo (usa una carta diplomatica) tra due fazioni in conflitto.', 5, 'facile', 'carta', NULL, NULL, NULL, 'Conta nel log le carte diplomatiche giocate che hanno ridotto il DEFCON o stabilizzato una fazione. Deve essere ≥ 1.', true),
  ('OBJ_EU_07', 'Unione Europea', 'Stabilità Energetica', 'Porta il tracciato Risorse Europa a 8 o superiore.', 5, 'media', 'tracciato', 'risorse_europa', '>=', 8, 'Controlla il tracciato Risorse Europa a fine partita. Deve essere ≥ 8.', true),
  ('OBJ_EU_08', 'Unione Europea', 'Peacekeeping', 'Schiera almeno 4 unità Peacekeeping durante la partita.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log militare quante unità Peacekeeping sono state schierate. Devono essere ≥ 4.', true),
  ('OBJ_EU_09', 'Unione Europea', 'Multilateralismo Vincente', 'Porta il tracciato Opinione Globale a 0 o superiore con almeno 3 carte diplomatiche.', 7, 'difficile', 'manuale', NULL, NULL, NULL, 'Verifica: Opinione Globale ≥ 0 a fine partita E almeno 3 carte diplomatiche EU usate durante la partita.', true),
  ('OBJ_EU_10', 'Unione Europea', 'Forza Rapida Attivata', 'Usa la ForzaRapidaEU in almeno 2 azioni durante la partita.', 6, 'media', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte è stata usata ForzaRapidaEU. Devono essere ≥ 2.', true),
  ('OBJ_EU_11', 'Unione Europea', 'Sanzioni BCE', 'Usa le SanzioniBCE in almeno 2 azioni economiche.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte sono state usate SanzioniBCE. Devono essere ≥ 2.', true),
  ('OBJ_EU_12', 'Unione Europea', 'Missione di Addestramento', 'Usa le MissioneAddestr in almeno 3 azioni.', 5, 'facile', 'manuale', NULL, NULL, NULL, 'Conta nel log quante volte sono state usate unità MissioneAddestr. Devono essere ≥ 3.', true),
  ('OBJ_EU_13', 'Unione Europea', 'Destabilizza Russia Diplomaticamente', 'Riduci l''Influenza Militare Russia a 3 o meno con carte diplomatiche.', 8, 'difficile', 'tracciato', 'influenza_militare_russia', '<=', 3, 'Controlla il tracciato Influenza Militare Russia a fine partita. Deve essere ≤ 3.', true),
  ('OBJ_EU_14', 'Unione Europea', 'Stabilità Iran', 'Porta la Stabilità dell''Iran a 7 o superiore (Europa come mediatore).', 6, 'media', 'tracciato', 'stabilita_iran', '>=', 7, 'Controlla il tracciato Stabilità Iran a fine partita. Deve essere ≥ 7.', true),
  ('OBJ_EU_15', 'Unione Europea', 'Accordo Finale', 'Termina la partita con DEFCON ≥ 4, Sanzioni tra 3 e 6, e Opinione Globale ≥ 0.', 9, 'difficile', 'manuale', NULL, NULL, NULL, 'Controlla a fine partita: DEFCON ≥ 4 E Sanzioni tra 3 e 6 E Opinione Globale ≥ 0. Tutte e tre le condizioni devono essere vere.', true)
ON CONFLICT (obj_id) DO UPDATE SET
  faction           = EXCLUDED.faction,
  nome              = EXCLUDED.nome,
  descrizione       = EXCLUDED.descrizione,
  punti             = EXCLUDED.punti,
  difficolta        = EXCLUDED.difficolta,
  condizione_tipo   = EXCLUDED.condizione_tipo,
  condizione_campo  = EXCLUDED.condizione_campo,
  condizione_op     = EXCLUDED.condizione_op,
  condizione_valore = EXCLUDED.condizione_valore,
  condizione_note   = EXCLUDED.condizione_note,
  attivo            = EXCLUDED.attivo;

-- ──────────────────────────────────────────────────────────────────────────────
-- SEZIONE 6 — RICARICA CACHE POSTGREST
-- ──────────────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- ──────────────────────────────────────────────────────────────────────────────
-- VERIFICA FINALE
-- Se l'output mostra obiettivi_totali=75 e stato=✅ il database è pronto
-- ──────────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT COUNT(*) FROM public.objectives)                      AS obiettivi_totali,
  (SELECT COUNT(*) FROM public.objectives WHERE attivo = true)  AS obiettivi_attivi,
  (SELECT COUNT(DISTINCT faction) FROM public.objectives)       AS fazioni_coperte,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('profiles','games','game_players','game_state',
                      'cards_deck','moves_log','territories','military_units',
                      'combat_log','cards_library','bot_cards',
                      'objectives','game_objectives'))           AS tabelle_create,
  'DATABASE LINEA ROSSA PRONTO ✅' AS stato;

-- ================================================================
-- LINEA ROSSA — SETUP COMPLETO
-- Crea le tabelle mancanti + aggiunge le colonne opzionali
-- SICURO da rieseguire: usa IF NOT EXISTS / IF NOT EXISTS
-- Incolla TUTTO nel SQL Editor di Supabase e clicca Run
-- ================================================================

-- ── 1. Tabella territories ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.territories (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id        uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  territory      text NOT NULL,
  inf_iran        integer NOT NULL DEFAULT 0 CHECK (inf_iran        BETWEEN 0 AND 5),
  inf_coalizione  integer NOT NULL DEFAULT 0 CHECK (inf_coalizione  BETWEEN 0 AND 5),
  inf_russia      integer NOT NULL DEFAULT 0 CHECK (inf_russia      BETWEEN 0 AND 5),
  inf_cina        integer NOT NULL DEFAULT 0 CHECK (inf_cina        BETWEEN 0 AND 5),
  inf_europa      integer NOT NULL DEFAULT 0 CHECK (inf_europa      BETWEEN 0 AND 5),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(game_id, territory)
);

-- ── 2. Tabella military_units ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.military_units (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id     uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  faction     text NOT NULL,
  territory   text NOT NULL,
  unit_type   text NOT NULL,
  quantity    integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(game_id, faction, territory, unit_type)
);

-- ── 3. Tabella combat_log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.combat_log (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id         uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  turn_number     integer NOT NULL,
  attacker        text NOT NULL,
  defender        text NOT NULL,
  territory       text NOT NULL,
  unit_types_used text[],
  attack_force    integer NOT NULL,
  defense_force   integer NOT NULL,
  result          text NOT NULL,
  inf_change_atk  integer NOT NULL DEFAULT 0,
  inf_change_def  integer NOT NULL DEFAULT 0,
  defcon_change   integer NOT NULL DEFAULT 0,
  description     text,
  created_at      timestamptz DEFAULT now()
);

-- ── 4. RLS per le nuove tabelle ───────────────────────────────────
ALTER TABLE public.territories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.military_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_log     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territories'    AND policyname='territories_read')  THEN CREATE POLICY "territories_read"  ON public.territories    FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territories'    AND policyname='territories_write') THEN CREATE POLICY "territories_write" ON public.territories    FOR ALL    USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='military_units' AND policyname='mil_units_read')   THEN CREATE POLICY "mil_units_read"    ON public.military_units FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='military_units' AND policyname='mil_units_write')  THEN CREATE POLICY "mil_units_write"   ON public.military_units FOR ALL    USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='combat_log'     AND policyname='combat_log_read')  THEN CREATE POLICY "combat_log_read"   ON public.combat_log     FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='combat_log'     AND policyname='combat_log_write') THEN CREATE POLICY "combat_log_write"  ON public.combat_log     FOR ALL    USING (true); END IF;
END $$;

-- ── 5. Colonne opzionali su game_state ───────────────────────────
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS forze_militari_iran       integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_coalizione integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_russia     integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_cina       integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS forze_militari_europa     integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS units_iran        jsonb DEFAULT '{"Convenzionale":3,"IRGC":2,"Proxy":4,"MissileiBalistici":1,"NavaleGolfo":2,"CyberIran":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_coalizione  jsonb DEFAULT '{"Convenzionale":2,"ForzeSpeciali":2,"AviazioneTattica":2,"DroniPrecisione":3,"ScudoMissilistico":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_russia      jsonb DEFAULT '{"Convenzionale":3,"ArmataCorazzata":2,"SottomariniAKULA":2,"GuerraIbrida":2,"WagnerGroup":3,"SystemsS400":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_cina        jsonb DEFAULT '{"Convenzionale":3,"EsercitoRegolare":2,"DroniCina":2,"NavalePLA":2,"GuerraEconomica":1,"CyberCina":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_europa      jsonb DEFAULT '{"Convenzionale":2,"Peacekeeping":3,"ForzaRapidaEU":1,"SanzioniBCE":1,"MissioneAddestr":2}'::jsonb,
  ADD COLUMN IF NOT EXISTS special_uses      jsonb DEFAULT '{"veto_russia":3,"hormuz_iran":false,"superiorita_aerea":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS active_alliances  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_event_turn   integer,
  ADD COLUMN IF NOT EXISTS last_event_id     text;

-- ── 6. Colonna game_mode su games ─────────────────────────────────
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS game_mode text NOT NULL DEFAULT 'classic';

-- Aggiorna il check se la colonna esisteva già senza vincolo
DO $$ BEGIN
  ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_game_mode_check;
  ALTER TABLE public.games ADD CONSTRAINT games_game_mode_check
    CHECK (game_mode IN ('classic','unified'));
END $$;

-- ── 7. Colonne mazzo unificato su cards_deck ──────────────────────
ALTER TABLE public.cards_deck
  ADD COLUMN IF NOT EXISTS owner_faction text,
  ADD COLUMN IF NOT EXISTS play_mode     text;

-- ── 8. Colonne acquisti mercato su moves_log ──────────────────────
ALTER TABLE public.moves_log
  ADD COLUMN IF NOT EXISTS is_market_purchase boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS market_op_spent    integer,
  ADD COLUMN IF NOT EXISTS market_resources   integer;

-- ── 9. Ricarica schema cache PostgREST ───────────────────────────
NOTIFY pgrst, 'reload schema';

SELECT 'SETUP COMPLETO — tutte le tabelle e colonne create' AS risultato;

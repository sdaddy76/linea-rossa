-- =============================================
-- LINEA ROSSA — Unità Militari e Territori
-- =============================================

-- ── Tabella territories: influenze per territorio per fazione ──
CREATE TABLE IF NOT EXISTS territories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id     uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  territory   text NOT NULL,  -- es. 'Iraq', 'Libano', 'Yemen'...
  -- Influenze per fazione (0-5 per fazione)
  inf_iran        integer NOT NULL DEFAULT 0 CHECK (inf_iran BETWEEN 0 AND 5),
  inf_coalizione  integer NOT NULL DEFAULT 0 CHECK (inf_coalizione BETWEEN 0 AND 5),
  inf_russia      integer NOT NULL DEFAULT 0 CHECK (inf_russia BETWEEN 0 AND 5),
  inf_cina        integer NOT NULL DEFAULT 0 CHECK (inf_cina BETWEEN 0 AND 5),
  inf_europa      integer NOT NULL DEFAULT 0 CHECK (inf_europa BETWEEN 0 AND 5),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(game_id, territory)
);

-- ── Tabella military_units: unità schierate per fazione per territorio ──
CREATE TABLE IF NOT EXISTS military_units (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id     uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  faction     text NOT NULL,
  territory   text NOT NULL,
  unit_type   text NOT NULL,  -- 'Convenzionale','IRGC','Proxy','Navale','AereoStrategico','SottoMar'
  quantity    integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(game_id, faction, territory, unit_type)
);

-- ── Tabella combat_log: storico combattimenti ──
CREATE TABLE IF NOT EXISTS combat_log (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id         uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  turn_number     integer NOT NULL,
  attacker        text NOT NULL,
  defender        text NOT NULL,
  territory       text NOT NULL,
  unit_types_used text[],          -- unità usate dall'attaccante
  attack_force    integer NOT NULL,
  defense_force   integer NOT NULL,
  result          text NOT NULL,   -- 'vittoria_decisiva','vittoria','stallo','sconfitta','sconfitta_grave'
  inf_change_atk  integer NOT NULL DEFAULT 0,
  inf_change_def  integer NOT NULL DEFAULT 0,
  defcon_change   integer NOT NULL DEFAULT 0,
  description     text,
  created_at      timestamptz DEFAULT now()
);

-- ── Aggiungi colonne units_pool a game_state ──
-- Numero unità disponibili (pool non schierate) per fazione
ALTER TABLE game_state
  ADD COLUMN IF NOT EXISTS units_iran        jsonb NOT NULL DEFAULT '{"Convenzionale":4,"IRGC":2,"Proxy":3,"Navale":2}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_coalizione  jsonb NOT NULL DEFAULT '{"Convenzionale":4,"Navale":3,"AereoStrategico":2}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_russia      jsonb NOT NULL DEFAULT '{"Convenzionale":3,"Navale":2,"SottoMar":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_cina        jsonb NOT NULL DEFAULT '{"Convenzionale":3,"Navale":2}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_europa      jsonb NOT NULL DEFAULT '{"Convenzionale":2}'::jsonb,
  -- Capacità speciali (usi rimanenti)
  ADD COLUMN IF NOT EXISTS special_uses      jsonb NOT NULL DEFAULT '{"veto_russia":3,"hormuz_iran":false,"superiorita_aerea":false}'::jsonb,
  -- Alleanze attive questo round
  ADD COLUMN IF NOT EXISTS active_alliances  jsonb NOT NULL DEFAULT '[]'::jsonb;

-- RLS (same policy as game_state)
ALTER TABLE territories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE military_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_log     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "territories_read"  ON territories  FOR SELECT USING (true);
CREATE POLICY "territories_write" ON territories  FOR ALL    USING (true);
CREATE POLICY "mil_units_read"    ON military_units FOR SELECT USING (true);
CREATE POLICY "mil_units_write"   ON military_units FOR ALL    USING (true);
CREATE POLICY "combat_log_read"   ON combat_log     FOR SELECT USING (true);
CREATE POLICY "combat_log_write"  ON combat_log     FOR ALL    USING (true);

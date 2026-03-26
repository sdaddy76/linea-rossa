
-- Aggiunge i tracciati forze militari Iran e Coalizione alla tabella game_state
ALTER TABLE game_state
  ADD COLUMN IF NOT EXISTS forze_militari_iran       INTEGER NOT NULL DEFAULT 5 CHECK (forze_militari_iran BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_coalizione INTEGER NOT NULL DEFAULT 5 CHECK (forze_militari_coalizione BETWEEN 1 AND 10);

-- Aggiunge colonna per tracciare le carte OP spese nel mercato
ALTER TABLE moves_log
  ADD COLUMN IF NOT EXISTS is_market_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS market_op_spent    INTEGER,
  ADD COLUMN IF NOT EXISTS market_resources   INTEGER;

COMMENT ON COLUMN game_state.forze_militari_iran IS 'Tracciato forze militari Iran (IRGC) 1-10: usato per calcolo costo nel mercato risorse';
COMMENT ON COLUMN game_state.forze_militari_coalizione IS 'Tracciato forze militari Coalizione 1-10: usato per calcolo costo nel mercato risorse';

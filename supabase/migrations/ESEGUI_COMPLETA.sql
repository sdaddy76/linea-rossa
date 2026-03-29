-- ================================================================
-- LINEA ROSSA — Migration COMPLETA (esegui tutta questa)
-- Aggiunge tutte le colonne opzionali che potrebbero mancare
-- Sicuro da rieseguire: usa ADD COLUMN IF NOT EXISTS
-- ================================================================

-- 1. games: modalità di gioco
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'classic'
    CHECK (game_mode IN ('classic', 'unified'));

-- 2. game_state: forze militari Iran + Coalizione
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS forze_militari_iran       INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_iran BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_coalizione INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_coalizione BETWEEN 1 AND 10);

-- 3. game_state: forze militari Russia/Cina/Europa
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS forze_militari_russia  INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_russia  BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_cina    INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_cina    BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_europa  INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_europa  BETWEEN 1 AND 10);

-- 4. game_state: pool unità (jsonb)
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS units_iran        jsonb DEFAULT '{"Convenzionale":3,"IRGC":2,"Proxy":4,"MissileiBalistici":1,"NavaleGolfo":2,"CyberIran":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_coalizione  jsonb DEFAULT '{"Convenzionale":2,"ForzeSpeciali":2,"AviazioneTattica":2,"DroniPrecisione":3,"ScudoMissilistico":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_russia      jsonb DEFAULT '{"Convenzionale":3,"ArmataCorazzata":2,"SottomariniAKULA":2,"GuerraIbrida":2,"WagnerGroup":3,"SystemsS400":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_cina        jsonb DEFAULT '{"Convenzionale":3,"EsercitoRegolare":2,"DroniCina":2,"NavalePLA":2,"GuerraEconomica":1,"CyberCina":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_europa      jsonb DEFAULT '{"Convenzionale":2,"Peacekeeping":3,"ForzaRapidaEU":1,"SanzioniBCE":1,"MissioneAddestr":2}'::jsonb,
  ADD COLUMN IF NOT EXISTS special_uses      jsonb DEFAULT '{"veto_russia":3,"hormuz_iran":false,"superiorita_aerea":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS active_alliances  jsonb DEFAULT '[]'::jsonb;

-- 5. game_state: eventi turno
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS last_event_turn INT,
  ADD COLUMN IF NOT EXISTS last_event_id   TEXT;

-- 6. cards_deck: mazzo unificato
ALTER TABLE public.cards_deck
  ADD COLUMN IF NOT EXISTS owner_faction TEXT,
  ADD COLUMN IF NOT EXISTS play_mode    TEXT;

-- 7. moves_log: acquisti mercato
ALTER TABLE public.moves_log
  ADD COLUMN IF NOT EXISTS is_market_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS market_op_spent    INTEGER,
  ADD COLUMN IF NOT EXISTS market_resources   INTEGER;

SELECT 'Migration completata OK' AS risultato;

-- =============================================
-- LINEA ROSSA — Fix: colonne mancanti in game_state
-- Aggiunge forze_militari per Russia/Cina/Europa
-- e allinea i DEFAULT delle units_* alle nuove
-- unità asimmetriche v2
-- =============================================

-- Colonne forze_militari mancanti
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS forze_militari_russia  INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_russia  BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_cina    INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_cina    BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_europa  INTEGER NOT NULL DEFAULT 5
    CHECK (forze_militari_europa  BETWEEN 1 AND 10);

-- Aggiorna DEFAULT units_* alle nuove unità asimmetriche v2
ALTER TABLE public.game_state
  ALTER COLUMN units_iran       SET DEFAULT '{"Convenzionale":3,"IRGC":2,"Proxy":4,"MissileiBalistici":1,"NavaleGolfo":2,"CyberIran":1}'::jsonb,
  ALTER COLUMN units_coalizione SET DEFAULT '{"Convenzionale":2,"ForzeSpeciali":2,"AviazioneTattica":2,"DroniPrecisione":3,"ScudoMissilistico":1}'::jsonb,
  ALTER COLUMN units_russia     SET DEFAULT '{"Convenzionale":3,"ArmataCorazzata":2,"SottomariniAKULA":2,"GuerraIbrida":2,"WagnerGroup":3,"SystemsS400":1}'::jsonb,
  ALTER COLUMN units_cina       SET DEFAULT '{"Convenzionale":3,"EsercitoRegolare":2,"DroniCina":2,"NavalePLA":2,"GuerraEconomica":1,"CyberCina":1}'::jsonb,
  ALTER COLUMN units_europa     SET DEFAULT '{"Convenzionale":2,"Peacekeeping":3,"ForzaRapidaEU":1,"SanzioniBCE":1,"MissioneAddestr":2}'::jsonb;

-- Aggiorna le righe esistenti che hanno ancora i vecchi valori di DEFAULT
UPDATE public.game_state
SET
  forze_militari_russia = COALESCE(forze_militari_russia, 5),
  forze_militari_cina   = COALESCE(forze_militari_cina,   5),
  forze_militari_europa = COALESCE(forze_militari_europa, 5)
WHERE forze_militari_russia IS NULL
   OR forze_militari_cina   IS NULL
   OR forze_militari_europa IS NULL;

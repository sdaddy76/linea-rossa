-- =============================================
-- LINEA ROSSA — Migration completa colonne mancanti
-- Esegui questo script nel SQL Editor di Supabase
-- https://supabase.com → SQL Editor → New query
-- =============================================

-- 1. Colonne forze_militari per tutte le fazioni
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS forze_militari_russia  INTEGER NOT NULL DEFAULT 5 CHECK (forze_militari_russia  BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_cina    INTEGER NOT NULL DEFAULT 5 CHECK (forze_militari_cina    BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS forze_militari_europa  INTEGER NOT NULL DEFAULT 5 CHECK (forze_militari_europa  BETWEEN 1 AND 10);

-- 2. Pool unità per fazione (asimmetriche v2)
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS units_iran        JSONB NOT NULL DEFAULT '{"Convenzionale":3,"IRGC":2,"Proxy":4,"MissileiBalistici":1,"NavaleGolfo":2,"CyberIran":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_coalizione  JSONB NOT NULL DEFAULT '{"Convenzionale":2,"ForzeSpeciali":2,"AviazioneTattica":2,"DroniPrecisione":3,"ScudoMissilistico":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_russia      JSONB NOT NULL DEFAULT '{"Convenzionale":3,"ArmataCorazzata":2,"SottomariniAKULA":2,"GuerraIbrida":2,"WagnerGroup":3,"SystemsS400":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_cina        JSONB NOT NULL DEFAULT '{"Convenzionale":3,"EsercitoRegolare":2,"DroniCina":2,"NavalePLA":2,"GuerraEconomica":1,"CyberCina":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_europa      JSONB NOT NULL DEFAULT '{"Convenzionale":2,"Peacekeeping":3,"ForzaRapidaEU":1,"SanzioniBCE":1,"MissioneAddestr":2}'::jsonb;

-- 3. Usi speciali e alleanze attive
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS special_uses      JSONB NOT NULL DEFAULT '{"veto_russia":3,"hormuz_iran":false,"superiorita_aerea":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS active_alliances  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4. Tracciati fazione extra
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS tecnologia_nucleare_iran          INTEGER NOT NULL DEFAULT 1  CHECK (tecnologia_nucleare_iran         BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS influenza_diplomatica_coalizione  INTEGER NOT NULL DEFAULT 5  CHECK (influenza_diplomatica_coalizione  BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS tecnologia_avanzata_coalizione    INTEGER NOT NULL DEFAULT 3  CHECK (tecnologia_avanzata_coalizione    BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS supporto_pubblico_coalizione      INTEGER NOT NULL DEFAULT 7  CHECK (supporto_pubblico_coalizione      BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS influenza_militare_russia         INTEGER NOT NULL DEFAULT 5  CHECK (influenza_militare_russia         BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS influenza_commerciale_cina        INTEGER NOT NULL DEFAULT 5  CHECK (influenza_commerciale_cina        BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS cyber_warfare_cina                INTEGER NOT NULL DEFAULT 3  CHECK (cyber_warfare_cina                BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS influenza_diplomatica_europa      INTEGER NOT NULL DEFAULT 6  CHECK (influenza_diplomatica_europa      BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS aiuti_umanitari_europa            INTEGER NOT NULL DEFAULT 5  CHECK (aiuti_umanitari_europa            BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS coesione_ue_europa                INTEGER NOT NULL DEFAULT 7  CHECK (coesione_ue_europa                BETWEEN 1 AND 10);

-- 5. Fix RPC generate_game_code (aveva bug "column reference code is ambiguous")
CREATE OR REPLACE FUNCTION public.generate_game_code()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['GULF','IRAN','ATOM','NUKE','HAWK','DOVE','SAND','SILK','BRIC','NATO'];
  new_code TEXT;
  already_exists BOOLEAN;
BEGIN
  LOOP
    new_code := prefixes[floor(random() * array_length(prefixes,1) + 1)] || '-' || floor(random()*90+10)::TEXT;
    SELECT EXISTS(SELECT 1 FROM public.games g WHERE g.code = new_code) INTO already_exists;
    EXIT WHEN NOT already_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fine migration
SELECT 'Migration completata con successo!' AS risultato;

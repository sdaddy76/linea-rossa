-- ============================================================
-- MIGRATION: Aggiunta tracciati per-fazione da regolamento
-- Ogni fazione ha 3 tracciati + 1 indicatore specifici
-- ============================================================

-- ─── IRAN ────────────────────────────────────────────────────
ALTER TABLE game_states
  ADD COLUMN IF NOT EXISTS tecnologia_nucleare_iran INTEGER NOT NULL DEFAULT 1 CHECK (tecnologia_nucleare_iran BETWEEN 1 AND 10);

-- Stabilità Interna Iran già esiste come stabilita_iran — ok

-- ─── COALIZIONE ──────────────────────────────────────────────
-- risorse_coalizione già esiste (ex-forze_militari range 1-15) — rinominato semanticamente nel frontend
ALTER TABLE game_states
  ADD COLUMN IF NOT EXISTS influenza_diplomatica_coalizione INTEGER NOT NULL DEFAULT 5 CHECK (influenza_diplomatica_coalizione BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS tecnologia_avanzata_coalizione   INTEGER NOT NULL DEFAULT 5 CHECK (tecnologia_avanzata_coalizione   BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS supporto_pubblico_coalizione     INTEGER NOT NULL DEFAULT 7 CHECK (supporto_pubblico_coalizione     BETWEEN 1 AND 10);

-- ─── RUSSIA ──────────────────────────────────────────────────
-- risorse_russia già esiste (Energia/Risorse [1-10]) — ok
ALTER TABLE game_states
  ADD COLUMN IF NOT EXISTS influenza_militare_russia   INTEGER NOT NULL DEFAULT 5  CHECK (influenza_militare_russia  BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS veto_onu_russia             INTEGER NOT NULL DEFAULT 3  CHECK (veto_onu_russia            BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS stabilita_economica_russia  INTEGER NOT NULL DEFAULT 6  CHECK (stabilita_economica_russia BETWEEN 1 AND 10);

-- ─── CINA ────────────────────────────────────────────────────
-- risorse_cina già esiste (Potenza Economica [1-12]) — occorre ampliare il check
ALTER TABLE game_states
  DROP CONSTRAINT IF EXISTS game_states_risorse_cina_check;
ALTER TABLE game_states
  ADD CONSTRAINT game_states_risorse_cina_check CHECK (risorse_cina BETWEEN 1 AND 12);

ALTER TABLE game_states
  ADD COLUMN IF NOT EXISTS influenza_commerciale_cina INTEGER NOT NULL DEFAULT 5 CHECK (influenza_commerciale_cina BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS cyber_warfare_cina         INTEGER NOT NULL DEFAULT 3 CHECK (cyber_warfare_cina         BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS stabilita_rotte_cina       INTEGER NOT NULL DEFAULT 7 CHECK (stabilita_rotte_cina       BETWEEN 1 AND 10);

-- ─── EUROPA ──────────────────────────────────────────────────
-- risorse_europa già esiste (Stabilità Energetica [1-10]) — ok
ALTER TABLE game_states
  ADD COLUMN IF NOT EXISTS influenza_diplomatica_europa INTEGER NOT NULL DEFAULT 6 CHECK (influenza_diplomatica_europa BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS aiuti_umanitari_europa       INTEGER NOT NULL DEFAULT 5 CHECK (aiuti_umanitari_europa       BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS coesione_ue_europa           INTEGER NOT NULL DEFAULT 7 CHECK (coesione_ue_europa           BETWEEN 1 AND 10);

-- ─── Coalizione: aggiorna range risorse_coalizione a 1-15 ────
ALTER TABLE game_states
  DROP CONSTRAINT IF EXISTS game_states_risorse_coalizione_check;
ALTER TABLE game_states
  ADD CONSTRAINT game_states_risorse_coalizione_check CHECK (risorse_coalizione BETWEEN 1 AND 15);

-- Valori default iniziali sensati per partite già esistenti
UPDATE game_states SET
  tecnologia_nucleare_iran           = COALESCE(tecnologia_nucleare_iran, 1),
  influenza_diplomatica_coalizione   = COALESCE(influenza_diplomatica_coalizione, 5),
  tecnologia_avanzata_coalizione     = COALESCE(tecnologia_avanzata_coalizione, 5),
  supporto_pubblico_coalizione       = COALESCE(supporto_pubblico_coalizione, 7),
  influenza_militare_russia          = COALESCE(influenza_militare_russia, 5),
  veto_onu_russia                    = COALESCE(veto_onu_russia, 3),
  stabilita_economica_russia         = COALESCE(stabilita_economica_russia, 6),
  influenza_commerciale_cina         = COALESCE(influenza_commerciale_cina, 5),
  cyber_warfare_cina                 = COALESCE(cyber_warfare_cina, 3),
  stabilita_rotte_cina               = COALESCE(stabilita_rotte_cina, 7),
  influenza_diplomatica_europa       = COALESCE(influenza_diplomatica_europa, 6),
  aiuti_umanitari_europa             = COALESCE(aiuti_umanitari_europa, 5),
  coesione_ue_europa                 = COALESCE(coesione_ue_europa, 7)
WHERE TRUE;

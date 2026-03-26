
-- Aggiunge colonne plance personali e colonna categoria_tni alla tabella cards_library
ALTER TABLE cards_library
  ADD COLUMN IF NOT EXISTS categoria_tni TEXT,
  -- IRAN
  ADD COLUMN IF NOT EXISTS iran_risorse_eco    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iran_forze_mil      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iran_stab_int       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iran_tech_nucleare  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iran_asse_resist    INTEGER DEFAULT 0,
  -- COALIZIONE
  ADD COLUMN IF NOT EXISTS coal_risorse_mil    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coal_infl_dipl      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coal_tech_avanz     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coal_supp_pubblico  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coal_alleanze       INTEGER DEFAULT 0,
  -- EUROPA
  ADD COLUMN IF NOT EXISTS ue_infl_dipl        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_aiuti_uman       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_stab_energ       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_coesione_int     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ue_pol_multilat     INTEGER DEFAULT 0,
  -- CINA
  ADD COLUMN IF NOT EXISTS cina_pot_eco        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cina_infl_comm      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cina_cyber          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cina_stab_rotte     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cina_progetti_bri   INTEGER DEFAULT 0,
  -- RUSSIA
  ADD COLUMN IF NOT EXISTS russia_infl_mil     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_energia      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_veto_onu     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_stab_eco     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS russia_op_spec      INTEGER DEFAULT 0,
  -- CARTA COLLEGATA (colonna codice, già presente ma rinomino per chiarezza)
  ADD COLUMN IF NOT EXISTS linked_effect       TEXT;

COMMENT ON COLUMN cards_library.linked_card_id  IS 'Codice carta collegata (es. C004)';
COMMENT ON COLUMN cards_library.linked_effect   IS 'Descrizione effetto combo con carta collegata';
COMMENT ON COLUMN cards_library.categoria_tni   IS 'Categoria TNI: Militare | Diplomatica | Media';

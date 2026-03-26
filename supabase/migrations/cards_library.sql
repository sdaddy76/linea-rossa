
-- =============================================
-- LINEA ROSSA — Libreria carte personalizzata
-- Caricabile tramite file Excel dall'utente
-- =============================================

CREATE TABLE IF NOT EXISTS public.cards_library (
  -- Identificatori
  card_id       TEXT PRIMARY KEY,               -- Codice carta (es. C001, E012)
  card_name     TEXT NOT NULL,                  -- Nome carta
  faction       TEXT NOT NULL DEFAULT 'Neutrale', -- Iran | Coalizione | Russia | Cina | Europa | Neutrale
  card_type     TEXT NOT NULL DEFAULT 'Evento', -- Militare | Diplomatico | Economico | Segreto | Media | Evento | Politico
  deck_type     TEXT NOT NULL DEFAULT 'base',   -- base | speciale
  op_points     INTEGER NOT NULL DEFAULT 1,     -- Costo punti operazione (1-5)
  description   TEXT,                           -- Testo descrittivo della carta

  -- Effetti sui tracciati (delta applicato al valore corrente)
  delta_nucleare    INTEGER DEFAULT 0,          -- modifica Tracciato Nucleare Iraniano
  delta_sanzioni    INTEGER DEFAULT 0,          -- modifica Sanzioni / Stabilità
  delta_defcon      INTEGER DEFAULT 0,          -- modifica DEFCON
  delta_opinione    INTEGER DEFAULT 0,          -- modifica Opinione Globale
  delta_risorse     INTEGER DEFAULT 0,          -- modifica Risorse fazione
  delta_stabilita   INTEGER DEFAULT 0,          -- modifica Stabilità Interna fazione

  -- Carta collegata: effetti aggiuntivi se una carta specifica è già stata giocata
  linked_card_id          TEXT,                 -- Codice della carta che "attiva" l'effetto collegato
  linked_delta_nucleare   INTEGER DEFAULT 0,
  linked_delta_sanzioni   INTEGER DEFAULT 0,
  linked_delta_defcon     INTEGER DEFAULT 0,
  linked_delta_opinione   INTEGER DEFAULT 0,
  linked_delta_risorse    INTEGER DEFAULT 0,
  linked_delta_stabilita  INTEGER DEFAULT 0,
  linked_description      TEXT,                 -- Testo descrittivo dell'effetto collegato

  -- Metadata
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indici per ricerche frequenti
CREATE INDEX IF NOT EXISTS idx_cards_library_faction   ON public.cards_library(faction);
CREATE INDEX IF NOT EXISTS idx_cards_library_card_type ON public.cards_library(card_type);
CREATE INDEX IF NOT EXISTS idx_cards_library_deck_type ON public.cards_library(deck_type);

-- Trigger aggiornamento automatico updated_at
CREATE OR REPLACE FUNCTION update_cards_library_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cards_library_updated ON public.cards_library;
CREATE TRIGGER trg_cards_library_updated
  BEFORE UPDATE ON public.cards_library
  FOR EACH ROW EXECUTE FUNCTION update_cards_library_timestamp();

-- RLS: tutti possono leggere, solo autenticati possono scrivere
ALTER TABLE public.cards_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cards_library_select" ON public.cards_library;
CREATE POLICY "cards_library_select"
  ON public.cards_library FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "cards_library_insert" ON public.cards_library;
CREATE POLICY "cards_library_insert"
  ON public.cards_library FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cards_library_update" ON public.cards_library;
CREATE POLICY "cards_library_update"
  ON public.cards_library FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cards_library_delete" ON public.cards_library;
CREATE POLICY "cards_library_delete"
  ON public.cards_library FOR DELETE
  USING (auth.uid() IS NOT NULL);

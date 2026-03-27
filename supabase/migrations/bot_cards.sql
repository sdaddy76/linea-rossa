
-- =============================================
-- LINEA ROSSA — Carte BOT (v2)
-- Struttura: selezione mazzo per priorità →
--            pesca casuale → condizione carta →
--            applica Azione P1 o P2
-- =============================================

-- Rimuovi vecchia tabella se presente
DROP TABLE IF EXISTS public.bot_cards CASCADE;

CREATE TABLE public.bot_cards (
  -- Identificatori
  id             TEXT PRIMARY KEY,          -- es. IR-NUC-01
  faction        TEXT NOT NULL,             -- Iran | Coalizione Occidentale (USA) | ...
  
  -- Selezione mazzo
  deck_priority  INT  NOT NULL,             -- 1=prima scelta, 2=seconda, 3=fallback
  deck_name      TEXT NOT NULL,             -- es. Tecnologia Nucleare
  deck_condition TEXT NOT NULL,             -- es. "Nucleare ≤ 10"
  
  -- Logica carta (valutata dopo la pesca)
  card_condition TEXT NOT NULL,             -- es. "Nucleare ≤ 5"
  priority_1     TEXT NOT NULL,             -- azione se condizione carta vera
  priority_2     TEXT,                      -- azione se condizione carta falsa
  
  -- Metadata
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indici
CREATE INDEX idx_bot_cards_faction          ON public.bot_cards(faction);
CREATE INDEX idx_bot_cards_deck_priority    ON public.bot_cards(faction, deck_priority);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_bot_cards_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bot_cards_updated ON public.bot_cards;
CREATE TRIGGER trg_bot_cards_updated
  BEFORE UPDATE ON public.bot_cards
  FOR EACH ROW EXECUTE FUNCTION update_bot_cards_timestamp();

-- RLS
ALTER TABLE public.bot_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_cards_select" ON public.bot_cards;
CREATE POLICY "bot_cards_select" ON public.bot_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "bot_cards_insert" ON public.bot_cards;
CREATE POLICY "bot_cards_insert" ON public.bot_cards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "bot_cards_update" ON public.bot_cards;
CREATE POLICY "bot_cards_update" ON public.bot_cards FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "bot_cards_delete" ON public.bot_cards;
CREATE POLICY "bot_cards_delete" ON public.bot_cards FOR DELETE USING (auth.uid() IS NOT NULL);

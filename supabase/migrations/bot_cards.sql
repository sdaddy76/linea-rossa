
-- =============================================
-- LINEA ROSSA — Carte BOT
-- Logica condizionale per fazioni gestite dal bot
-- Caricabile tramite file Excel dedicato
-- =============================================

CREATE TABLE IF NOT EXISTS public.bot_cards (
  -- Identificatori
  id            TEXT PRIMARY KEY,          -- es. IR-ECO-01, USA-MIL-03
  faction       TEXT NOT NULL,             -- Iran | Coalizione | Russia-Cina | Unione Europea | Israele
  deck          TEXT NOT NULL,             -- Nome del mazzo (es. Risorse Economiche)

  -- Logica di attivazione
  condition     TEXT NOT NULL,             -- Testo condizione (es. "Risorse Eco ≤ 3")

  -- Azioni prioritarie
  priority_1    TEXT NOT NULL,             -- Azione principale se condizione soddisfatta
  priority_2    TEXT,                      -- Azione alternativa se priorità 1 non applicabile

  -- Metadata
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indici per query frequenti
CREATE INDEX IF NOT EXISTS idx_bot_cards_faction ON public.bot_cards(faction);
CREATE INDEX IF NOT EXISTS idx_bot_cards_deck    ON public.bot_cards(deck);

-- Trigger aggiornamento automatico updated_at
CREATE OR REPLACE FUNCTION update_bot_cards_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bot_cards_updated ON public.bot_cards;
CREATE TRIGGER trg_bot_cards_updated
  BEFORE UPDATE ON public.bot_cards
  FOR EACH ROW EXECUTE FUNCTION update_bot_cards_timestamp();

-- RLS: tutti leggono, solo autenticati scrivono
ALTER TABLE public.bot_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_cards_select" ON public.bot_cards;
CREATE POLICY "bot_cards_select"
  ON public.bot_cards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "bot_cards_insert" ON public.bot_cards;
CREATE POLICY "bot_cards_insert"
  ON public.bot_cards FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "bot_cards_update" ON public.bot_cards;
CREATE POLICY "bot_cards_update"
  ON public.bot_cards FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "bot_cards_delete" ON public.bot_cards;
CREATE POLICY "bot_cards_delete"
  ON public.bot_cards FOR DELETE
  USING (auth.uid() IS NOT NULL);

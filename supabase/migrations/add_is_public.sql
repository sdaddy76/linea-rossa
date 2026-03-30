-- Migration: partite aperte / riservate + rimozione vincolo NOT NULL su name
-- Esegui su Supabase Dashboard → SQL Editor

-- 1. Aggiunge colonna is_public (default FALSE = riservata, compatibile con partite esistenti)
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Rende name opzionale (era NOT NULL)
ALTER TABLE public.games
  ALTER COLUMN name DROP NOT NULL;

-- 3. Indice per filtrare le partite pubbliche in lobby rapidamente
CREATE INDEX IF NOT EXISTS idx_games_public_lobby
  ON public.games (is_public, status)
  WHERE status IN ('lobby', 'active');

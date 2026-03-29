-- ============================================================
-- Migration: colonne per mazzo unificato, eventi e game_mode
-- Esegui su Supabase → SQL Editor
-- ============================================================

-- 1. games: modalità di gioco (classico vs unificato)
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'classic'
    CHECK (game_mode IN ('classic', 'unified'));

-- 2. cards_deck: colonne per mazzo unificato
ALTER TABLE public.cards_deck
  ADD COLUMN IF NOT EXISTS owner_faction TEXT,   -- fazione proprietaria della carta nel mazzo unificato
  ADD COLUMN IF NOT EXISTS play_mode    TEXT;    -- 'event' | 'ops' | null (come è stata giocata)

-- 3. game_state: tracciamento evento corrente per turno
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS last_event_turn INT,
  ADD COLUMN IF NOT EXISTS last_event_id   TEXT;

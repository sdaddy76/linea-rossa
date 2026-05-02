-- =============================================
-- LINEA ROSSA — Migrazione: turno variabile
-- Aggiunge colonne per durata partita e tracciata
-- Da eseguire nel SQL Editor di Supabase Dashboard
-- =============================================

-- Tabella games: durata partita e limite tracciata
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS game_length TEXT DEFAULT 'media'
    CHECK (game_length IN ('breve','media','lunga')),
  ADD COLUMN IF NOT EXISTS track_limit INTEGER DEFAULT 70;

-- Tabella game_state: posizione segnalino + ordine turno variabile
ALTER TABLE game_state
  ADD COLUMN IF NOT EXISTS track_position     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_turn_order TEXT[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_turn_advancers TEXT[] DEFAULT NULL;

-- Aggiorna partite esistenti con valori di default
UPDATE games SET
  game_length = 'media',
  track_limit = 70
WHERE game_length IS NULL;

UPDATE game_state SET
  track_position = 0
WHERE track_position IS NULL;

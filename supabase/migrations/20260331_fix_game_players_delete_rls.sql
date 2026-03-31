-- ================================================================
-- FIX: Aggiunge policy RLS DELETE mancante su game_players
-- Senza questa policy, Supabase blocca silenziosamente il DELETE
-- causando la comparsa di righe duplicate (stesso player_id,
-- fazioni diverse) quando un giocatore cambia fazione.
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'game_players'
      AND policyname = 'gp_delete'
  ) THEN
    CREATE POLICY "gp_delete"
      ON public.game_players
      FOR DELETE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

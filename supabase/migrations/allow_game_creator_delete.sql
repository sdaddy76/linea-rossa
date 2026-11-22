-- Consente al creatore di eliminare il tavolo e i dati collegati
-- (le FK ON DELETE CASCADE rimuovono stato, carte, mosse e giocatori).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'games'
      AND policyname = 'Partita eliminabile dal creatore'
  ) THEN
    CREATE POLICY "Partita eliminabile dal creatore"
      ON public.games
      FOR DELETE
      USING (auth.uid() = created_by);
  END IF;
END
$$;

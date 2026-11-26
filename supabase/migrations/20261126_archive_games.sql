-- Archivio dei tavoli (2026-11-26).
-- Le partite non si cancellano: chi ha creato il tavolo (o l'amministratore) le archivia,
-- e spariscono dalle liste dei giocatori. Solo l'amministratore può ripristinarle.
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS games_archived_at_idx ON public.games (archived_at);

CREATE OR REPLACE FUNCTION public.archive_games(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accesso richiesto' USING ERRCODE = '42501'; END IF;
  UPDATE public.games SET archived_at = now(), archived_by = auth.uid()
   WHERE id = ANY(p_ids) AND archived_at IS NULL
     AND (created_by = auth.uid() OR public.is_linea_rossa_admin());
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.restore_games(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_linea_rossa_admin() THEN RAISE EXCEPTION 'Solo l''amministratore può ripristinare le partite' USING ERRCODE = '42501'; END IF;
  UPDATE public.games SET archived_at = NULL, archived_by = NULL
   WHERE id = ANY(p_ids) AND archived_at IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.archive_games(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_games(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_games(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_games(uuid[]) TO authenticated;

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SQL_MIGRATION = `
-- ============================================
-- LINEA ROSSA — Migration colonne + RLS fix
-- Esegui nel SQL Editor di Supabase:
-- supabase.com → tuo progetto → SQL Editor
-- ============================================

ALTER TABLE game_state ADD COLUMN IF NOT EXISTS forze_militari_russia  INTEGER NOT NULL DEFAULT 3;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS forze_militari_cina    INTEGER NOT NULL DEFAULT 3;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS forze_militari_europa  INTEGER NOT NULL DEFAULT 3;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS units_iran        JSONB DEFAULT '{}';
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS units_coalizione   JSONB DEFAULT '{}';
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS units_russia       JSONB DEFAULT '{}';
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS units_cina         JSONB DEFAULT '{}';
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS units_europa       JSONB DEFAULT '{}';
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS special_uses       JSONB DEFAULT '{}';
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS active_alliances   JSONB DEFAULT '[]';

DROP POLICY IF EXISTS "Mazzo modificabile da partecipanti" ON public.cards_deck;
CREATE POLICY "Mazzo modificabile da partecipanti" ON public.cards_deck FOR UPDATE USING (
  auth.uid() IN (
    SELECT player_id FROM public.game_players
    WHERE game_players.game_id = cards_deck.game_id AND player_id IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Stato modificabile da partecipanti" ON public.game_state;
CREATE POLICY "Stato modificabile da partecipanti" ON public.game_state FOR UPDATE USING (
  auth.uid() IN (
    SELECT player_id FROM public.game_players
    WHERE game_players.game_id = game_state.game_id AND player_id IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Log inseribile da partecipanti" ON public.moves_log;
CREATE POLICY "Log inseribile da partecipanti" ON public.moves_log FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT player_id FROM public.game_players
    WHERE game_players.game_id = moves_log.game_id AND player_id IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION public.generate_game_code(p_prefix text DEFAULT 'GAME')
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE code text; i int := 0;
BEGIN
  LOOP
    code := p_prefix || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.games WHERE game_code = code);
    i := i + 1;
    IF i > 100 THEN RAISE EXCEPTION 'Impossibile generare codice unico'; END IF;
  END LOOP;
  RETURN code;
END;
$$;

SELECT 'Migration completata!' AS risultato;
`;

interface ColStatus { name: string; present: boolean; }

export default function AdminMigration() {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cols, setCols] = useState<ColStatus[]>([]);

  const copy = () => {
    navigator.clipboard.writeText(SQL_MIGRATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const check = async () => {
    setChecking(true);
    const { data } = await supabase.from('game_state').select('*').limit(1);
    if (data?.[0]) {
      const keys = Object.keys(data[0]);
      const needed = ['forze_militari_russia','forze_militari_cina','forze_militari_europa',
        'units_iran','units_coalizione','units_russia','units_cina','units_europa',
        'special_uses','active_alliances'];
      setCols(needed.map(n => ({ name: n, present: keys.includes(n) })));
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 font-mono">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#00ff88]">⚙️ Admin — Database Migration</h1>
        <p className="text-[#8899aa] text-sm">
          Esegui questo script nel <b>SQL Editor</b> del pannello Supabase
          per aggiungere le colonne mancanti e correggere le RLS policies.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={copy}
            className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] font-bold rounded hover:bg-[#00dd77]">
            {copied ? '✅ Copiato!' : '📋 Copia SQL'}
          </button>
          <button onClick={check} disabled={checking}
            className="px-4 py-2 bg-[#1e3a5f] border border-[#334455] rounded hover:bg-[#2a4a6f]">
            {checking ? '⏳ Verifico...' : '🔍 Verifica colonne DB'}
          </button>
          <a href="https://supabase.com/dashboard/project/zgatqhrafaorexqrftcv/sql/new"
            target="_blank" rel="noreferrer"
            className="px-4 py-2 bg-[#3ecf8e20] border border-[#3ecf8e] text-[#3ecf8e] rounded hover:bg-[#3ecf8e30]">
            🚀 Apri SQL Editor Supabase
          </a>
        </div>
        {cols.length > 0 && (
          <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4 space-y-1">
            <p className="text-xs text-[#8899aa] mb-2">Stato colonne nel DB:</p>
            {cols.map(c => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className={c.present ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{c.present ? '✓' : '✗'}</span>
                <span className={c.present ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{c.name}</span>
                {!c.present && <span className="text-[#f59e0b]">← esegui lo script SQL</span>}
              </div>
            ))}
            {cols.every(c => c.present) && (
              <p className="text-[#22c55e] font-bold mt-2">✅ Tutte le colonne presenti — nessuna azione richiesta!</p>
            )}
          </div>
        )}
        <pre className="bg-[#060a14] border border-[#1e3a5f] rounded-xl p-4 text-xs
          text-[#22c55e] overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto">
          {SQL_MIGRATION}
        </pre>
      </div>
    </div>
  );
}

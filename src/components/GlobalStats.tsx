// =============================================
// LINEA ROSSA — GlobalStats
// Statistiche cumulate di tutte le partite (solo admin sdaddino@yahoo.it)
// =============================================
import React, { useEffect, useState } from 'react';

interface FactionWins { [faction: string]: number }
interface ConditionCounts { [condition: string]: number }

interface StatsData {
  factionWins: FactionWins;
  conditionCounts: ConditionCounts;
  totalGames: number;
  movesPerFaction: { [faction: string]: number };
}

const FACTION_FLAGS: Record<string, string> = {
  Iran: '🇮🇷', Coalizione: '🇺🇸', Russia: '🇷🇺', Cina: '🇨🇳', Europa: '🇪🇺',
};

const GlobalStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');

        // Query 1: partite finite
        const { data: gamesData, error: gamesErr } = await supabase
          .from('games')
          .select('winner_faction, winner_condition')
          .eq('status', 'finished');

        if (gamesErr) throw gamesErr;

        // Query 2: mosse per fazione
        const { data: movesData, error: movesErr } = await supabase
          .from('moves_log')
          .select('faction');

        if (movesErr) throw movesErr;

        if (cancelled) return;

        // Aggregazione factionWins
        const factionWins: FactionWins = {};
        const conditionCounts: ConditionCounts = {};
        let noWinner = 0;

        for (const g of (gamesData ?? [])) {
          const f = g.winner_faction ?? 'Nessun vincitore';
          factionWins[f] = (factionWins[f] ?? 0) + 1;
          if (!g.winner_faction) noWinner++;
          const c = g.winner_condition ?? 'sconosciuto';
          conditionCounts[c] = (conditionCounts[c] ?? 0) + 1;
        }

        // Aggregazione mosse per fazione
        const movesPerFaction: { [k: string]: number } = {};
        for (const m of (movesData ?? [])) {
          const f = (m as { faction?: string }).faction ?? 'sconosciuto';
          movesPerFaction[f] = (movesPerFaction[f] ?? 0) + 1;
        }

        setStats({
          factionWins,
          conditionCounts,
          totalGames: (gamesData ?? []).length,
          movesPerFaction,
        });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-xl p-4">
        <span className="font-mono text-xs text-[#8899aa]">📊 Caricamento statistiche…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-[#0d1117] border border-[#7f1d1d] rounded-xl p-4">
        <span className="font-mono text-xs text-[#ff4444]">⚠️ Dati non disponibili (permessi insufficienti o tabelle vuote)</span>
      </div>
    );
  }

  const factions = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

  return (
    <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-[#00ff88]">📊 Statistiche Globali</span>
        <span className="font-mono text-[10px] text-[#334455]">— partite totali: {stats.totalGames}</span>
      </div>

      {/* Vittorie per fazione */}
      <div>
        <p className="font-mono text-[10px] text-[#8899aa] mb-2 uppercase tracking-widest">Vittorie per fazione</p>
        <div className="flex flex-wrap gap-2">
          {factions.map(f => (
            <div key={f} className="bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-center min-w-[90px]">
              <div className="text-lg">{FACTION_FLAGS[f] ?? '🏳️'}</div>
              <div className="font-mono text-[10px] text-[#8899aa]">{f}</div>
              <div className="font-mono text-xl font-black text-[#00ff88]">{stats.factionWins[f] ?? 0}</div>
              <div className="font-mono text-[9px] text-[#334455]">vince</div>
            </div>
          ))}
          <div className="bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-center min-w-[90px]">
            <div className="text-lg">🤝</div>
            <div className="font-mono text-[10px] text-[#8899aa]">Nessuno</div>
            <div className="font-mono text-xl font-black text-[#ffaa00]">{stats.factionWins['Nessun vincitore'] ?? 0}</div>
            <div className="font-mono text-[9px] text-[#334455]">nessun vince</div>
          </div>
        </div>
      </div>

      {/* Condizioni di vittoria */}
      <div>
        <p className="font-mono text-[10px] text-[#8899aa] mb-2 uppercase tracking-widest">Condizioni di vittoria</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.conditionCounts).sort((a, b) => b[1] - a[1]).map(([cond, count]) => (
            <span key={cond} className="font-mono text-[11px] bg-[#0a0e1a] border border-[#1e3a5f] rounded px-2 py-1 text-[#aabbcc]">
              {cond} <span className="text-[#00ff88] font-bold">×{count}</span>
            </span>
          ))}
          {Object.keys(stats.conditionCounts).length === 0 && (
            <span className="font-mono text-[10px] text-[#334455]">nessun dato</span>
          )}
        </div>
      </div>

      {/* Mosse per fazione */}
      <div>
        <p className="font-mono text-[10px] text-[#8899aa] mb-2 uppercase tracking-widest">Mosse totali per fazione</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.movesPerFaction).sort((a, b) => b[1] - a[1]).map(([f, n]) => (
            <span key={f} className="font-mono text-[11px] bg-[#0a0e1a] border border-[#1e3a5f] rounded px-2 py-1 text-[#aabbcc]">
              {FACTION_FLAGS[f] ?? ''} {f} <span className="text-[#00ff88] font-bold">{n}</span>
            </span>
          ))}
          {Object.keys(stats.movesPerFaction).length === 0 && (
            <span className="font-mono text-[10px] text-[#334455]">nessun dato</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalStats;

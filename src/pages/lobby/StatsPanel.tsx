import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MyGame { game_id: string; name: string | null; code: string; finished_at: string | null; faction: string; final_score: number; final_position: number; is_winner: boolean; humans: number; mode: string | null; reason: string | null }
export interface Leader { player_id: string; username: string; games: number; wins: number; ranking_points: number; avg_score: number; avg_position: number; favourite_faction: string | null }

const REASON: Record<string, string> = { points: 'ai punti', war: 'guerra totale', nuclear: 'Nucleare 15', sanctions: 'Sanzioni 10' };
const COLORS: Record<string, string> = { Iran: '#22c55e', Coalizione: '#3b82f6', Russia: '#ef4444', Cina: '#f59e0b', Europa: '#a78bfa' };

/** Riassunto delle mie partite concluse: totali, vittorie e fazione più giocata. */
export function summarize(games: MyGame[]) {
  const byFaction = new Map<string, { games: number; wins: number }>();
  for (const g of games) { const x = byFaction.get(g.faction) ?? { games: 0, wins: 0 }; x.games++; if (g.is_winner) x.wins++; byFaction.set(g.faction, x); }
  const wins = games.filter(g => g.is_winner).length;
  return { played: games.length, wins, rate: games.length ? Math.round(wins * 100 / games.length) : 0,
    avg: games.length ? Math.round(games.reduce((n, g) => n + g.final_score, 0) * 10 / games.length) / 10 : 0,
    factions: [...byFaction.entries()].sort((a, b) => b[1].games - a[1].games) };
}

export function StatsPanel({ userId, username, onClose, onOpen }: { userId: string; username: string; onClose: () => void; onOpen: (gameId: string) => void }) {
  const [tab, setTab] = useState<'mine' | 'board'>('mine');
  const [mine, setMine] = useState<MyGame[] | null>(null);
  const [board, setBoard] = useState<Leader[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    void supabase.rpc('linea_rossa_my_games' as never, { p_limit: 100 } as never).then(r => {
      if (r.error) setError('Storico non disponibile: ' + r.error.message); else setMine((r.data ?? []) as MyGame[]);
    });
    void supabase.rpc('linea_rossa_leaderboard' as never, { p_min_games: 1 } as never).then(r => {
      if (r.error) setError('Classifica non disponibile: ' + r.error.message); else setBoard((r.data ?? []) as Leader[]);
    });
  }, []);
  const s = mine ? summarize(mine) : null;
  const tabClass = (on: boolean) => `rounded-lg border px-3 py-1.5 text-xs font-bold ${on ? 'border-emerald-400 text-emerald-200 bg-emerald-950/40' : 'border-slate-700 text-slate-300'}`;
  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
    <div className="readability-content bg-[#080e1a] border border-[#1e3a5f] rounded-2xl p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto text-slate-100" onClick={e => e.stopPropagation()} role="dialog" aria-label="Statistiche">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black font-mono tracking-widest text-[#00ff88]">📊 STATISTICHE · {username}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm" aria-label="Chiudi">✕</button>
      </div>
      <div className="flex gap-2 mb-4">
        <button className={tabClass(tab === 'mine')} onClick={() => setTab('mine')}>Le mie partite</button>
        <button className={tabClass(tab === 'board')} onClick={() => setTab('board')}>🏅 Classifica generale</button>
      </div>
      {error && <p role="alert" className="text-xs text-amber-300 mb-3">{error}</p>}
      {tab === 'mine' && (mine === null ? <p className="text-xs text-slate-400">Caricamento…</p> : <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">{[
          ['Partite concluse', s!.played], ['Vittorie', s!.wins], ['Percentuale', `${s!.rate}%`], ['PV medi', s!.avg]].map(([label, value]) =>
          <div key={String(label)} className="rounded-xl border border-slate-700 p-3 text-center"><div className="text-2xl font-black">{value}</div><div className="text-[11px] text-slate-400">{label}</div></div>)}
        </div>
        {s!.factions.length > 0 && <p className="text-xs text-slate-300 mb-3">Fazioni: {s!.factions.map(([f, x]) => <span key={f} className="mr-3"><b style={{ color: COLORS[f] }}>{f}</b> {x.games} {x.games === 1 ? 'partita' : 'partite'} · {x.wins} {x.wins === 1 ? 'vittoria' : 'vittorie'}</span>)}</p>}
        {!mine.length ? <p className="text-sm text-slate-400">Nessuna partita conclusa con l’edizione da tavolo.</p> :
          <ul className="space-y-2">{mine.map(g => <li key={g.game_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 p-2 text-sm">
            <span className="min-w-0"><b>{g.name || g.code}</b> <span className="text-slate-400">· {g.finished_at ? new Date(g.finished_at).toLocaleDateString('it-IT') : '—'} · {g.humans} {g.humans === 1 ? 'giocatore' : 'giocatori'}{g.reason ? ` · ${REASON[g.reason] ?? g.reason}` : ''}</span><br />
              <span style={{ color: COLORS[g.faction] }}>{g.faction}</span> · {g.final_position}° posto · {g.final_score} PV {g.is_winner && '🏆'}</span>
            <button className="rounded-lg border border-slate-500 px-3 py-1 text-xs" onClick={() => onOpen(g.game_id)}>Apri riepilogo</button>
          </li>)}</ul>}
      </>)}
      {tab === 'board' && (board === null ? <p className="text-xs text-slate-400">Caricamento…</p> : !board.length ? <p className="text-sm text-slate-400">La classifica comparirà dopo le prime partite concluse.</p> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-400">
          <th className="p-1">#</th><th className="p-1">Giocatore</th><th className="p-1">Punti</th><th className="p-1">Partite</th><th className="p-1">Vittorie</th><th className="p-1">PV medi</th><th className="p-1">Posizione media</th><th className="p-1">Fazione preferita</th></tr></thead>
          <tbody>{board.map((p, i) => <tr key={p.player_id} className={'border-t border-slate-800 ' + (p.player_id === userId ? 'bg-emerald-950/40' : '')}>
            <td className="p-1">{i + 1}</td><td className="p-1 font-bold">{p.username}{p.player_id === userId && ' (tu)'}</td><td className="p-1">{p.ranking_points}</td><td className="p-1">{p.games}</td>
            <td className="p-1">{p.wins}</td><td className="p-1">{p.avg_score}</td><td className="p-1">{p.avg_position}</td><td className="p-1" style={{ color: p.favourite_faction ? COLORS[p.favourite_faction] : undefined }}>{p.favourite_faction ?? '—'}</td></tr>)}</tbody>
        </table><p className="text-xs text-slate-400 mt-2">Punti per piazzamento: 1° 10, 2° 6, 3° 4, 4° 2, 5° 1 (BOT compresi), come nei tornei. A parità contano vittorie e PV medi. Solo partite dell’edizione da tavolo.</p></div>)}
    </div>
  </div>;
}

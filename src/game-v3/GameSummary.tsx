import { FACTIONS, type Faction } from './catalog-types';
import type { EngineState } from './engine';
import { keyMoments, pointSeries, trackDelta } from './summary';

const ICON: Record<string, string> = { combat: '⚔️', blockade: '⚓', war: '💥', victory: '🏁', seat: '⏱️', veto: '✋' };

/** Riepilogo di fine partita: andamento dei PV, tracciati finali e momenti decisivi. */
export function GameSummary({ s, tone }: { s: EngineState; tone: Record<Faction, string> }) {
  const data = pointSeries(s);
  const first = s.history?.[0];
  const moments = keyMoments(s.log);
  const W = 640, H = 220, P = 34;
  const max = data ? Math.max(5, ...FACTIONS.flatMap(f => data.series[f])) : 0;
  const x = (i: number) => P + (data ? i * (W - P * 2) / Math.max(1, data.rounds.length - 1) : 0);
  const y = (v: number) => H - P - v * (H - P * 2) / max;
  return <div className="space-y-4 mt-4" data-testid="game-summary">
    <h3 className="font-bold">Riepilogo della partita</h3>
    {data ? <figure className="rounded-lg border border-slate-700 bg-slate-950/60 p-2 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-auto" role="img" aria-label="Punti vittoria round per round">
        {[0, 0.25, 0.5, 0.75, 1].map(k => <g key={k}><line x1={P} x2={W - P} y1={y(max * k)} y2={y(max * k)} stroke="#334155" strokeWidth="1" />
          <text x={P - 6} y={y(max * k) + 4} fontSize="10" textAnchor="end" fill="#94a3b8">{Math.round(max * k)}</text></g>)}
        {data.rounds.map((r, i) => <text key={r + i} x={x(i)} y={H - P + 16} fontSize="10" textAnchor="middle" fill="#94a3b8">{r}</text>)}
        {FACTIONS.filter(f => !s.players[f].neutral).map(f => <g key={f}>
          <polyline fill="none" stroke={tone[f]} strokeWidth="2.5" points={data.series[f].map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {data.series[f].map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={tone[f]} />)}
        </g>)}
      </svg>
      <figcaption className="flex flex-wrap gap-3 text-xs mt-1">{FACTIONS.filter(f => !s.players[f].neutral).map(f =>
        <span key={f} className="inline-flex items-center gap-1"><span className="inline-block w-3 h-1 rounded" style={{ background: tone[f] }} />{f}</span>)}
        <span className="text-slate-400">PV round per round; l’ultimo punto comprende Influenza, obiettivi e tracciati a 10.</span></figcaption>
    </figure> : <p className="text-sm text-slate-400">Andamento round per round non disponibile per le partite iniziate prima del 28 novembre 2026.</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">{FACTIONS.filter(f => !s.players[f].neutral).map(f =>
      <div key={f} className="rounded-lg border border-slate-700 p-3 text-xs"><strong style={{ color: tone[f] }}>{f}</strong>
        <ul className="mt-1 space-y-0.5">{trackDelta(first, s, f).map(t => <li key={t.track} className="flex justify-between gap-2"><span>{t.track}</span>
          <span>{t.now}{first ? <span className={t.delta > 0 ? 'text-emerald-300' : t.delta < 0 ? 'text-red-300' : 'text-slate-500'}> ({t.delta > 0 ? '+' : ''}{t.delta})</span> : null}</span></li>)}</ul>
      </div>)}</div>
    {moments.length > 0 && <div><h4 className="font-semibold text-sm">Momenti decisivi</h4>
      <ol className="mt-1 space-y-1 text-sm">{moments.map((m, i) => <li key={i} className="flex gap-2"><span aria-hidden="true">{ICON[m.kind]}</span>
        <span><span className="text-slate-400">Round {m.round} · </span>{m.text}</span></li>)}</ol></div>}
  </div>;
}

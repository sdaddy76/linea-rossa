import { FACTIONS, TRACKS, type Faction } from './catalog-types';
import type { EngineState, RoundSnapshot } from './engine';

export interface Moment { round: number; kind: 'combat' | 'blockade' | 'war' | 'victory' | 'seat' | 'veto'; text: string }

/** Momenti decisivi letti dal registro della partita, con il round in cui sono avvenuti. */
export function keyMoments(log: string[], limit = 14): Moment[] {
  let round = 1; const out: Moment[] = [];
  for (const line of log) {
    const r = line.match(/^Fine round (\d+) \((\d+)\)/); if (r) { round = Number(r[2]) + 1; continue; }
    let kind: Moment['kind'] | null = null;
    if (/^Combattimento: /.test(line)) kind = 'combat';
    else if (/Blocco di Hormuz (attivato|revocato)|token Blocco di Hormuz torna/.test(line)) kind = 'blockade';
    else if (/^Guerra totale/.test(line)) kind = 'war';
    else if (/^Partita terminata: vince/.test(line)) kind = 'victory';
    else if (/Tempo scaduto|riprende il controllo|Sostituito dall/.test(line)) kind = 'seat';
    else if (/: Veto sulla correlazione/.test(line)) kind = 'veto';
    if (kind) out.push({ round, kind, text: line });
  }
  return out.slice(-limit);
}

/** Serie per il grafico: PV di ogni fazione round per round (ultimo punto = punteggio finale). */
export function pointSeries(state: Pick<EngineState, 'history' | 'result' | 'players'>): { rounds: string[]; series: Record<Faction, number[]> } | null {
  const h = (state.history ?? []).filter(x => !x.final);
  if (h.length < 2) return null;
  const rounds = h.map(x => x.round === 0 ? 'Inizio' : `R${x.round}`);
  const series = Object.fromEntries(FACTIONS.map(f => [f, h.map(x => x.points[f])])) as Record<Faction, number[]>;
  if (state.result) { rounds.push('Finale'); FACTIONS.forEach(f => series[f].push(state.result!.scores[f])); }
  return { rounds, series };
}

/** Quanto è cresciuto ogni tracciato dall'inizio. */
export function trackDelta(first: RoundSnapshot | undefined, state: Pick<EngineState, 'players'>, f: Faction) {
  return TRACKS.map(t => ({ track: t, now: state.players[f].tracks[t], delta: first ? state.players[f].tracks[t] - first.tracks[f][t] : 0 }));
}

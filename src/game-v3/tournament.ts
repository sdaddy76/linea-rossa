import { FACTIONS, type Faction } from './catalog-types';
import type { EngineState } from './engine';

/** Regole dei tornei di Linea Rossa: tavoli, sorteggio delle potenze e classifica. Funzioni pure, senza database. */
export interface Seat { player_id: string; faction: Faction }
export interface TournamentTable { round: number; table_no: number; game_id: string | null; seats: Seat[] }
export type RNG = () => number;

/** Punti torneo per piazzamento al tavolo, contando anche le potenze BOT (1°, 2°, 3°, 4°, 5°). */
export const PLACEMENT_POINTS = [10, 6, 4, 2, 1] as const;
export const MIN_PLAYERS = 3;

/** Numero di tavoli e giocatori per tavolo: il minimo di tavoli possibile, da 3 a 5 giocatori, il più possibile uguali. */
export function tableSizes(players: number): number[] {
  if (players < MIN_PLAYERS) throw new Error(`Servono almeno ${MIN_PLAYERS} iscritti.`);
  const tables = Math.ceil(players / 5), base = Math.floor(players / tables), extra = players % tables;
  return Array.from({ length: tables }, (_, i) => base + (i < extra ? 1 : 0));
}

function shuffled<T>(items: readonly T[], rng: RNG): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(p => [x, ...p]));
}
const ALL_ORDERS = permutations(FACTIONS);

/** Quante volte ogni giocatore ha già avuto ciascuna potenza, e con chi ha già giocato. */
export function history(tables: TournamentTable[]) {
  const factions = new Map<string, Map<Faction, number>>(), met = new Map<string, Set<string>>();
  for (const t of tables) for (const s of t.seats) {
    const f = factions.get(s.player_id) ?? new Map<Faction, number>();
    f.set(s.faction, (f.get(s.faction) ?? 0) + 1); factions.set(s.player_id, f);
    const m = met.get(s.player_id) ?? new Set<string>();
    t.seats.forEach(o => { if (o.player_id !== s.player_id) m.add(o.player_id); }); met.set(s.player_id, m);
  }
  return { factions, met };
}

/** Sorteggio delle potenze di un tavolo: chi ha già giocato una potenza tende a riceverne un’altra. */
export function assignFactions(players: string[], previous: Map<string, Map<Faction, number>>, rng: RNG): Seat[] {
  if (players.length < 1 || players.length > 5) throw new Error('Da 1 a 5 giocatori per tavolo.');
  const cost = (order: readonly Faction[]) => players.reduce((n, p, i) => n + (previous.get(p)?.get(order[i]) ?? 0), 0);
  const best = Math.min(...ALL_ORDERS.map(cost));
  const choices = ALL_ORDERS.filter(o => cost(o) === best);
  const order = choices[Math.floor(rng() * choices.length)];
  return players.map((player_id, i) => ({ player_id, faction: order[i] }));
}

/**
 * Tavoli di un turno.
 * Turno 1: sorteggio. Turni successivi: i giocatori sono ordinati per classifica e divisi a gruppi
 * (sistema svizzero), poi scambi tra tavoli vicini riducono chi si è già incontrato.
 */
export function seatRound(players: string[], round: number, previousTables: TournamentTable[], ranking: string[], rng: RNG): Seat[][] {
  const unique = [...new Set(players)];
  const sizes = tableSizes(unique.length);
  const { factions, met } = history(previousTables);
  const ordered = round <= 1 ? shuffled(unique, rng)
    : [...shuffled(unique, rng)].sort((a, b) => rankOf(ranking, a) - rankOf(ranking, b));
  const groups: string[][] = [];
  let k = 0;
  for (const size of sizes) { groups.push(ordered.slice(k, k + size)); k += size; }
  if (round > 1) reduceRematches(groups, met);
  return groups.map(g => assignFactions(g, factions, rng));
}
const rankOf = (ranking: string[], id: string) => { const i = ranking.indexOf(id); return i < 0 ? ranking.length : i; };
const rematches = (group: string[], met: Map<string, Set<string>>) =>
  group.reduce((n, a, i) => n + group.slice(i + 1).filter(b => met.get(a)?.has(b)).length, 0);
function reduceRematches(groups: string[][], met: Map<string, Set<string>>) {
  for (let pass = 0; pass < 4; pass++) {
    let improved = false;
    for (let g = 0; g + 1 < groups.length; g++) {
      const a = groups[g], b = groups[g + 1];
      for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
        const before = rematches(a, met) + rematches(b, met);
        [a[i], b[j]] = [b[j], a[i]];
        if (rematches(a, met) + rematches(b, met) < before) improved = true; else [a[i], b[j]] = [b[j], a[i]];
      }
    }
    if (!improved) break;
  }
}

/** Piazzamento delle cinque potenze a fine partita: chi vince è primo; chi ha provocato la guerra è ultimo. */
export function placements(state: Pick<EngineState, 'result' | 'players'>): Record<Faction, number> | null {
  const result = state.result;
  if (!result) return null;
  const score = (f: Faction) => result.scores?.[f] ?? state.players[f].points;
  const key = (f: Faction) => [result.winners.includes(f) ? 1 : 0, result.responsible === f ? 0 : 1, score(f)];
  const order = [...FACTIONS].sort((a, b) => {
    const ka = key(a), kb = key(b);
    return kb[0] - ka[0] || kb[1] - ka[1] || kb[2] - ka[2];
  });
  const place = {} as Record<Faction, number>;
  order.forEach((f, i) => {
    const prev = order[i - 1];
    place[f] = prev && key(prev).every((v, j) => v === key(f)[j]) ? place[prev] : i + 1;
  });
  return place;
}

export interface Standing { player_id: string; points: number; pv: number; wins: number; played: number; place: number }
/** Classifica: punti torneo, poi PV totali, poi vittorie. Le partite non ancora finite non contano. */
export function standings(players: string[], tables: TournamentTable[], states: Map<string, Pick<EngineState, 'result' | 'players'>>): Standing[] {
  const rows = new Map(players.map(p => [p, { player_id: p, points: 0, pv: 0, wins: 0, played: 0, place: 0 }]));
  for (const t of tables) {
    const state = t.game_id ? states.get(t.game_id) : undefined;
    const place = state && placements(state);
    if (!state || !place) continue;
    for (const s of t.seats) {
      const row = rows.get(s.player_id);
      if (!row) continue;
      row.points += PLACEMENT_POINTS[place[s.faction] - 1] ?? 0;
      row.pv += state.result?.scores?.[s.faction] ?? state.players[s.faction].points;
      row.wins += state.result?.winners.includes(s.faction) ? 1 : 0;
      row.played += 1;
    }
  }
  const list = [...rows.values()].sort((a, b) => b.points - a.points || b.pv - a.pv || b.wins - a.wins);
  list.forEach((r, i) => {
    const prev = list[i - 1];
    r.place = prev && prev.points === r.points && prev.pv === r.pv && prev.wins === r.wins ? prev.place : i + 1;
  });
  return list;
}

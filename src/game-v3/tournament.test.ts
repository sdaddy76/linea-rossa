import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS, type Faction } from './catalog-types';
import { assignFactions, history, placements, seatRound, standings, tableSizes, PLACEMENT_POINTS, type TournamentTable } from './tournament';

const seeded = (seed: number) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

test('tables are as few as possible, 3 to 5 players each, as equal as possible', () => {
  assert.deepEqual(tableSizes(3), [3]);
  assert.deepEqual(tableSizes(5), [5]);
  assert.deepEqual(tableSizes(6), [3, 3]);
  assert.deepEqual(tableSizes(7), [4, 3]);
  assert.deepEqual(tableSizes(12), [4, 4, 4]);
  assert.deepEqual(tableSizes(16), [4, 4, 4, 4]);
  for (let n = 3; n <= 60; n++) {
    const sizes = tableSizes(n);
    assert.equal(sizes.reduce((a, b) => a + b, 0), n);
    assert.ok(sizes.every(s => s >= 3 && s <= 5), `${n}: ${sizes}`);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
    assert.equal(sizes.length, Math.ceil(n / 5));
  }
  assert.throws(() => tableSizes(2));
});

test('every player sits exactly once per round, with distinct powers at each table', () => {
  for (const n of [3, 7, 11, 23]) {
    const round = seatRound(ids(n), 1, [], [], seeded(n));
    const all = round.flat().map(s => s.player_id);
    assert.equal(all.length, n); assert.equal(new Set(all).size, n);
    for (const table of round) assert.equal(new Set(table.map(s => s.faction)).size, table.length);
  }
});

test('powers are drawn so that nobody repeats a power while another is available', () => {
  const previous = new Map([['a', new Map<Faction, number>([['Iran', 1]])], ['b', new Map<Faction, number>([['Iran', 1], ['Cina', 1]])]]);
  for (let s = 1; s < 30; s++) {
    const seats = assignFactions(['a', 'b', 'c'], previous, seeded(s));
    assert.notEqual(seats[0].faction, 'Iran');
    assert.ok(!['Iran', 'Cina'].includes(seats[1].faction));
  }
  // Cinque turni a un tavolo da 5: ognuno gioca ogni potenza una volta.
  const tables: TournamentTable[] = [];
  for (let r = 1; r <= 5; r++) tables.push({ round: r, table_no: 1, game_id: null, seats: seatRound(ids(5), r, tables, ids(5), seeded(r))[0] });
  for (const [, counts] of history(tables).factions) assert.deepEqual([...counts.values()].sort(), [1, 1, 1, 1, 1]);
});

test('later rounds group by ranking and avoid rematches where possible', () => {
  const players = ids(10), r1 = seatRound(players, 1, [], [], seeded(3));
  const tables: TournamentTable[] = r1.map((seats, i) => ({ round: 1, table_no: i + 1, game_id: null, seats }));
  const r2 = seatRound(players, 2, tables, players, seeded(4));
  const met = history(tables).met;
  const pairs = (table: { player_id: string }[]) => table.reduce((n, a, i) => n + table.slice(i + 1).filter(b => met.get(a.player_id)?.has(b.player_id)).length, 0);
  const repeats = r2.reduce((n, t) => n + pairs(t), 0);
  // Con 10 giocatori e due tavoli da 5 almeno 8 coppie si ritrovano per forza (3+2 e 2+3 dai tavoli del turno 1);
  // dividere per classifica senza scambi ne ritroverebbe fino a 20.
  assert.equal(repeats, 8);
});

const finished = (scores: Record<Faction, number>, winners: Faction[], responsible?: Faction) => ({
  result: { reason: 'points', winners, scores, ...(responsible ? { responsible } : {}) },
  players: Object.fromEntries(FACTIONS.map(f => [f, { points: scores[f] }])),
}) as never;

test('placements: winner first, ties share a place, the faction that caused the war is last', () => {
  assert.deepEqual(placements(finished({ Iran: 20, Coalizione: 25, Russia: 25, Cina: 10, Europa: 5 }, ['Coalizione', 'Russia'])),
    { Coalizione: 1, Russia: 1, Iran: 3, Cina: 4, Europa: 5 });
  assert.deepEqual(placements(finished({ Iran: 30, Coalizione: 12, Russia: 18, Cina: 9, Europa: 7 }, ['Russia'], 'Iran')),
    { Russia: 1, Coalizione: 2, Cina: 3, Europa: 4, Iran: 5 });
  assert.equal(placements({ result: null, players: {} } as never), null);
});

test('standings add placement points, then PV and wins; unfinished tables do not count', () => {
  const tables: TournamentTable[] = [
    { round: 1, table_no: 1, game_id: 'g1', seats: [{ player_id: 'a', faction: 'Iran' }, { player_id: 'b', faction: 'Cina' }, { player_id: 'c', faction: 'Europa' }] },
    { round: 2, table_no: 1, game_id: 'g2', seats: [{ player_id: 'a', faction: 'Russia' }, { player_id: 'b', faction: 'Iran' }, { player_id: 'c', faction: 'Coalizione' }] },
  ];
  const states = new Map([['g1', finished({ Iran: 22, Coalizione: 15, Russia: 14, Cina: 18, Europa: 9 }, ['Iran'])]]);
  const s = standings(['a', 'b', 'c'], tables, states);
  assert.deepEqual(s.map(r => [r.player_id, r.points, r.pv, r.wins, r.played, r.place]),
    [['a', PLACEMENT_POINTS[0], 22, 1, 1, 1], ['b', PLACEMENT_POINTS[1], 18, 0, 1, 2], ['c', PLACEMENT_POINTS[4], 9, 0, 1, 3]]);
});

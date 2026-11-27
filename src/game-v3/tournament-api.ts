import { supabase } from '@/integrations/supabase/client';
import { initializeTabletop, readTabletop } from './online';
import { seatRound, standings, type Seat, type Standing, type TournamentTable } from './tournament';
import type { EngineState, GameMode } from './engine';

/** Accesso ai dati dei tornei. Le regole (tavoli, potenze, classifica) sono in tournament.ts. */
export interface Tournament {
  id: string; name: string; status: 'registration' | 'running' | 'finished';
  rounds_planned: number; current_round: number; game_length: GameMode; created_at: string; finished_at?: string | null;
}
export interface TableView extends TournamentTable { id: string; game_status: 'lobby' | 'active' | 'finished' | null; ended: boolean }
export interface TournamentDetail {
  tournament: Tournament; players: string[]; names: Record<string, string>;
  tables: TableView[]; standings: Standing[];
}
// Le tabelle dei tornei non sono ancora nei tipi generati del client: accesso non tipizzato e circoscritto qui.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
function checked<T>(r: { data: T; error: { message: string } | null }): T { if (r.error) throw new Error(r.error.message); return r.data; }

export async function listTournaments(): Promise<Tournament[]> {
  return checked(await db.from('tournaments').select('*').order('created_at', { ascending: false }).limit(50)) ?? [];
}

export async function loadTournament(id: string): Promise<TournamentDetail> {
  const tournament = checked(await db.from('tournaments').select('*').eq('id', id).single()) as Tournament;
  const reg = (checked(await db.from('tournament_players').select('player_id,registered_at').eq('tournament_id', id).order('registered_at')) ?? []) as { player_id: string }[];
  const rows = (checked(await db.from('tournament_tables').select('*').eq('tournament_id', id).order('round').order('table_no')) ?? []) as (TournamentTable & { id: string })[];
  const players = reg.map(r => r.player_id);
  const people = [...new Set([...players, ...rows.flatMap(t => t.seats.map(s => s.player_id))])];
  const names: Record<string, string> = {};
  for (let i = 0; i < people.length; i += 50) {
    const found = checked(await supabase.from('profiles').select('id,username').in('id', people.slice(i, i + 50))) ?? [];
    for (const p of found as { id: string; username: string }[]) names[p.id] = p.username;
  }
  const gameIds = rows.map(t => t.game_id).filter((g): g is string => !!g);
  const states = new Map<string, EngineState>(), status = new Map<string, TableView['game_status']>();
  for (let i = 0; i < gameIds.length; i += 20) {
    const chunk = gameIds.slice(i, i + 20);
    const games = checked(await supabase.from('games').select('id,status').in('id', chunk)) ?? [];
    for (const g of games as { id: string; status: TableView['game_status'] }[]) status.set(g.id, g.status);
    const saved = checked(await supabase.from('game_state').select('game_id,special_uses').in('game_id', chunk)) ?? [];
    for (const row of saved as { game_id: string }[]) { const s = readTabletop(row); if (s) states.set(row.game_id, s.state); }
  }
  const tables: TableView[] = rows.map(t => ({ ...t, game_status: t.game_id ? status.get(t.game_id) ?? null : null,
    ended: !!(t.game_id && states.get(t.game_id)?.result) }));
  return { tournament, players, names, tables, standings: standings(players, tables, states) };
}

export async function register(tournamentId: string, userId: string) {
  checked(await db.from('tournament_players').insert({ tournament_id: tournamentId, player_id: userId }));
}
export async function unregister(tournamentId: string, userId: string) {
  checked(await db.from('tournament_players').delete().eq('tournament_id', tournamentId).eq('player_id', userId));
}

/* ── Solo amministratore ── */
export async function createTournament(input: { name: string; rounds_planned: number; game_length: GameMode }) {
  return checked(await db.from('tournaments').insert(input).select('id').single()) as { id: string };
}
export async function finishTournament(id: string) {
  checked(await db.from('tournaments').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', id));
}
export async function removePlayer(tournamentId: string, playerId: string) { await unregister(tournamentId, playerId); }

/**
 * Avvia il turno successivo: pianifica i tavoli, crea una partita privata per ciascuno con i giocatori
 * già seduti e la avvia (i posti vuoti diventano BOT). Se un avvio si interrompe, ripeterlo riprende
 * dai tavoli già pianificati senza cambiare i posti.
 */
export async function startNextRound(detail: TournamentDetail, adminId: string, rng: () => number = Math.random, onProgress?: (done: number, total: number) => void) {
  const { tournament: t } = detail;
  const resuming = t.current_round > 0 && detail.tables.some(x => x.round === t.current_round && (!x.game_id || x.game_status === 'lobby'));
  const round = resuming ? t.current_round : t.current_round + 1;
  if (!resuming && round > t.rounds_planned) throw new Error('Tutti i turni previsti sono stati giocati.');
  let planned = detail.tables.filter(x => x.round === round);
  if (!planned.length) {
    const previous = detail.tables.filter(x => x.round < round);
    const seats: Seat[][] = seatRound(detail.players, round, previous, detail.standings.map(s => s.player_id), rng);
    const rows = seats.map((s, i) => ({ tournament_id: t.id, round, table_no: i + 1, seats: s, game_id: null }));
    checked(await db.from('tournament_tables').insert(rows));
    planned = rows.map(r => ({ ...r, id: '', game_status: null, ended: false }));
  }
  checked(await db.from('tournaments').update({ status: 'running', current_round: round }).eq('id', t.id));
  let done = 0;
  for (const table of planned) {
    const gameId = checked(await db.rpc('tournament_create_table', { p_tournament: t.id, p_round: round, p_table: table.table_no, p_seats: table.seats })) as string;
    const game = checked(await supabase.from('games').select('status').eq('id', gameId).single()) as { status: string };
    if (game.status === 'lobby') await initializeTabletop(gameId, adminId, t.game_length);
    onProgress?.(++done, planned.length);
  }
  return round;
}

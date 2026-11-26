import type { Game } from '@/types/game';
import { FACTIONS, type Faction } from '@/game-v3/catalog-types';

export interface RoomPlayer {
  faction: Faction;
  player_id: string | null;
  is_bot: boolean;
  profile?: { username: string } | null;
}
export interface RoomGame extends Game {
  allow_join?: boolean;
  _players: RoomPlayer[];
}
type Client = typeof import('@/integrations/supabase/client').supabase;

export function tableSeats(game: RoomGame, userId: string) {
  const players = game._players.filter(p => FACTIONS.includes(p.faction));
  const humans = players.filter(p => p.player_id && !p.is_bot)
    .filter((p, i, all) => all.findIndex(other => other.player_id === p.player_id) === i);
  const occupied = new Set(players.map(p => p.faction));
  const free = FACTIONS.filter(f => !occupied.has(f));
  const enrolled = humans.some(p => p.player_id === userId);
  return {
    humans, free, enrolled,
    bots: players.filter(p => p.is_bot).length,
    canJoin: game.status === 'lobby' && game.allow_join !== false && free.length > 0,
  };
}

export function openedAt(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Data non disponibile';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

/** Missing column on databases without the archive migration: fall back to showing every table. */
const missingColumn = (error: { code?: string } | null) => error?.code === '42703' || error?.code === 'PGRST204';

/** Only public table metadata and usernames; no hands, objectives or emails. Archived tables are hidden. */
export async function loadRoom(client: Client, userId: string): Promise<{ open: RoomGame[]; recent: RoomGame[] }> {
  const open: Game[] = [];
  let archive = true;
  // Page the server result instead of silently dropping all but eight tables.
  for (let offset = 0; ; offset += 100) {
    let query = client.from('games').select('*').eq('is_public', true).in('status', ['lobby', 'active']);
    if (archive) query = query.is('archived_at', null);
    let result = await query.order('created_at', { ascending: false }).order('id').range(offset, offset + 99);
    if (archive && missingColumn(result.error)) {
      archive = false;
      result = await client.from('games').select('*').eq('is_public', true).in('status', ['lobby', 'active'])
        .order('created_at', { ascending: false }).order('id').range(offset, offset + 99);
    }
    if (result.error) throw result.error;
    open.push(...(result.data ?? []) as Game[]);
    if ((result.data ?? []).length < 100) break;
    if (offset >= 4900) throw new Error('Troppi tavoli da caricare. Riprova più tardi.');
  }
  const memberships = await client.from('game_players').select('game_id').eq('player_id', userId);
  if (memberships.error) throw memberships.error;
  const owned = await client.from('games').select('*').eq('created_by', userId)
    .order('created_at', { ascending: false }).limit(20);
  if (owned.error) throw owned.error;
  const personal = new Map<string, Game>((owned.data ?? []).map(g => [g.id, g as Game]));
  const memberIds = [...new Set((memberships.data ?? []).map(p => p.game_id))].filter(Boolean);
  for (let i = 0; i < memberIds.length; i += 10) {
    const result = await client.from('games').select('*').in('id', memberIds.slice(i, i + 10));
    if (result.error) throw result.error;
    for (const game of result.data ?? []) personal.set(game.id, game as Game);
  }
  const recent = [...personal.values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
  const ids = [...new Set([...open, ...recent].map(g => g.id))];
  const players = new Map<string, RoomPlayer[]>();
  for (let i = 0; i < ids.length; i += 10) {
    const result = await client.from('game_players')
      .select('game_id,faction,is_bot,player_id,profile:profiles(username)')
      .in('game_id', ids.slice(i, i + 10)).order('turn_order');
    if (result.error) throw result.error;
    for (const p of result.data ?? []) {
      const list = players.get(p.game_id) ?? [];
      list.push(p as unknown as RoomPlayer);
      players.set(p.game_id, list);
    }
  }
  const enrich = (games: Game[]) => games
    .filter(g => String(g.winner_condition) !== 'archived_by_owner' && !g.archived_at)
    .map(g => ({ ...g, _players: players.get(g.id) ?? [] }));
  return { open: enrich(open), recent: enrich(recent) };
}

async function withPlayers(client: Client, games: Game[]): Promise<RoomGame[]> {
  const players = new Map<string, RoomPlayer[]>();
  for (let i = 0; i < games.length; i += 10) {
    const result = await client.from('game_players')
      .select('game_id,faction,is_bot,player_id,profile:profiles(username)')
      .in('game_id', games.slice(i, i + 10).map(g => g.id)).order('turn_order');
    if (result.error) throw result.error;
    for (const p of result.data ?? []) {
      const list = players.get(p.game_id) ?? [];
      list.push(p as unknown as RoomPlayer);
      players.set(p.game_id, list);
    }
  }
  return games.map(g => ({ ...g, _players: players.get(g.id) ?? [] }));
}

/** Archived tables, most recent first: shown only to the administrator, who can restore them. */
export async function loadArchived(client: Client): Promise<RoomGame[]> {
  const result = await client.from('games').select('*').not('archived_at', 'is', null)
    .order('archived_at', { ascending: false }).limit(300);
  if (missingColumn(result.error)) return [];
  if (result.error) throw result.error;
  return withPlayers(client, (result.data ?? []) as Game[]);
}

import { supabase } from '@/integrations/supabase/client';
import { createGame, currentActor, reduce, type Command, type EngineState } from './engine';
import { FACTIONS, type Faction } from './catalog-types';

export interface SavedTabletop { revision: number; state: EngineState }
export function readTabletop(row: unknown): SavedTabletop | null {
  const value = (row as { special_uses?: { tabletop_v3?: SavedTabletop } } | null)?.special_uses?.tabletop_v3;
  return value?.state?.version === 3 && Number.isInteger(value.revision) ? value : null;
}
function checked(error: { message: string } | null) { if (error) throw new Error(error.message); }
export async function initializeTabletop(gameId: string, userId: string) {
  const game = await supabase.from('games').select('created_by,status').eq('id', gameId).single();
  checked(game.error);
  if (game.data?.created_by !== userId) throw new Error('Solo il creatore può avviare la partita.');
  if (game.data.status !== 'lobby') throw new Error('La partita è già stata avviata.');
  const members = await supabase.from('game_players').select('*').eq('game_id', gameId);
  checked(members.error);
  const humans = (members.data ?? []).filter(p => p.player_id && !p.is_bot);
  if (!humans.length || humans.some(p => !FACTIONS.includes(p.faction as Faction))) throw new Error('Seleziona una fazione prima di iniziare.');
  const bots = FACTIONS.filter(f => !humans.some(p => p.faction === f));
  if (bots.length) {
    const rows = bots.map(f => ({ game_id: gameId, faction: f, player_id: null, is_bot: true,
      bot_difficulty: 'normal', is_ready: true, turn_order: FACTIONS.indexOf(f) + 1 }));
    // Never replace a human who selected a seat while the host was starting.
    checked((await supabase.from('game_players').upsert(rows, { onConflict: 'game_id,faction', ignoreDuplicates: true })).error);
  }
  const roster = await supabase.from('game_players').select('*').eq('game_id', gameId);
  checked(roster.error);
  const actualBots = FACTIONS.filter(f => !roster.data?.some(p => p.faction === f && p.player_id && !p.is_bot));
  const existing = await supabase.from('game_state').select('*').eq('game_id', gameId).maybeSingle();
  checked(existing.error);
  // Retry an interrupted start without dealing a second set of cards.
  const saved = readTabletop(existing.data) ?? { revision: 0, state: createGame({ bots: actualBots }) };
  const values = { game_id: gameId, nucleare: saved.state.globals.Nucleare, sanzioni: saved.state.globals.Sanzioni,
    active_faction: currentActor(saved.state),
    special_uses: { ...((existing.data?.special_uses as object) ?? {}), tabletop_v3: saved } };
  const write = existing.data
    ? await supabase.from('game_state').update(values as never).eq('game_id', gameId)
    : await supabase.from('game_state').insert(values as never);
  checked(write.error);
  checked((await supabase.from('games').update({ status: 'active', started_at: new Date().toISOString(),
    max_turns: 6, allow_join: false } as never).eq('id', gameId).eq('status', 'lobby')).error);
}

export async function commitCommand(gameId: string, saved: SavedTabletop, actor: Faction, command: Command) {
  const next = reduce(saved.state, actor, command);
  const read = await supabase.from('game_state').select('special_uses').eq('game_id', gameId).single();
  checked(read.error);
  const updated: SavedTabletop = { revision: saved.revision + 1, state: next };
  const result = await supabase.from('game_state').update({
    special_uses: { ...((read.data?.special_uses as object) ?? {}), tabletop_v3: updated },
    active_faction: currentActor(next) ?? actor, nucleare: next.globals.Nucleare, sanzioni: next.globals.Sanzioni,
  } as never).eq('game_id', gameId)
    .eq('special_uses->tabletop_v3->>revision', String(saved.revision)).select('game_id');
  checked(result.error);
  if (!result.data?.length) throw new Error('Un altro giocatore ha aggiornato la partita. Stato ricaricato: ripeti la scelta.');
  // The engine result, not this convenience lobby flag, owns the outcome.
  if (next.phase === 'ended') {
    const finish = await supabase.from('games').update({ status: 'finished', finished_at: new Date().toISOString() } as never).eq('id', gameId);
    if (finish.error) console.warn('Esito salvato; aggiornamento elenco partite non riuscito:', finish.error.message);
  }
  return updated;
}

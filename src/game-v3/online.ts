import { supabase } from '@/integrations/supabase/client';
import type { Command, EngineState, GameMode } from './engine';
import type { Faction } from './catalog-types';
import { mergePrivate, type PrivateView } from './server-core';

/** Stato mostrato nel browser: copia pubblica del server con i dati privati del proprio posto. */
export interface SavedTabletop { revision: number; state: EngineState; turnStartedAt?: string }
export interface ServerView { revision: number; state: EngineState; turnStartedAt: string; mine: PrivateView | null }

export function readTabletop(row: unknown): SavedTabletop | null {
  const value = (row as { special_uses?: { tabletop_v3?: SavedTabletop } } | null)?.special_uses?.tabletop_v3;
  return value?.state?.version === 3 && Number.isInteger(value.revision) ? value : null;
}

/** Tutte le mosse passano dalla funzione "tabletop": il browser non scrive più lo stato. */
async function call(body: Record<string, unknown>): Promise<ServerView> {
  const { data, error } = await supabase.functions.invoke('tabletop', { body });
  if (error) {
    let message = error.message;
    try {
      const detail = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.();
      if (detail?.error) message = detail.error;
    } catch { /* risposta non JSON */ }
    throw new Error(message);
  }
  const view = data as ServerView & { error?: string };
  if (view?.error) throw new Error(view.error);
  return view;
}
export function toSaved(view: ServerView, faction: Faction | null): SavedTabletop {
  return { revision: view.revision, state: mergePrivate(view.state, faction, view.mine), turnStartedAt: view.turnStartedAt };
}

export async function initializeTabletop(gameId: string, _userId: string, requestedMode?: GameMode, requestedNeutrals: Faction[] = []) {
  return call({ action: 'start', gameId, mode: requestedMode, neutrals: requestedNeutrals });
}
export async function commitCommand(gameId: string, saved: SavedTabletop, actor: Faction, command: Command, faction: Faction | null = actor) {
  return toSaved(await call({ action: 'command', gameId, revision: saved.revision, actor, command }), faction);
}
/** Apertura della partita: controlla il tempo limite, fa avanzare i BOT, restituisce la propria mano. */
export async function syncTabletop(gameId: string, faction: Faction | null) {
  return toSaved(await call({ action: 'sync', gameId }), faction);
}
export async function substituteSeat(gameId: string, target: Faction, faction: Faction | null) {
  return toSaved(await call({ action: 'substitute', gameId, faction: target }), faction);
}
export async function resumeSeat(gameId: string, faction: Faction) {
  return toSaved(await call({ action: 'resume', gameId }), faction);
}

/**
 * Logica condivisa tra il server (funzione "tabletop" su Supabase) e il browser.
 * Il server tiene lo stato completo; i giocatori vedono una copia pubblica senza mani,
 * obiettivi, mazzi e informazioni riservate, più i propri dati privati.
 */
import { FACTIONS, type Faction } from './catalog-types';
import { currentActor, reduce, setStandIn, type Command, type EngineState, type GameMode, type RNG } from './engine';

export const HIDDEN = '?';
export const TURN_LIMIT_MS = 24 * 60 * 60 * 1000;

export interface PrivateView { hand: string[]; objectives: string[]; intel: EngineState['intel'][Faction] }
export interface PublicTabletop { revision: number; state: EngineState; redacted: true; turnStartedAt: string }

const mask = (ids: string[]) => ids.map(() => HIDDEN);

/** Copia pubblica: a partita conclusa tutto torna visibile. */
export function redact(state: EngineState): EngineState {
  if (state.phase === 'ended') return state;
  const s: EngineState = structuredClone(state);
  for (const f of FACTIONS) {
    s.players[f].hand = mask(s.players[f].hand);
    s.players[f].objectives = mask(s.players[f].objectives);
    s.intel[f] = [];
  }
  s.deck = mask(s.deck);
  s.specialReserve = mask(s.specialReserve);
  s.eventDeck = mask(s.eventDeck);
  for (const f of FACTIONS) for (const t of Object.keys(s.botDecks[f]) as (keyof EngineState['botDecks'][Faction])[]) s.botDecks[f][t] = mask(s.botDecks[f][t]);
  return s;
}

export function privateView(state: EngineState, faction: Faction): PrivateView {
  return { hand: [...state.players[faction].hand], objectives: [...state.players[faction].objectives], intel: structuredClone(state.intel[faction]) };
}

/** Il browser rimette nella copia pubblica i dati privati del proprio posto. */
export function mergePrivate(state: EngineState, faction: Faction | null, mine: PrivateView | null): EngineState {
  if (!faction || !mine || state.phase === 'ended') return state;
  const s: EngineState = structuredClone(state);
  // Una mano privata più vecchia della copia pubblica (realtime in ritardo) non va mostrata a metà.
  if (mine.hand.length === s.players[faction].hand.length) s.players[faction].hand = [...mine.hand];
  s.players[faction].objectives = [...mine.objectives];
  s.intel[faction] = structuredClone(mine.intel);
  return s;
}

export const isRedacted = (state: EngineState) => FACTIONS.some(f => state.players[f].hand.includes(HIDDEN) || state.players[f].objectives.includes(HIDDEN));

/** Fa giocare i BOT (e i posti in sostituzione) finché tocca a un giocatore o serve una scelta manuale. */
export function runBots(state: EngineState, rng: RNG = Math.random, limit = 400): EngineState {
  let s = state;
  for (let i = 0; i < limit; i++) {
    const actor = currentActor(s);
    if (!actor || s.phase === 'ended') return s;
    const p = s.players[actor];
    if (!(p.bot || p.neutral)) return s;
    if (s.pending?.kind === 'bot-influence') return s;   // vecchie partite: destinazione indicata da un giocatore
    s = reduce(s, actor, { type: 'advance-bot' }, rng);
  }
  return s;
}

export interface Caller { userId: string; faction: Faction | null; member: boolean; host: boolean; admin: boolean }

/** Applica la mossa di un giocatore con i controlli di permesso, poi fa giocare i BOT. */
export function applyCommand(state: EngineState, caller: Caller, actor: Faction, command: Command, rng: RNG = Math.random): EngineState {
  if (!caller.member) throw new Error('Non partecipi a questa partita.');
  const current = currentActor(state);
  if (actor !== current) throw new Error('Non è il turno di questa fazione.');
  const botChoice = state.players[actor].bot && state.pending?.kind === 'bot-influence' && command.type === 'bot-influence';
  if (!botChoice) {
    if (command.type === 'advance-bot') throw new Error('I BOT vengono fatti giocare dal server.');
    if (caller.faction !== actor) throw new Error('Puoi muovere solo la tua fazione.');
  }
  return runBots(reduce(state, actor, command, rng), rng);
}

/** Passa al BOT il posto di chi non ha mosso in tempo. */
export function applyTimeout(state: EngineState, turnStartedAt: number, now: number, rng: RNG = Math.random): EngineState | null {
  const actor = currentActor(state);
  if (!actor || state.phase === 'ended') return null;
  const p = state.players[actor];
  if (p.bot || p.neutral || now - turnStartedAt < TURN_LIMIT_MS) return null;
  return runBots(setStandIn(state, actor, true, 'Tempo scaduto (24 ore).'), rng);
}

export function substitute(state: EngineState, caller: Caller, faction: Faction, rng: RNG = Math.random): EngineState {
  if (!caller.host && !caller.admin) throw new Error('Solo chi ha creato la partita o l’amministratore può sostituire un giocatore.');
  return runBots(setStandIn(state, faction, true, 'Sostituito dall’organizzatore.'), rng);
}

export function resume(state: EngineState, caller: Caller): EngineState {
  if (!caller.faction || !state.players[caller.faction].standIn) throw new Error('Il tuo posto non è in sostituzione.');
  return setStandIn(state, caller.faction, false, '');
}

/** Quando cambia chi deve muovere riparte il conteggio delle 24 ore. */
export function turnKey(state: EngineState) {
  const a = currentActor(state);
  return `${a ?? '-'}:${state.activation}:${state.phase}:${a && state.players[a].bot ? 'bot' : 'human'}`;
}

export interface Seat { faction: string; player_id: string | null; is_bot: boolean }
/** Controlli dell'avvio: posti umani validi, neutrali solo nei posti vuoti, modalità. */
export function planStart(roster: Seat[], neutrals: Faction[], requested?: GameMode, gameLength?: unknown) {
  const humans = roster.filter(p => p.player_id && !p.is_bot);
  if (!humans.length || humans.some(p => !FACTIONS.includes(p.faction as Faction))) throw new Error('Seleziona una fazione prima di iniziare.');
  const empty = FACTIONS.filter(f => !humans.some(p => p.faction === f));
  if (neutrals.some(f => !empty.includes(f))) throw new Error('Solo i posti senza giocatore possono essere neutrali.');
  const mode = requested ?? (['breve', 'media', 'lunga'].includes(String(gameLength)) ? gameLength as GameMode : 'media');
  return { empty, bots: empty.filter(f => !neutrals.includes(f)), neutrals, mode, limit: mode === 'breve' ? 30 : mode === 'media' ? 60 : 80 };
}

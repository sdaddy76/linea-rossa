import { BOT_CARDS, EVENTS, FACTION_CARDS } from './catalog';
import type { EngineState } from './engine';

export interface VisualChange {
  target: string;
  before: number;
  after: number;
}
export interface CardCue {
  key: string;
  kind: 'card' | 'event' | 'bot' | 'effects';
  cardId?: string;
  actor?: string;
  title: string;
  detail: string;
  destination: string;
  changes: VisualChange[];
}
const factions = 'Iran|Coalizione|Russia|Cina|Europa';

/** Public, append-only log only. Never inspect private hands, objectives or intel.
 * A snapshot refresh is not an action, and must not replay old cards. */
export function confirmedCues(previous: EngineState, next: EngineState, revision: number): CardCue[] {
  if (next.log.length <= previous.log.length ||
      previous.log.some((line, index) => line !== next.log[index])) return [];
  const cues: CardCue[] = [];
  let current: CardCue | undefined;
  for (let index = previous.log.length; index < next.log.length; index++) {
    const line = next.log[index];
    const card = line.match(new RegExp(`^(${factions})(?: BOT rivela|: gioca) \\[([^\\]]+)\\]`));
    const event = line.match(/^Round \d+ \(\d+\): \[(E\d+)\]/);
    const bot = line.match(new RegExp(`^(${factions}): \\[(BOT-[^\\]]+)\\].* — (P[12])`));
    let cue: Omit<CardCue, 'key' | 'changes'> | undefined;
    if (card) {
      const definition = FACTION_CARDS.find(c => c.id === card[2]);
      if (definition) cue = {
        kind: 'card', cardId: definition.id, actor: card[1], title: definition.name,
        detail: line.slice(line.indexOf(definition.name) + definition.name.length).trim().replace(/^come /, ''),
        destination: definition.special ? 'Retirata dal gioco · speciale' : 'Scarti',
      };
    } else if (event) {
      const definition = EVENTS.find(e => e.id === event[1]);
      if (definition) cue = {
        kind: 'event', cardId: definition.id, title: definition.name,
        detail: `Ordine: ${definition.order.join(' → ')} · Avanza: ${definition.advancers.join(', ') || 'nessuna'}`,
        destination: 'Evento del round',
      };
    } else if (bot) {
      const definition = BOT_CARDS.find(c => c.id === bot[2]);
      if (definition) cue = {
        kind: 'bot', cardId: definition.id, actor: bot[1], title: definition.name,
        detail: `${bot[3]} · ${bot[3] === 'P1' ? definition.priority1 : definition.priority2}`,
        destination: 'Mazzo BOT',
      };
    }
    if (cue) {
      current = { ...cue, key: `${revision}:${index}`, changes: [] };
      cues.push(current);
    }
    const change = line.match(new RegExp(`^(Globale|${factions}): (?:(PV di fine round) |(Economia|Militare|Diplomazia|Consenso|Nucleare|Sanzioni|Crisi Bellica|Opinione) )(-?\\d+) → (-?\\d+)$`));
    if (change && change[4] !== change[5]) {
      if (!current) {
        current = { key: `${revision}:${index}`, kind: 'effects', title: 'Effetti applicati',
          detail: 'Mossa confermata', destination: '', changes: [] };
        cues.push(current);
      }
      current.changes.push({
        target: `${change[1] === 'Globale' ? '' : `${change[1]} · `}${change[2] ? 'PV' : change[3]}`,
        before: Number(change[4]), after: Number(change[5]),
      });
    }
  }
  return cues;
}

export function openingEvent(state: EngineState): CardCue[] {
  const event = EVENTS.find(e => e.id === state.event);
  return event ? [{
    key: `opening:${event.id}`, kind: 'event', cardId: event.id, title: event.name,
    detail: `Round ${state.round} · ${event.order.join(' → ')}`, destination: 'Evento del round', changes: [],
  }] : [];
}

export const cueDuration = (cue: CardCue, reduced: boolean) =>
  reduced || cue.kind === 'effects' ? 1800 : 2600;

/** Dedupe notifications without touching saved game state. */
export function enqueueCues(queue: CardCue[], incoming: CardCue[]): CardCue[] {
  const known = new Set(queue.map(cue => cue.key));
  return [...queue, ...incoming.filter(cue => !known.has(cue.key))];
}

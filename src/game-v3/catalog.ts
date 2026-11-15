/**
 * Tabletop edition 3 catalog, imported from the supplied original 46-page PDF.
 * Regenerate with scripts/import-tabletop-catalog.py; do not synthesize options.
 * See CATALOG_PROVENANCE for source-image event metadata and the remaining
 * three legacy unlock flags whose original fronts were not supplied.
 */
import data from './catalog-data.json';
import { FACTIONS, TRACKS } from './catalog-types';
import type {
  BotCard, EventCard, Faction, FactionCard, Objective, TerritoryDef, Track,
  TrackChange, UnitDef,
} from './catalog-types';

export * from './catalog-types';

export const FACTION_CARDS = data.factionCards as FactionCard[];
export const EVENTS = data.events as EventCard[];
export const BOT_CARDS = data.bots as BotCard[];
export const OBJECTIVES = data.objectives as Objective[];
export const UNITS = data.units as UnitDef[];
export const TERRITORIES = data.territories as TerritoryDef[];
export const CORRELATIONS = data.correlations as Record<Faction, Record<Track, TrackChange[]>>;
export const INITIAL_TRACKS = data.initialTracks as Record<Faction, Record<Track, number>>;
export const CATALOG_PROVENANCE = data.provenance;

/** Fail closed if a future import is incomplete or leaks obsolete card formats. */
export function assertCatalogComplete(): void {
  const fail = (message: string): never => { throw new Error(`Catalogo tabletop incompleto: ${message}`); };
  const faction = (value: string) => (FACTIONS as readonly string[]).includes(value);
  const track = (value: string) => (TRACKS as readonly string[]).includes(value);
  const change = (value: TrackChange) => value && faction(value.faction) && track(value.track)
    && Number.isInteger(value.delta) && value.delta !== 0;
  const globals = new Set(['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione']);
  const globalChanges = (rows: EventCard['globals']) => Array.isArray(rows) && rows.every(
    row => globals.has(row.track) && Number.isInteger(row.delta) && row.delta !== 0,
  );
  const counts: [string, { id: string; name: string }[], number][] = [
    ['fazioni', FACTION_CARDS, 347], ['eventi', EVENTS, 75], ['BOT', BOT_CARDS, 120],
    ['obiettivi', OBJECTIVES, 75], ['unità', UNITS, 31], ['territori', TERRITORIES, 16],
  ];
  for (const [label, rows, expected] of counts) {
    if (rows.length !== expected || new Set(rows.map(row => row.id)).size !== expected) {
      fail(`${label}: attesi ${expected} ID univoci, ricevuti ${rows.length}`);
    }
    if (rows.some(row => !row.id || !row.name?.trim())) fail(`${label}: ID o titolo mancante`);
  }
  if (FACTION_CARDS.filter(card => card.special).length !== 15) fail('15 carte speciali richieste');
  for (const card of FACTION_CARDS) {
    if ((!faction(card.origin) && card.origin !== 'Neutrale') || !Number.isInteger(card.cost)
      || card.cost < 1 || card.cost > 4 || card.special !== /^(SE_|SC_)/.test(card.id)
      || typeof card.unlocksSpecial !== 'boolean') fail(`metadati ${card.id}`);
    if (card.options?.length !== 3 || new Set(card.options.map(o => o.boost.faction)).size !== 3
      || card.options.some(o => !change(o.boost) || o.boost.delta < 1
        || !change(o.correlation) || !globalChanges(o.globals))) fail(`tre opzioni esplicite per ${card.id}`);
  }
  for (const event of EVENTS) {
    if (event.order.length !== 5 || new Set(event.order).size !== 5 || !event.order.every(faction)
      || !event.advancers.length || event.advancers.length > 2 || !event.advancers.every(faction)
      || new Set(event.advancers).size !== event.advancers.length
      || !globalChanges(event.globals) || !event.changes.every(change)
      || typeof event.blocksRound !== 'boolean') fail(`evento ${event.id}`);
  }
  for (const f of FACTIONS) {
    for (const t of TRACKS) {
      if (BOT_CARDS.filter(b => b.faction === f && b.track === t).length !== 6) fail(`BOT ${f}/${t}`);
      const links = CORRELATIONS[f]?.[t];
      if (links?.length !== 2 || !links.every(change)) fail(`correlazioni ${f}/${t}`);
      if (!Number.isInteger(INITIAL_TRACKS[f]?.[t]) || INITIAL_TRACKS[f][t] < 1
        || INITIAL_TRACKS[f][t] > 10) fail(`inizio ${f}/${t}`);
    }
    if (TRACKS.reduce((sum, t) => sum + INITIAL_TRACKS[f][t], 0) !== 20) fail(`20 punti iniziali ${f}`);
    const objectives = OBJECTIVES.filter(o => o.faction === f);
    if (objectives.length !== 15 || Array.from({ length: 15 }, (_, i) => i + 1)
      .some(n => !objectives.some(o => o.number === n))) fail(`obiettivi ${f}`);
    const expectedUnits = f === 'Iran' ? 7 : 6;
    if (UNITS.filter(u => u.faction === f).length !== expectedUnits) fail(`unità ${f}`);
  }
  if (BOT_CARDS.some(b => !b.condition || !b.priority1 || !b.priority2)) fail('testo BOT mancante');
  if (OBJECTIVES.some(o => !o.condition || ![3, 4, 6].includes(o.points))) fail('condizione/valore obiettivo');
  if (UNITS.some(u => /dummy/i.test(u.name) || !u.effect || !Number.isInteger(u.cost)
    || !Number.isInteger(u.attack) || !Number.isInteger(u.defense))) fail('unità segnaposto o incompleta');
  if (TERRITORIES.some(t => !Number.isInteger(t.capacity) || t.capacity < 1
    || Object.keys(t.alignment).length !== 5
    || FACTIONS.some(f => ![0, 1, 2].includes(t.alignment[f])))) fail('capienza/allineamento territorio');
}

assertCatalogComplete();

import { FACTIONS, TRACKS, type Faction, type Track, type GlobalTrack, type TrackChange, type GlobalChange } from './catalog-types';
import { FACTION_CARDS, EVENTS, BOT_CARDS, OBJECTIVES, UNITS, TERRITORIES, CORRELATIONS, INITIAL_TRACKS } from './catalog';
import { objectiveComplete } from './objectives';
import { botCondition, botPlan, weakestTrack, chooseBotCorrelation, type BotAction } from './bots';

export type RNG = () => number;
export interface PlayerState {
  bot: boolean; tracks: Record<Track, number>; points: number; hand: string[]; objectives: string[];
  vetoUsed: boolean; neutral?: boolean; dividendUsed?: boolean;
}
export interface PlacedUnit { id: string; type: string; faction: Faction; territory: string; placedRound: number; rotated: boolean; slot?: number }
export interface PlacedInfluence { id: string; faction: Faction; territory: string; slot: number }
export type GameMode = 'breve' | 'media' | 'lunga';
export type ControlChoice = Track | 'Nucleare';
export interface Combat {
  attacker: Faction; defender: Faction; territory: string;
  supporters: Faction[]; supportIndex: number; support: Partial<Record<Faction, 'attacker' | 'defender' | 'none'>>;
  attack?: number; defense?: number; dice?: [number, number]; winner?: Faction; loser?: Faction; casualties?: number;
}
type Effect =
  | { kind: 'correlation'; change: TrackChange }
  | { kind: 'globals'; changes: GlobalChange[]; responsible?: Faction }
  | { kind: 'track'; change: TrackChange }
  | { kind: 'reward'; actor: Faction; favored: Faction; unlock: boolean }
  | { kind: 'bot'; actor: Faction; track: Track; action: BotAction }
  | { kind: 'closure-bot'; actor: Faction }
  | { kind: 'closure-control'; territoryId: string }
  | { kind: 'closure-score' | 'closure-units' | 'closure-refill' };
export interface EngineState {
  version: 3; phase: 'activation' | 'ops' | 'veto' | 'support' | 'casualty' | 'discard' | 'control' | 'bot-influence' | 'ended';
  /** Absent on persisted games from the previous rulebook: never migrate them implicitly. */
  rulesRevision?: '2026-11-16' | '2026-11-21'; mode?: GameMode; turnMarker?: number;
  coalitionIranRounds?: number;
  influence?: PlacedInfluence[]; nextInfluence?: number;
  lastBotCards?: Partial<Record<Faction, string>>; roundClosure?: boolean;
  round: number; actualRound: number; lap: 1 | 2; turnIndex: number; activation: number;
  players: Record<Faction, PlayerState>; globals: Record<GlobalTrack, number>;
  order: Faction[]; advancers: Faction[]; roundBlocked: boolean; event: string | null;
  deck: string[]; discard: string[]; specialReserve: string[]; removed: string[]; eventDeck: string[];
  botDecks: Record<Faction, Record<Track, string[]>>; units: PlacedUnit[]; nextUnit: number;
  ops: { actor: Faction; card: string; remaining: number; pressured: GlobalTrack[] } | null;
  pending: { kind: 'veto'; actor: Faction; change: TrackChange } | { kind: 'support'; actor: Faction } |
    { kind: 'casualty'; actor: Faction; count: number; unitIds: string[] } |
    { kind: 'discard'; actor: Faction; count: number; limit: number } |
    { kind: 'control'; actor: Faction; territoryId: string; choices: ControlChoice[] } |
    { kind: 'bot-influence'; actor: Faction; cardId: string } | null;
  combat: Combat | null; queue: Effect[]; continuation: 'ops' | 'finish'; discardQueue: Faction[];
  intel: Record<Faction, { target: Faction; hand: string[]; activation: number }[]>;
  result: { reason: 'war' | 'nuclear' | 'sanctions' | 'points'; winners: Faction[]; scores: Record<Faction, number>; responsible?: Faction } | null;
  log: string[];
}
export type Command =
  | { type: 'play-event'; cardId: string; option: number }
  | { type: 'begin-ops'; cardId: string }
  | { type: 'develop'; track: Track; correlation: number }
  | { type: 'pressure'; track: GlobalTrack; delta: 1 | -1 }
  | { type: 'deploy'; unitId: string; territoryId: string; target?: Faction; diplomacyEffect?: 'sanctions' | 'opinion' }
  | { type: 'influence'; territoryId: string }
  | { type: 'destabilize'; influenceId: string }
  | { type: 'control-bonus'; track: ControlChoice }
  | { type: 'bot-influence'; territoryId: string }
  | { type: 'attack'; territoryId: string }
  | { type: 'finish-ops' } | { type: 'skip' }
  | { type: 'veto'; use: boolean }
  | { type: 'support'; side: 'attacker' | 'defender' | 'none' }
  | { type: 'casualties'; unitIds: string[] }
  | { type: 'discard'; cardIds: string[] }
  | { type: 'advance-bot' };

const assert: (test: unknown, message: string) => asserts test = (test, message) => { if (!test) throw new Error(message); };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const unitDef = (id: string) => { const d = UNITS.find(u => u.id === id); assert(d, 'Unità sconosciuta'); return d; };
const territoryDef = (id: string) => { const d = TERRITORIES.find(t => t.id === id); assert(d, 'Territorio sconosciuto'); return d; };
const cardDef = (id: string) => { const d = FACTION_CARDS.find(c => c.id === id); assert(d, 'Carta sconosciuta'); return d; };
const named = (u: PlacedUnit, name: string) => unitDef(u.type).name.toLowerCase() === name.toLowerCase();
const inNamed = (u: PlacedUnit, name: string) => territoryDef(u.territory).name.toLowerCase().includes(name.toLowerCase());
export const zone = (value: number): 'crisis' | 'stable' | 'strong' => value <= 3 ? 'crisis' : value >= 8 ? 'strong' : 'stable';
export const MODE_THRESHOLDS: Record<GameMode, number> = { breve: 30, media: 60, lunga: 80 };
export const usesOfficialRules = (s: Pick<EngineState,'rulesRevision'>) => s.rulesRevision === '2026-11-16' || usesLatestRules(s);
export const usesLatestRules = (s: Pick<EngineState,'rulesRevision'>) => s.rulesRevision === '2026-11-21';
/** Zero-based shared board slots. Existing explicit positions are never compacted after removals. */
export function occupiedSlots(s: Pick<EngineState,'rulesRevision'|'units'|'influence'>, territoryId: string): number[] {
  const local = usesLatestRules(s) ? [] : s.units.filter(u => u.territory === territoryId);
  const slots = new Set<number>([
    ...local.flatMap(u => u.slot === undefined ? [] : [u.slot]),
    ...(usesOfficialRules(s) ? (s.influence ?? []).filter(i => i.territory === territoryId).map(i => i.slot) : []),
  ]);
  // Compatibility for fixtures and imported states with units not yet carrying a slot.
  for (const u of local.filter(u => u.slot === undefined)) {
    void u;
    let slot = 0; while (slots.has(slot)) slot++; slots.add(slot);
  }
  return [...slots].sort((a, b) => a - b);
}
export function territoryPresence(s: EngineState, faction: Faction, territoryId: string): number {
  if (s.players[faction]?.neutral) return 0;
  return s.units.filter(u => u.faction === faction && u.territory === territoryId).length +
    (usesOfficialRules(s) ? (s.influence ?? []).filter(i => i.faction === faction && i.territory === territoryId).length : 0);
}
export function territoryController(s: EngineState, territoryId: string): Faction | null {
  const counts = FACTIONS.map(f => ({ faction: f, count: territoryPresence(s, f, territoryId) })).sort((a, b) => b.count - a.count);
  return counts[0].count > 0 && counts[0].count > counts[1].count ? counts[0].faction : null;
}
export function influenceCost(s: EngineState, faction: Faction, territoryId: string): number {
  const alignment = territoryDef(territoryId).alignment[faction];
  if (!usesLatestRules(s)) return 1 + alignment;
  const military = s.players[faction].tracks.Militare;
  const strength = !['Iran', 'Coalizione'].includes(faction) && alignment > 0 ? (military >= 8 ? -1 : military <= 3 ? 1 : 0) : 0;
  const opinion = faction === 'Iran' && s.globals.Opinione <= -4 || faction === 'Coalizione' && s.globals.Opinione >= 4 ? -1 : 0;
  return Math.max(1, 1 + alignment + strength + opinion);
}
export function canInfluence(s: EngineState, territoryId: string): boolean {
  const t = TERRITORIES.find(t => t.id === territoryId);
  return usesOfficialRules(s) && !!t && occupiedSlots(s, territoryId).length < t.capacity;
}
function firstFreeSlot(s: EngineState, territoryId: string): number {
  const occupied = occupiedSlots(s, territoryId);
  return Array.from({ length: territoryDef(territoryId).capacity }, (_, slot) => slot).find(slot => !occupied.includes(slot)) ?? -1;
}
/** The board's printed bonuses, including the choices that need an owning player's decision. */
export function controlBonusChoices(s: EngineState, territoryId: string, controller = territoryController(s, territoryId)): (Track | 'Nucleare' | 'PV')[] {
  const name = territoryDef(territoryId).name;
  if (['Arabia Saudita', 'Emirati', 'Qatar', 'Kuwait'].includes(name)) return ['Economia'];
  if (['Israele', 'Turchia'].includes(name)) return ['Militare'];
  if (['Egitto', 'Giordania', 'Oman'].includes(name)) return ['Diplomazia'];
  if (['Siria', 'Libano', 'Yemen', 'Bahrein'].includes(name)) return ['Consenso'];
  if (name === 'Iraq') return ['Economia', 'Militare'];
  if (name === 'Iran') return controller === 'Iran' ? ['Consenso', 'Nucleare'] : ['Consenso'];
  if (name.includes('Hormuz')) return ['PV'];
  return [];
}
function random(rng: RNG) { const n = rng(); assert(Number.isFinite(n) && n >= 0 && n < 1, 'RNG deve restituire un numero in [0,1)'); return n; }
function shuffle<T>(input: readonly T[], rng: RNG): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random(rng) * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function record<T>(fn: (f: Faction) => T): Record<Faction, T> { return Object.fromEntries(FACTIONS.map(f => [f, fn(f)])) as Record<Faction, T>; }
export function currentActor(s: EngineState): Faction | null {
  return s.phase === 'ended' ? null : s.pending?.actor ?? s.ops?.actor ?? s.order[s.turnIndex] ?? null;
}
export function hormuzBlocked(s: EngineState): boolean {
  const local = s.units.filter(u => inNamed(u, 'Hormuz'));
  return local.filter(u => u.faction === 'Iran' && named(u, 'Flotta veloce del Golfo')).length >= 2 &&
    !local.some(u => named(u, 'Carrier Strike Group'));
}
export function deployCost(s: EngineState, faction: Faction, unitId: string, territoryId: string): number {
  const u = unitDef(unitId), t = territoryDef(territoryId), eco = s.players[faction].tracks.Economia, crisis = s.globals['Crisi Bellica'];
  return Math.max(1, u.cost + (crisis <= 4 ? 2 : crisis <= 7 ? 1 : 0) +
    (eco <= 3 ? 1 : eco >= 8 ? -1 : 0) + t.alignment[faction] + (faction === 'Coalizione' && hormuzBlocked(s) ? 1 : 0));
}
function changeTrack(s: EngineState, c: TrackChange) {
  const before = s.players[c.faction].tracks[c.track];
  s.players[c.faction].tracks[c.track] = clamp(before + c.delta, 1, 10);
  s.log.push(`${c.faction}: ${c.track} ${before} → ${s.players[c.faction].tracks[c.track]}`);
}
function end(s: EngineState, reason: 'war' | 'nuclear' | 'sanctions', responsible?: Faction) {
  if (reason === 'war' && usesLatestRules(s)) {
    finalScore(s, { responsible }); s.queue = []; s.ops = null; s.combat = null;
    return;
  }
  s.phase = 'ended'; s.pending = null; s.queue = []; s.ops = null;
  if (usesOfficialRules(s)) s.roundClosure = false;
  s.result = { reason, winners: reason === 'war' ? [] : [reason === 'nuclear' ? 'Iran' : 'Coalizione'], scores: record(f => s.players[f].points) };
  s.log.push(reason === 'war' ? 'Guerra totale: nessun vincitore.' : `Partita terminata: vince ${s.result.winners.join(', ')} (${reason === 'nuclear' ? 'Nucleare 15' : 'Sanzioni 10'}).`);
}
function globals(s: EngineState, changes: GlobalChange[], responsible?: Faction) {
  let war = false, nuclear = false, sanctions = false;
  for (const c of changes) {
    const before = s.globals[c.track];
    s.globals[c.track] = clamp(before + c.delta, c.track === 'Opinione' ? -10 : 1, c.track === 'Nucleare' ? 15 : 10);
    if (usesLatestRules(s) && c.track === 'Nucleare' && s.players.Iran.neutral) s.globals.Nucleare = Math.min(14, s.globals.Nucleare);
    if (usesLatestRules(s) && c.track === 'Sanzioni' && s.players.Coalizione.neutral) s.globals.Sanzioni = Math.min(9, s.globals.Sanzioni);
    s.log.push(`Globale: ${c.track} ${before} → ${s.globals[c.track]}`);
    war ||= s.globals['Crisi Bellica'] === 1; nuclear ||= s.globals.Nucleare === 15; sanctions ||= s.globals.Sanzioni === 10;
  }
  if (war) end(s, 'war', responsible);
  else if (nuclear) end(s, 'nuclear');
  else if (sanctions) end(s, 'sanctions');
}
function draw(s: EngineState, rng: RNG): string | undefined {
  if (!s.deck.length && s.discard.length) { s.deck = shuffle(s.discard, rng); s.discard = []; }
  return s.deck.shift();
}
function dispose(s: EngineState, id: string) { (cardDef(id).special ? s.removed : s.discard).push(id); }
function takeCard(s: EngineState, actor: Faction, id: string) {
  const hand = s.players[actor].hand, i = hand.indexOf(id); assert(i >= 0, 'Carta non in mano');
  hand.splice(i, 1); dispose(s, id); return cardDef(id);
}
function moveTurnMarker(s: EngineState, actor: Faction, cost: number) {
  if (!usesOfficialRules(s) || s.roundBlocked || !s.advancers.includes(actor)) return;
  const before = s.turnMarker ?? 0; s.turnMarker = before + cost;
  s.log.push(`Segna-turni: ${before} → ${s.turnMarker} (${actor}, ${cost} OP della carta).`);
}
function startRound(s: EngineState, rng: RNG) {
  s.lap = 1; s.turnIndex = 0; s.ops = null; s.pending = null; s.queue = []; s.phase = 'activation';
  if (usesOfficialRules(s)) { s.roundClosure = false; s.lastBotCards = {}; }
  FACTIONS.forEach(f => { s.players[f].vetoUsed = false; s.players[f].dividendUsed = false; });
  if (usesOfficialRules(s) && !s.eventDeck.length) {
    s.eventDeck = shuffle(EVENTS.map(e => e.id), rng);
    s.log.push('Mazzo Eventi esaurito: gli Eventi vengono rimescolati.');
  }
  const id = s.eventDeck.shift(); assert(id, 'Mazzo eventi esaurito');
  const e = EVENTS.find(c => c.id === id); assert(e, 'Evento sconosciuto'); s.event = id; s.roundBlocked = e.blocksRound;
  s.order = [...new Set([...e.order, ...FACTIONS])]; s.advancers = [...e.advancers];
  s.log.push(`Round ${s.round} (${s.actualRound}): [${e.id}] ${e.name}`);
  e.changes.forEach(c => changeTrack(s, c)); globals(s, e.globals);
}
export function createGame(options: { bots: Faction[]; neutrals?: Faction[]; mode?: GameMode; rulesRevision?: EngineState['rulesRevision'] }, rng: RNG = Math.random): EngineState {
  assert(options.bots.every(f => FACTIONS.includes(f)), 'Fazione BOT sconosciuta');
  assert((options.neutrals ?? []).every(f => FACTIONS.includes(f) && !options.bots.includes(f)), 'Fazioni neutrali non valide');
  assert(!options.mode || ['breve', 'media', 'lunga'].includes(options.mode), 'Modalità sconosciuta');
  const s: EngineState = {
    version: 3, phase: 'activation', round: 1, actualRound: 1, lap: 1, turnIndex: 0, activation: 1,
    rulesRevision: options.rulesRevision ?? '2026-11-16', mode: options.mode ?? 'media', turnMarker: 0,
    influence: [], nextInfluence: 1, lastBotCards: {}, roundClosure: false,
    players: record(f => ({ bot: options.bots.includes(f), neutral: options.neutrals?.includes(f) ?? false, tracks: { ...INITIAL_TRACKS[f] }, points: 0, hand: [], objectives: [], vetoUsed: false })),
    globals: { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 }, order: [...FACTIONS], advancers: [], roundBlocked: false, event: null,
    deck: shuffle(FACTION_CARDS.filter(c => !c.special).map(c => c.id), rng), discard: [],
    specialReserve: shuffle(FACTION_CARDS.filter(c => c.special).map(c => c.id), rng), removed: [],
    eventDeck: shuffle(EVENTS.map(e => e.id), rng),
    botDecks: record(f => Object.fromEntries(TRACKS.map(t => [t, shuffle(BOT_CARDS.filter(c => c.faction === f && c.track === t).map(c => c.id), rng)])) as Record<Track, string[]>),
    units: [], nextUnit: 1, ops: null, pending: null, combat: null, queue: [], continuation: 'finish', discardQueue: [],
    intel: record(() => []), result: null, log: [],
  };
  if (usesLatestRules(s)) { s.deck = shuffle(FACTION_CARDS.map(c => c.id), rng); s.specialReserve = []; }
  FACTIONS.forEach(f => {
    if (!s.players[f].bot && !s.players[f].neutral) {
      for (let n = 0; n < 5; n++) { const card = draw(s, rng); if (card) s.players[f].hand.push(card); }
      s.players[f].objectives = shuffle(OBJECTIVES.filter(o => o.faction === f).map(o => o.id), rng).slice(0, 3);
    }
  });
  startRound(s, rng); return s;
}
function finalScore(s: EngineState, war?: { responsible?: Faction }) {
  for (const f of FACTIONS) {
    const p = s.players[f];
    if (p.neutral) { p.points = 0; continue; }
    const scoringPieces = usesOfficialRules(s) ? (s.influence ?? []) : s.units;
    p.points += scoringPieces.filter(u => u.faction === f).reduce((n, u) => n + 1 + territoryDef(u.territory).alignment[f], 0);
    p.points += p.objectives.reduce((n, id) => n + (objectiveComplete(s, id) ? OBJECTIVES.find(o => o.id === id)!.points : 0), 0);
    p.points += TRACKS.filter(t => p.tracks[t] === 10).length * 2;
    if (war && !war.responsible) p.points -= 5;
  }
  const rank = (f: Faction) => [s.players[f].points, TRACKS.reduce((n, t) => n + s.players[f].tracks[t], 0), s.players[f].tracks.Consenso];
  const compare = (a: Faction, b: Faction) => { const aa = rank(a), bb = rank(b); return aa[0] - bb[0] || aa[1] - bb[1] || aa[2] - bb[2]; };
  const eligible = FACTIONS.filter(f => !s.players[f].neutral && f !== war?.responsible);
  const leader = [...eligible].sort((a, b) => compare(b, a))[0];
  s.result = { reason: war ? 'war' : 'points', winners: eligible.filter(f => compare(f, leader) === 0), scores: record(f => s.players[f].points),
    ...(war?.responsible ? { responsible: war.responsible } : {}) };
  s.phase = 'ended'; s.pending = null;
  if (usesOfficialRules(s)) s.roundClosure = false;
  s.log.push(`Punteggio finale: ${FACTIONS.map(f => `${f} ${s.players[f].points} PV`).join(' · ')}. Vince: ${s.result.winners.join(', ')}.`);
}
function afterDiscards(s: EngineState, rng: RNG) {
  if (usesOfficialRules(s)) {
    if ((s.turnMarker ?? 0) >= MODE_THRESHOLDS[s.mode ?? 'media']) { finalScore(s); return; }
    s.round++;
  } else {
    if ((s.round >= 6 && !s.roundBlocked) || s.actualRound >= 8) { finalScore(s); return; }
    if (!s.roundBlocked) s.round++;
  }
  s.actualRound++; startRound(s, rng);
}
function promptDiscard(s: EngineState, rng: RNG) {
  while (s.discardQueue.length) {
    const f = s.discardQueue.shift()!, p = s.players[f], limit = p.tracks.Consenso <= 3 ? 5 : 7;
    if (p.hand.length > limit) { s.phase = 'discard'; s.pending = { kind: 'discard', actor: f, count: p.hand.length - limit, limit }; return; }
  }
  afterDiscards(s, rng);
}
function scoreRound(s: EngineState) {
  FACTIONS.forEach(f => {
    const p = s.players[f], before = p.points;
    if (p.neutral) return;
    p.points = Math.max(0, p.points + TRACKS.reduce((n, t) => n + (p.tracks[t] >= 8 ? 1 : p.tracks[t] <= 3 ? -1 : 0), 0));
    s.log.push(`${f}: PV di fine round ${before} → ${p.points}`);
  });
}
function rotateUnits(s: EngineState) {
  const expired = s.units.filter(u => u.rotated);
  expired.forEach(u => s.log.push(`${u.faction}: ${unitDef(u.type).name} torna in riserva da ${territoryDef(u.territory).name}.`));
  s.units = s.units.filter(u => !u.rotated); s.units.forEach(u => { u.rotated = true; });
}
function refill(s: EngineState, rng: RNG) {
  FACTIONS.forEach(f => {
    if (s.players[f].bot || s.players[f].neutral) return;
    const count = (s.players[f].tracks.Consenso <= 3 ? 1 : s.players[f].tracks.Consenso >= 8 ? 3 : 2) +
      (!usesOfficialRules(s) && s.advancers.includes(f) ? 1 : 0);
    for (let i = 0; i < count; i++) { const card = draw(s, rng); if (card) s.players[f].hand.push(card); }
  });
}
function endRound(s: EngineState, rng: RNG) {
  s.log.push(`Fine round ${s.round} (${s.actualRound}): Tensione, ${usesOfficialRules(s) ? 'Influenza BOT, controllo, ' : ''}punteggio, durata unità e rifornimento.`);
  if (s.globals.Sanzioni >= 8) changeTrack(s, { faction: 'Iran', track: 'Economia', delta: -1 });
  if (s.globals.Nucleare >= 12) globals(s, [{ track: 'Crisi Bellica', delta: -1 }]);
  if (s.phase === 'ended') return;
  if (s.globals.Opinione <= -6) changeTrack(s, { faction: 'Iran', track: 'Diplomazia', delta: 1 });
  if (s.globals.Opinione >= 6) changeTrack(s, { faction: 'Coalizione', track: 'Diplomazia', delta: 1 });
  if (usesLatestRules(s)) {
    if (s.units.some(u => u.faction === 'Coalizione' && u.territory === 'iran')) {
      changeTrack(s, { faction: 'Iran', track: 'Consenso', delta: 1 });
      changeTrack(s, { faction: 'Coalizione', track: 'Consenso', delta: -1 });
      for (const faction of ['Russia', 'Cina'] as const) changeTrack(s, { faction, track: 'Diplomazia', delta: 1 });
    }
  }
  if (usesOfficialRules(s)) {
    // Each effect is removed before it runs. Serialized pending choices resume the remaining
    // sequence without applying Tension, scoring or RNG-dependent refill a second time.
    s.roundClosure = true;
    s.queue = [
      ...s.order.filter(f => s.players[f].bot).map(actor => ({ kind: 'closure-bot' as const, actor })),
      ...TERRITORIES.map(t => ({ kind: 'closure-control' as const, territoryId: t.id })),
      { kind: 'closure-score' }, { kind: 'closure-units' }, { kind: 'closure-refill' },
    ];
    drain(s, rng);
  } else {
    scoreRound(s); rotateUnits(s); refill(s, rng);
    s.discardQueue = [...s.order]; promptDiscard(s, rng);
  }
}
function finish(s: EngineState, rng: RNG) {
  s.ops = null; s.pending = null; s.combat = null; s.queue = []; s.phase = 'activation'; s.activation++;
  s.turnIndex++;
  if (s.turnIndex >= s.order.length) {
    s.turnIndex = 0;
    if (s.lap === 1) s.lap = 2; else endRound(s, rng);
  }
}
function canVeto(s: EngineState, c: TrackChange) {
  return !s.players[c.faction].neutral && c.delta < 0 && s.players[c.faction].tracks.Diplomazia >= 8 && !s.players[c.faction].vetoUsed;
}
function applyVeto(s: EngineState, c: TrackChange) {
  s.log.push(`${c.faction}: Veto sulla correlazione ${c.track} ${c.delta}; costo −1 Diplomazia.`);
  s.players[c.faction].vetoUsed = true; changeTrack(s, { faction: c.faction, track: 'Diplomazia', delta: -1 });
}
function revealBotCard(s: EngineState, actor: Faction, track: Track) {
  const deck = s.botDecks[actor][track], id = deck.shift();
  assert(id, 'Mazzo BOT vuoto'); deck.push(id);
  const card = BOT_CARDS.find(b => b.id === id);
  assert(card && card.faction === actor && card.track === track, 'Carta BOT non valida per il mazzo');
  if (usesOfficialRules(s)) { s.lastBotCards ??= {}; s.lastBotCards[actor] = id; }
  return card;
}
function promptBotInfluence(s: EngineState, actor: Faction, cardId?: string) {
  const id = cardId ?? s.lastBotCards?.[actor] ?? revealBotCard(s, actor, weakestTrack(s, actor)).id;
  s.phase = 'bot-influence'; s.pending = { kind: 'bot-influence', actor, cardId: id };
  s.log.push(`${actor} BOT: [${id}] Influenza a fine round — il materiale disponibile non riporta lo Stato; indicarlo esplicitamente dalla carta originale.`);
}
function placeInfluence(s: EngineState, actor: Faction, territoryId: string) {
  assert(canInfluence(s, territoryId), 'Serve un riquadro libero per l’Influenza');
  s.influence ??= []; s.nextInfluence ??= 1;
  const slot = firstFreeSlot(s, territoryId); assert(slot >= 0, 'Nessun riquadro libero');
  s.influence.push({ id: `i${s.nextInfluence++}`, faction: actor, territory: territoryId, slot });
  s.log.push(`${actor}: piazza Influenza in ${territoryDef(territoryId).name}, riquadro ${slot + 1}.`);
}
function grantControlBonus(s: EngineState, actor: Faction, territoryId: string, track: Track | 'Nucleare' | 'PV') {
  s.log.push(`${actor}: bonus controllo ${territoryDef(territoryId).name}, ${track} +1.`);
  if (track === 'PV') s.players[actor].points++;
  else if (track === 'Nucleare') globals(s, [{ track: 'Nucleare', delta: 1 }], actor);
  else changeTrack(s, { faction: actor, track, delta: 1 });
}
function resolveControl(s: EngineState, territoryId: string) {
  const actor = territoryController(s, territoryId);
  if (usesLatestRules(s) && territoryId === 'iran') {
    s.coalitionIranRounds = actor === 'Coalizione' ? (s.coalitionIranRounds ?? 0) + 1 : 0;
    if (actor === 'Coalizione') {
      changeTrack(s, { faction: 'Iran', track: 'Economia', delta: -1 });
      if (s.coalitionIranRounds >= 2) globals(s, [{ track: 'Nucleare', delta: -2 }], actor);
      return;
    }
  }
  if (!actor) return;
  const choices = controlBonusChoices(s, territoryId, actor);
  if (choices.length > 1) {
    s.phase = 'control'; s.pending = { kind: 'control', actor, territoryId, choices: choices as ControlChoice[] };
  } else if (choices.length) grantControlBonus(s, actor, territoryId, choices[0]);
}
function drain(s: EngineState, rng: RNG) {
  while (s.queue.length && s.phase !== 'ended') {
    const effect = s.queue.shift()!;
    if (effect.kind === 'correlation') {
      if (canVeto(s, effect.change)) {
        const p = s.players[effect.change.faction];
        if (p.bot) { if (p.tracks[effect.change.track] <= 3) applyVeto(s, effect.change); else changeTrack(s, effect.change); }
        else { s.phase = 'veto'; s.pending = { kind: 'veto', actor: effect.change.faction, change: effect.change }; return; }
      } else changeTrack(s, effect.change);
    } else if (effect.kind === 'track') changeTrack(s, effect.change);
    else if (effect.kind === 'globals') globals(s, effect.changes, effect.responsible);
    else if (effect.kind === 'reward') {
      if (effect.favored !== effect.actor && (!usesLatestRules(s) || !s.players[effect.actor].dividendUsed)) {
        s.players[effect.actor].points++; s.players[effect.actor].dividendUsed = true; s.log.push(`${effect.actor}: dividendo diplomatico +1 PV.`);
      }
      if (effect.unlock && !usesLatestRules(s)) { const id = s.specialReserve.shift(); if (id) { s.players[effect.actor].hand.push(id); s.log.push(`${effect.actor}: pesca una carta dalla Riserva speciale.`); } }
    } else if (effect.kind === 'bot') executeBotAction(s, effect.actor, effect.track, effect.action, rng);
    else if (effect.kind === 'closure-bot') promptBotInfluence(s, effect.actor);
    else if (effect.kind === 'closure-control') resolveControl(s, effect.territoryId);
    else if (effect.kind === 'closure-score') scoreRound(s);
    else if (effect.kind === 'closure-units') rotateUnits(s);
    else if (effect.kind === 'closure-refill') refill(s, rng);
    if (s.pending || s.phase === 'support' || s.phase === 'casualty') return;
  }
  if (s.phase === 'ended') return;
  s.pending = null;
  if (s.roundClosure) { s.discardQueue = [...s.order]; promptDiscard(s, rng); return; }
  if (s.continuation === 'ops') s.phase = 'ops'; else finish(s, rng);
}
function development(s: EngineState, actor: Faction, track: Track, correlation: number) {
  assert(TRACKS.includes(track), 'Tracciato non valido');
  const change = CORRELATIONS[actor][track][correlation]; assert(change, 'Scegli una delle due correlazioni');
  s.log.push(`${actor}: Sviluppo ${track}; correlazione ${change.faction} ${change.track} ${change.delta > 0 ? '+' : ''}${change.delta}.`);
  changeTrack(s, { faction: actor, track, delta: 1 }); s.queue.unshift({ kind: 'correlation', change });
}
export function canDeploy(s: EngineState, faction: Faction, unitId: string, territoryId: string): boolean {
  const u = UNITS.find(d => d.id === unitId), t = TERRITORIES.find(d => d.id === territoryId);
  if (!u || !t || u.faction !== faction || (u.naval && t.name.toLowerCase().includes('giordania'))) return false;
  const local = s.units.filter(x => x.territory === territoryId);
  const max = u.maxPerTerritory ?? (/missili balistici/i.test(u.name) ? 2 : /caschi blu/i.test(u.name) ? 3 : undefined);
  return !s.players[faction].neutral && (usesLatestRules(s) ? s.units.filter(x => x.type === unitId).length < 5 : occupiedSlots(s, territoryId).length < t.capacity) &&
    (!max || local.filter(x => x.type === unitId).length < max);
}
function deployment(s: EngineState, actor: Faction, unitId: string, territoryId: string, target?: Faction, diplomacyEffect?: 'sanctions' | 'opinion') {
  assert(canDeploy(s, actor, unitId, territoryId), 'Schieramento non valido: fazione, capacità o limite navale/unità');
  const d = unitDef(unitId), name = d.name.toLowerCase();
  const intelligence = /intelligence|satelliti/.test(name), cyber = name === 'cyber russia' || name === 'cyber unit';
  if (intelligence) assert(target && FACTIONS.includes(target), 'Scegli esplicitamente la fazione di cui vedere la mano');
  if (cyber) assert(target && target !== actor && (usesLatestRules(s) ? territoryPresence(s, target, territoryId) > 0 : s.units.some(u => u.territory === territoryId && u.faction === target)), 'Cyber: scegli un avversario presente nello stesso territorio');
  if (name === 'diplomazia ue') assert(diplomacyEffect === 'sanctions' || diplomacyEffect === 'opinion', 'Scegli l’effetto diplomatico');
  s.log.push(`${actor}: schiera ${d.name} in ${territoryDef(territoryId).name}.`);
  s.units.push({ id: `u${s.nextUnit++}`, type: unitId, faction: actor, territory: territoryId, placedRound: s.actualRound, rotated: false,
    ...(usesOfficialRules(s) && !usesLatestRules(s) ? { slot: firstFreeSlot(s, territoryId) } : {}) });
  if (usesLatestRules(s) && actor === 'Coalizione' && territoryId === 'iran') {
    globals(s, [{ track: 'Crisi Bellica', delta: -1 }, { track: 'Opinione', delta: -1 }], actor);
    if (s.result) return;
  }
  if (intelligence) s.intel[actor].push({ target: target!, hand: [...s.players[target!].hand], activation: s.activation });
  if (cyber) changeTrack(s, { faction: target!, track: 'Economia', delta: -1 });
  if (name === 'investimenti bri') changeTrack(s, { faction: 'Cina', track: 'Diplomazia', delta: 1 });
  if (name === 'tecnologia duale') changeTrack(s, { faction: 'Cina', track: 'Militare', delta: 1 });
  if (name === 'infrastrutture') changeTrack(s, { faction: 'Cina', track: 'Consenso', delta: 1 });
  if (name === 'aiuti umanitari') changeTrack(s, { faction: 'Europa', track: 'Consenso', delta: 1 });
  if (name === 'caschi blu') globals(s, [{ track: 'Opinione', delta: 1 }]);
  if (name === 'diplomazia ue') globals(s, [{ track: diplomacyEffect === 'sanctions' ? 'Sanzioni' : 'Opinione', delta: diplomacyEffect === 'sanctions' ? -1 : 1 }]);
}
function beginAttack(s: EngineState, actor: Faction, territory: string, rng: RNG) {
  assert(actor === 'Iran' || actor === 'Coalizione', 'Solo Iran e Coalizione possono attaccare');
  const defender = actor === 'Iran' ? 'Coalizione' : 'Iran';
  assert(s.units.some(u => u.territory === territory && u.faction === actor) && s.units.some(u => u.territory === territory && u.faction === defender), 'Servono unità di entrambe le fazioni belligeranti nel territorio');
  s.log.push(`${actor}: attacco a ${defender} in ${territoryDef(territory).name}.`);
  globals(s, [{ track: 'Crisi Bellica', delta: -1 }], actor); if (s.phase === 'ended') return;
  s.combat = { attacker: actor, defender, territory, supporters: s.order.filter(f => f !== actor && f !== defender && s.units.some(u => u.faction === f && u.territory === territory)), supportIndex: 0, support: {} };
  promptSupport(s, rng);
}
function promptSupport(s: EngineState, rng: RNG) {
  const c = s.combat!;
  while (c.supportIndex < c.supporters.length) {
    const f = c.supporters[c.supportIndex];
    if (s.players[f].bot) {
      c.support[f] = f === 'Europa' ? (c.attacker === 'Coalizione' ? 'attacker' : 'defender') : (c.attacker === 'Iran' ? 'attacker' : 'defender');
      s.log.push(`${f} BOT: sostiene ${c.support[f] === 'attacker' ? c.attacker : c.defender} in ${territoryDef(c.territory).name}.`);
      c.supportIndex++;
    }
    else { s.phase = 'support'; s.pending = { kind: 'support', actor: f }; return; }
  }
  resolveCombat(s, rng);
}
function resolveCombat(s: EngineState, rng: RNG) {
  const c = s.combat!, local = s.units.filter(u => u.territory === c.territory);
  const attacking = local.filter(u => u.faction === c.attacker || c.support[u.faction] === 'attacker');
  const defending = local.filter(u => u.faction === c.defender || c.support[u.faction] === 'defender');
  const defensiveSystems = usesLatestRules(s) ? local : defending;
  const s400 = defensiveSystems.some(u => named(u, 'Difesa aerea S-400')), shield = defensiveSystems.some(u => named(u, 'Scudo Missilistico'));
  const modifier = (f: Faction) => s.players[f].tracks.Militare <= 3 ? -1 : s.players[f].tracks.Militare >= 8 ? 1 : 0;
  c.dice = [1 + Math.floor(random(rng) * 6), 1 + Math.floor(random(rng) * 6)];
  c.attack = attacking.reduce((n, u) => n + (((s400 && named(u, 'Aviazione Tattica')) || (shield && named(u, 'Missili balistici'))) ? 0 : unitDef(u.type).attack) +
    (usesLatestRules(s) && named(u, 'Forniture armi') && c.support[u.faction] === 'attacker' ? 1 : 0), 0) + modifier(c.attacker) + c.dice[0];
  const controllingFaction = territoryController(s, c.territory);
  c.defense = defending.reduce((n, u) => n + (named(u, 'IRGC') && inNamed(u, 'Iran') ? 5 :
    named(u, 'Forniture armi') && c.support[u.faction] === 'defender' ? 1 : unitDef(u.type).defense) +
    (usesOfficialRules(s) && !usesLatestRules(s) && controllingFaction === u.faction ? 1 : 0), 0) +
    modifier(c.defender) + c.dice[1] - attacking.filter(u => named(u, 'IRGC Cyber Unit')).length +
    (usesLatestRules(s) && defending.some(u => u.faction === controllingFaction) ? 1 : 0);
  // IRGC's printed D+5 already includes its homeland defense; do not count it twice.
  if (usesLatestRules(s) && c.territory === 'iran' && c.defender === 'Iran' && !defending.some(u => named(u, 'IRGC'))) c.defense++;
  c.winner = c.attack > c.defense ? c.attacker : c.defender; c.loser = c.winner === c.attacker ? c.defender : c.attacker;
  const eligible = local.filter(u => u.faction === c.loser).map(u => u.id);
  c.casualties = Math.min(eligible.length, Math.abs(c.attack - c.defense) >= 4 ? 2 : 1);
  s.phase = 'casualty'; s.pending = { kind: 'casualty', actor: c.loser, count: c.casualties, unitIds: eligible };
  if (s.players[c.loser].bot) applyCasualties(s, eligible.sort((a, b) => {
    const aa = unitDef(s.units.find(u => u.id === a)!.type), bb = unitDef(s.units.find(u => u.id === b)!.type);
    return aa.cost - bb.cost;
  }).slice(0, c.casualties), rng, false);
}
function applyCasualties(s: EngineState, ids: string[], rng: RNG, resume = true) {
  const c = s.combat!, p = s.pending; assert(p?.kind === 'casualty', 'Nessuna perdita da scegliere');
  assert(new Set(ids).size === ids.length && ids.length === p.count && ids.every(id => p.unitIds.includes(id)), 'Scegli esattamente le unità da rimuovere');
  s.log.push(`${c.loser}: rimuove ${ids.map(id => unitDef(s.units.find(u => u.id === id)!.type).name).join(', ')} da ${territoryDef(c.territory).name}.`);
  s.units = s.units.filter(u => !ids.includes(u.id)); changeTrack(s, { faction: c.loser!, track: 'Consenso', delta: -1 });
  if (usesOfficialRules(s)) {
    const lost = (s.influence ?? []).filter(i => i.territory === c.territory && i.faction === c.loser).sort((a, b) => a.slot - b.slot)[0];
    if (lost) { s.influence = s.influence!.filter(i => i.id !== lost.id); s.log.push(`${c.loser}: perde anche l’Influenza più a sinistra in ${territoryDef(c.territory).name}.`); }
  }
  const winnerUnits = s.units.filter(u => u.territory === c.territory && u.faction === c.winner);
  const bonus = winnerUnits.filter(u => named(u, 'Proxy regionali') || named(u, 'Droni Shahed')).length;
  if (bonus) changeTrack(s, { faction: c.loser!, track: 'Consenso', delta: -bonus });
  const specialForces = winnerUnits.filter(u => named(u, 'Forze Speciali')).length;
  if (specialForces) changeTrack(s, { faction: 'Coalizione', track: 'Diplomazia', delta: specialForces });
  const cruise = winnerUnits.filter(u => named(u, 'Missili da crociera') && inNamed(u, 'Iran')).length;
  if (cruise) globals(s, [{ track: 'Nucleare', delta: -cruise }]);
  if (usesLatestRules(s) && c.territory === 'iran') globals(s, [{ track: c.winner === 'Coalizione' ? 'Nucleare' : 'Opinione', delta: -1 }], c.winner);
  s.log.push(`Combattimento: ${c.attacker} ${c.attack} / ${c.defender} ${c.defense} (dadi ${c.dice?.join(' / ')}); vince ${c.winner}`);
  s.combat = null; s.pending = null;
  if (s.phase !== 'ended') {
    s.phase = s.continuation === 'ops' ? 'ops' : 'activation';
    if (resume) drain(s, rng);
  }
}
function executeBotAction(s: EngineState, actor: Faction, track: Track, action: BotAction, rng: RNG) {
  if (action.kind === 'develop') development(s, actor, action.track, chooseBotCorrelation(s, actor, action.track));
  else if (action.kind === 'global') globals(s, [{ track: action.track, delta: action.delta === 'zero' ? -Math.sign(s.globals.Opinione) : action.delta }], actor);
  else if (action.kind === 'track') changeTrack(s, action.change);
  else if (action.kind === 'attack') {
    const territory = action.territory ?? TERRITORIES.find(t => s.units.some(u => u.faction === 'Iran' && u.territory === t.id) && s.units.some(u => u.faction === 'Coalizione' && u.territory === t.id))?.id;
    if (territory && s.globals['Crisi Bellica'] > 3 && s.units.some(u => u.faction === actor && u.territory === territory) && s.units.some(u => u.faction === (actor === 'Iran' ? 'Coalizione' : 'Iran') && u.territory === territory)) beginAttack(s, actor, territory, rng);
    else development(s, actor, track, chooseBotCorrelation(s, actor, track));
  } else {
    const def = UNITS.find(u => u.faction === actor && u.name.toLowerCase() === action.unit.toLowerCase());
    if (!def) { development(s, actor, track, chooseBotCorrelation(s, actor, track)); return; }
    // Appendix B specifies this order; the catalog follows the board layout, a different order.
    const printedOrder = ['Turchia', 'Siria', 'Libano', 'Israele', 'Giordania', 'Egitto', 'Iraq', 'Iran', 'Kuwait', 'Arabia Saudita', 'Bahrein', 'Qatar', 'Emirati', 'Oman', 'Yemen'];
    const friendly = printedOrder.flatMap(name => TERRITORIES.filter(t => t.name === name && t.alignment[actor] === 0).map(t => t.id));
    const hormuz = TERRITORIES.find(t => t.name.includes('Hormuz'))?.id;
    const candidates = def.naval ? [usesLatestRules(s) ? action.territory ?? hormuz : hormuz] : [action.territory, ...friendly];
    let selected = candidates.find(t => t && canDeploy(s, actor, def.id, t));
    const cyber = /^Cyber (Russia|Unit)$/i.test(def.name);
    if (cyber) selected = candidates.find(t => t && canDeploy(s, actor, def.id, t) && s.units.some(u => u.territory === t && u.faction !== actor));
    if (!selected) {
      const fallback = s.units.filter(u => u.type === def.id).length >= 5 ? 'Militare' : track;
      development(s, actor, usesLatestRules(s) ? fallback : 'Militare', chooseBotCorrelation(s, actor, usesLatestRules(s) ? fallback : 'Militare')); return;
    }
    const target = cyber ? s.units.find(u => u.territory === selected && u.faction !== actor)!.faction : FACTIONS.find(f => f !== actor)!;
    deployment(s, actor, def.id, selected, target, 'opinion');
  }
}
function botActivation(s: EngineState, actor: Faction, rng: RNG) {
  const id = draw(s, rng); s.continuation = 'finish';
  if (id) {
    const card = cardDef(id); const option = card.options.find(o => o.boost.faction === actor);
    if (usesLatestRules(s) && !option) s.discard.push(id); else dispose(s, id);
    if (!usesLatestRules(s) || option) moveTurnMarker(s, actor, card.cost);
    s.log.push(`${actor} BOT rivela [${card.id}] ${card.name}${option ? ` — opzione ${card.options.indexOf(option) + 1}` : ' — nessuna opzione propria, passa al mazzo BOT'}.`);
    if (option) { changeTrack(s, option.boost); s.queue = [{ kind: 'correlation', change: option.correlation }, { kind: 'globals', changes: option.globals, responsible: actor }]; drain(s, rng); return; }
  }
  const track = weakestTrack(s, actor), card = revealBotCard(s, actor, track);
  if (usesLatestRules(s)) moveTurnMarker(s, actor, 2);
  let p1 = botCondition(s, actor, card.condition);
  let actions = botPlan(s, actor, p1 ? card.priority1 : card.priority2, card.condition);
  if (actions.some(a => a.kind === 'attack') && s.globals['Crisi Bellica'] <= 3) { p1 = false; actions = botPlan(s, actor, card.priority2, card.condition); }
  s.log.push(`${actor}: [${card.id}] ${card.name} — ${p1 ? 'P1' : 'P2'} (${p1 ? card.priority1 : card.priority2})`);
  s.queue = actions.map(action => ({ kind: 'bot', actor, track, action })); drain(s, rng);
}
export function reduce(state: EngineState, actor: Faction, command: Command, rng: RNG = Math.random): EngineState {
  // Copy first: thrown validation and interrupted effects never mutate the caller's JSON state.
  const s: EngineState = structuredClone(state);
  assert(s.version === 3 && s.phase !== 'ended', 'Partita terminata o versione non valida');
  assert(FACTIONS.includes(actor) && actor === currentActor(s), 'Non è il turno di questa fazione');
  if (command.type === 'bot-influence') {
    const p = s.pending;
    assert(usesOfficialRules(s) && s.roundClosure && s.phase === 'bot-influence' && p?.kind === 'bot-influence' && s.players[actor].bot, 'Nessuna Influenza BOT pendente');
    const territory = territoryDef(command.territoryId);
    if (!canInfluence(s, territory.id)) {
      const leftmost = (s.influence ?? []).filter(i => i.territory === territory.id).sort((a, b) => a.slot - b.slot)[0];
      if (leftmost) {
        s.influence = s.influence!.filter(i => i.id !== leftmost.id);
        s.log.push(`${actor} BOT: scalza l’Influenza di ${leftmost.faction} dal riquadro ${leftmost.slot + 1} in ${territory.name}.`);
      } else {
        const card = BOT_CARDS.find(b => b.id === p.cardId); assert(card, 'Carta BOT sconosciuta');
        const next = revealBotCard(s, actor, card.track);
        s.log.push(`${territory.name}: solo unità, non vengono scalzate. Il BOT passa alla carta successiva [${next.id}].`);
        promptBotInfluence(s, actor, next.id); return s;
      }
    }
    placeInfluence(s, actor, territory.id); s.pending = null; s.phase = 'activation'; drain(s, rng); return s;
  }
  if (command.type === 'control-bonus') {
    const p = s.pending;
    assert(usesOfficialRules(s) && s.roundClosure && s.phase === 'control' && p?.kind === 'control', 'Nessun bonus controllo pendente');
    assert(p.choices.includes(command.track), 'Scegli uno dei bonus di questo Stato');
    grantControlBonus(s, actor, p.territoryId, command.track);
    if (!s.result) { s.pending = null; s.phase = 'activation'; drain(s, rng); }
    return s;
  }
  if (command.type === 'advance-bot') {
    if (usesLatestRules(s) && s.players[actor].neutral) {
      assert(s.phase === 'activation', 'Fazione neutrale fuori attivazione');
      moveTurnMarker(s, actor, 2); s.log.push(`${actor}: fazione neutrale, salta l’attivazione.`); finish(s, rng); return s;
    }
    assert(s.players[actor].bot && s.phase === 'activation', 'Il BOT non può avanzare in questa fase'); botActivation(s, actor, rng); return s;
  }
  assert(!s.players[actor].bot, 'Usa advance-bot per la fazione automatica');
  if (command.type === 'veto') {
    const p = s.pending; assert(s.phase === 'veto' && p?.kind === 'veto', 'Nessun veto pendente');
    if (command.use) { assert(canVeto(s, p.change), 'Veto non disponibile'); applyVeto(s, p.change); }
    else { s.log.push(`${actor}: rinuncia al Veto.`); changeTrack(s, p.change); }
    s.pending = null; s.phase = s.continuation === 'ops' ? 'ops' : 'activation'; drain(s, rng); return s;
  }
  if (command.type === 'support') {
    assert(s.phase === 'support' && s.combat && ['attacker', 'defender', 'none'].includes(command.side), 'Sostegno non valido');
    s.log.push(`${actor}: ${command.side === 'none' ? 'nessun sostegno' : `sostiene ${command.side === 'attacker' ? s.combat.attacker : s.combat.defender}`} in ${territoryDef(s.combat.territory).name}.`);
    s.combat.support[actor] = command.side; s.combat.supportIndex++; s.pending = null; promptSupport(s, rng);
    if (!s.pending && !s.result) drain(s, rng);
    return s;
  }
  if (command.type === 'casualties') { assert(s.phase === 'casualty', 'Nessun combattimento pendente'); applyCasualties(s, command.unitIds, rng); return s; }
  if (command.type === 'discard') {
    const p = s.pending; assert(s.phase === 'discard' && p?.kind === 'discard', 'Nessuno scarto pendente');
    assert(command.cardIds.length === p.count && new Set(command.cardIds).size === p.count && command.cardIds.every(id => s.players[actor].hand.includes(id)), 'Scarta il numero esatto di carte');
    s.log.push(`${actor}: scarta ${p.count} ${p.count === 1 ? 'carta' : 'carte'} per il limite di mano ${p.limit}.`);
    command.cardIds.forEach(id => { s.players[actor].hand.splice(s.players[actor].hand.indexOf(id), 1); if (usesLatestRules(s)) s.discard.push(id); else dispose(s, id); });
    s.pending = null; promptDiscard(s, rng); return s;
  }
  if (command.type === 'skip') { assert(s.phase === 'activation' && !s.players[actor].hand.length, 'Puoi saltare solo senza carte'); s.log.push(`${actor}: salta l’attivazione, mano vuota.`); finish(s, rng); return s; }
  if (command.type === 'play-event') {
    assert(s.phase === 'activation', 'Non puoi giocare un evento in questa fase');
    const card = takeCard(s, actor, command.cardId), o = card.options[command.option]; assert(o && Number.isInteger(command.option), 'Opzione non valida');
    moveTurnMarker(s, actor, card.cost);
    s.log.push(`${actor}: gioca [${card.id}] ${card.name} come evento — opzione ${command.option + 1}, a favore di ${o.boost.faction}.`);
    s.continuation = 'finish'; changeTrack(s, o.boost);
    s.queue = [{ kind: 'correlation', change: o.correlation }, { kind: 'globals', changes: o.globals, responsible: actor }, { kind: 'reward', actor, favored: o.boost.faction, unlock: card.unlocksSpecial }];
    drain(s, rng); return s;
  }
  if (command.type === 'begin-ops') {
    assert(s.phase === 'activation', 'Non puoi iniziare OP in questa fase'); const card = takeCard(s, actor, command.cardId);
    moveTurnMarker(s, actor, card.cost);
    s.log.push(`${actor}: gioca [${card.id}] ${card.name} per ${card.cost} OP.`);
    s.ops = { actor, card: card.id, remaining: card.cost, pressured: [] }; s.phase = 'ops'; s.continuation = 'ops'; return s;
  }
  assert(s.phase === 'ops' && s.ops, 'Serve una carta giocata come OP');
  if (command.type === 'finish-ops') { s.log.push(`${actor}: conclude le azioni OP; ${s.ops.remaining} OP non spesi si perdono.`); finish(s, rng); return s; }
  if (command.type === 'develop') {
    assert(s.ops.remaining >= 2, 'Servono 2 OP'); s.ops.remaining -= 2;
    s.log.push(`${actor}: spende 2 OP per Sviluppo; restano ${s.ops.remaining} OP.`);
    development(s, actor, command.track, command.correlation); drain(s, rng);
  } else if (command.type === 'pressure') {
    const { track, delta } = command;
    assert(['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione'].includes(track) && (delta === 1 || delta === -1), 'Pressione non valida');
    assert(!s.ops.pressured.includes(track), 'Massimo un passo per tracciato globale per attivazione');
    assert(track !== 'Nucleare' || (delta === 1 ? actor === 'Iran' : actor === 'Coalizione' || actor === 'Europa'), 'Pressione sul Nucleare non consentita');
    assert(track !== 'Sanzioni' || (delta === 1 ? actor === 'Coalizione' || actor === 'Europa' : actor === 'Iran' || actor === 'Russia' || actor === 'Cina'), 'Pressione sulle Sanzioni non consentita');
    const dip = s.players[actor].tracks.Diplomazia, cost = dip <= 3 ? 3 : dip >= 8 ? 1 : 2;
    assert(s.ops.remaining >= cost, 'OP insufficienti'); s.ops.remaining -= cost; s.ops.pressured.push(track);
    s.log.push(`${actor}: Pressione ${track} ${delta > 0 ? '+' : ''}${delta}, costo ${cost} OP; restano ${s.ops.remaining} OP.`);
    globals(s, [{ track, delta }], actor);
  } else if (command.type === 'deploy') {
    const cost = deployCost(s, actor, command.unitId, command.territoryId); assert(s.ops.remaining >= cost, 'OP insufficienti');
    s.log.push(`${actor}: spende ${cost} OP per Schieramento; restano ${s.ops.remaining - cost} OP.`);
    deployment(s, actor, command.unitId, command.territoryId, command.target, command.diplomacyEffect); if (s.ops) s.ops.remaining -= cost;
  } else if (command.type === 'influence') {
    assert(usesOfficialRules(s), 'Influenza non prevista dal regolamento di questo salvataggio');
    const cost = influenceCost(s, actor, command.territoryId); assert(s.ops.remaining >= cost, 'OP insufficienti');
    placeInfluence(s, actor, command.territoryId); s.ops.remaining -= cost;
    s.log.push(`${actor}: spende ${cost} OP per Influenza; restano ${s.ops.remaining} OP.`);
  } else if (command.type === 'destabilize') {
    assert(usesOfficialRules(s), 'Destabilizzare non previsto dal regolamento di questo salvataggio');
    assert(s.ops.remaining >= 2, 'Servono 2 OP');
    const marker = (s.influence ?? []).find(i => i.id === command.influenceId);
    assert(marker && marker.faction !== actor, 'Scegli un segnalino Influenza avversario');
    assert(usesLatestRules(s) || territoryPresence(s, actor, marker.territory) > 0, 'Destabilizzare richiede presenza nello stesso Stato');
    s.influence = s.influence!.filter(i => i.id !== marker.id); s.ops.remaining -= 2;
    s.log.push(`${actor}: Destabilizzare rimuove Influenza ${marker.faction} da ${territoryDef(marker.territory).name}, costo 2 OP; restano ${s.ops.remaining} OP.`);
  } else if (command.type === 'attack') {
    assert(s.ops.remaining >= 2, 'Servono 2 OP'); s.ops.remaining -= 2;
    s.log.push(`${actor}: spende 2 OP per Attacco; restano ${s.ops.remaining} OP.`);
    beginAttack(s, actor, command.territoryId, rng);
  } else throw new Error('Comando sconosciuto');
  return s;
}

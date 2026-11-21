import { createGame, reduce, currentActor, deployCost, type EngineState, type Command, type RNG } from '../engine';
import { FACTIONS, TRACKS, FACTION_CARDS, EVENTS, INITIAL_TRACKS, CORRELATIONS, UNITS, TERRITORIES, type Faction, type Track, type GlobalTrack, type TrackChange } from '../catalog';

export const STORAGE_KEY = 'linea-rossa.guided-game.v4';
export type Speed = 'lenta' | 'normale' | 'veloce';
export interface Session { version: 1; choices: string[]; cursor: number; speed: Speed }
export interface Choice { id: string; label: string; recommended?: boolean; detail?: string; unavailableReason?: string }
export interface Lesson {
  id: string; number: number; title: string; text: string; why: string;
  actor?: Faction; card?: string; event?: string; mandatory?: boolean;
}
export interface TutorialState {
  game: EngineState; step: number; developed: Track;
  roundTarget?: EngineState; feedback: string; selectedSupport?: string;
}
const stableRng: RNG = () => 0.31;
const combatRng = (): RNG => { let n = 0; return () => n++ === 0 ? 0.99 : 0.2; };
export const changeLabel = (c: TrackChange) => `${c.faction} ${c.track} ${c.delta > 0 ? '+' : ''}${c.delta}`;
const lesson = (id: string, number: number, title: string, text: string, why: string, extra: Partial<Lesson> = {}): Lesson =>
  ({ id, number, title, text, why, ...extra });
export const LESSONS: Lesson[] = [
  lesson('intro', 0, 'Cinque potenze. Una crisi.', 'Cinque potenze, quattro tracciati uguali per tutte. Ogni carta può favorire tre fazioni diverse.', 'Per brevità, questo copione mostra una sola attivazione per fazione a round. La partita vera ne prevede due; il segna-turni avanza con gli OP delle carte Avanza fino alla soglia della modalità scelta.', { card: 'C097' }),
  lesson('event1', 1, 'La crisi si apre', 'Rivela E01 e osserva i segnalini. Europa → Iran → Cina → Coalizione → Russia. Avanza: Cina.', 'All’inizio di ogni round un evento cambia la crisi e decide l’ordine. Gli eventi non attivano correlazioni.', { event: 'E01' }),
  lesson('europe', 2, 'Una carta, tre alleati possibili', 'Scegli un’opzione di Mediazione UE oppure usa i suoi 3 OP. Le tue scelte cambiano davvero il seguito.', 'L’opzione alza un tracciato, applica la correlazione e gli eventuali globali. Diplomazia Forte rende la Pressione economica e abilita il Veto.', { actor: 'Europa', card: 'C097' }),
  lesson('iran-deploy', 3, 'Schiera l’IRGC in Iraq', 'Usa C025 come OP. In questo tutorial questa mossa è obbligatoria per mostrarti il combattimento.', 'Il costo dipende da unità, Crisi Bellica, zona Economia e allineamento. Le unità schierate non si muovono.', { actor: 'Iran', card: 'C025', mandatory: true }),
  lesson('china', 4, 'Il dividendo diplomatico', 'Aiutare un’altra fazione ti dà +1 PV, anche se la correlazione avvantaggia te.', 'Il dividendo premia chi gioca un’opzione a favore di una fazione diversa dalla propria.', { actor: 'Cina', card: 'C075C' }),
  lesson('coalition-deploy', 5, 'Anche la Coalizione entra in Iraq', 'Schiera Convenzionale usando C010. In questo tutorial questa mossa è obbligatoria per mostrarti il combattimento.', 'Un territorio neutrale aggiunge 1 OP al costo; uno nemico ne aggiunge 2.', { actor: 'Coalizione', card: 'C010', mandatory: true }),
  lesson('russia-deploy', 6, 'I Consiglieri militari', 'Usa NR01 per schierare i Consiglieri in Iraq: tre unità accanto allo Stato, nessun riquadro Influenza occupato.', 'Russia, Cina ed Europa non attaccano, ma possono sostenere uno schieramento nel territorio in cui hanno unità.', { actor: 'Russia', card: 'NR01', mandatory: true }),
  lesson('tension1', 7, 'Fine round · 1 / 6 · Tensione', 'Controlla Sanzioni, Nucleare e Opinione: il motore applica le soglie reali.', 'Sanzioni ≥8 riduce l’Economia iraniana; Nucleare ≥12 abbassa la Crisi Bellica; Opinione estrema modifica la Diplomazia.'),
  lesson('bot1', 7, 'Fine round · 2 / 6 · Influenza BOT', 'I BOT piazzano Influenza in base alla carta rivelata. Nel materiale ricevuto mancano le intestazioni che indicano lo Stato di destinazione.', 'Le destinazioni delle carte BOT non si possono ricostruire dal regolamento disponibile; questa simulazione guidata ha cinque fazioni umane e non inventa mosse BOT.'),
  lesson('control1', 7, 'Fine round · 3 / 6 · Controllo', 'Il controllo somma unità e Influenza. Qui Iraq resta in parità e non assegna bonus.', 'I bonus dei territori controllati sono quelli stampati sulla plancia; Iraq richiede la scelta Economia o Militare.'),
  lesson('score1', 7, 'Fine round · 4 / 6 · Punteggio', 'Ogni tracciato Forte vale +1 PV; ogni tracciato in Crisi vale −1 PV.', 'Il punteggio è calcolato dai tracciati che hai costruito: le alternative non vengono annullate. I PV non scendono sotto zero.'),
  lesson('units1', 7, 'Fine round · 5 / 6 · Durata', 'Le tre unità in Iraq ruotano di 90°.', 'Ogni unità resta due round: alla prima fine round si ruota, alla successiva rientra nella riserva.'),
  lesson('refill1', 7, 'Fine round · 6 / 6 · Rifornimento', 'Si pesca in base al Consenso, poi si scarta fino al limite di mano.', 'Consenso in Crisi: 1 carta; Stabile: 2; Forte: 3. Non c’è una pesca extra per la fazione Avanza.'),
  lesson('event2', 8, 'Round 2 · Un canale segreto', 'Rivela E37. Cina → Coalizione → Iran → Russia → Europa. Avanza: Cina.', 'Gli aumenti di Diplomazia dell’evento non applicano correlazioni.', { event: 'E37' }),
  lesson('development', 9, 'Sviluppo · scegli un tracciato', 'C091C vale 2 OP: scegli quale tracciato della Cina sviluppare.', 'Sviluppo costa 2 OP e alza di 1 il tracciato scelto; devi applicare una delle sue due correlazioni.', { actor: 'Cina', card: 'C091C' }),
  lesson('correlation', 9, 'Sviluppo · scegli la correlazione', 'Applica una delle due correlazioni stampate sulla plancia cinese.', 'La correlazione è obbligatoria. La consigliata di Diplomazia aiuta la mediazione europea.', { actor: 'Cina', card: 'C091C' }),
  lesson('declare', 10, 'Combattimento · 1 / 5 · Dichiara', 'La Coalizione spende 2 dei 3 OP di C009 per attaccare in Iraq.', 'Solo Iran e Coalizione attaccano. Ogni attacco abbassa di 1 la Crisi Bellica: se arriva a 1 perde chi ha provocato la guerra; le altre fazioni fanno il punteggio finale.', { actor: 'Coalizione', card: 'C009', mandatory: true }),
  lesson('support', 10, 'Combattimento · 2 / 5 · Sostegno', 'La Russia ha i Consiglieri in Iraq. Quale schieramento sosterrà?', 'Contano solo le unità del territorio attaccato. Il sostegno usa il valore di Attacco o Difesa dell’unità secondo lo schieramento.', { actor: 'Russia' }),
  lesson('special', 10, 'Combattimento · 3 / 5 · Effetti speciali', 'Qui nessun effetto speciale si applica. IRGC è in Iraq, non in Iran.', 'IRGC Cyber Unit riduce la difesa avversaria; S-400 annulla l’Aviazione Tattica; uno Scudo annulla il bonus dei Missili balistici attaccanti.'),
  lesson('dice', 10, 'Combattimento · 4 / 5 · Dadi', 'I dadi didattici sono fissi: Coalizione 6, Iran 2. I totali dipendono dalle tue scelte.', 'Attacco e Difesa sommano unità locali, modificatore Militare e dado. In parità vince il difensore.'),
  lesson('outcome', 10, 'Combattimento · 5 / 5 · Esito', 'Rimuovi la perdita dello schieramento sconfitto. Le unità di sostegno non vengono sacrificate.', 'Lo sconfitto perde 1 Consenso. Il motore calcola perdite ed effetti dalle unità realmente presenti.'),
  lesson('oil', 11, 'Il petrolio e il Veto', 'Scegli una delle tre opzioni di NI04. Se una correlazione è negativa e la Diplomazia del bersaglio è Forte, potrà usare il Veto.', 'Il Veto annulla soltanto la correlazione: costa −1 Diplomazia ed è disponibile una volta per round.', { actor: 'Iran', card: 'NI04' }),
  lesson('russia', 12, 'L’influenza diplomatica russa', 'Scegli un’opzione di Veto ONU Russia. Il titolo della carta non è l’azione di Veto.', 'Anche qui si applicano aumento, correlazione e dividendo diplomatico quando favorisci un’altra fazione.', { actor: 'Russia', card: 'C073R' }),
  lesson('pressure', 13, 'Europa · tre OP sulla crisi', 'Gioca C001 come OP e assegna la Pressione, oppure scegli un’opzione Evento.', 'Diplomazia Forte: 1 OP a passo; Stabile: 2; Crisi: 3. Massimo un passo per ciascun globale. Solo Iran alza Nucleare; Coalizione ed Europa alzano Sanzioni.', { actor: 'Europa', card: 'C001' }),
  lesson('tension2', 14, 'Fine round · 4 / 6 · Controllo', 'Il controllore di ogni territorio riceve il bonus stampato, se previsto.', 'Unità e Influenza concorrono al controllo.'),
  lesson('score2', 14, 'Fine round · 5 / 6 · Punteggio', 'Osserva i PV e le zone Forte e Crisi delle cinque potenze.', 'I bonus e le penalità dei quattro tracciati si sommano per ogni fazione.'),
  lesson('units2', 14, 'Fine round · 6 / 6 · Rifornimento', 'Le unità già ruotate tornano in riserva; il rifornimento dipende dal Consenso.', 'Per riaverle sul tabellone bisogna ricomprarle. Non c’è pescata extra Avanza.'),
  lesson('duration2', 14, 'La partita continua', 'Il segna-turni avanza in base agli OP delle carte giocate dalle fazioni Avanza.', 'Breve termina a 30, Media a 60, Lunga a 80. Si chiude il round che raggiunge o supera la soglia.'),
  lesson('summary', 15, 'Hai attraversato la crisi', 'Questa è la classifica della tua partita guidata, calcolata dalle mosse scelte.', 'Vittoria immediata: Nucleare 15 → Iran; Sanzioni 10 → Coalizione. Crisi Bellica 1: perde chi la provoca, gli altri fanno il punteggio finale; se causata da Evento o Tensione, −5 PV a tutte le fazioni in gara. Il punteggio finale considera Influenza, obiettivi segreti e tracciati al massimo.'),
];

/** Explicit scenario adapter: prescribed cards/events, one activation/faction,
 * fixed dice. Player actions/costs/combat/scoring go through reduce(); the two
 * event reveals use the authoritative event catalog (see startEvent). */
export function initialTutorial(): TutorialState {
  const s = createGame({ bots: [], rulesRevision: '2026-11-21' }, stableRng);
  s.phase = 'activation'; s.round = 1; s.actualRound = 1; s.lap = 1; s.turnIndex = 0;
  s.order = [...EVENTS.find(e => e.id === 'E01')!.order]; s.advancers = []; s.event = null;
  s.eventDeck = ['E01', 'E37', 'E01']; s.units = []; s.nextUnit = 1;
  s.globals = { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 };
  s.queue = []; s.pending = null; s.ops = null; s.combat = null; s.result = null; s.log = [];
  s.deck = FACTION_CARDS.map(c => c.id);
  s.discard = []; s.removed = []; s.roundBlocked = false;
  for (const f of FACTIONS) {
    s.players[f] = { bot: false, tracks: { ...INITIAL_TRACKS[f] }, points: 0, hand: [], objectives: [], vetoUsed: false };
  }
  return { game: s, step: 0, developed: 'Diplomazia', feedback: '' };
}
function command(s: EngineState, c: Command, rng: RNG = stableRng) {
  const actor = currentActor(s); if (!actor) throw new Error('Nessun attore');
  return reduce(s, actor, c, rng);
}
function prepare(s: EngineState, actor: Faction, card: string) {
  s.phase = 'activation'; s.pending = null; s.ops = null; s.queue = []; s.combat = null;
  s.turnIndex = s.order.indexOf(actor); s.lap = 1;
  if (!s.players[actor].hand.includes(card)) {
    s.deck = s.deck.filter(id => id !== card);
    for (const f of FACTIONS) s.players[f].hand = s.players[f].hand.filter(id => id !== card);
    s.players[actor].hand.push(card);
  }
  return s;
}
function finishOps(s: EngineState) { return s.phase === 'ops' ? command(s, { type: 'finish-ops' }) : s; }
function startEvent(s: EngineState, id: string) {
  // startRound is private. This narrow scenario adapter reveals prescribed
  // events separately from endRound; effects come from the live catalog.
  const e = EVENTS.find(x => x.id === id)!;
  for (const c of e.changes) s.players[c.faction].tracks[c.track] = Math.max(1, Math.min(10, s.players[c.faction].tracks[c.track] + c.delta));
  for (const c of e.globals) s.globals[c.track] = Math.max(c.track === 'Opinione' ? -10 : 1, Math.min(c.track === 'Nucleare' ? 15 : 10, s.globals[c.track] + c.delta));
  s.order = [...e.order]; s.advancers = [...e.advancers]; s.event = id; s.turnIndex = 0; s.lap = 1; s.eventDeck = id === 'E01' ? ['E37', 'E01'] : ['E01'];
  s.log.push(`[${id}] ${e.name}: ${e.order.join(' → ')}. Avanza: ${e.advancers.join(', ')}`);
  return s;
}
/** Exercise the actual reducer's second-lap endRound, then undo ONLY the
 * automatic following event so the tutorial can reveal that event separately.
 * These E01/E37 inverses cannot clamp in this bounded two-round scenario. */
function roundTarget(s: EngineState): EngineState {
  const input = structuredClone(s), nextId = s.round === 1 ? 'E37' : 'E01';
  input.phase = 'activation'; input.ops = null; input.pending = null; input.queue = [];
  input.lap = 2; input.turnIndex = input.order.length - 1;
  const lastActor = input.order[input.turnIndex], savedHand = [...input.players[lastActor].hand];
  input.players[lastActor].hand = []; input.eventDeck = [nextId];
  const next = command(input, { type: 'skip' });
  next.players[lastActor].hand.unshift(...savedHand);
  const e = EVENTS.find(x => x.id === nextId)!;
  for (const c of e.changes) next.players[c.faction].tracks[c.track] -= c.delta;
  for (const c of e.globals) next.globals[c.track] -= c.delta;
  next.round = s.round; next.actualRound = s.actualRound; next.event = s.event;
  next.order = [...s.order]; next.advancers = [...s.advancers];
  const eventLog = next.log.findIndex(line => line.startsWith(`Round ${s.round + 1} (`));
  if (eventLog !== -1) next.log = next.log.slice(0, eventLog);
  return next;
}
export function currentLesson(t: TutorialState) { return LESSONS[t.step]; }
export function cardFor(t: TutorialState) { return FACTION_CARDS.find(c => c.id === currentLesson(t).card); }
export function choicesFor(t: TutorialState): Choice[] {
  const s = t.game, l = currentLesson(t);
  if (s.phase === 'veto') return [{ id: 'veto:yes', label: `${currentActor(s)}: usa il Veto`, recommended: true, detail: 'Annulla la correlazione; −1 Diplomazia.' }, { id: 'veto:no', label: 'Accetta la correlazione' }];
  if (l.id === 'summary') return [];
  if (s.phase === 'ops' && !['declare', 'correlation', 'iran-deploy', 'coalition-deploy', 'russia-deploy', 'outcome', 'special', 'dice'].includes(l.id)) {
    const out: Choice[] = [];
    for (const track of ['Sanzioni', 'Opinione', 'Nucleare', 'Crisi Bellica'] as GlobalTrack[]) {
      for (const delta of [1, -1] as const) {
        let candidate: EngineState;
        try { candidate = command(s, { type: 'pressure', track, delta }); } catch { continue; }
        // A teaching constraint, not a game rule: do not let the optional OP
        // branches make the later mandatory printed-card deployment unaffordable.
        const upcoming = [
          { id: 'iran-deploy', actor: 'Iran' as Faction, unit: 'IR-U02', card: 'C025' },
          { id: 'coalition-deploy', actor: 'Coalizione' as Faction, unit: 'CO-U01', card: 'C010' },
          { id: 'russia-deploy', actor: 'Russia' as Faction, unit: 'RU-U01', card: 'NR01' },
        ];
        const blocked = upcoming.find(x => LESSONS.findIndex(next => next.id === x.id) > t.step &&
          deployCost(candidate, x.actor, x.unit, 'iraq') > FACTION_CARDS.find(c => c.id === x.card)!.cost);
        const unavailableReason = blocked ? `Non disponibile in questo copione: renderebbe lo schieramento obbligatorio di ${blocked.actor} più costoso della carta ${blocked.card}. Nella partita vera puoi farlo.` : undefined;
        const rec = (track === 'Sanzioni' && delta === 1) || (track === 'Opinione' && delta === 1) || (track === 'Nucleare' && delta === -1);
        out.push({ id: `pressure:${track}:${delta}`, label: `${track} ${delta > 0 ? '+' : ''}${delta}`,
          detail: `${s.ops!.remaining - candidate.ops!.remaining} OP`, unavailableReason,
          recommended: !unavailableReason && (l.id === 'pressure' ? rec : track === 'Opinione' && delta === 1) });
      }
    }
    out.push({ id: 'finish', label: 'Concludi gli OP', recommended: !out.some(c => c.recommended), detail: `${s.ops?.remaining ?? 0} OP non spesi andranno persi.` });
    return out;
  }
  if (['europe', 'china', 'oil', 'russia', 'pressure'].includes(l.id)) {
    const c = cardFor(t)!;
    const options = c.options.map((o, i) => ({ id: `event:${i}`, label: `${'ABC'[i]}) ${changeLabel(o.boost)}`, detail: `▸ ${changeLabel(o.correlation)}${o.globals.map(g => ` · ${g.track} ${g.delta > 0 ? '+' : ''}${g.delta}`).join('')}${o.boost.faction !== l.actor ? ` · ${l.actor} +1 PV` : ''}`, recommended: l.id !== 'pressure' && i === (l.id === 'china' ? 1 : 0) }));
    if (!['oil', 'russia'].includes(l.id)) options.push({ id: 'ops', label: `Usa come ${c.cost} OP`, detail: 'Scegli la Pressione globale e spendi il budget reale.', recommended: l.id === 'pressure' });
    return options;
  }
  if (l.id === 'development') return TRACKS.map(track => ({ id: `track:${track}`, label: `Sviluppa ${track} +1`, recommended: track === 'Diplomazia' }));
  if (l.id === 'correlation') return CORRELATIONS.Cina[t.developed].map((c, i) => ({ id: `correlation:${i}`, label: changeLabel(c), recommended: i === 1 }));
  if (l.id === 'support') return [{ id: 'support:defender', label: 'Russia: sostieni Iran', recommended: true }, { id: 'support:attacker', label: 'Russia: sostieni Coalizione' }, { id: 'support:none', label: 'Russia: nessun sostegno' }];
  const labels: Record<string, string> = { intro: 'Inizia il round 1', event1: 'Rivela E01', event2: 'Rivela E37', 'iran-deploy': 'Schiera IRGC in Iraq', 'coalition-deploy': 'Schiera Convenzionale in Iraq', 'russia-deploy': 'Schiera Consiglieri in Iraq', declare: 'Dichiara l’attacco · 2 OP', special: 'Verifica gli effetti speciali', dice: 'Tira i dadi didattici', outcome: 'Applica l’esito e la perdita' };
  return [{ id: 'next', label: labels[l.id] ?? 'Applica questa fase', recommended: true }];
}
export function recommendedChoice(t: TutorialState) { const c = choicesFor(t).filter(x => !x.unavailableReason); return c.find(x => x.recommended) ?? c[0]; }
export function applyChoice(previous: TutorialState, id: string): TutorialState {
  if (!choicesFor(previous).some(c => c.id === id && !c.unavailableReason)) throw new Error('Scelta non valida in questo passo');
  const t = structuredClone(previous), l = currentLesson(t);
  let s = t.game;
  t.feedback = choicesFor(previous).find(c => c.id === id)!.label;
  const advance = () => { t.step++; };
  if (id.startsWith('veto:')) {
    s = command(s, { type: 'veto', use: id === 'veto:yes' });
    if (s.phase !== 'veto') { if (s.phase === 'ops') s = finishOps(s); advance(); }
  } else if (id.startsWith('event:')) {
    s = prepare(s, l.actor!, l.card!);
    s = command(s, { type: 'play-event', cardId: l.card!, option: Number(id.split(':')[1]) });
    if (s.phase !== 'veto') advance();
  } else if (id === 'ops') {
    s = prepare(s, l.actor!, l.card!); s = command(s, { type: 'begin-ops', cardId: l.card! });
  } else if (id.startsWith('pressure:')) {
    const [, track, delta] = id.split(':');
    s = command(s, { type: 'pressure', track: track as GlobalTrack, delta: Number(delta) as 1 | -1 });
  } else if (id === 'finish') { s = finishOps(s); advance(); }
  else if (id.startsWith('track:')) {
    t.developed = id.slice(6) as Track; advance();
  } else if (id.startsWith('correlation:')) {
    s = prepare(s, 'Cina', 'C091C'); s = command(s, { type: 'begin-ops', cardId: 'C091C' });
    s = command(s, { type: 'develop', track: t.developed, correlation: Number(id.split(':')[1]) });
    if (s.phase !== 'veto') { s = finishOps(s); advance(); }
  } else if (id.startsWith('support:')) {
    t.selectedSupport = id.split(':')[1];
    s = command(s, { type: 'support', side: t.selectedSupport as 'attacker' | 'defender' | 'none' }, combatRng()); advance();
  } else if (l.id === 'event1' || l.id === 'event2') {
    if (l.id === 'event2') { s.round = 2; s.actualRound = 2; for (const f of FACTIONS) { s.players[f].vetoUsed = false; s.players[f].dividendUsed = false; } }
    s = startEvent(s, l.event!); advance();
  } else if (l.id.endsWith('-deploy')) {
    const unitId = ({ 'iran-deploy': 'IR-U02', 'coalition-deploy': 'CO-U01', 'russia-deploy': 'RU-U01' } as Record<string, string>)[l.id];
    s = prepare(s, l.actor!, l.card!); s = command(s, { type: 'begin-ops', cardId: l.card! });
    s = command(s, { type: 'deploy', unitId, territoryId: 'iraq' }); s = finishOps(s); advance();
  } else if (l.id === 'declare') {
    s = prepare(s, 'Coalizione', 'C009'); s = command(s, { type: 'begin-ops', cardId: 'C009' });
    s = command(s, { type: 'attack', territoryId: 'iraq' }); advance();
  } else if (l.id === 'outcome') {
    if (s.pending?.kind !== 'casualty') throw new Error('Esito non disponibile');
    s = command(s, { type: 'casualties', unitIds: s.pending.unitIds.slice(0, s.pending.count) }); s = finishOps(s); advance();
  } else if (/^(tension|score|units|draw|refill)[12]$/.test(l.id)) {
    if (l.id.startsWith('tension')) t.roundTarget = roundTarget(s);
    const target = t.roundTarget!;
    if (l.id.startsWith('tension')) {
      s.globals = { ...target.globals };
      for (const f of FACTIONS) s.players[f].tracks = { ...target.players[f].tracks };
    } else if (l.id.startsWith('score')) {
      for (const f of FACTIONS) s.players[f].points = target.players[f].points;
    } else if (l.id.startsWith('units')) s.units = structuredClone(target.units);
    else {
      for (const f of FACTIONS) s.players[f].hand = [...target.players[f].hand];
      s.deck = [...target.deck]; s.discard = [...target.discard]; t.roundTarget = undefined;
      s.log = [...target.log];
    }
    advance();
  } else advance();
  t.game = s; return t;
}
export function deploymentPreview(t: TutorialState) {
  const l = currentLesson(t), unitId = ({ 'iran-deploy': 'IR-U02', 'coalition-deploy': 'CO-U01', 'russia-deploy': 'RU-U01' } as Record<string, string>)[l.id];
  if (!unitId || !l.actor) return null;
  const u = UNITS.find(x => x.id === unitId)!, territory = TERRITORIES.find(x => x.id === 'iraq')!;
  const cost = deployCost(t.game, l.actor, unitId, territory.id);
  // Obtain each surcharge by asking the same cost function for a neutral
  // reference state, rather than copying its thresholds/formula into the UI.
  const reference = structuredClone(t.game);
  reference.globals['Crisi Bellica'] = 8;
  reference.players[l.actor].tracks.Economia = 5;
  const alignedReference = deployCost(reference, l.actor, unitId, territory.id);
  const crisisOnly = structuredClone(reference); crisisOnly.globals['Crisi Bellica'] = t.game.globals['Crisi Bellica'];
  const economyOnly = structuredClone(reference); economyOnly.players[l.actor].tracks.Economia = t.game.players[l.actor].tracks.Economia;
  return { unit: u, cost, alignment: ['Amico', 'Neutrale', 'Nemico'][territory.alignment[l.actor]],
    alignmentCost: territory.alignment[l.actor], crisisCost: deployCost(crisisOnly, l.actor, unitId, territory.id) - alignedReference,
    economyCost: deployCost(economyOnly, l.actor, unitId, territory.id) - alignedReference,
    available: FACTION_CARDS.find(c => c.id === l.card)!.cost };
}
export const freshSession = (): Session => ({ version: 1, choices: [], cursor: 0, speed: 'normale' });
export function replaySession(session: Session): TutorialState {
  return session.choices.slice(0, session.cursor).reduce(applyChoice, initialTutorial());
}
export function choose(session: Session, id: string): Session {
  applyChoice(replaySession(session), id);
  const choices = [...session.choices.slice(0, session.cursor), id];
  return { ...session, choices, cursor: choices.length };
}
export function back(session: Session): Session { return { ...session, cursor: Math.max(0, session.cursor - 1) }; }
export function parseSession(raw: string | null): Session {
  if (!raw) return freshSession();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return freshSession();
    const s = value as Session;
    if (s.version !== 1 || !Array.isArray(s.choices) || s.choices.length > 120 || s.choices.some(c => typeof c !== 'string' || c.length > 80) ||
      !Number.isInteger(s.cursor) || s.cursor < 0 || s.cursor > s.choices.length || !['lenta', 'normale', 'veloce'].includes(s.speed)) return freshSession();
    const clean: Session = { version: 1, choices: [...s.choices], cursor: s.cursor, speed: s.speed };
    replaySession({ ...clean, cursor: clean.choices.length }); return clean;
  } catch { return freshSession(); }
}

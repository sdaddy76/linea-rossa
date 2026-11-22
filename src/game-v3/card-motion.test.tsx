import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createGame, reduce, type EngineState } from './engine';
import { FACTION_CARDS, BOT_CARDS, EVENTS } from './catalog';
import { CardMotion } from './CardMotion';
import { confirmedCues, cueDuration, enqueueCues, openingEvent, motionSpeed } from './card-motion';

function fixture() {
  const state = createGame({ bots: [] }, () => 0.3);
  state.order = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
  state.turnIndex = 0;
  state.globals = { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 };
  return state;
}
function withLogs(state: EngineState, lines: string[]): EngineState {
  return { ...state, log: [...state.log, ...lines] };
}
test('confirmed OP card emits one cue, with real budget and no private hand data', () => {
  const state = fixture(), card = FACTION_CARDS.find(c => c.id === state.players.Iran.hand[0])!;
  const original = structuredClone(state);
  const next = reduce(state, 'Iran', { type: 'begin-ops', cardId: card.id });
  const cues = confirmedCues(state, next, 1);
  assert.equal(cues.length, 1);
  assert.equal(cues[0].cardId, card.id);
  assert.equal(cues[0].actor, 'Iran');
  assert.ok(cues[0].detail.includes(`${card.cost} OP`));
  assert.equal(cues[0].destination, card.special ? 'Retirata dal gioco · speciale' : 'Scarti');
  for (const hidden of state.players.Coalizione.hand)
    assert.ok(!JSON.stringify(cues).includes(`"${hidden}"`));
  assert.deepEqual(state, original);
});
test('actual event option emits boost, correlation and global changes in log order', () => {
  const state = fixture();
  const card = FACTION_CARDS.find(c => !c.special && c.options.some(o => o.globals.length > 0))!;
  state.players.Iran.hand = [card.id];
  for (const player of Object.values(state.players)) player.tracks.Diplomazia = 5;
  const option = card.options.findIndex(o => o.globals.length > 0);
  const next = reduce(state, 'Iran', { type: 'play-event', cardId: card.id, option }, () => 0.3);
  const [cue] = confirmedCues(state, next, 2);
  assert.equal(cue.cardId, card.id);
  assert.match(cue.detail, new RegExp(`opzione ${option + 1}`));
  assert.ok(cue.changes.length >= 2);
  assert.equal(cue.changes[0].target, `${card.options[option].boost.faction} · ${card.options[option].boost.track}`);
  assert.ok(cue.changes.some(c => c.target === card.options[option].globals[0].track));
});
test('special card has a removal exit instead of an ordinary discard label', () => {
  const state = fixture(), card = FACTION_CARDS.find(c => c.special)!;
  state.players.Iran.hand = [card.id];
  const next = reduce(state, 'Iran', { type: 'begin-ops', cardId: card.id });
  const cue = confirmedCues(state, next, 3)[0];
  assert.equal(cue.destination, 'Retirata dal gioco · speciale');
  assert.ok(renderToStaticMarkup(<CardMotion cue={cue} reduced={false} onDismiss={() => {}}/>).includes('card-motion-special'));
  assert.ok(next.removed.includes(card.id));
});
test('round event reveal follows any played card and receives only its own changes', () => {
  const state = fixture(), card = FACTION_CARDS[0], event = EVENTS[0];
  const next = withLogs(state, [
    `Iran: gioca [${card.id}] ${card.name} per ${card.cost} OP.`,
    'Iran: Economia 4 → 5',
    `Round 2 (2): [${event.id}] ${event.name}`,
    'Globale: Sanzioni 3 → 4',
  ]);
  const cues = confirmedCues(state, next, 4);
  assert.deepEqual(cues.map(c => c.kind), ['card', 'event']);
  assert.deepEqual(cues[0].changes, [{ target: 'Iran · Economia', before: 4, after: 5 }]);
  assert.deepEqual(cues[1].changes, [{ target: 'Sanzioni', before: 3, after: 4 }]);
});
test('BOT shared-card reveal and fallback priority both have ordered public animations', () => {
  const state = fixture(), card = FACTION_CARDS[0], bot = BOT_CARDS[0];
  const next = withLogs(state, [
    `Iran BOT rivela [${card.id}] ${card.name} — nessuna opzione propria, passa al mazzo BOT.`,
    `${bot.faction}: [${bot.id}] ${bot.name} — P2 (${bot.priority2})`,
    `${bot.faction}: Economia 5 → 6`,
  ]);
  const cues = confirmedCues(state, next, 5);
  assert.deepEqual(cues.map(c => c.kind), ['card', 'bot']);
  assert.equal(cues[1].detail, `P2 · ${bot.priority2}`);
  assert.equal(cues[0].changes.length, 0);
  assert.equal(cues[1].changes.length, 1);
});
test('poll/realtime duplicate, stale snapshot and replaced history do not replay cards', () => {
  const state = fixture(), card = FACTION_CARDS[0];
  const next = withLogs(state, [`Iran: gioca [${card.id}] ${card.name} per 3 OP.`]);
  assert.deepEqual(confirmedCues(next, structuredClone(next), 7), []);
  assert.deepEqual(confirmedCues(next, state, 7), []);
  const rewritten = withLogs(state, ['different history', ...next.log]);
  rewritten.log[0] = 'another game';
  assert.deepEqual(confirmedCues(next, rewritten, 7), []);
  assert.equal(confirmedCues(state, next, 6).length, 1);
});
test('private intelligence/unlock/scarted cards never become a played-card reveal', () => {
  const state = fixture();
  const next = withLogs(state, ['Iran: pesca una carta dalla Riserva speciale.',
    'Iran: scarta 2 carte per il limite di mano 5.', 'Iran: intelligence sulla mano di Coalizione.']);
  next.players.Coalizione.hand = ['PRIVATE-HAND'];
  next.players.Coalizione.objectives = ['PRIVATE-OBJECTIVE'];
  assert.deepEqual(confirmedCues(state, next, 8), []);
});
test('later veto resolution and OP effects animate without pretending to play another card', () => {
  const state = fixture();
  const cues = confirmedCues(state, withLogs(state, [
    'Europa: rinuncia al Veto.', 'Europa: Economia 6 → 5', 'Globale: Opinione -1 → 1',
  ]), 9);
  assert.equal(cues.length, 1);
  assert.equal(cues[0].kind, 'effects');
  assert.equal(cues[0].changes[1].after - cues[0].changes[1].before, 2);
  assert.equal(cues[0].cardId, undefined);
});
test('first load shows only current event, never historical cards', () => {
  const state = fixture(), cues = openingEvent(state);
  assert.equal(cues.length, 1);
  assert.equal(cues[0].cardId, state.event);
  assert.deepEqual(cues[0].changes, []);
  assert.deepEqual(openingEvent({ ...state, event: null }), []);
});
test('visual queue dedupes arrivals, keeps order and never mutates game state', () => {
  const state = fixture(), cue = openingEvent(state)[0], original = structuredClone(state);
  const second = { ...cue, key: 'second' };
  const queue = enqueueCues([cue], [cue, second]);
  assert.deepEqual(queue.map(c => c.key), [cue.key, 'second']);
  assert.deepEqual(state, original);
  assert.equal(cueDuration(cue, false), 10000);
  assert.equal(cueDuration(cue, true), 10000);
});
test('presentation renders original event front/back, skip and reduced-motion state without a blocking dialog', () => {
  const cue = openingEvent(fixture())[0];
  const html = renderToStaticMarkup(<CardMotion cue={cue} reduced={true} onDismiss={() => {}}/>);
  assert.ok(html.includes(`/events/${cue.cardId}.jpg`));
  assert.ok(html.includes('retro_Eventi.jpg'));
  assert.ok(html.includes('Salta questa animazione'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('data-reduced-motion="true"'));
  assert.ok(!html.includes('role="dialog"'));
});
test('played card uses the shared graphical face; presentation CSS allows clicks through and reduced motion', () => {
  const state = fixture(), card = FACTION_CARDS.find(c => c.origin === 'Russia')!;
  const [cue] = confirmedCues(state, withLogs(state, [`Iran: gioca [${card.id}] ${card.name} per ${card.cost} OP.`]), 10);
  const html = renderToStaticMarkup(<CardMotion cue={cue} reduced={false} onDismiss={() => {}}/>);
  assert.ok(html.includes('data-card-source="digital"'));
  assert.ok(html.includes('/card-art/russia_art.png'));
  assert.ok(html.includes(`${card.cost} OP`));
  const css = readFileSync('src/game-v3/card-motion.css', 'utf8');
  assert.ok(css.includes('pointer-events:none'));
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('animation:none!important'));
});
test('slower timings scale with effects without reducing reading time for accessibility', () => {
  const cue=openingEvent(fixture())[0];
  assert.equal(motionSpeed(null),'slow');assert.equal(motionSpeed('invalid'),'slow');
  assert.equal(motionSpeed('fast'),'fast');
  assert.equal(cueDuration(cue,false,'normal'),6500);
  assert.equal(cueDuration(cue,true,'fast'),4000);
  const changes=Array.from({length:30},()=>({target:'Iran · Economia',before:4,after:5}));
  assert.equal(cueDuration({...cue,changes},false,'slow'),16000);
});
test('pause has an owning control and pauses CSS instead of mutating confirmed gameplay', () => {
  const cue=openingEvent(fixture())[0];
  const html=renderToStaticMarkup(<CardMotion cue={cue} reduced={false} paused={true} onPause={()=>{}} onDismiss={()=>{}}/>);
  assert.ok(html.includes('data-paused="true"'));
  assert.ok(html.includes('Riprendi animazione'));
  assert.ok(html.includes('aria-pressed="true"'));
  const css=readFileSync('src/game-v3/card-motion.css','utf8');
  assert.ok(css.includes('animation-play-state:paused'));
});

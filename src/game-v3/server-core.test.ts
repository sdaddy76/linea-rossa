import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS } from './catalog-types';
import { createGame, currentActor, type EngineState } from './engine';
import { applyCommand, applyTimeout, HIDDEN, mergePrivate, privateView, redact, resume, runBots, substitute, turnKey, TURN_LIMIT_MS, type Caller } from './server-core';

function seeded(seed = 7) { let x = seed; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
const iran: Caller = { userId: 'u-iran', faction: 'Iran', member: true, host: true, admin: false };
const europa: Caller = { userId: 'u-eu', faction: 'Europa', member: true, host: false, admin: false };
function start(rng = seeded()) {
  return runBots(createGame({ bots: ['Coalizione', 'Russia', 'Cina'], mode: 'breve', rulesRevision: '2026-11-21', botInfluenceEdition: '2026-11-22' }, rng), rng);
}
/** Gioca la prima carta della mano come OP e chiude subito: mossa sempre valida. */
function playSomething(s: EngineState, caller: Caller, rng: () => number): EngineState {
  const f = currentActor(s)!;
  if (s.phase === 'discard') return applyCommand(s, caller, f, { type: 'discard', cardIds: s.players[f].hand.slice(0, (s.pending as { count: number }).count) }, rng);
  if (s.phase === 'ops') return applyCommand(s, caller, f, { type: 'finish-ops' }, rng);
  if (s.pending?.kind === 'veto') return applyCommand(s, caller, f, { type: 'veto', use: false }, rng);
  if (s.pending?.kind === 'support') return applyCommand(s, caller, f, { type: 'support', side: 'none' }, rng);
  if (s.pending?.kind === 'control') return applyCommand(s, caller, f, { type: 'control-bonus', track: s.pending.choices[0] }, rng);
  if (!s.players[f].hand.length) return applyCommand(s, caller, f, { type: 'skip' }, rng);
  return applyCommand(s, caller, f, { type: 'begin-ops', cardId: s.players[f].hand[0] }, rng);
}

test('i BOT giocano da soli fino al turno di un giocatore', () => {
  const s = start();
  const a = currentActor(s)!;
  assert.ok(a === 'Iran' || a === 'Europa', a);
});

test('la copia pubblica nasconde mani, obiettivi, mazzi e Rete informativa', () => {
  const s = start();
  const pub = redact(s);
  for (const f of FACTIONS) {
    assert.equal(pub.players[f].hand.length, s.players[f].hand.length);
    assert.ok(pub.players[f].hand.every(c => c === HIDDEN));
    assert.ok(pub.players[f].objectives.every(c => c === HIDDEN));
    assert.deepEqual(pub.intel[f], []);
  }
  assert.ok(pub.deck.every(c => c === HIDDEN) && pub.eventDeck.every(c => c === HIDDEN));
  assert.ok(!JSON.stringify(pub).includes(s.players.Iran.hand[0] + '"'), 'nessun id di carta in mano nella copia pubblica');
  const merged = mergePrivate(pub, 'Iran', privateView(s, 'Iran'));
  assert.deepEqual(merged.players.Iran.hand, s.players.Iran.hand);
  assert.ok(merged.players.Europa.hand.every(c => c === HIDDEN));
});

test('solo il giocatore di turno può muovere, e mai al posto dei BOT', () => {
  const rng = seeded(3); const s = start(rng);
  const a = currentActor(s)!;
  const other = a === 'Iran' ? europa : iran;
  assert.throws(() => applyCommand(s, other, a, { type: 'begin-ops', cardId: s.players[a].hand[0] }, rng), /solo la tua fazione/);
  assert.throws(() => applyCommand(s, { ...iran, member: false }, a, { type: 'skip' }, rng), /Non partecipi/);
  assert.throws(() => applyCommand(s, iran, a, { type: 'advance-bot' }, rng), /server/);
});

test('una partita con due giocatori arriva alla fine senza blocchi', () => {
  const rng = seeded(11); let s = start(rng);
  for (let i = 0; i < 3000 && s.phase !== 'ended'; i++) {
    const a = currentActor(s)!;
    s = playSomething(s, a === 'Iran' ? iran : europa, rng);
  }
  assert.equal(s.phase, 'ended');
  assert.deepEqual(redact(s), s, 'a fine partita tutto torna visibile');
});

test('dopo 24 ore un BOT gioca al posto dell’assente, che poi può riprendere il posto', () => {
  const rng = seeded(5); let s = start(rng);
  const a = currentActor(s)!;
  assert.equal(applyTimeout(s, 0, TURN_LIMIT_MS - 1, rng), null);
  const after = applyTimeout(s, 0, TURN_LIMIT_MS + 1, rng)!;
  assert.ok(after.players[a].standIn && after.players[a].bot);
  assert.notEqual(turnKey(after), turnKey(s));
  assert.ok(after.log.some(l => l.includes('Tempo scaduto')));
  // Il posto continua a pescare: la mano resta del giocatore.
  s = after;
  for (let i = 0; i < 400 && s.phase !== 'ended' && s.actualRound < 3; i++) {
    const x = currentActor(s)!;
    s = playSomething(s, x === 'Iran' ? iran : europa, rng);
  }
  const caller = a === 'Iran' ? iran : europa;
  const back = resume(s, caller);
  assert.equal(back.players[a].bot, false);
  assert.equal(back.players[a].standIn, false);
  assert.throws(() => resume(back, caller), /non è in sostituzione/);
});

test('solo chi ha creato la partita o l’amministratore può sostituire un giocatore', () => {
  const rng = seeded(9); const s = start(rng);
  assert.throws(() => substitute(s, europa, 'Iran', rng), /creato la partita/);
  const sub = substitute(s, iran, 'Europa', rng);
  assert.ok(sub.players.Europa.standIn);
  assert.throws(() => substitute(sub, iran, 'Europa', rng), /già automatico/);
});

test('il BOT sostituto risolve scarti, operazioni e scelte rimaste in sospeso', () => {
  const rng = seeded(21); let s = start(rng);
  const a = currentActor(s)!;
  const caller = a === 'Iran' ? iran : europa;
  s = applyCommand(s, caller, a, { type: 'begin-ops', cardId: s.players[a].hand[0] }, rng);
  assert.equal(s.phase, 'ops');
  const after = applyTimeout(s, 0, TURN_LIMIT_MS * 2, rng)!;
  assert.ok(after.log.some(l => l.includes('Operazioni lasciate in sospeso')));
  assert.notEqual(currentActor(after), a);
});

test('BOT Iran: la Flotta schierata nello Stretto arriva a 2 e attiva il Blocco di Hormuz (regola BOT 2026-11-28)', () => {
  // Seme fisso: partita di soli BOT in cui la carta BOT-IR-M2 viene giocata.
  let x = 1020; const rng = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const s = runBots(createGame({ bots: [...FACTIONS], mode: 'media', rulesRevision: '2026-11-21', botInfluenceEdition: '2026-11-22' }, rng), rng, 100000);
  const i = s.log.findIndex(l => l.includes('Blocco di Hormuz attivato'));
  assert.ok(i > 0);
  assert.ok(s.log.slice(Math.max(0, i - 4), i).filter(l => l.includes('schiera Flotta veloce del Golfo in Stretto di Hormuz')).length >= 1);
});
test('equilibrio 2026-11-28: correlazioni verso la Russia e INIZIO della Coalizione', async () => {
  const { CORRELATIONS, INITIAL_TRACKS } = await import('./catalog');
  assert.deepEqual(CORRELATIONS.Iran.Diplomazia.map(c => `${c.faction} ${c.track} ${c.delta}`), ['Russia Diplomazia 1', 'Russia Consenso -1']);
  assert.deepEqual(CORRELATIONS.Cina.Diplomazia.map(c => `${c.faction} ${c.track} ${c.delta}`), ['Russia Diplomazia -1', 'Europa Diplomazia 1']);
  assert.deepEqual(INITIAL_TRACKS.Coalizione, { Economia: 4, Militare: 7, Diplomazia: 4, Consenso: 5 });
});

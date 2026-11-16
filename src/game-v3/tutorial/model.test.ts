/** Bundle with esbuild --platform=node --format=cjs, then node --test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS, TRACKS } from '../catalog';
import { applyChoice, back, choose, choicesFor, currentLesson, deploymentPreview, freshSession, initialTutorial, parseSession, recommendedChoice, replaySession, STORAGE_KEY, type Session } from './model';

function play(overrides: Record<string, string> = {}) {
  let t = initialTutorial(), turns = 0;
  while (currentLesson(t).id !== 'summary') {
    assert.ok(++turns < 100, 'bounded tutorial');
    const key = `${currentLesson(t).id}${t.game.phase === 'veto' ? ':veto' : t.game.phase === 'ops' ? ':ops' : ''}`;
    const choice = overrides[key] ?? recommendedChoice(t)?.id;
    assert.ok(choice, key);
    t = applyChoice(t, choice);
  }
  return t;
}
function until(id: string) {
  let t = initialTutorial(), count = 0;
  while (currentLesson(t).id !== id) {
    assert.ok(++count < 100);
    t = applyChoice(t, recommendedChoice(t)!.id);
  }
  return t;
}
test('all recommended choices match authoritative final fixture, computed by real engine', () => {
  const t = play(), expected = {
    Iran: [8, 7, 5, 3, 0], Coalizione: [5, 7, 4, 4, 0],
    Russia: [6, 6, 6, 4, 0], Cina: [8, 4, 5, 4, 3], Europa: [6, 4, 8, 4, 2],
  };
  for (const f of FACTIONS) assert.deepEqual([...TRACKS.map(track => t.game.players[f].tracks[track]), t.game.players[f].points], expected[f], f);
  assert.deepEqual(t.game.globals, { Nucleare: 5, Sanzioni: 6, 'Crisi Bellica': 7, Opinione: 2 });
  assert.equal(t.game.units.length, 0);
});
test('tutorial uses revised rules, exposes a 60-space marker and documents the two end-round gaps', () => {
  let t = initialTutorial();
  assert.equal(t.game.rulesRevision, '2026-11-16');
  assert.equal(t.game.mode, 'media');
  assert.equal(t.game.turnMarker, 0);
  assert.match(currentLesson(t).why, /segna-turni/i);
  while (currentLesson(t).id !== 'bot1') t = applyChoice(t, recommendedChoice(t)!.id);
  t = applyChoice(t, recommendedChoice(t)!.id);
  assert.ok(currentLesson(t).id === 'control1' || currentLesson(t).id === 'event2');
  assert.equal(STORAGE_KEY, 'linea-rossa.guided-game.v2');
});
test('alternative event propagates boosts, correlation, dividend and later zones', () => {
  const standard = play(), alternative = play({ china: 'event:2' });
  assert.equal(alternative.game.players.Coalizione.tracks.Economia, 7);
  assert.equal(alternative.game.players.Iran.tracks.Economia, 5);
  assert.equal(alternative.game.players.Cina.tracks.Economia, 7);
  assert.equal(alternative.game.players.Cina.points, 1);
  assert.notDeepEqual(alternative.game.players, standard.game.players);
});
test('all three Russian support choices are real and use fixed 6/2 dice', () => {
  const t = until('support');
  const defender = applyChoice(t, 'support:defender'), attacker = applyChoice(t, 'support:attacker'), none = applyChoice(t, 'support:none');
  assert.deepEqual(defender.game.combat?.dice, [6, 2]);
  assert.equal(defender.game.combat?.attack, 6); assert.equal(defender.game.combat?.defense, 5);
  assert.equal(attacker.game.combat?.attack, 7); assert.equal(attacker.game.combat?.defense, 4);
  assert.equal(none.game.combat?.defense, 4);
  assert.equal(play({ support: 'support:none' }).game.players.Iran.tracks.Consenso, 3);
});
test('veto spends Diplomacy; declining changes the actual Economy', () => {
  const yes = play(), no = play({ 'oil:veto': 'veto:no' });
  assert.equal(yes.game.players.Europa.tracks.Economia, 6);
  assert.equal(yes.game.players.Europa.tracks.Diplomazia, 8);
  assert.equal(no.game.players.Europa.tracks.Economia, 5);
  assert.equal(no.game.players.Europa.tracks.Diplomazia, 9);
});
test('without strong Diplomacy no veto is fabricated and pressure uses affordable budget', () => {
  const t = play({ europe: 'event:1' });
  assert.equal(t.game.players.Europa.tracks.Diplomazia, 7);
  assert.equal(t.game.players.Europa.tracks.Economia, 5);
  assert.equal(t.game.globals.Sanzioni, 6);
  assert.equal(t.game.globals.Nucleare, 6, '2 OP cost leaves only one global pressure');
});
test('development alternatives apply authoritative correlations and track caps', () => {
  const t = play({ development: 'track:Economia', correlation: 'correlation:0' });
  assert.equal(t.game.players.Cina.tracks.Economia, 9);
  assert.equal(t.game.players.Iran.tracks.Economia, 9);
  for (const f of FACTIONS) for (const track of TRACKS) assert.ok(t.game.players[f].tracks[track] >= 1 && t.game.players[f].tracks[track] <= 10);
});
test('mandatory deployments use catalog IDs, real costs, capacity and two-round expiry', () => {
  const t = until('iran-deploy'), preview = deploymentPreview(t)!;
  assert.equal(preview.unit.id, 'IR-U02'); assert.equal(preview.cost, 4);
  const secondRound = until('event2');
  assert.equal(secondRound.game.units.length, 3);
  assert.ok(secondRound.game.units.every(u => u.rotated));
  assert.equal(play().game.units.length, 0);
});
test('pressure offers only legal actions, cannot repeat a global, no extra clicks grant free effects', () => {
  let t = applyChoice(until('pressure'), 'ops');
  t = applyChoice(t, 'pressure:Sanzioni:1');
  assert.ok(!choicesFor(t).some(c => c.id.startsWith('pressure:Sanzioni:')));
  assert.ok(!choicesFor(t).some(c => c.id === 'pressure:Nucleare:1'));
  assert.throws(() => applyChoice(t, 'pressure:Sanzioni:1'));
});
test('tutorial explicitly blocks only the pressure branch that breaks a later mandatory printed budget', () => {
  let t = until('europe');
  t = applyChoice(t, 'ops');
  t = applyChoice(t, 'pressure:Crisi Bellica:-1'); t = applyChoice(t, 'finish');
  t = applyChoice(t, 'next'); // Iran mandatory deployment
  t = applyChoice(t, 'ops'); // China chooses optional pressure
  const blocked = choicesFor(t).find(c => c.id === 'pressure:Crisi Bellica:-1')!;
  assert.ok(blocked.unavailableReason?.includes('Nella partita vera'));
  assert.throws(() => applyChoice(t, blocked.id));
  t = applyChoice(t, 'pressure:Opinione:1');
  t = applyChoice(t, 'finish');
  assert.equal(deploymentPreview(t)?.cost, 3);
});
test('back restores exact prior snapshot, branch truncates future and resume is deterministic', () => {
  let s: Session = freshSession();
  for (let i = 0; i < 5; i++) s = choose(s, recommendedChoice(replaySession(s))!.id);
  const before = replaySession(s), moved = choose(s, recommendedChoice(before)!.id);
  assert.deepEqual(replaySession(back(moved)), before);
  assert.deepEqual(replaySession(parseSession(JSON.stringify(moved))), replaySession(moved));
  const branch = choose(back(moved), choicesFor(before).find(c => !c.recommended)?.id ?? recommendedChoice(before)!.id);
  assert.equal(branch.cursor, moved.cursor); assert.equal(branch.choices.length, branch.cursor);
});
test('corrupt, unknown, overlong, impossible, wrong-version persisted data fail closed', () => {
  for (const raw of ['{', 'null', '[]', '{"version":2}', JSON.stringify({ version: 1, choices: ['event:2'], cursor: 1, speed: 'normale' }), JSON.stringify({ version: 1, choices: [], cursor: -1, speed: 'normale' }), JSON.stringify({ version: 1, choices: Array(121).fill('next'), cursor: 1, speed: 'normale' }), JSON.stringify({ version: 1, choices: [], cursor: 0, speed: 'unsafe' })])
    assert.deepEqual(parseSession(raw), freshSession());
});
test('all non-OP event alternatives and all development branches reach a valid summary', () => {
  for (const id of ['europe', 'china', 'oil', 'russia', 'pressure']) for (let option = 0; option < 3; option++) {
    const t = play({ [id]: `event:${option}` });
    assert.equal(currentLesson(t).id, 'summary', `${id}/${option}`);
  }
  for (const track of TRACKS) for (let correlation = 0; correlation < 2; correlation++)
    assert.equal(currentLesson(play({ development: `track:${track}`, correlation: `correlation:${correlation}` })).id, 'summary');
});

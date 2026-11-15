import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTabletop, commitCommand, readTabletop } from './online';
import { database } from './test-client';
import { currentActor } from './engine';
import { FACTION_CARDS } from './catalog';

beforeEach(() => {
  database.game = { created_by: 'host', status: 'lobby' };
  database.members = [{ faction: 'Iran', player_id: 'host', is_bot: false }];
  database.state = null; database.calls = []; database.failState = false;
});
test('start persists a complete game before activating it, with four official BOTs', async () => {
  await initializeTabletop('game', 'host');
  const saved = readTabletop(database.state)!;
  assert.equal(saved.state.players.Iran.hand.length, 5);
  assert.equal(saved.state.players.Iran.objectives.length, 3);
  assert.equal(Object.values(saved.state.players).filter(p => p.bot).length, 4);
  const stateWrite = database.calls.findIndex(c => c.table === 'game_state' && c.operation === 'insert');
  const activate = database.calls.findIndex(c => c.table === 'games' && c.operation === 'update');
  assert.ok(activate > stateWrite);
  assert.equal(database.game.status, 'active');
});
test('a persistence failure is surfaced and never marks the game active', async () => {
  database.failState = true;
  await assert.rejects(initializeTabletop('game', 'host'), /Salvataggio negato/);
  assert.equal(database.game.status, 'lobby');
});
test('only the host can initialize, and active games cannot be redealt', async () => {
  await assert.rejects(initializeTabletop('game', 'other'), /creatore/);
  await initializeTabletop('game', 'host');
  const original = JSON.stringify(database.state);
  await assert.rejects(initializeTabletop('game', 'host'), /già stata avviata/);
  assert.equal(JSON.stringify(database.state), original);
});
test('a failed final activation can resume the already persisted deal', async () => {
  await initializeTabletop('game', 'host');
  const original = JSON.stringify(readTabletop(database.state));
  database.game.status = 'lobby';
  await initializeTabletop('game', 'host');
  assert.equal(JSON.stringify(readTabletop(database.state)), original);
});
test('revision comparison permits exactly one command from two stale clients', async () => {
  await initializeTabletop('game', 'host');
  const saved = readTabletop(database.state)!;
  saved.state.order = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa']; saved.state.turnIndex = 0;
  const card = FACTION_CARDS[0]; saved.state.players.Iran.hand = [card.id];
  database.state!.special_uses = { tabletop_v3: saved, unrelated: 'preserve' };
  const actor = currentActor(saved.state)!;
  const next = await commitCommand('game', saved, actor, { type: 'begin-ops', cardId: card.id });
  assert.equal(next.revision, 1);
  await assert.rejects(commitCommand('game', saved, actor, { type: 'begin-ops', cardId: card.id }), /altro giocatore/);
  assert.equal(readTabletop(database.state)!.revision, 1);
  assert.equal((database.state!.special_uses as { unrelated: string }).unrelated, 'preserve');
  const write = database.calls.find(c => c.table === 'game_state' && c.filters.some(([k]) => k.includes('revision')))!;
  assert.ok(write.filters.some(([k, value]) => k === 'game_id' && value === 'game'));
});
test('unknown and legacy JSON cannot be mistaken for the new edition', () => {
  assert.equal(readTabletop(null), null);
  assert.equal(readTabletop({ special_uses: { veto_russia: 3 } }), null);
  assert.equal(readTabletop({ special_uses: { tabletop_v3: { revision: 0, state: { version: 2 } } } }), null);
});

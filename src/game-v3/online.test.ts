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
  assert.equal(saved.state.rulesRevision, '2026-11-21');
  assert.equal(database.game.game_length, 'media');
  assert.equal(database.game.track_limit, 60);
});
test('host-selected tabletop duration persists the matching turn marker threshold', async () => {
  await initializeTabletop('game', 'host', 'breve');
  assert.equal(readTabletop(database.state)!.state.mode, 'breve');
  assert.equal(database.game.max_turns, 30);
  assert.equal(database.game.game_length, 'breve');
  assert.equal(database.game.track_limit, 30);
});
test('host may select passive neutrals only in seats without human players', async () => {
  await initializeTabletop('game','host','media',['Cina','Europa']);
  const s=readTabletop(database.state)!.state;
  assert.equal(s.players.Cina.neutral,true);assert.equal(s.players.Cina.bot,false);
  assert.equal(s.players.Russia.bot,true);
  database.game.status='lobby';
  await assert.rejects(initializeTabletop('game','host','media',['Iran']),/senza giocatore/);
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
test('maintenance persists the same unit and OP debit; a stale second click never charges twice', async () => {
  await initializeTabletop('game', 'host');
  const saved = readTabletop(database.state)!;
  saved.state.order = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa']; saved.state.turnIndex = 0;
  saved.state.phase = 'ops';
  saved.state.ops = { actor: 'Iran', card: 'C027', remaining: 2, pressured: [] };
  saved.state.units = [{ id: 'expiring', faction: 'Iran', type: 'IR-U01', territory: 'iran', placedRound: 1, rotated: true }];
  database.state!.special_uses = { tabletop_v3: saved, unrelated: 'preserve' };
  const next = await commitCommand('game', saved, 'Iran', { type: 'maintain', unitId: 'expiring' });
  assert.equal(next.revision, saved.revision + 1);
  assert.equal(next.state.ops!.remaining, 1); assert.equal(next.state.units[0].rotated, false);
  assert.deepEqual(next.state.units[0], { ...saved.state.units[0], rotated: false });
  assert.equal(next.state.rulesRevision, saved.state.rulesRevision);
  await assert.rejects(commitCommand('game', saved, 'Iran', { type: 'maintain', unitId: 'expiring' }), /altro giocatore/);
  const persisted = readTabletop(JSON.parse(JSON.stringify(database.state)))!;
  assert.deepEqual(persisted, next);
  assert.equal((database.state!.special_uses as { unrelated: string }).unrelated, 'preserve');
});
test('BOT maintenance and its normal action persist together; stale retries cannot renew another unit', async () => {
  await initializeTabletop('game', 'host');
  const saved = readTabletop(database.state)!;
  saved.state.order = ['Russia', 'Iran', 'Coalizione', 'Cina', 'Europa']; saved.state.turnIndex = 0;
  saved.state.deck = [FACTION_CARDS.find(c => c.options.some(o => o.boost.faction === 'Russia'))!.id];
  saved.state.units = [
    { id: 'bot-a', faction: 'Russia', type: 'RU-U04', territory: 'siria', placedRound: 1, rotated: true },
    { id: 'bot-b', faction: 'Russia', type: 'RU-U04', territory: 'libano', placedRound: 1, rotated: true },
  ];
  database.state!.special_uses = { tabletop_v3: saved, unrelated: 'preserve' };
  const next = await commitCommand('game', saved, 'Russia', { type: 'advance-bot' });
  assert.equal(next.revision, saved.revision + 1);
  assert.equal(next.state.units[0].rotated, false); assert.equal(next.state.units[1].rotated, true);
  assert.equal(next.state.log.filter(l => l.includes('Mantenimento gratuito')).length, 1);
  await assert.rejects(commitCommand('game', saved, 'Russia', { type: 'advance-bot' }), /altro giocatore/);
  assert.deepEqual(readTabletop(JSON.parse(JSON.stringify(database.state))), next);
  assert.equal((database.state!.special_uses as { unrelated: string }).unrelated, 'preserve');
});

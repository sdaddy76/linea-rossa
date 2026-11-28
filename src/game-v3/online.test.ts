import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTabletop, commitCommand, readTabletop, syncTabletop, toSaved } from './online';
import { database, server } from './test-client';
import { currentActor } from './engine';
import { HIDDEN } from './server-core';

beforeEach(() => {
  database.game = { created_by: 'host', status: 'lobby' };
  database.members = [{ faction: 'Iran', player_id: 'host', is_bot: false }];
  database.state = null; database.calls = [];
  server.row = null; server.user = 'host'; server.faction = 'Iran'; server.calls = []; server.fail = '';
});
test('l’avvio passa dal server: il browser non scrive lo stato della partita', async () => {
  const view = await initializeTabletop('game', 'host');
  assert.equal(server.calls[0].action, 'start');
  assert.ok(!database.calls.some(c => c.table === 'game_state' && c.operation !== 'select'));
  assert.equal(view.mine!.hand.length, 5);
  assert.equal(view.mine!.objectives.length, 3);
  assert.equal(Object.values(view.state.players).filter(p => p.bot).length, 4);
  assert.equal(database.game.status, 'active');
  assert.equal(database.game.track_limit, 60);
});
test('la durata scelta dall’host arriva al server', async () => {
  await initializeTabletop('game', 'host', 'breve');
  assert.equal(server.row!.state.mode, 'breve');
  assert.equal(database.game.track_limit, 30);
});
test('neutrali solo nei posti vuoti, e solo l’host avvia', async () => {
  await assert.rejects(initializeTabletop('game', 'host', 'media', ['Iran']), /senza giocatore/);
  server.user = 'other';
  await assert.rejects(initializeTabletop('game', 'other'), /creatore/);
});
test('il browser vede la propria mano e solo segnaposto per le altre', async () => {
  database.members.push({ faction: 'Europa', player_id: 'eu', is_bot: false });
  await initializeTabletop('game', 'host');
  const mine = await syncTabletop('game', 'Iran');
  assert.ok(mine.state.players.Iran.hand.every(c => c !== HIDDEN));
  assert.ok(mine.state.players.Europa.hand.every(c => c === HIDDEN));
  assert.ok(mine.state.players.Europa.objectives.every(c => c === HIDDEN));
});
test('una mossa con revisione superata è rifiutata con un messaggio chiaro', async () => {
  const start = toSaved(await initializeTabletop('game', 'host'), 'Iran');
  const actor = currentActor(start.state)!;
  const card = start.state.players.Iran.hand[0];
  const next = await commitCommand('game', start, actor, { type: 'begin-ops', cardId: card });
  assert.equal(next.revision, start.revision + 1);
  assert.equal(next.state.phase, 'ops');
  await assert.rejects(commitCommand('game', start, actor, { type: 'begin-ops', cardId: card }), /altro giocatore/);
});
test('il server rifiuta le mosse per conto di altre fazioni', async () => {
  database.members.push({ faction: 'Europa', player_id: 'eu', is_bot: false });
  const start = toSaved(await initializeTabletop('game', 'host'), 'Iran');
  const actor = currentActor(start.state)!;
  const other = actor === 'Iran' ? { user: 'eu', faction: 'Europa' as const } : { user: 'host', faction: 'Iran' as const };
  server.user = other.user; server.faction = other.faction;
  await assert.rejects(commitCommand('game', start, actor, { type: 'skip' }, other.faction), /solo la tua fazione/);
});
test('JSON sconosciuto o di edizioni precedenti non viene scambiato per la nuova edizione', () => {
  assert.equal(readTabletop(null), null);
  assert.equal(readTabletop({ special_uses: { veto_russia: 3 } }), null);
  assert.equal(readTabletop({ special_uses: { tabletop_v3: { revision: 0, state: { version: 2 } } } }), null);
});

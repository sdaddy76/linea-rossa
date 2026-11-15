import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import TabletopGamePage from './TabletopGamePage';
import { uiFixture } from './test-ui-store';
import { createGame } from './engine';
import { FACTIONS, FACTION_CARDS, EVENTS, BOT_CARDS, TERRITORIES, UNITS } from './catalog';
import { eventFrontArt, botFrontArt, botBackArt, factionBoardArt, unitFrontArt, unitBackArt, BOARD_ART, EVENT_BACK, RULEBOOK_URL, UNIT_REFERENCE_URL, PLAYER_BOARDS_URL } from './art';

const render = () => renderToStaticMarkup(<TabletopGamePage onBack={() => {}} />);
beforeEach(() => {
  uiFixture.state = createGame({ bots: [] }, () => 0.3);
  uiFixture.state.order = [...FACTIONS]; uiFixture.state.turnIndex = 0;
  uiFixture.own = 'Iran'; uiFixture.member = true;
});
test('new game renders all sixteen selectable territories and every printed slot', () => {
  const html = render();
  for (const t of TERRITORIES) assert.ok(html.includes(`${t.name}, riquadro 1`), t.id);
  assert.equal((html.match(/riquadro \d+: libero/g) ?? []).length, TERRITORIES.reduce((n, t) => n + t.capacity, 0));
  assert.ok(html.includes('Round 1/6')); assert.ok(html.includes(BOARD_ART));
});
test('only the current player hand/objectives are rendered, spectators have neither', () => {
  const state = uiFixture.state;
  state.players.Iran.hand = FACTION_CARDS.slice(0, 3).map(c => c.id);
  state.players.Coalizione.hand = FACTION_CARDS.slice(20, 23).map(c => c.id);
  const html = render();
  for (const id of state.players.Iran.hand) assert.ok(html.includes(id));
  for (const id of state.players.Coalizione.hand) assert.ok(!html.includes(id));
  uiFixture.own = null; uiFixture.member = false;
  const spectator = render();
  assert.ok(!spectator.includes('I tuoi obiettivi segreti'));
  assert.ok(!spectator.includes('La tua mano'));
});
test('OP controls expose remaining budget, targets, deployment costs and explicit activation end', () => {
  const s = uiFixture.state;
  s.phase = 'ops'; s.ops = { actor: 'Iran', remaining: 4, card: s.players.Iran.hand[0], pressured: [] };
  const html = render();
  for (const label of ['4 OP disponibili', 'Sviluppo', 'Pressione', 'Schieramento', 'Termina attivazione', 'Missili balistici']) assert.ok(html.includes(label), label);
});
test('pending veto, casualty, support and discard decisions have an owning UI', () => {
  const s = uiFixture.state;
  s.phase = 'veto'; s.pending = { kind: 'veto', actor: 'Iran', change: { faction: 'Iran', track: 'Economia', delta: -1 } };
  assert.ok(render().includes('Usa il veto'));
  s.phase = 'support'; s.pending = { kind: 'support', actor: 'Iran' };
  assert.ok(render().includes('Non intervenire'));
  s.phase = 'casualty'; s.pending = { kind: 'casualty', actor: 'Iran', count: 1, unitIds: ['u1'] };
  s.units = [{ id: 'u1', type: 'IR-U01', faction: 'Iran', territory: 'iran', placedRound: 1, rotated: false }];
  assert.ok(render().includes('Conferma perdite'));
  s.phase = 'discard'; s.pending = { kind: 'discard', actor: 'Iran', count: 2, limit: 5 };
  assert.ok(render().includes('Conferma scarto'));
  uiFixture.own = 'Coalizione';
  assert.ok(!render().includes('Conferma scarto'));
});
test('all official gameplay fronts/backs and PDFs resolve to real local deploy assets', () => {
  const paths = [BOARD_ART, EVENT_BACK, RULEBOOK_URL, UNIT_REFERENCE_URL, PLAYER_BOARDS_URL,
    ...FACTIONS.flatMap(f => [factionBoardArt(f), unitBackArt(f)]),
    ...UNITS.map(u => unitFrontArt(u.id)), ...EVENTS.map(e => eventFrontArt(e.id)),
    ...BOT_CARDS.flatMap(c => [botFrontArt(c.id), botBackArt(c.faction, c.track)])];
  for (const path of new Set(paths)) assert.ok(existsSync(`public${path}`), path);
});
test('release binds the latest rulebook, unit reference and all five unchanged original JPEGs', () => {
  const release = JSON.parse(readFileSync('public/assets/tabletop-v3/release.json', 'utf8'));
  assert.equal(release.release, 'tabletop-2026-11-15-guidata');
  assert.equal(Object.keys(release.assets).length, 7);
  for (const [url, expected] of Object.entries(release.assets)) {
    const actual = createHash('sha256').update(readFileSync(`public${url}`)).digest('hex');
    assert.equal(actual, expected, url);
  }
});

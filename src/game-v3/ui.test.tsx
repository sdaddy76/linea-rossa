import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import TabletopGamePage from './TabletopGamePage';
import { uiFixture } from './test-ui-store';
import { createGame, reduce } from './engine';
import { TabletopBoard } from './Boards';
import { PlayerAid } from './PlayerAid';
import { Materials } from './Materials';
import { TERRITORY_LAYOUT, territorySlot } from './board-layout';
import { FACTIONS, FACTION_CARDS, EVENTS, BOT_CARDS, TERRITORIES, UNITS } from './catalog';
import { eventFrontArt, botFrontArt, botBackArt, factionBoardArt, unitFrontArt, unitBackArt, BOARD_ART, EVENT_BACK, RULEBOOK_URL, UNIT_REFERENCE_URL, PLAYER_BOARDS_URL, PLAYER_AID_URL, PLAYER_AID_WHITE_URL } from './art';

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
  assert.ok(html.includes('media')); assert.ok(html.includes('segna-turni 0/60')); assert.ok(html.includes(BOARD_ART));
  assert.ok(html.includes('Riduci animazioni'));
  assert.ok(html.includes('card-motion-layer'));
});
test('each territory has individually anchored square slots within the original map', () => {
  assert.deepEqual(Object.keys(TERRITORY_LAYOUT).sort(), TERRITORIES.map(t=>t.id).sort());
  for (const t of TERRITORIES) {
    const slots=Array.from({length:t.capacity},(_,i)=>territorySlot(t.id,i));
    for(const [i,pos] of slots.entries()) {
      assert.ok(pos.x>20&&pos.x<82&&pos.y>20&&pos.y<78,`${t.id} slot ${i+1}`);
      if(i) assert.ok(pos.x>slots[i-1].x+1.5,`${t.id}: non-overlapping slots`);
    }
  }
  assert.deepEqual(territorySlot('iran',0),{x:67.4,y:31.09});
  assert.deepEqual(territorySlot('siria',0),{x:38.02,y:32.81});
});
test('all five factions render inside map slots, including a mixed territory and rotated units', () => {
  const units=FACTIONS.map((f,i)=>({
    id:`map-${i}`,faction:f,type:UNITS.find(u=>u.faction===f)!.id,territory:'iran',deployedAt:i===0?1:2,
  }));
  const html=renderToStaticMarkup(<TabletopBoard globals={uiFixture.state.globals} round={2} elapsed={2}
    units={units} pv={{Iran:0,Coalizione:0,Russia:0,Cina:0,Europa:0}} selected="iran" onSelect={()=>{}}/>);
  assert.equal((html.match(/data-unit-id=/g)??[]).length,5);
  for (const [i,u] of units.entries()) {
    assert.ok(html.includes(`data-territory="iran" data-slot="${i+1}" data-unit-id="${u.id}" data-faction="${u.faction}"`));
    assert.ok(html.includes(unitFrontArt(u.type)));
  }
  assert.ok(html.includes('data-rotated="true"'));
  assert.ok(html.includes('rotate(90deg)'));
  assert.ok(html.includes('Zoom della mappa'));
  assert.ok(html.includes('5/6 riquadri occupati'));
});
test('a successful deploy command puts the same saved unit on its exact map territory', () => {
  const s=uiFixture.state;
  s.phase='ops'; s.ops={actor:'Iran',remaining:20,card:s.players.Iran.hand[0],pressured:[]};
  uiFixture.state=reduce(s,'Iran',{type:'deploy',unitId:'IR-U01',territoryId:'iraq'});
  const unit=uiFixture.state.units[0];
  assert.equal(unit.territory,'iraq');
  const html=render();
  assert.ok(html.includes(`data-territory="iraq" data-slot="1" data-unit-id="${unit.id}" data-faction="Iran"`));
  assert.ok(!html.includes(`data-territory="iran" data-slot="1" data-unit-id="${unit.id}"`));
  assert.ok(html.includes('left:52.97%;top:34.61%'));
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
  const paths = [BOARD_ART.split('?')[0], EVENT_BACK, RULEBOOK_URL.split('?')[0], UNIT_REFERENCE_URL, PLAYER_BOARDS_URL,
    ...FACTIONS.flatMap(f => [factionBoardArt(f).split('?')[0], unitBackArt(f)]),
    ...UNITS.map(u => unitFrontArt(u.id)), ...EVENTS.map(e => eventFrontArt(e.id)),
    ...BOT_CARDS.flatMap(c => [botFrontArt(c.id), botBackArt(c.faction, c.track)])];
  for (const path of new Set(paths)) assert.ok(existsSync(`public${path}`), path);
});
test('release binds the latest rulebook, unit reference, five faction boards and the main board', () => {
  const release = JSON.parse(readFileSync('public/assets/tabletop-v3/release.json', 'utf8'));
  assert.equal(release.release, 'tabletop-2026-11-21-regolamento-v11');
  assert.equal(Object.keys(release.assets).length, 10);
  for (const [url, expected] of Object.entries(release.assets)) {
    const actual = createHash('sha256').update(readFileSync(`public${url}`)).digest('hex');
    assert.equal(actual, expected, url);
  }
});
test('player aid is consultable in-game and both original PDFs are deploy assets', () => {
  const html=renderToStaticMarkup(<PlayerAid onClose={()=>{}}/>);
  assert.ok(html.includes('Aiuto giocatore fronte e retro'));
  assert.ok(html.includes(`src="${PLAYER_AID_URL}"`));
  assert.ok(html.includes('Scarica aiuto giocatore'));
  assert.ok(html.includes('Fondo bianco'));
  for(const url of [PLAYER_AID_URL,PLAYER_AID_WHITE_URL]) assert.ok(existsSync(`public${url}`));
  assert.ok(render().includes('Aiuto giocatore'));
  assert.ok(renderToStaticMarkup(<Materials onClose={()=>{}}/>).includes('Consulta aiuto giocatore'));
});
test('v11 map keeps unit stacks separate from Influence slots and shows every faction score', () => {
  const s=uiFixture.state;s.rulesRevision='2026-11-21';
  s.units=[{id:'u1',type:'IR-U01',faction:'Iran',territory:'iran',placedRound:1,rotated:false}];
  s.influence=[{id:'i1',faction:'Coalizione',territory:'iran',slot:0}];
  const html=render();
  assert.ok(html.includes('data-unit-stack="iran" data-faction="Iran"'));
  assert.ok(html.includes('data-influence-id="i1"'));
  assert.ok(!html.includes('data-unit-id="u1"'));
  assert.ok(html.includes('Iran: 0 PV'));assert.ok(html.includes('Segna-turni 0'));
});

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
import GameReadabilityPreview from './GameReadabilityPreview';
import { Materials } from './Materials';
import { FactionCardFace } from './FactionCardFace';
import CardVisual, { CARD_BACK, CARD_BACK_EVENTO } from '@/components/CardVisual';
import CardDetailModal from '@/components/CardDetailModal';
import type { GameCard } from '@/types/game';
import { TERRITORY_LAYOUT, territorySlot, perimeterPoint, globalTrackPoint } from './board-layout';
import { viewerFaction } from './player-visibility';
import { InfluenceAction, sameInfluenceProposal } from './InfluenceAction';
import { FACTIONS, FACTION_CARDS, EVENTS, BOT_CARDS, BOT_INFLUENCE, OBJECTIVES, TERRITORIES, UNITS } from './catalog';
import { getFactionCardBack, getFactionCardFront, FACTION_CARD_BACK, getObjectiveCardBack, getObjectiveCardFront } from '@/data/card-graphics';
import { eventFrontArt, botFrontArt, botBackArt, factionBoardArt, unitFrontArt, unitBackArt, BOARD_ART, EVENT_BACK, RULEBOOK_URL, UNIT_REFERENCE_URL, PLAYER_BOARDS_URL, PLAYER_AID_URL, PLAYER_AID_WHITE_URL } from './art';

const render = () => renderToStaticMarkup(<TabletopGamePage onBack={() => {}} />);
test('game reading preview uses the real interface and only fictional local state', () => {
  const html = renderToStaticMarkup(<GameReadabilityPreview onBack={() => {}} />);
  assert.ok(html.includes('game-interface tabletop-view'));
  assert.ok(html.includes('Anteprima leggibilità'));
  assert.ok(html.includes('nessuna partita online viene letta o modificata'));
  assert.ok(html.includes('La tua mano · Iran · 5 carte'));
  assert.ok(html.includes('Registro pubblico'));
});
test('game typography raises labels to 16px and body to 18px with white text, isolated from light mode and artwork', () => {
  const css = readFileSync('src/pages/game/game-readability.css', 'utf8');
  assert.ok(css.includes('font-size: 18px'));
  assert.ok(css.includes('--text-xs: 1rem'));
  assert.ok(css.includes('color: #ffffff'));
  assert.ok(css.includes('font-size: 16px'));
  assert.ok(!css.includes('!important'));
  assert.ok(!css.includes('.lobby-ui'));
  assert.ok(!css.includes('img {'));
  const gameSource = readFileSync('src/pages/game/Index.tsx', 'utf8');
  assert.ok(gameSource.includes('onMarkComplete={(id) => markObjectiveComplete(id, true)}'));
  assert.ok(!gameSource.includes('setShowMarket'));
  assert.ok(gameSource.includes('<OpsActionModal'));
});
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
test('a route faction or spectator cannot impersonate a seat or see private Intelligence snapshots', () => {
  const players=[{player_id:'me',faction:'Europa',is_bot:false},{player_id:'other',faction:'Russia',is_bot:false},{player_id:null,faction:'Iran',is_bot:true}];
  assert.equal(viewerFaction('me',players),'Europa');
  assert.equal(viewerFaction(undefined,players),null);assert.equal(viewerFaction('spectator',players),null);
  assert.equal(viewerFaction('me',[...players,{player_id:'me',faction:'Cina',is_bot:false}]),null);
  const state=uiFixture.state,privateCard=FACTION_CARDS.find(c=>c.origin==='Russia')!;
  state.players.Iran.hand=['NI03'];
  state.players.Russia.hand=[privateCard.id];
  state.intel.Iran=[{target:'Russia',hand:[privateCard.id],activation:1}];
  const html=render();
  assert.ok(html.includes('data-card-id="NI03"'));
  assert.ok(!html.includes('Intelligence · consultazioni riservate'));
  assert.ok(!html.includes(privateCard.name));assert.ok(!html.includes(`data-card-id="${privateCard.id}"`));
  uiFixture.member=false;
  assert.ok(!render().includes('La tua mano'));assert.ok(!render().includes('I tuoi obiettivi segreti'));
});
test('human control decisions are never rendered to another human; old BOT control prompts wait for automatic recovery', () => {
  uiFixture.state.phase='control';uiFixture.state.roundClosure=true;
  uiFixture.state.pending={kind:'control',actor:'Russia',territoryId:'iraq',choices:['Economia','Militare']};
  assert.ok(!render().includes('bonus stampato:'));
  uiFixture.own='Russia';assert.ok(render().includes('bonus stampato:'));
  uiFixture.state.players.Russia.bot=true;assert.ok(!render().includes('bonus stampato:'));
});
test('Influence requires a confirmation naming the territory, exact cost and remaining budget', () => {
  const proposal={revision:4,actor:'Europa',territoryId:'iran',territoryName:'Iran',cost:3,budget:4};
  const initial=renderToStaticMarkup(<InfluenceAction proposal={proposal} disabled={false} onConfirm={()=>{throw new Error('SSR never places Influence');}}/>);
  assert.ok(initial.includes('Piazzare Influenza in Iran · 3 OP…'));assert.ok(!initial.includes('role="dialog"'));
  const pending=renderToStaticMarkup(<InfluenceAction proposal={proposal} initialProposal={proposal} disabled={false} onConfirm={()=>{}}/>);
  for(const text of ['Conferma piazzamento Influenza','Annulla','Conferma · Iran · 3 OP','Residuo: 1 OP'])assert.ok(pending.includes(text),text);
  assert.equal(sameInfluenceProposal(proposal,{...proposal}),true);
  for(const changed of [{...proposal,revision:5},{...proposal,territoryId:'turchia'},{...proposal,cost:1},{...proposal,budget:3},{...proposal,actor:'Iran'}]) {
    assert.equal(sameInfluenceProposal(proposal,changed),false);
    const stale=renderToStaticMarkup(<InfluenceAction proposal={changed} initialProposal={proposal} disabled={false} onConfirm={()=>{}}/>);
    assert.ok(stale.includes('La partita o la selezione sono cambiate'));
    assert.ok(/disabled=""[^>]*>Conferma/.test(stale));
  }
});
test('short duration is explicitly a threshold followed by completion of the current round', () => {
  uiFixture.state.mode='breve';uiFixture.state.turnMarker=39;
  const html=render();
  assert.ok(html.includes('Ultimo round: soglia 30 raggiunta.'));
  assert.ok(html.includes('senza pescare un nuovo Evento'));
});
test('perimeter tokens share measured cell centres and single faction markers are never offset', () => {
  assert.deepEqual(perimeterPoint(1),{x:298/3072*100,y:66/2048*100});
  assert.deepEqual(perimeterPoint(6),{x:872/3072*100,y:66/2048*100});
  assert.deepEqual(perimeterPoint(0),perimeterPoint(-4));
  assert.deepEqual(perimeterPoint(100),perimeterPoint(130));
  const s=uiFixture.state;s.turnMarker=6;
  const pv={Iran:0,Coalizione:0,Russia:0,Cina:0,Europa:1};
  const html=renderToStaticMarkup(<TabletopBoard globals={s.globals} round={1} elapsed={1} units={[]} gameState={s}
    pv={pv} selected="iran" onSelect={()=>{}}/>);
  assert.equal((html.match(/data-track-cell=/g)??[]).length,3);
  assert.ok(html.includes(`data-track-cell="1" data-track-point="true"`)||html.includes(`data-track-cell="1" data-track-point=""`));
  assert.ok(html.includes(`left:${perimeterPoint(1).x}%;top:${perimeterPoint(1).y}%`));
  const crisis=globalTrackPoint('Crisi Bellica',6);
  assert.equal(crisis.x,2637/3072*100);assert.equal(crisis.y,1521.5/2048*100);
  assert.ok(html.includes('transform:translate(-50%, -50%)'));
});
test('OP controls expose remaining budget, targets, deployment costs and explicit activation end', () => {
  const s = uiFixture.state;
  s.phase = 'ops'; s.ops = { actor: 'Iran', remaining: 4, card: s.players.Iran.hand[0], pressured: [] };
  const html = render();
  for (const label of ['4 OP disponibili', 'Sviluppo', 'Pressione', 'Schieramento', 'Termina attivazione', 'Missili balistici']) assert.ok(html.includes(label), label);
});
test('maintenance UI lists each expiring own unit, disables without OP and removes paid unit', () => {
  const s = uiFixture.state;
  s.phase = 'ops'; s.ops = { actor: 'Iran', remaining: 0, card: s.players.Iran.hand[0], pressured: [] };
  s.units = [
    { id: 'own-a', type: 'IR-U01', faction: 'Iran', territory: 'iran', placedRound: 1, rotated: true },
    { id: 'own-b', type: 'IR-U01', faction: 'Iran', territory: 'iran', placedRound: 1, rotated: true },
    { id: 'fresh', type: 'IR-U01', faction: 'Iran', territory: 'iran', placedRound: 1, rotated: false },
    { id: 'enemy', type: 'RU-U01', faction: 'Russia', territory: 'iran', placedRound: 1, rotated: true },
  ];
  const html = render();
  assert.ok(html.includes('Mantenimento · 1 OP per unità'));
  assert.equal((html.match(/data-maintain-unit=/g) ?? []).length, 2);
  assert.equal((html.match(/data-maintain-unit="own-[ab]"[^>]*disabled=""/g) ?? []).length, 2);
  assert.ok(!html.includes('data-maintain-unit="fresh"')); assert.ok(!html.includes('data-maintain-unit="enemy"'));
  s.ops.remaining = 1;
  assert.ok(!/data-maintain-unit="own-a"[^>]*disabled=""/.test(render()));
  uiFixture.state = reduce(s, 'Iran', { type: 'maintain', unitId: 'own-a' });
  const paid = render();
  assert.ok(!paid.includes('data-maintain-unit="own-a"'));
  assert.ok(/data-maintain-unit="own-b"[^>]*disabled=""/.test(paid));
  uiFixture.own = 'Russia'; assert.ok(!render().includes('data-maintain-unit='));
  uiFixture.own = null; uiFixture.member = false; assert.ok(!render().includes('data-maintain-unit='));
});
test('the board renders real rotation, including a maintained old unit with rotated=false', () => {
  const s = uiFixture.state;
  s.actualRound = 3;
  s.units = [{ id: 'maintained', faction: 'Iran', type: 'IR-U01', territory: 'iran', placedRound: 1, rotated: false }];
  const html = render();
  assert.ok(html.includes('data-unit-id="maintained"'));
  assert.ok(html.includes('data-rotated="false"'));
  assert.ok(!html.includes('rotate(90deg)'));
});
test('BOT maintenance is explained publicly without exposing human OP controls for BOT turns', () => {
  const s = uiFixture.state;
  s.players.Russia.bot = true; s.turnIndex = s.order.indexOf('Russia');
  s.units = [{ id: 'bot-expiring', faction: 'Russia', type: 'RU-U04', territory: 'iran', placedRound: 1, rotated: true }];
  const before = render();
  assert.ok(before.includes('Mantenimento automatico BOT (gratis, 1 unità per attivazione)'));
  assert.ok(!before.includes('data-maintain-unit='));
  s.deck = [FACTION_CARDS.find(c => c.options.some(o => o.boost.faction === 'Russia'))!.id];
  uiFixture.state = reduce(s, 'Russia', { type: 'advance-bot' });
  const after = render();
  assert.ok(after.includes('Russia BOT: Mantenimento gratuito'));
  assert.ok(after.includes('data-rotated="false"'));
  assert.ok(!after.includes('BOT senza Mantenimento'));
});
test('minimum BOT presence renders the saved base unit beside the printed State without replacing Influence', () => {
  const s = uiFixture.state; s.rulesRevision = '2026-11-21';
  s.players.Coalizione.bot = true; s.turnIndex = s.order.indexOf('Coalizione');
  s.players.Coalizione.tracks.Consenso = 2;
  s.players.Coalizione.tracks.Economia = 6; s.players.Coalizione.tracks.Militare = 6; s.players.Coalizione.tracks.Diplomazia = 6;
  s.botDecks.Coalizione.Consenso = ['BOT-CO-C2'];
  s.deck = [FACTION_CARDS.find(c => !c.options.some(o => o.boost.faction === 'Coalizione'))!.id];
  const territory = BOT_INFLUENCE['BOT-CO-C2'];
  s.influence = [{ id: 'preserved-influence', faction: 'Iran', territory, slot: 0 }];
  uiFixture.state = reduce(s, 'Coalizione', { type: 'advance-bot' });
  const html = render();
  assert.ok(html.includes(`data-unit-stack="${territory}" data-faction="Coalizione"`));
  assert.ok(html.includes(unitFrontArt('CO-U01')));
  assert.ok(html.includes('data-influence-id="preserved-influence"'));
  assert.ok(html.includes('presenza minima: Schiera Convenzionale'));
  assert.equal(uiFixture.state.units[0].slot, undefined);
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
  for (const path of new Set(paths)) assert.ok(existsSync(`public${path.split('?')[0]}`), path);
});
test('release binds the latest rulebook, unit reference, five faction boards and the main board', () => {
  const release = JSON.parse(readFileSync('public/assets/tabletop-v3/release.json', 'utf8'));
  assert.equal(release.release, 'tabletop-2026-11-28-regolamento-v12');
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
test('all 347 base cards use their exact original fronts, without digital or generic artwork', () => {
  assert.equal(FACTION_CARDS.length,347);
  for(const card of FACTION_CARDS) {
    const html=renderToStaticMarkup(<FactionCardFace card={card}/>);
    assert.ok(html.includes(`data-card-id="${card.id}"`));
    assert.ok(html.includes('data-card-source="original"'),card.id);
    assert.ok(html.includes(`/assets/tabletop-v3/faction-cards/${card.id}.jpg?v=2026-11-23-base`));
    assert.ok(!html.includes('data-card-source="digital"'));
    assert.ok(!html.includes('/card-art/'));
  }
});
test('base artwork matches exact IDs and origins, with one supplied common back', () => {
  for(const card of FACTION_CARDS) {
    assert.equal(getFactionCardFront(card.id,card.origin),`/assets/tabletop-v3/faction-cards/${card.id}.jpg?v=2026-11-23-base`);
    assert.equal(getFactionCardFront(card.id,'unknown'),null);
    assert.equal(getFactionCardBack(card.origin),FACTION_CARD_BACK);
  }
  assert.equal(getFactionCardFront('C073C','Russia'),null);
  assert.notEqual(getFactionCardFront('C073C','Cina'),getFactionCardFront('C073R','Russia'));
  assert.notEqual(getFactionCardFront('C083C','Cina'),getFactionCardFront('C083C2','Cina'));
  for(const id of ['unknown','../../other','NI00']) assert.equal(getFactionCardFront(id,'Iran'),null);
  assert.equal(getFactionCardBack('unknown'),null);
});
test('legacy card thumbnail and detail use the original, without replacing BOT or Event backs', () => {
  const card:GameCard={card_id:'C073C',card_name:'Veto ONU Cina',faction:'Cina',card_type:'Diplomatico',op_points:3,deck_type:'base',effects:{}};
  const original=getFactionCardFront(card.card_id,card.faction)!;
  assert.ok(renderToStaticMarkup(<CardVisual card={card}/>).includes(original));
  const detail=renderToStaticMarkup(<CardDetailModal card={card} onClose={()=>{}} onPlay={()=>{}}/>);
  assert.ok(detail.includes(original));assert.ok(detail.includes('role="dialog"'));
  assert.ok(detail.includes('Gioca questa carta'));assert.ok(detail.includes('aria-label="Chiudi"'));
  const back=(c:GameCard)=>renderToStaticMarkup(<CardVisual card={c} flipped/>);
  assert.ok(back(card).includes(FACTION_CARD_BACK));
  const bot=back({...card,card_id:'BOT-CN-ECO-01'});
  assert.ok(bot.includes(`src="${CARD_BACK}"`));assert.ok(!bot.includes(FACTION_CARD_BACK));
  const event=back({...card,card_id:'E01',card_type:'Evento'});
  assert.ok(event.includes(`src="${CARD_BACK_EVENTO}"`));assert.ok(!event.includes(FACTION_CARD_BACK));
});
test('base materials expose every faction plus neutrals, and the actual common back', () => {
  for(const faction of FACTIONS) {
    const front=renderToStaticMarkup(<Materials onClose={()=>{}} initialCategory="Carte fazione" initialFaction={faction}/>);
    const cards=FACTION_CARDS.filter(c=>c.origin===faction||c.origin==='Neutrale');
    assert.ok(front.includes(`${cards.length} elementi`));
    assert.ok(front.includes('Mostra retri'));
    assert.equal((front.match(/data-card-source="original"/g)??[]).length,cards.length);
    for(const card of FACTION_CARDS) assert.equal(front.includes(getFactionCardFront(card.id,card.origin)!),cards.includes(card),card.id);
    const back=renderToStaticMarkup(<Materials onClose={()=>{}} initialCategory="Carte fazione" initialFaction={faction} initialBack/>);
    assert.ok(back.includes('Mostra fronti'));
    assert.equal((back.match(/src="\/assets\/tabletop-v3\/faction-cards\/retro_Mazzo_Base.jpg/g)??[]).length,cards.length);
    assert.ok(!back.includes('data-card-source="original"'));
  }
});
test('hand uses the same graphical face for mixed factions and retains discard selection', () => {
  const s=uiFixture.state;
  s.players.Iran.hand=['NI03','C073C',...['Russia','Europa','Neutrale'].map(f=>FACTION_CARDS.find(c=>c.origin===f)!.id),'SE_C01'];
  s.phase='discard';s.pending={kind:'discard',actor:'Iran',count:1,limit:5};
  const html=render();
  assert.ok(html.includes('tabletop-hand-grid'));
  assert.ok(html.includes('data-card-id="NI03" data-card-source="original"'));
  assert.ok(html.includes('data-card-id="C073C" data-card-source="original"'));
  for(const id of s.players.Iran.hand) assert.ok(html.includes(`data-card-id="${id}" data-card-source="original"`),id);
  assert.ok(html.includes('Seleziona per lo scarto'));
  assert.ok(html.includes('Velocità animazioni carte'));
  assert.ok(html.includes('Lenta · 10 s'));
});
test('complete base archive binds all 348 unchanged originals by source hash', () => {
  const manifest=JSON.parse(readFileSync('public/assets/tabletop-v3/base-art-manifest.json','utf8'));
  assert.equal(manifest.edition,'2026-11-23-base');
  assert.equal(manifest.fronts,347);assert.equal(manifest.backs,1);
  assert.equal(Object.keys(manifest.assets).length,348);
  assert.deepEqual(manifest.origins,{Cina:58,Coalizione:73,Europa:58,Iran:70,Neutrale:30,Russia:58});
  for(const [url,hash] of Object.entries(manifest.assets))
    assert.equal(createHash('sha256').update(readFileSync(`public${url}`)).digest('hex'),hash,url);
  for(const card of FACTION_CARDS) assert.ok(manifest.assets[getFactionCardFront(card.id,card.origin)!.split('?')[0]],card.id);
  assert.ok(manifest.assets[FACTION_CARD_BACK.split('?')[0]]);
});
test('new BOT asset manifest covers all 120 fronts and 20 backs with exact deployed source hashes', () => {
  const manifest=JSON.parse(readFileSync('public/assets/tabletop-v3/bot-art-manifest.json','utf8'));
  assert.equal(manifest.edition,'2026-11-22');
  assert.equal(manifest.fronts,120);assert.equal(manifest.backs,20);
  assert.equal(Object.keys(manifest.assets).length,140);
  for(const [name,hash] of Object.entries(manifest.assets)) {
    assert.equal(createHash('sha256').update(readFileSync(`public/assets/tabletop-v3/bots/${name}`)).digest('hex'),hash,name);
  }
  for(const card of BOT_CARDS) assert.ok(manifest.assets[`${card.id}.jpg`],card.id);
});

test('all 75 objective fronts and five backs use the supplied current deck, with saved aliases preserved', () => {
  for(const objective of OBJECTIVES) {
    const url=getObjectiveCardFront(objective.id);
    assert.equal(url,`/assets/tabletop-v3/objectives/${objective.id}.jpg?v=2026-11-23`);
    assert.ok(existsSync(`public${url!.split('?')[0]}`));
  }
  const codes={Iran:'IRAN',Coalizione:'COAL',Russia:'RUSS',Cina:'CINA',Europa:'EU'} as const;
  for(const faction of FACTIONS) {
    const url=getObjectiveCardBack(faction);
    assert.ok(url?.includes(`retro_Obiettivi_${faction}.jpg`));
    assert.ok(existsSync(`public${url!.split('?')[0]}`));
    for(const o of OBJECTIVES.filter(o=>o.faction===faction)) {
      assert.equal(getObjectiveCardFront(`OBJ_${codes[faction]}_${String(o.number).padStart(2,'0')}`),getObjectiveCardFront(o.id));
    }
  }
  for(const id of ['OBJ-IR-00','OBJ-IR-16','OBJ-XX-01','OBJ_IRAN_99','../../other']) assert.equal(getObjectiveCardFront(id),null);
  assert.equal(getObjectiveCardBack('unknown'),null);
});

test('materials expose each complete objective faction deck, without mixing factions', () => {
  for(const faction of FACTIONS) {
    const html=renderToStaticMarkup(<Materials onClose={()=>{}} initialCategory="Obiettivi" initialFaction={faction}/>);
    assert.ok(html.includes('75 fronti originali e 5 retri'));
    assert.ok(html.includes('15 elementi'));
    assert.ok(html.includes('Mostra retri'));
    for(const o of OBJECTIVES) {
      assert.equal(html.includes(getObjectiveCardFront(o.id)!),o.faction===faction,o.id);
    }
  }
});

test('every faction sees graphical versions of only its assigned secret objectives', () => {
  for(const faction of FACTIONS) {
    uiFixture.own=faction;
    const assigned=OBJECTIVES.filter(o=>o.faction===faction).slice(0,3);
    uiFixture.state.players[faction].objectives=assigned.map(o=>o.id);
    const html=render();
    for(const o of OBJECTIVES) {
      assert.equal(html.includes(getObjectiveCardFront(o.id)!),assigned.some(a=>a.id===o.id),o.id);
    }
    assert.ok(!html.includes('/card-art/real/objectives-iran/'));
  }
  uiFixture.own=null;uiFixture.member=false;
  assert.ok(!render().includes('/assets/tabletop-v3/objectives/'));
});

test('the four uploaded decks bind all 337 exact front and back files by source hash', () => {
  const manifest=JSON.parse(readFileSync('public/assets/tabletop-v3/deck-art-manifest.json','utf8'));
  assert.equal(manifest.edition,'2026-11-23');
  assert.equal(manifest.sources.length,4);
  assert.equal(Object.keys(manifest.assets).length,337);
  for(const [url,hash] of Object.entries(manifest.assets)) {
    assert.equal(createHash('sha256').update(readFileSync(`public${url}`)).digest('hex'),hash,url);
  }
  const urls=[
    ...EVENTS.map(c=>eventFrontArt(c.id)),
    ...BOT_CARDS.flatMap(c=>[botFrontArt(c.id),botBackArt(c.faction,c.track)]),
    ...UNITS.map(c=>unitFrontArt(c.id)),
    ...OBJECTIVES.map(c=>getObjectiveCardFront(c.id)!),
    ...FACTIONS.flatMap(f=>[getObjectiveCardBack(f)!,unitBackArt(f)]),
    EVENT_BACK,
  ];
  for(const url of urls) assert.ok(manifest.assets[url.split('?')[0]],url);
});
test('in-game high readability toggle shares the homepage preference and switches the game to the light theme', () => {
  const store: Record<string, string> = { linea_rossa_readability: 'high' };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } }, matchMedia: () => ({ matches: false }) } });
  try {
    const high = renderToStaticMarkup(<GameReadabilityPreview onBack={() => {}} />);
    assert.ok(high.includes('data-readability="high"') && high.includes('Alta leggibilità: attiva') && high.includes('aria-pressed="true"'));
    store.linea_rossa_readability = 'standard';
    const standard = renderToStaticMarkup(<GameReadabilityPreview onBack={() => {}} />);
    assert.ok(standard.includes('data-readability="standard"') && standard.includes('>Alta leggibilità</button>'));
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});

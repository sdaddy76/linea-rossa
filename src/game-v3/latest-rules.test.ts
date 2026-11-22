import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduce, canDeploy, canInfluence, influenceCost, occupiedSlots, territoryController, type EngineState } from './engine';
import { FACTIONS, FACTION_CARDS, INITIAL_TRACKS, BOT_CARDS, BOT_INFLUENCE, TERRITORIES, type Faction } from './catalog';
const rng = () => 0.3;
function setup(bots: Faction[] = [], neutrals: Faction[] = []) {
  const s = createGame({ bots, neutrals, rulesRevision: '2026-11-21' }, rng);
  s.globals = { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 };
  s.order = [...FACTIONS]; s.turnIndex = 0; s.advancers = []; s.roundBlocked = false;
  for (const f of FACTIONS) s.players[f].tracks = { ...INITIAL_TRACKS[f] };
  return s;
}
function ops(s = setup(), actor: Faction = 'Iran') {
  s.turnIndex = s.order.indexOf(actor); s.phase = 'ops'; s.continuation = 'ops';
  s.ops = { actor, card: 'C073C', remaining: 20, pressured: [] }; return s;
}
function unit(s: EngineState, type = 'IR-U01', faction: Faction = 'Iran', territory = 'iran') {
  s.units.push({ id: `u${s.nextUnit++}`, type, faction, territory, placedRound: s.actualRound, rotated: false });
}
function close(s = setup()) {
  s.order=[...FACTIONS];s.pending=null;s.eventDeck=['E05'];
  for(const f of FACTIONS)s.players[f].hand=[];
  ops(s, 'Europa'); s.lap = 2;
  return reduce(s, 'Europa', { type: 'finish-ops' }, rng);
}
test('latest setup mixes all 15 specials; neutral and BOT seats receive no cards or objectives', () => {
  const s = setup(['Russia'], ['Cina', 'Europa']);
  assert.equal(s.specialReserve.length, 0);
  assert.equal(s.deck.length, 337);
  assert.equal(new Set([...s.deck, ...s.players.Iran.hand, ...s.players.Coalizione.hand]).size, 347);
  for (const f of ['Russia','Cina','Europa'] as const) assert.deepEqual([s.players[f].hand.length, s.players[f].objectives.length], [0,0]);
});
test('unit stacks never consume Influence slots, even in full States; max five per type globally', () => {
  const s = ops();
  s.influence = Array.from({length:6}, (_,slot)=>({id:`i${slot}`,faction:'Russia',territory:'iran',slot}));
  assert.equal(canInfluence(s,'iran'), false);
  assert.equal(canDeploy(s,'Iran','IR-U01','iran'), true);
  const next = reduce(s,'Iran',{type:'deploy',unitId:'IR-U01',territoryId:'iran'},rng);
  assert.equal(next.units[0].slot,undefined); assert.equal(occupiedSlots(next,'iran').length,6);
  for(let i=0;i<4;i++)unit(next);
  assert.equal(canDeploy(next,'Iran','IR-U01','iraq'),false);
  assert.equal(canDeploy(next,'Iran','IR-U05','giordania'),false);
});
test('military and Opinion modify Influence, never Economy or war-cost modifiers', () => {
  const s = setup(); s.players.Russia.tracks.Militare = 8;
  assert.equal(influenceCost(s,'Russia','turchia'),2);
  s.players.Russia.tracks.Militare = 3;
  assert.equal(influenceCost(s,'Russia','turchia'),4);
  assert.equal(influenceCost(s,'Russia','siria'),1);
  s.globals.Opinione = -4; assert.equal(influenceCost(s,'Iran','israele'),2);
  s.globals.Opinione = 4; assert.equal(influenceCost(s,'Coalizione','iran'),2);
  s.players.Coalizione.tracks.Economia=1; s.globals['Crisi Bellica']=2;
  assert.equal(influenceCost(s,'Coalizione','iran'),2);
});
test('Destabilize can remove an enemy Influence anywhere without friendly presence', () => {
  const s=ops(); s.influence=[{id:'enemy',faction:'Coalizione',territory:'qatar',slot:0}];
  const next=reduce(s,'Iran',{type:'destabilize',influenceId:'enemy'},rng);
  assert.equal(next.influence!.length,0);assert.equal(next.ops!.remaining,18);
});
test('diplomatic dividend occurs at most once per faction per round; no unlock reserve draw', () => {
  let s=setup(); const card=FACTION_CARDS.find(c=>c.unlocksSpecial && c.options.some(o=>o.boost.faction!=='Iran'))!;
  const option=card.options.findIndex(o=>o.boost.faction!=='Iran');
  for(let i=0;i<2;i++){
    s.turnIndex=0;s.phase='activation';s.players.Iran.hand=[card.id];
    s=reduce(s,'Iran',{type:'play-event',cardId:card.id,option},rng);
  }
  assert.equal(s.players.Iran.points,1);assert.equal(s.players.Iran.hand.length,0);
});
test('neutral actors advance by two only if highlighted and cannot win or use veto', () => {
  let s=setup([],['Iran','Coalizione']);s.advancers=['Iran'];s.turnIndex=0;
  s=reduce(s,'Iran',{type:'advance-bot'},rng);
  assert.equal(s.turnMarker,2); assert.equal(s.deck.length,332);
  s=ops(s,'Europa');s.globals.Nucleare=14;s.globals.Sanzioni=9;
  // Direct card globals still clamp neutral immediate-win tracks.
  const nuclear=FACTION_CARDS.find(c=>c.options.some(o=>o.globals.some(g=>g.track==='Nucleare'&&g.delta>0)))!;
  s.phase='activation';s.players.Europa.hand=[nuclear.id];
  s=reduce(s,'Europa',{type:'play-event',cardId:nuclear.id,option:nuclear.options.findIndex(o=>o.globals.some(g=>g.track==='Nucleare'&&g.delta>0))},rng);
  assert.equal(s.globals.Nucleare,14);assert.equal(s.result,null);
});
test('BOT fallback advances exactly two rather than the discarded shared card cost', () => {
  const s=setup(['Iran']);s.advancers=['Iran'];
  s.deck=[FACTION_CARDS.find(c=>c.cost!==2&&!c.options.some(o=>o.boost.faction==='Iran'))!.id];
  const next=reduce(s,'Iran',{type:'advance-bot'},rng);
  assert.equal(next.turnMarker,2);
});
test('Coalition deployment in Iran applies war and Opinion immediately', () => {
  const s=ops(setup(),'Coalizione');
  const next=reduce(s,'Coalizione',{type:'deploy',unitId:'CO-U01',territoryId:'iran'},rng);
  assert.equal(next.globals['Crisi Bellica'],6);assert.equal(next.globals.Opinione,-1);
});
test('Coalition occupation tension, control exclusion and consecutive-round nuclear penalty', () => {
  let s=setup();unit(s,'CO-U01','Coalizione');
  assert.equal(territoryController(s,'iran'),'Coalizione');
  s=close(s);
  assert.equal(s.players.Iran.tracks.Consenso,6); assert.equal(s.players.Coalizione.tracks.Consenso,3);
  assert.equal(s.players.Iran.tracks.Economia,3);assert.equal(s.players.Russia.tracks.Diplomazia,5);
  assert.equal(s.players.Coalizione.tracks.Consenso,3,'no Iran control bonus to Coalition');
  s.globals.Nucleare=8;s=close(s);
  assert.ok(s.log.includes('Globale: Nucleare 8 → 6')); assert.equal(s.units.length,0);
});
test('war caused by a player excludes that player, but scores the others immediately', () => {
  const s=ops();s.globals['Crisi Bellica']=2;s.players.Iran.points=100;
  s.players.Russia.points=10;s.players.Russia.objectives=[];
  const next=reduce(s,'Iran',{type:'pressure',track:'Crisi Bellica',delta:-1},rng);
  assert.equal(next.result!.reason,'war');assert.equal(next.result!.responsible,'Iran');
  assert.deepEqual(next.result!.winners,['Russia']);assert.equal(next.phase,'ended');
});
test('Tension war has no culprit and applies minus five to each competing faction, never neutrals', () => {
  const s=setup([],['Cina']);s.globals.Nucleare=12;s.globals['Crisi Bellica']=2;
  for(const f of FACTIONS){s.players[f].objectives=[];s.players[f].points=10;}
  const next=close(s);
  assert.equal(next.result!.reason,'war');assert.equal(next.result!.responsible,undefined);
  assert.equal(next.result!.scores.Iran,5);assert.equal(next.result!.scores.Cina,0);
  assert.ok(!next.result!.winners.includes('Cina'));
});
test('control adds exactly one defense bonus, not one per defending unit', () => {
  let s=ops();unit(s);unit(s,'CO-U01','Coalizione');unit(s,'CO-U01','Coalizione');
  s=reduce(s,'Iran',{type:'attack',territoryId:'iran'},rng);
  assert.equal(s.combat!.defense,5); // D1 + D1 + control1 + die2
});
test('all 120 new BOT fronts supply explicit valid Influence destinations independent from deployment', () => {
  assert.equal(Object.keys(BOT_INFLUENCE).length,120);
  for(const card of BOT_CARDS) assert.ok(TERRITORIES.some(t=>t.id===BOT_INFLUENCE[card.id]),card.id);
  assert.equal(BOT_INFLUENCE['BOT-IR-E5'],'bahrein'); // unit priority says Iraq, not Influence
  assert.equal(BOT_INFLUENCE['BOT-CO-E4'],'kuwait'); // unit priority says Emirates
  assert.equal(BOT_INFLUENCE['BOT-CO-M3'],'kuwait'); // attack Iran / deployment Saudi Arabia
});
test('new BOT edition resolves every printed Influence destination and full-state eviction automatically', () => {
  for(const card of BOT_CARDS) {
    const s=setup([card.faction]);s.botInfluenceEdition='2026-11-22';
    s.lastBotCards={[card.faction]:card.id};s.roundClosure=true;
    s.queue=[{kind:'closure-bot',actor:card.faction}];
    const target=TERRITORIES.find(t=>t.id===BOT_INFLUENCE[card.id])!;
    s.influence=Array.from({length:target.capacity},(_,slot)=>({id:`old-${slot}`,faction:'Iran',territory:target.id,slot}));
    s.units=[{id:'unit-untouched',type:'IR-U01',faction:'Iran',territory:target.id,placedRound:1,rotated:false}];
    // Finish the second lap with a human actor so the closure queue is drained.
    const actor=FACTIONS.find(f=>f!==card.faction)!;
    s.order=[...FACTIONS.filter(f=>f!==actor), actor]; s.lap=2;
    ops(s,actor);
    let next=reduce(s,actor,{type:'finish-ops'},rng);
    // Control bonuses are still explicit choices in the tabletop rules; resolve
    // any fixture-generated control prompt so this assertion reaches the end
    // of the closure queue.
    while (next.pending?.kind === 'control') {
      next=reduce(next,next.pending.actor,{type:'control-bonus',track:next.pending.choices[0]},rng);
    }
    assert.equal(next.pending,null,card.id);
    assert.ok(!next.influence!.some(i=>i.id==='old-0'),card.id);
    assert.ok(next.influence!.some(i=>i.faction===card.faction&&i.territory===target.id&&i.slot===0),card.id);
    assert.equal(next.units[0].id,'unit-untouched',card.id);
  }
});
test('previous BOT edition retains explicit manual choice rather than migrating saved games', () => {
  const s=setup(['Russia']);s.roundClosure=true;s.lastBotCards={Russia:'BOT-RU-E1'};
  s.queue=[{kind:'closure-bot',actor:'Russia'}];s.order=['Coalizione','Cina','Europa','Russia','Iran'];s.lap=2;ops(s,'Iran');
  const next=reduce(s,'Iran',{type:'finish-ops'},rng);
  assert.equal(next.pending?.kind,'bot-influence');
  assert.equal(next.botInfluenceEdition,undefined);
});

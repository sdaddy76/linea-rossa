import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduce, canDeploy, canInfluence, maintainableUnits, BOT_BASE_UNIT, influenceCost, deployCost, attackCost, canPeek, hormuzBlocked, occupiedSlots, territoryController, type EngineState } from './engine';
import { FACTIONS, FACTION_CARDS, INITIAL_TRACKS, BOT_CARDS, BOT_INFLUENCE, OBJECTIVES, TERRITORIES, UNITS, type Faction } from './catalog';
import { chooseBotControlBonus, chooseBotCorrelation, weakestTrack } from './bots';
import { objectiveComplete } from './objectives';
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
test('latest maintenance survives serialized human control closure and is charged once', () => {
  let s = ops(setup(), 'Russia');
  unit(s, 'RU-U01', 'Russia', 'iraq'); s.units[0].rotated = true;
  const id = s.units[0].id; s.ops!.remaining = 1;
  s = reduce(s, 'Russia', { type: 'maintain', unitId: id }, rng);
  assert.equal(s.ops!.remaining, 0);
  assert.equal(s.rulesRevision, '2026-11-21');
  const next = close(s);
  assert.equal(next.pending?.kind, 'control'); assert.equal(next.pending?.actor, 'Russia');
  const resumed = reduce(JSON.parse(JSON.stringify(next)), 'Russia', { type: 'control-bonus', track: 'Economia' }, rng);
  assert.equal(resumed.round, 2); assert.equal(resumed.units[0].rotated, true);
  assert.equal(resumed.log.filter(l => l.includes('Mantenimento di')).length, 1);
  assert.equal(maintainableUnits(resumed, 'Russia')[0].id, id);
});
test('latest final objectives require maintenance while territorial PF still come only from Influence', () => {
  const final = (pay: boolean) => {
    let s = setup(); s.mode = 'breve'; s.turnMarker = 30;
    s.players.Russia.objectives = ['OBJ-RU-09'];
    unit(s, 'RU-U04', 'Russia', 'siria'); unit(s, 'RU-U04', 'Russia', 'libano');
    s.units.forEach(u => { u.rotated = true; });
    s.influence = [{ id: 'permanent', faction: 'Russia', territory: 'siria', slot: 0 }];
    if (pay) {
      s = ops(s, 'Russia'); s.ops!.remaining = 2;
      for (const u of [...s.units]) s = reduce(s, 'Russia', { type: 'maintain', unitId: u.id }, rng);
    }
    s = close(s);
    assert.equal(s.phase, 'ended');
    assert.equal(s.units.length, pay ? 2 : 0);
    assert.equal(s.influence?.length, 1);
    assert.equal(objectiveComplete(s, 'OBJ-RU-09'), pay);
    return s.result!.scores.Russia;
  };
  assert.equal(final(true) - final(false), OBJECTIVES.find(o => o.id === 'OBJ-RU-09')!.points,
    'same control bonuses, only the printed objective reward changes');
});
test('BOT units not renewed during activation expire at closure; no extra closure maintenance', () => {
  const s = setup(['Russia']); s.botInfluenceEdition = '2026-11-22';
  unit(s, 'RU-U04', 'Russia', 'siria'); s.units[0].rotated = true;
  const id = s.units[0].id;
  const next = close(s);
  assert.equal(next.round, 2);
  assert.ok(!next.units.some(u => u.id === id));
  assert.ok(!next.log.some(line => line.includes('Mantenimento di')));
});
test('BOT Iran controlling Iraq selects its weaker printed bonus and completes round closure', () => {
  const s=setup(['Iran']);s.botInfluenceEdition='2026-11-22';
  s.influence=[{id:'own',faction:'Iran',territory:'iraq',slot:0}];
  s.players.Iran.tracks.Economia=2;s.players.Iran.tracks.Militare=7;
  s.lastBotCards={Iran:BOT_CARDS.find(c=>c.faction==='Iran'&&BOT_INFLUENCE[c.id]==='iraq')!.id};
  const next=close(s);
  assert.equal(next.round,2);assert.equal(next.roundClosure,false);assert.equal(next.pending,null);
  assert.ok(next.log.includes('Iran BOT: sceglie automaticamente Economia per il controllo di Iraq.'));
  assert.equal(next.players.Iran.tracks.Economia,3);
  assert.equal(next.log.filter(l=>l==='Iran: bonus controllo Iraq, Economia +1.').length,1);
});
test('persisted BOT control prompts recover automatically without repeating closure effects', () => {
  const s=setup(['Iran']);
  s.phase='control';s.roundClosure=true;s.pending={kind:'control',actor:'Iran',territoryId:'iraq',choices:['Economia','Militare']};
  s.players.Iran.tracks.Economia=2;s.queue=[{kind:'closure-score'},{kind:'closure-units'},{kind:'closure-refill'}];
  s.globals.Sanzioni=9;s.players.Iran.hand=[];s.units=[];s.eventDeck=['E05'];
  const next=reduce(s,'Iran',{type:'advance-bot'},rng);
  assert.equal(next.round,2);assert.equal(next.players.Iran.tracks.Economia,3);
  assert.equal(next.log.filter(l=>l.includes('bonus controllo Iraq')).length,1);
  assert.equal(next.log.filter(l=>l.includes('PV di fine round')).length,5);
  assert.throws(()=>reduce(next,'Iran',{type:'control-bonus',track:'Economia'},rng));
});
test('BOT control choice repairs tracks, breaks ties by faction priority and can win at Nuclear 14', () => {
  const s=setup(['Iran']);
  s.players.Iran.tracks.Economia=5;s.players.Iran.tracks.Militare=5;
  assert.equal(chooseBotControlBonus(s,'Iran',['Economia','Militare']),'Militare');
  s.players.Iran.tracks.Consenso=2;
  assert.equal(chooseBotControlBonus(s,'Iran',['Consenso','Nucleare']),'Consenso');
  s.players.Iran.tracks.Consenso=8;
  assert.equal(chooseBotControlBonus(s,'Iran',['Consenso','Nucleare']),'Nucleare');
  s.globals.Nucleare=14;s.players.Iran.tracks.Consenso=1;
  assert.equal(chooseBotControlBonus(s,'Iran',['Consenso','Nucleare']),'Nucleare');
});
test('a human control choice is still owned by that player, never silently automated', () => {
  const s=setup();s.influence=[{id:'own',faction:'Iran',territory:'iraq',slot:0}];
  const next=close(s);
  assert.equal(next.phase,'control');assert.equal(next.pending?.actor,'Iran');
  assert.throws(()=>reduce(next,'Europa',{type:'control-bonus',track:'Economia'},rng));
  assert.equal(reduce(next,'Iran',{type:'control-bonus',track:'Economia'},rng).round,2);
});
test('reported economy and consensus penalties follow printed negative correlations, not extra chained effects', () => {
  const s=ops(setup(),'Russia');
  assert.equal(chooseBotCorrelation(s,'Russia','Economia'),0);
  const economy=s.players.Europa.tracks.Economia;
  const before=structuredClone(s.players);
  const next=reduce(s,'Russia',{type:'develop',track:'Economia',correlation:chooseBotCorrelation(s,'Russia','Economia')},rng);
  assert.equal(next.players.Europa.tracks.Economia,economy-1);
  assert.equal(next.players.Russia.tracks.Economia,before.Russia.tracks.Economia+1);
  for(const f of ['Iran','Coalizione','Cina'] as const)assert.deepEqual(next.players[f].tracks,before[f].tracks);
  assert.equal(chooseBotCorrelation(s,'Iran','Diplomazia'),1);
  assert.equal(chooseBotCorrelation(s,'Russia','Consenso'),0);
});
test('Coalition fallback repairs Consensus in crisis; Russian fallback follows weakest track rather than always Diplomacy', () => {
  const s=setup(['Coalizione']);s.turnIndex=s.order.indexOf('Coalizione');
  s.players.Coalizione.tracks.Consenso=1;
  assert.equal(weakestTrack(s,'Coalizione'),'Consenso');
  s.deck=[FACTION_CARDS.find(c=>!c.options.some(o=>o.boost.faction==='Coalizione'))!.id];
  s.botDecks.Coalizione.Consenso=['BOT-CO-C2'];
  unit(s,'CO-U01','Coalizione','kuwait'); // Already present: test the original Development fallback.
  const next=reduce(s,'Coalizione',{type:'advance-bot'},rng);
  assert.equal(next.players.Coalizione.tracks.Consenso,3);
  s.players.Russia.tracks.Diplomazia=10;s.players.Russia.tracks.Consenso=2;
  assert.equal(weakestTrack(s,'Russia'),'Consenso');
});
test('Fronte atlantico and Russian diplomatic objective keep their printed thresholds', () => {
  const s=setup();s.players.Europa.tracks.Consenso=6;s.players.Coalizione.tracks.Consenso=6;
  assert.equal(objectiveComplete(s,'OBJ-EU-15'),true);
  s.players.Coalizione.tracks.Consenso=5;assert.equal(objectiveComplete(s,'OBJ-EU-15'),false);
  s.players.Russia.tracks.Diplomazia=3;assert.equal(objectiveComplete(s,'OBJ-EU-10'),true);
  s.players.Russia.tracks.Diplomazia=4;assert.equal(objectiveComplete(s,'OBJ-EU-10'),false);
});
test('a short game at marker 39 ends at this round closure and never draws a new event', () => {
  const s=setup();s.mode='breve';s.turnMarker=39;
  const next=close(s);
  assert.equal(next.phase,'ended');assert.equal(next.result?.reason,'points');
  assert.equal(next.turnMarker,39);assert.equal(next.round,1);assert.deepEqual(next.eventDeck,['E05']);
});
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
  assert.equal(s.players.Iran.tracks.Consenso,6); assert.equal(s.players.Coalizione.tracks.Consenso,4);
  assert.equal(s.players.Iran.tracks.Economia,3);assert.equal(s.players.Russia.tracks.Diplomazia,5);
  assert.equal(s.players.Coalizione.tracks.Consenso,4,'no Iran control bonus to Coalition');
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

function botPresenceTurn(s: EngineState, f: Faction, cardId: string) {
  s.turnIndex = s.order.indexOf(f); s.phase = 'activation';
  s.deck = [FACTION_CARDS.find(c => !c.options.some(o => o.boost.faction === f))!.id];
  const track = BOT_CARDS.find(c => c.id === cardId)!.track;
  for (const t of ['Economia', 'Militare', 'Diplomazia', 'Consenso'] as const) s.players[f].tracks[t] = t === track ? 2 : 6;
  s.botDecks[f][track] = [cardId];
  return reduce(s, f, { type: 'advance-bot' }, rng);
}
test('BOT without units replaces only its first Development with the base unit in the printed State', () => {
  const cardId = 'BOT-CO-C2';
  const next = botPresenceTurn(setup(['Coalizione']), 'Coalizione', cardId);
  const placed = next.units.filter(u => u.faction === 'Coalizione');
  assert.equal(placed.length, 1); assert.equal(placed[0].type, 'CO-U01');
  assert.equal(placed[0].territory, BOT_INFLUENCE[cardId]);
  assert.ok(next.log.some(l => l.includes('presenza minima')));
});
test('BOT presence leaves existing units, printed deployment and older saved rules unchanged', () => {
  const withUnit = setup(['Europa']); unit(withUnit, 'EU-U01', 'Europa', 'libano');
  const a = botPresenceTurn(withUnit, 'Europa', 'BOT-EU-C2');
  assert.equal(a.units.filter(u => u.faction === 'Europa').length, 1);
  assert.ok(!a.log.some(l => l.includes('presenza minima')));
  const printed = BOT_CARDS.find(c => c.faction === 'Iran' && /^Schiera/.test(c.priority2) && !/Schiera/.test(c.priority1))!;
  const b = botPresenceTurn(setup(['Iran']), 'Iran', printed.id);
  assert.ok(!b.log.some(l => l.includes('presenza minima')));
  for (const revision of [undefined, '2026-11-16'] as const) {
    const old = setup(['Coalizione']); old.rulesRevision = revision;
    const c = botPresenceTurn(old, 'Coalizione', 'BOT-CO-C2');
    assert.equal(c.units.length, 0); assert.ok(!c.log.some(l => l.includes('presenza minima')));
  }
});
test('all five BOT factions can deploy their actual base unit through minimum presence', () => {
  for (const f of FACTIONS) {
    const card = BOT_CARDS.find(c => c.faction === f && !/Schiera|Attacco/.test(c.priority2) && /Sviluppo/.test(c.priority2))!;
    const next = botPresenceTurn(setup([f]), f, card.id);
    const placed = next.units.filter(u => u.faction === f);
    assert.equal(placed.length, 1, `${f} ${card.id}`);
    assert.equal(UNITS.find(u => u.id === placed[0].type)!.name, BOT_BASE_UNIT[f]);
    assert.equal(placed[0].territory, BOT_INFLUENCE[card.id]);
  }
});
test('minimum presence does not alter a drawn faction event or add deployment after maintenance', () => {
  const s = setup(['Russia']); s.turnIndex = s.order.indexOf('Russia');
  const own = FACTION_CARDS.find(c => c.options.some(o => o.boost.faction === 'Russia'))!;
  s.deck = [own.id];
  const event = reduce(s, 'Russia', { type: 'advance-bot' }, rng);
  assert.equal(event.units.length, 0);
  assert.ok(!event.log.some(l => l.includes('presenza minima')));
  const retained = setup(['Coalizione']); unit(retained, 'CO-U01', 'Coalizione', 'kuwait');
  retained.units[0].rotated = true;
  const maintained = botPresenceTurn(retained, 'Coalizione', 'BOT-CO-C2');
  assert.equal(maintained.units.length, 1); assert.equal(maintained.units[0].rotated, false);
  assert.ok(maintained.log.some(l => l.includes('Mantenimento gratuito')));
  assert.ok(!maintained.log.some(l => l.includes('presenza minima')));
});
test('minimum presence keeps remaining Development actions, marker cost and permanent Influence intact', () => {
  const s = setup(['Coalizione']); s.advancers = ['Coalizione']; s.turnMarker = 0;
  s.influence = [{ id: 'permanent', faction: 'Coalizione', territory: 'kuwait', slot: 0 }];
  const next = botPresenceTurn(s, 'Coalizione', 'BOT-CO-C2'); // Consensus in crisis selects Development ×2.
  assert.equal(next.units.length, 1);
  assert.equal(next.players.Coalizione.tracks.Consenso, 3, 'only one of the two Developments is replaced');
  assert.equal(next.turnMarker, 2, 'BOT card still advances by two');
  assert.deepEqual(next.influence, s.influence);
  assert.equal(next.rulesRevision, s.rulesRevision);
});

// ── Bonus persistenti delle unità e Blocco di Hormuz (2026-11-26) ─────────────────────────
const inf=(s:EngineState,faction:Faction,territory:string)=>{const m={id:`i${(s.nextInfluence??0)}`,faction,territory,slot:(s.influence??[]).filter(i=>i.territory===territory).length};s.nextInfluence=(s.nextInfluence??0)+1;(s.influence??=[]).push(m);return m;};
test('Influence discounts are local, Russian fleet works only in Syria and Lebanon, and are not cumulative', () => {
  const s=setup();
  const base={iran:influenceCost(s,'Iran','iraq'),cina:influenceCost(s,'Cina','oman'),europa:influenceCost(s,'Europa','libano'),russia:influenceCost(s,'Russia','siria'),turchia:influenceCost(s,'Russia','turchia')};
  unit(s,'IR-U03','Iran','iraq'); unit(s,'IR-U03','Iran','iraq'); unit(s,'CN-U01','Cina','oman'); unit(s,'EU-U03','Europa','libano'); unit(s,'RU-U04','Russia','hormuz');
  assert.equal(influenceCost(s,'Iran','iraq'),Math.max(1,base.iran-1));
  assert.equal(influenceCost(s,'Cina','oman'),Math.max(1,base.cina-1));
  assert.equal(influenceCost(s,'Europa','libano'),Math.max(1,base.europa-1));
  assert.equal(influenceCost(s,'Russia','siria'),Math.max(1,base.russia-1));
  assert.equal(influenceCost(s,'Russia','turchia'),base.turchia,'la Flotta nel Mediterraneo non vale in Turchia');
  assert.equal(influenceCost(s,'Iran','siria'),influenceCost(setup(),'Iran','siria'),'il Proxy vale solo nel suo Stato');
});
test('Interferenza: an enemy Cyber raises Influence and deployment costs in its State only, never for its owner', () => {
  const s=setup(); const inf0=influenceCost(s,'Iran','iraq'), dep0=deployCost(s,'Iran','IR-U01','iraq');
  unit(s,'RU-U06','Russia','iraq');
  assert.equal(influenceCost(s,'Iran','iraq'),inf0+1); assert.equal(deployCost(s,'Iran','IR-U01','iraq'),dep0+1);
  assert.equal(influenceCost(s,'Russia','iraq'),influenceCost(setup(),'Russia','iraq'));
  assert.equal(influenceCost(s,'Iran','siria'),influenceCost(setup(),'Iran','siria'));
  unit(s,'CN-U06','Cina','iraq'); assert.equal(influenceCost(s,'Iran','iraq'),inf0+1,'più Cyber non si sommano');
  const irgc=setup(); unit(irgc,'IR-U06','Iran','iraq'); assert.equal(influenceCost(irgc,'Coalizione','iraq'),influenceCost(setup(),'Coalizione','iraq'),'la IRGC Cyber Unit resta un’unità di combattimento');
});
test('Presidio: Iranian conventional forces protect Iranian Influence only in Iran; Coalition and Chinese presidio work in their State', () => {
  const s=ops(setup(),'Europa');
  const inIran=inf(s,'Iran','iran'), inIraq=inf(s,'Iran','iraq'), coal=inf(s,'Coalizione','kuwait'), cn=inf(s,'Cina','oman');
  unit(s,'IR-U01','Iran','iran'); unit(s,'IR-U01','Iran','iraq'); unit(s,'CO-U01','Coalizione','kuwait'); unit(s,'CN-U04','Cina','oman');
  for(const m of [inIran,coal,cn]) assert.throws(()=>reduce(structuredClone(s),'Europa',{type:'destabilize',influenceId:m.id},rng),/Presidio/);
  const next=reduce(structuredClone(s),'Europa',{type:'destabilize',influenceId:inIraq.id},rng);
  assert.ok(!next.influence!.some(i=>i.id===inIraq.id),'fuori dall’Iran le Forze convenzionali non proteggono');
});
test('Caschi blu make an attack cost 2 OP more; Diplomazia UE lowers European Pressure by 1 OP', () => {
  const s=setup(); assert.equal(attackCost(s,'libano'),2); unit(s,'EU-U01','Europa','libano'); assert.equal(attackCost(s,'libano'),4);
  const a=ops(structuredClone(s),'Coalizione'); unit(a,'CO-U01','Coalizione','libano'); unit(a,'IR-U01','Iran','libano'); a.ops!.remaining=3;
  assert.throws(()=>reduce(a,'Coalizione',{type:'attack',territoryId:'libano'},rng),/Servono 4 OP/);
  const e=ops(setup(),'Europa'); e.players.Europa.tracks.Diplomazia=5; unit(e,'EU-U04','Europa','egitto');
  const after=reduce(e,'Europa',{type:'pressure',track:'Opinione',delta:1},rng);
  assert.equal(after.ops!.remaining,19,'Diplomazia Stabile: 2 OP − 1');
});
test('Rotte protette / Rotte sicure absorb one Economy loss per round from correlations and events', () => {
  const s=ops(setup(),'Russia'); unit(s,'EU-U02','Europa','oman');
  const eco=s.players.Europa.tracks.Economia;
  const one=reduce(s,'Russia',{type:'develop',track:'Economia',correlation:0},rng);
  assert.equal(one.players.Europa.tracks.Economia,eco,'prima perdita ignorata');
  assert.ok(one.log.some(l=>l.includes('Missione navale UE')));
  const two=reduce(one,'Russia',{type:'develop',track:'Economia',correlation:0},rng);
  assert.equal(two.players.Europa.tracks.Economia,eco-1,'la seconda perdita nello stesso round si applica');
});
test('Tecnologia duale adds +1 to Iran’s defense; Forze Speciali cost the Coalition 1 Consenso when it loses', () => {
  const fight=(td:boolean,low=false)=>{
    let s=ops(setup(),'Coalizione'); unit(s,'CO-U02','Coalizione','iraq'); unit(s,'IR-U01','Iran','iraq');
    if(low){ unit(s,'IR-U01','Iran','iraq'); unit(s,'IR-U01','Iran','iraq'); }
    if(td) unit(s,'CN-U03','Cina','iraq');
    if(low) s.players.Coalizione.tracks.Militare=1;
    s=reduce(s,'Coalizione',{type:'attack',territoryId:'iraq'},rng);
    while(s.phase==='support') s=reduce(s,s.pending!.actor,{type:'support',side:'none'},rng);
    return s;
  };
  assert.equal(fight(true).combat!.defense,fight(false).combat!.defense+1);
  let lost=fight(false,true); assert.equal(lost.combat!.loser,'Coalizione');
  const cons=lost.players.Coalizione.tracks.Consenso;
  lost=reduce(lost,'Coalizione',{type:'casualties',unitIds:lost.pending!.kind==='casualty'?lost.pending!.unitIds.slice(0,lost.pending!.count):[]},rng);
  assert.equal(lost.players.Coalizione.tracks.Consenso,cons-2,'−1 per la sconfitta, −1 per le Forze Speciali');
});
test('Forze Speciali cause the extra Coalition Consenso loss only when one is actually removed', () => {
  const resolve=(casualty:'CO-U01'|'CO-U02')=>{
    const s=setup(); unit(s,'CO-U01','Coalizione','iraq'); unit(s,'CO-U02','Coalizione','iraq');
    const removed=s.units.find(u=>u.type===casualty)!;
    s.phase='casualty'; s.turnIndex=s.order.indexOf('Coalizione');
    s.pending={kind:'casualty',actor:'Coalizione',count:1,unitIds:[removed.id]};
    s.combat={attacker:'Iran',defender:'Coalizione',territory:'iraq',supporters:[],supportIndex:0,support:{},attack:4,defense:3,dice:[4,3],winner:'Iran',loser:'Coalizione',casualties:1};
    const before=s.players.Coalizione.tracks.Consenso;
    return {next:reduce(s,'Coalizione',{type:'casualties',unitIds:[removed.id]},rng),before};
  };
  const regular=resolve('CO-U01');
  assert.equal(regular.next.players.Coalizione.tracks.Consenso,regular.before-1,'solo la normale penalità per la sconfitta');
  const special=resolve('CO-U02');
  assert.equal(special.next.players.Coalizione.tracks.Consenso,special.before-2,'penalità aggiuntiva solo quando viene rimossa Forze Speciali');
});
test('Blocco di Hormuz: activation costs Crisi Bellica and Opinione once; each round end hits Europe, China and Iran and helps Russia', () => {
  let s=ops(setup(),'Iran'); unit(s,'IR-U05','Iran','hormuz');
  s=reduce(s,'Iran',{type:'deploy',unitId:'IR-U05',territoryId:'hormuz'},rng);
  assert.ok(hormuzBlocked(s)); assert.equal(s.hormuzBlockade,true);
  assert.equal(s.globals['Crisi Bellica'],6); assert.equal(s.globals.Opinione,-1);
  s=reduce(s,'Iran',{type:'deploy',unitId:'IR-U05',territoryId:'hormuz'},rng);
  assert.equal(s.globals['Crisi Bellica'],6,'una terza Flotta non riattiva il Blocco');
  s.ops=null;s.phase='activation';
  const before=structuredClone(s.players);
  unit(s,'CN-U02','Cina','oman');
  const after=close(s);
  assert.equal(after.players.Europa.tracks.Economia,before.Europa.tracks.Economia-1);
  assert.equal(after.players.Cina.tracks.Economia,before.Cina.tracks.Economia,'Flotta commerciale assorbe la perdita');
  assert.equal(after.players.Russia.tracks.Economia,before.Russia.tracks.Economia+1);
  assert.equal(after.players.Iran.tracks.Economia,before.Iran.tracks.Economia-1);
  assert.equal(after.players.Iran.tracks.Consenso,before.Iran.tracks.Consenso+1);
  const broken=ops(structuredClone(after),'Coalizione'); broken.ops!.remaining=20;
  const freed=reduce(broken,'Coalizione',{type:'deploy',unitId:'CO-U04',territoryId:'hormuz'},rng);
  assert.ok(!hormuzBlocked(freed)); assert.equal(freed.hormuzBlockade,false);
});
test('current rules: deployment has no one-shot effects; Rete informativa peeks once per activation where the target is present', () => {
  const s=ops(setup(),'Cina'); const before=structuredClone(s.players);
  for(const [id,t] of [['CN-U01','oman'],['CN-U03','qatar'],['CN-U04','egitto']] as const) reduce(s,'Cina',{type:'deploy',unitId:id,territoryId:t},rng);
  assert.deepEqual(s.players.Cina.tracks,before.Cina.tracks);
  const c=ops(setup(),'Cina'); unit(c,'IR-U01','Iran','iraq');
  assert.doesNotThrow(()=>reduce(structuredClone(c),'Cina',{type:'deploy',unitId:'CN-U06',territoryId:'qatar'},rng),'Cyber senza bersaglio');
  const r=setup(); r.turnIndex=r.order.indexOf('Russia'); unit(r,'RU-U05','Russia','iraq'); unit(r,'IR-U01','Iran','iraq'); r.players.Iran.hand=['C073C'];
  assert.ok(canPeek(r,'Russia','Iran')); assert.ok(!canPeek(r,'Russia','Europa'));
  const seen=reduce(r,'Russia',{type:'peek',target:'Iran'},rng);
  assert.deepEqual(seen.intel.Russia.at(-1)!.hand,['C073C']); assert.ok(!canPeek(seen,'Russia','Iran'),'una volta per attivazione');
  const old=setup(); delete old.rulesRevision; old.turnIndex=old.order.indexOf('Russia'); unit(old,'RU-U05','Russia','iraq'); unit(old,'IR-U01','Iran','iraq');
  assert.ok(!canPeek(old,'Russia','Iran'),'non nei salvataggi precedenti');
});

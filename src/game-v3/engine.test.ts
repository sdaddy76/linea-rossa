/** Run by bundling this entry with esbuild (platform=node), then node --test the output. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduce, currentActor, canDeploy, deployCost, hormuzBlocked, type EngineState, type PlacedUnit } from './engine';
import { botCondition, botPlan, weakestTrack, chooseBotCorrelation } from './bots';
import { objectiveComplete, controlsTerritory } from './objectives';
import { FACTIONS, TRACKS, FACTION_CARDS, EVENTS, BOT_CARDS, OBJECTIVES, UNITS, TERRITORIES, INITIAL_TRACKS, CORRELATIONS, type Faction } from './catalog';

const rng = () => 0.31;
function fixture(): EngineState {
  const s = createGame({ bots: [] }, rng);
  s.phase = 'activation'; s.pending = null; s.result = null; s.queue = []; s.combat = null; s.ops = null;
  s.order = [...FACTIONS]; s.turnIndex = 0; s.round = 1; s.actualRound = 1; s.lap = 1; s.roundBlocked = false; s.advancers = [];
  s.globals = { Nucleare: 4, Sanzioni: 3, 'Crisi Bellica': 7, Opinione: 0 };
  for (const f of FACTIONS) { s.players[f].tracks = { ...INITIAL_TRACKS[f] }; s.players[f].vetoUsed = false; s.players[f].points = 0; }
  return s;
}
function ops(s = fixture(), actor: Faction = 'Iran', budget = 20) {
  s.turnIndex = s.order.indexOf(actor); s.phase = 'ops'; s.continuation = 'ops';
  s.ops = { actor, card: FACTION_CARDS[0].id, remaining: budget, pressured: [] }; return s;
}
function unit(s: EngineState, faction: Faction, name: string, place = 'Iran'): PlacedUnit {
  const d = UNITS.find(d => d.faction === faction && d.name.toLowerCase() === name.toLowerCase())!;
  assert.ok(d, `unit ${faction}/${name}`);
  const t = TERRITORIES.find(t => t.name === place || t.name.includes(place))!; assert.ok(t, place);
  const u = { id: `u${s.nextUnit++}`, type: d.id, faction, territory: t.id, placedRound: s.actualRound, rotated: false };
  s.units.push(u); return u;
}
test('setup shares an ordinary deck; only humans receive five cards and three objectives', () => {
  const s = createGame({ bots: ['Russia', 'Cina', 'Europa'] }, rng);
  assert.equal(s.players.Iran.hand.length, 5); assert.equal(s.players.Coalizione.objectives.length, 3);
  assert.equal(s.players.Russia.hand.length, 0); assert.equal(s.players.Russia.objectives.length, 0);
  assert.equal(s.deck.length, 322); assert.equal(s.specialReserve.length, 15);
  assert.equal(new Set([...s.deck, ...s.specialReserve, ...FACTIONS.flatMap(f => s.players[f].hand)]).size, 347);
  assert.equal(s.order.length, 5);
});
test('OP budget supports multiple actions; pressure once/global; invalid command leaves input intact', () => {
  let s = fixture(); const card = FACTION_CARDS.find(c => c.cost === 4)!; s.players.Iran.hand = [card.id];
  s.players.Iran.tracks.Diplomazia = 8;
  s = reduce(s, 'Iran', { type: 'begin-ops', cardId: card.id }, rng);
  s = reduce(s, 'Iran', { type: 'pressure', track: 'Nucleare', delta: 1 }, rng); assert.equal(s.ops!.remaining, 3);
  const before = JSON.stringify(s);
  assert.throws(() => reduce(s, 'Iran', { type: 'pressure', track: 'Nucleare', delta: 1 }, rng));
  assert.equal(JSON.stringify(s), before);
  s = reduce(s, 'Iran', { type: 'develop', track: 'Economia', correlation: 0 }, rng);
  assert.equal(s.ops!.remaining, 1); assert.equal(s.players.Iran.tracks.Economia, 5);
  assert.equal(s.players.Cina.tracks.Economia, 8);
  s = reduce(s, 'Iran', { type: 'pressure', track: 'Opinione', delta: -1 }, rng);
  assert.equal(s.ops!.remaining, 0); assert.equal(s.globals.Opinione, -1);
  s = reduce(s, 'Iran', { type: 'finish-ops' }, rng); assert.equal(currentActor(s), 'Coalizione');
});
test('all faction-specific pressure restrictions are enforced', () => {
  for (const f of FACTIONS) {
    const s = ops(fixture(), f);
    assert.equal((() => { try { reduce(s, f, { type: 'pressure', track: 'Nucleare', delta: 1 }, rng); return true; } catch { return false; } })(), f === 'Iran');
    assert.equal((() => { try { reduce(s, f, { type: 'pressure', track: 'Sanzioni', delta: 1 }, rng); return true; } catch { return false; } })(), f === 'Coalizione' || f === 'Europa');
  }
});
test('event applies boost, explicit veto, globals, dividend and special unlock in order', () => {
  let s = fixture();
  const card = FACTION_CARDS.find(c => c.unlocksSpecial && c.options.some(o => o.correlation.delta < 0 && o.boost.faction !== 'Iran'))!;
  assert.ok(card);
  const i = card.options.findIndex(o => o.correlation.delta < 0 && o.boost.faction !== 'Iran'), option = card.options[i];
  s.players.Iran.hand = [card.id]; s.players[option.correlation.faction].tracks.Diplomazia = 8;
  const old = s.players[option.correlation.faction].tracks[option.correlation.track], reserve = s.specialReserve.length;
  s = reduce(s, 'Iran', { type: 'play-event', cardId: card.id, option: i }, rng);
  assert.equal(s.phase, 'veto'); assert.equal(currentActor(s), option.correlation.faction);
  assert.equal(s.players.Iran.points, 0); assert.equal(s.specialReserve.length, reserve);
  s = reduce(s, option.correlation.faction, { type: 'veto', use: true }, rng);
  assert.equal(s.players[option.correlation.faction].vetoUsed, true);
  if (option.correlation.track !== 'Diplomazia') assert.equal(s.players[option.correlation.faction].tracks[option.correlation.track], old);
  assert.equal(s.players.Iran.points, 1); assert.equal(s.specialReserve.length, reserve - 1);
});
test('development clamps at ten and still resolves exactly one correlation, with no chains', () => {
  const s = ops(); s.players.Iran.tracks.Economia = 10;
  const next = reduce(s, 'Iran', { type: 'develop', track: 'Economia', correlation: 0 }, rng);
  assert.equal(next.players.Iran.tracks.Economia, 10); assert.equal(next.players.Cina.tracks.Economia, 8);
  assert.equal(next.players.Europa.tracks.Economia, s.players.Europa.tracks.Economia);
});
test('shared territory capacity, naval restriction, unit maxima and Hormuz surcharge', () => {
  const s = ops(); s.globals['Crisi Bellica'] = 8; s.players.Iran.tracks.Economia = 8;
  const fleet = UNITS.find(u => u.name === 'Flotta veloce del Golfo')!, carrier = UNITS.find(u => u.name === 'Carrier Strike Group')!;
  const hormuz = TERRITORIES.find(t => t.name.includes('Hormuz'))!, jordan = TERRITORIES.find(t => t.name === 'Giordania')!;
  assert.equal(canDeploy(s, 'Iran', fleet.id, jordan.id), false);
  unit(s, 'Iran', fleet.name, 'Hormuz'); unit(s, 'Iran', fleet.name, 'Hormuz');
  assert.equal(hormuzBlocked(s), true); assert.equal(canDeploy(s, 'Coalizione', carrier.id, hormuz.id), false);
  const coast = TERRITORIES.find(t => t.name === 'Iran')!;
  const before = deployCost(s, 'Coalizione', carrier.id, coast.id);
  s.units.pop(); assert.equal(hormuzBlocked(s), false); assert.equal(deployCost(s, 'Coalizione', carrier.id, coast.id), before - 1);
  const missile = UNITS.find(u => u.name === 'Missili balistici')!;
  unit(s, 'Iran', missile.name); unit(s, 'Iran', missile.name);
  assert.equal(canDeploy(s, 'Iran', missile.id, coast.id), false);
});
test('intelligence requires explicit target and cyber requires an opponent in same territory', () => {
  let s = ops(fixture(), 'Russia');
  const intel = UNITS.find(u => u.faction === 'Russia' && u.name === 'Intelligence')!;
  const cyber = UNITS.find(u => u.name === 'Cyber Russia')!;
  const syria = TERRITORIES.find(t => t.name === 'Siria')!;
  assert.throws(() => reduce(s, 'Russia', { type: 'deploy', unitId: intel.id, territoryId: syria.id }, rng));
  s = reduce(s, 'Russia', { type: 'deploy', unitId: intel.id, territoryId: syria.id, target: 'Iran' }, rng);
  assert.deepEqual(s.intel.Russia[0].hand, s.players.Iran.hand);
  assert.throws(() => reduce(s, 'Russia', { type: 'deploy', unitId: cyber.id, territoryId: syria.id, target: 'Iran' }, rng));
  unit(s, 'Iran', 'Forze convenzionali', 'Siria');
  const eco = s.players.Iran.tracks.Economia;
  s = reduce(s, 'Russia', { type: 'deploy', unitId: cyber.id, territoryId: syria.id, target: 'Iran' }, rng);
  assert.equal(s.players.Iran.tracks.Economia, eco - 1);
});
test('defending shield cancels ballistic attack bonus, defender wins ties, loser chooses casualties', () => {
  let s = ops(); s.players.Iran.tracks.Militare = 4; s.players.Coalizione.tracks.Militare = 4;
  const missile = unit(s, 'Iran', 'Missili balistici'), shield = unit(s, 'Coalizione', 'Scudo Missilistico');
  const remote = unit(s, 'Iran', 'IRGC', 'Iraq');
  s = reduce(s, 'Iran', { type: 'attack', territoryId: missile.territory }, () => 0);
  assert.equal(s.phase, 'casualty'); assert.equal(s.combat!.attack, 1); assert.equal(s.combat!.defense, 5);
  assert.equal(s.pending!.actor, 'Iran');
  s = reduce(s, 'Iran', { type: 'casualties', unitIds: [missile.id] }, rng);
  assert.equal(s.phase, 'ops'); assert.ok(s.units.some(u => u.id === remote.id)); assert.ok(s.units.some(u => u.id === shield.id));
  assert.equal(s.players.Iran.tracks.Consenso, 4);
});
test('support is chosen in event order; supporting units cannot be casualties; S400 blocks air', () => {
  let s = ops(fixture(), 'Coalizione'); s.players.Iran.tracks.Militare = 4; s.players.Coalizione.tracks.Militare = 4;
  const air = unit(s, 'Coalizione', 'Aviazione Tattica'), irgc = unit(s, 'Iran', 'IRGC'), sam = unit(s, 'Russia', 'Difesa aerea S-400');
  s = reduce(s, 'Coalizione', { type: 'attack', territoryId: air.territory }, () => 0);
  assert.equal(s.phase, 'support'); assert.equal(currentActor(s), 'Russia');
  s = reduce(s, 'Russia', { type: 'support', side: 'defender' }, () => 0);
  assert.equal(s.combat!.attack, 1); assert.equal(s.combat!.defense, 9);
  assert.equal(s.combat!.winner, 'Iran');
  assert.throws(() => reduce(s, 'Coalizione', { type: 'casualties', unitIds: [sam.id] }, rng));
  s = reduce(s, 'Coalizione', { type: 'casualties', unitIds: [air.id] }, rng);
  assert.ok(s.units.some(u => u.id === sam.id)); assert.ok(s.units.some(u => u.id === irgc.id));
});
test('corrected rulebook: one defending shield cancels BOTH attacking ballistic missiles', () => {
  let s = ops();
  s.players.Iran.tracks.Militare = 7; s.players.Coalizione.tracks.Militare = 7;
  unit(s, 'Iran', 'Missili balistici'); unit(s, 'Iran', 'Missili balistici');
  const irgc = unit(s, 'Iran', 'IRGC');
  unit(s, 'Coalizione', 'Scudo Missilistico');
  s = reduce(s, 'Iran', {type:'attack', territoryId:irgc.territory}, () => 0);
  assert.equal(s.combat!.attack, 4, 'IRGC 3 + both missiles 0 + die 1');
  assert.equal(s.combat!.defense, 5, 'shield 4 + die 1');
  assert.equal(s.combat!.winner, 'Coalizione');
  assert.equal(s.combat!.casualties, 1);
});
test('declaration reaches total war immediately, before support or dice', () => {
  const s = ops(); s.globals['Crisi Bellica'] = 2;
  const a = unit(s, 'Iran', 'IRGC'); unit(s, 'Coalizione', 'Convenzionale');
  const next = reduce(s, 'Iran', { type: 'attack', territoryId: a.territory }, () => { throw new Error('dice must not be rolled'); });
  assert.equal(next.phase, 'ended'); assert.equal(next.result!.reason, 'war'); assert.deepEqual(next.result!.winners, []);
});
test('end round tension, score, rotation/expiry and explicit excess-hand discard', () => {
  let s = ops(fixture(), 'Europa'); s.lap = 2; s.turnIndex = 4;
  s.globals.Sanzioni = 8; s.globals.Nucleare = 12; s.globals.Opinione = -6;
  for (const f of FACTIONS) s.players[f].hand = [];
  s.players.Iran.tracks.Consenso = 2; s.players.Iran.hand = FACTION_CARDS.filter(c => !c.special).slice(0, 5).map(c => c.id);
  s.deck = s.deck.filter(id => !s.players.Iran.hand.includes(id));
  const old = unit(s, 'Russia', 'Consiglieri militari', 'Siria'); old.rotated = true;
  const fresh = unit(s, 'Iran', 'IRGC');
  s = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.equal(s.phase, 'discard'); assert.equal(s.pending!.actor, 'Iran'); assert.equal(s.globals['Crisi Bellica'], 6);
  assert.equal(s.players.Iran.tracks.Economia, 3); assert.equal(s.players.Iran.tracks.Diplomazia, 5);
  assert.ok(!s.units.some(u => u.id === old.id)); assert.equal(s.units.find(u => u.id === fresh.id)!.rotated, true);
  const discard = s.players.Iran.hand[0];
  s = reduce(s, 'Iran', { type: 'discard', cardIds: [discard] }, rng);
  assert.equal(s.round, 2); assert.equal(s.actualRound, 2);
});
test('ordinary discard is reshuffled, special card is permanently removed', () => {
  let s = fixture();
  const special = FACTION_CARDS.find(c => c.special)!; s.players.Iran.hand = [special.id]; s.specialReserve = s.specialReserve.filter(id => id !== special.id);
  s = reduce(s, 'Iran', { type: 'begin-ops', cardId: special.id }, rng);
  assert.ok(s.removed.includes(special.id)); assert.ok(!s.discard.includes(special.id));
  s.turnIndex = 4; s.ops!.actor = 'Europa'; s.lap = 2;
  const ordinary = FACTION_CARDS.find(c => !c.special)!; s.deck = []; s.discard = [ordinary.id];
  FACTIONS.forEach(f => { s.players[f].hand = []; });
  s = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.ok(FACTIONS.some(f => s.players[f].hand.includes(ordinary.id)));
});
test('war has precedence over simultaneous nuclear/sanctions endpoint event', () => {
  const s = ops(fixture(), 'Europa'); s.lap = 2; s.turnIndex = 4;
  FACTIONS.forEach(f => { s.players[f].hand = []; }); s.deck = []; s.discard = [];
  s.globals.Nucleare = 13; s.globals.Sanzioni = 7; s.globals['Crisi Bellica'] = 2;
  const e = EVENTS.find(e => e.globals.some(c => c.track === 'Nucleare' && c.delta >= 2) && e.globals.some(c => c.track === 'Crisi Bellica' && c.delta < 0))!;
  assert.ok(e); s.eventDeck = [e.id, ...s.eventDeck.filter(id => id !== e.id)];
  // Nuclear tension occurs first at round end, so keep Nucleare below its tension threshold until the event.
  s.globals.Nucleare = 11;
  const eventNuclear = e.globals.find(c => c.track === 'Nucleare')!.delta;
  s.globals.Nucleare = 15 - eventNuclear;
  if (s.globals.Nucleare >= 12) s.globals['Crisi Bellica'] = 3;
  const next = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.equal(next.result!.reason, 'war');
});
test('every printed BOT P1/P2 parses and every condition evaluates', () => {
  const s = fixture();
  for (const card of BOT_CARDS) {
    assert.doesNotThrow(() => botCondition(s, card.faction, card.condition), card.id);
    assert.doesNotThrow(() => botPlan(s, card.faction, card.priority1, card.condition), `${card.id}/P1`);
    assert.doesNotThrow(() => botPlan(s, card.faction, card.priority2, card.condition), `${card.id}/P2`);
  }
});
test('BOT weakest-track tie order and adversarial/positive correlation targets', () => {
  const s = fixture(); FACTIONS.forEach(f => TRACKS.forEach(t => { s.players[f].tracks[t] = 5; }));
  assert.equal(weakestTrack(s, 'Iran'), 'Militare'); assert.equal(weakestTrack(s, 'Cina'), 'Economia');
  s.players.Europa.points = 10; s.players.Iran.points = 3;
  const links = CORRELATIONS.Coalizione.Economia;
  assert.equal(links[chooseBotCorrelation(s, 'Coalizione', 'Economia')].faction, 'Europa');
});
test('all-bot games progress with bounded commands without hands/objectives', () => {
  for (let seed = 1; seed <= 20; seed++) {
    let value = seed;
    const seeded = () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
    let s = createGame({ bots: [...FACTIONS] }, seeded);
    for (let n = 0; n < 90 && s.phase !== 'ended'; n++) {
      assert.equal(s.phase, 'activation', `seed ${seed}, ${s.phase}`);
      s = reduce(s, currentActor(s)!, { type: 'advance-bot' }, seeded);
    }
    assert.equal(s.phase, 'ended', `seed ${seed}`);
    FACTIONS.forEach(f => { assert.equal(s.players[f].hand.length, 0); assert.equal(s.players[f].objectives.length, 0); });
  }
});
test('all 75 objective predicates are defined; control requires strict plurality', () => {
  const s = fixture();
  for (const o of OBJECTIVES) assert.equal(typeof objectiveComplete(s, o), 'boolean', o.id);
  const a = unit(s, 'Iran', 'IRGC', 'Siria'); assert.equal(controlsTerritory(s, 'Iran', a.territory), true);
  unit(s, 'Russia', 'Consiglieri militari', 'Siria'); assert.equal(controlsTerritory(s, 'Iran', a.territory), false);
});
test('final scoring adds alignment PF, completed objectives and tracks at ten exactly once', () => {
  const s = ops(fixture(), 'Europa'); s.round = 6; s.actualRound = 6; s.lap = 2; s.turnIndex = 4;
  s.deck = []; s.discard = [];
  FACTIONS.forEach(f => { s.players[f].hand = []; s.players[f].objectives = []; TRACKS.forEach(t => { s.players[f].tracks[t] = 5; }); });
  s.players.Iran.points = 4; s.players.Iran.tracks.Economia = 10; s.players.Iran.tracks.Consenso = 7;
  s.players.Iran.objectives = [OBJECTIVES.find(o => o.faction === 'Iran' && o.number === 9)!.id];
  const hostile = TERRITORIES.find(t => t.alignment.Iran === 2)!;
  unit(s, 'Iran', 'Forze convenzionali', hostile.name);
  const next = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.equal(next.result!.reason, 'points'); assert.equal(next.players.Iran.points, 13); assert.deepEqual(next.result!.winners, ['Iran']);
  assert.throws(() => reduce(next, 'Iran', { type: 'skip' }, rng));
});
test('final tie breaks on track total, then consensus; a perfect tie remains shared', () => {
  function ending() {
    const s = ops(fixture(), 'Europa'); s.round = 6; s.actualRound = 6; s.lap = 2; s.turnIndex = 4; s.deck = []; s.discard = [];
    FACTIONS.forEach(f => { s.players[f].hand = []; s.players[f].objectives = []; TRACKS.forEach(t => { s.players[f].tracks[t] = 5; }); });
    return s;
  }
  assert.deepEqual(reduce(ending(), 'Europa', { type: 'finish-ops' }, rng).result!.winners, [...FACTIONS]);
  const total = ending(); total.players.Cina.tracks.Economia = 6;
  assert.deepEqual(reduce(total, 'Europa', { type: 'finish-ops' }, rng).result!.winners, ['Cina']);
  const consensus = ending(); consensus.players.Russia.tracks.Consenso = 6; consensus.players.Russia.tracks.Economia = 4;
  assert.deepEqual(reduce(consensus, 'Europa', { type: 'finish-ops' }, rng).result!.winners, ['Russia']);
});
test('blocked advancement repeats the sixth marker, with an absolute ceiling of eight actual rounds', () => {
  let s = ops(fixture(), 'Europa'); s.round = 6; s.actualRound = 6; s.roundBlocked = true; s.lap = 2; s.turnIndex = 4;
  s.deck = []; s.discard = []; FACTIONS.forEach(f => { s.players[f].hand = []; });
  const neutral = EVENTS.find(e => e.globals.every(c => c.track !== 'Crisi Bellica' || c.delta >= 0) && e.globals.every(c => c.track !== 'Nucleare' || c.delta <= 0))!;
  s.eventDeck = [neutral.id];
  s = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.equal(s.round, 6); assert.equal(s.actualRound, 7); assert.notEqual(s.phase, 'ended');
  s = ops(s, 'Europa'); s.roundBlocked = true; s.actualRound = 8; s.lap = 2; s.turnIndex = 4;
  s = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.equal(s.phase, 'ended'); assert.equal(s.result!.reason, 'points');
});
test('pressure costs 3/2/1 by current diplomacy and enforces every faction/direction combination', () => {
  for (const dip of [1, 3, 4, 7, 8, 10]) {
    const s = ops(); s.players.Iran.tracks.Diplomazia = dip;
    const next = reduce(s, 'Iran', { type: 'pressure', track: 'Opinione', delta: 1 }, rng);
    assert.equal(next.ops!.remaining, 20 - (dip <= 3 ? 3 : dip >= 8 ? 1 : 2));
  }
  for (const actor of FACTIONS) for (const delta of [-1, 1] as const) for (const track of ['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione'] as const) {
    const s = ops(fixture(), actor);
    const allowed = track === 'Nucleare' ? (delta === 1 ? actor === 'Iran' : ['Coalizione', 'Europa'].includes(actor)) :
      track === 'Sanzioni' ? (delta === 1 ? ['Coalizione', 'Europa'].includes(actor) : ['Iran', 'Russia', 'Cina'].includes(actor)) : true;
    if (allowed) assert.doesNotThrow(() => reduce(s, actor, { type: 'pressure', track, delta }, rng), `${actor}/${track}/${delta}`);
    else assert.throws(() => reduce(s, actor, { type: 'pressure', track, delta }, rng), `${actor}/${track}/${delta}`);
  }
});
test('deployment cost exhaustively applies crisis/economy/alignment bands with a minimum of one', () => {
  for (const actor of FACTIONS) for (const crisis of [2, 4, 5, 7, 8, 10]) for (const eco of [1, 3, 4, 7, 8, 10]) for (const territory of TERRITORIES) {
    const s = fixture(); s.globals['Crisi Bellica'] = crisis; s.players[actor].tracks.Economia = eco;
    const d = UNITS.find(u => u.faction === actor)!;
    const expected = Math.max(1, d.cost + (crisis <= 4 ? 2 : crisis <= 7 ? 1 : 0) + (eco <= 3 ? 1 : eco >= 8 ? -1 : 0) + territory.alignment[actor]);
    assert.equal(deployCost(s, actor, d.id, territory.id), expected);
  }
});
test('all printed placement boosts and both EU diplomacy options apply directly without correlations', () => {
  const boosts = [
    ['Cina', 'Investimenti BRI', 'Diplomazia'],
    ['Cina', 'Tecnologia duale', 'Militare'],
    ['Cina', 'Infrastrutture', 'Consenso'],
    ['Europa', 'Aiuti umanitari', 'Consenso'],
  ] as const;
  const iran = TERRITORIES.find(t => t.name === 'Iran')!;
  for (const [f, name, track] of boosts) {
    const s = ops(fixture(), f), def = UNITS.find(u => u.faction === f && u.name === name)!;
    const next = reduce(s, f, { type: 'deploy', unitId: def.id, territoryId: iran.id }, rng);
    assert.equal(next.players[f].tracks[track], s.players[f].tracks[track] + 1, name);
    for (const other of FACTIONS.filter(o => o !== f)) assert.deepEqual(next.players[other].tracks, s.players[other].tracks, `${name} has no correlation`);
  }
  const peace = UNITS.find(u => u.name === 'Caschi blu')!, diplomacy = UNITS.find(u => u.name === 'Diplomazia UE')!;
  assert.equal(reduce(ops(fixture(), 'Europa'), 'Europa', { type: 'deploy', unitId: peace.id, territoryId: iran.id }, rng).globals.Opinione, 1);
  for (const effect of ['sanctions', 'opinion'] as const) {
    const s = ops(fixture(), 'Europa');
    const next = reduce(s, 'Europa', { type: 'deploy', unitId: diplomacy.id, territoryId: iran.id, diplomacyEffect: effect }, rng);
    assert.equal(next.globals.Sanzioni, effect === 'sanctions' ? 2 : 3);
    assert.equal(next.globals.Opinione, effect === 'opinion' ? 1 : 0);
  }
  assert.throws(() => reduce(ops(fixture(), 'Europa'), 'Europa', { type: 'deploy', unitId: diplomacy.id, territoryId: iran.id }, rng));
});
test('all three intelligence and all three placement cyber definitions require and honor explicit targets', () => {
  const place = TERRITORIES.find(t => t.name === 'Iran')!;
  for (const def of UNITS.filter(u => /intelligence|satelliti/i.test(u.name))) {
    const s = ops(fixture(), def.faction);
    assert.throws(() => reduce(s, def.faction, { type: 'deploy', unitId: def.id, territoryId: place.id }, rng));
    const next = reduce(s, def.faction, { type: 'deploy', unitId: def.id, territoryId: place.id, target: 'Coalizione' }, rng);
    assert.deepEqual(next.intel[def.faction][0], { target: 'Coalizione', hand: s.players.Coalizione.hand, activation: s.activation });
    assert.doesNotThrow(() => reduce(s, def.faction, { type: 'deploy', unitId: def.id, territoryId: place.id, target: def.faction }, rng));
  }
  for (const def of UNITS.filter(u => /^cyber (russia|unit)$/i.test(u.name))) {
    const s = ops(fixture(), def.faction);
    unit(s, 'Coalizione', 'Convenzionale');
    assert.throws(() => reduce(s, def.faction, { type: 'deploy', unitId: def.id, territoryId: place.id, target: 'Iran' }, rng));
    const next = reduce(s, def.faction, { type: 'deploy', unitId: def.id, territoryId: place.id, target: 'Coalizione' }, rng);
    assert.equal(next.players.Coalizione.tracks.Economia, s.players.Coalizione.tracks.Economia - 1);
  }
});
test('winning proxy and drone units each apply their additional consensus penalty', () => {
  let s = ops(); s.players.Iran.tracks.Militare = 4; s.players.Coalizione.tracks.Militare = 4;
  s.players.Coalizione.tracks.Consenso = 6;
  const proxy = unit(s, 'Iran', 'Proxy regionali'); unit(s, 'Iran', 'Droni Shahed');
  const loser = unit(s, 'Coalizione', 'Convenzionale');
  let roll = 0; s = reduce(s, 'Iran', { type: 'attack', territoryId: proxy.territory }, () => roll++ === 0 ? 0.99 : 0);
  assert.equal(s.combat!.winner, 'Iran');
  s = reduce(s, 'Coalizione', { type: 'casualties', unitIds: [loser.id] }, rng);
  assert.equal(s.players.Coalizione.tracks.Consenso, 3); // loss -1, proxy -1, drone -1
});
test('Coalition victory applies special forces diplomacy and cruise nuclear effects, only in Iran', () => {
  for (const place of ['Iran', 'Iraq']) {
    let s = ops(fixture(), 'Coalizione'); s.players.Iran.tracks.Militare = 4; s.players.Coalizione.tracks.Militare = 4;
    const forces = unit(s, 'Coalizione', 'Forze Speciali', place); unit(s, 'Coalizione', 'Missili da crociera', place);
    const loser = unit(s, 'Iran', 'Forze convenzionali', place);
    let roll = 0; s = reduce(s, 'Coalizione', { type: 'attack', territoryId: forces.territory }, () => roll++ === 0 ? 0.99 : 0);
    s = reduce(s, 'Iran', { type: 'casualties', unitIds: [loser.id] }, rng);
    assert.equal(s.players.Coalizione.tracks.Diplomazia, 5);
    assert.equal(s.globals.Nucleare, place === 'Iran' ? 3 : 4);
  }
});
test('IRGC cyber subtracts opposing defense and defending arms supplies add the printed +1', () => {
  let s = ops(); s.players.Iran.tracks.Militare = 4; s.players.Coalizione.tracks.Militare = 4;
  const cyber = unit(s, 'Iran', 'IRGC Cyber Unit'); unit(s, 'Coalizione', 'Convenzionale');
  s = reduce(s, 'Iran', { type: 'attack', territoryId: cyber.territory }, () => 0);
  assert.equal(s.combat!.attack, 2); assert.equal(s.combat!.defense, 1);
  s = ops(fixture(), 'Coalizione'); s.players.Iran.tracks.Militare = 4; s.players.Coalizione.tracks.Militare = 4;
  const forces = unit(s, 'Coalizione', 'Forze Speciali'); unit(s, 'Iran', 'Forze convenzionali'); unit(s, 'Russia', 'Forniture armi');
  s = reduce(s, 'Coalizione', { type: 'attack', territoryId: forces.territory }, () => 0);
  s = reduce(s, 'Russia', { type: 'support', side: 'defender' }, () => 0);
  assert.equal(s.combat!.defense, 3); // conventional 1 + supplies 1 + die 1
});
function queuedGlobals(changes: { track: 'Nucleare' | 'Sanzioni' | 'Crisi Bellica' | 'Opinione'; delta: number }[], preset?: Partial<EngineState['globals']>) {
  const s = ops(); Object.assign(s.globals, preset); s.phase = 'veto';
  s.pending = { kind: 'veto', actor: 'Iran', change: { faction: 'Iran', track: 'Economia', delta: -1 } };
  s.queue = [{ kind: 'globals', changes }];
  return reduce(s, 'Iran', { type: 'veto', use: false }, rng);
}
test('all global tracks clamp at both ends; a single effect gives war precedence in every order', () => {
  for (const track of ['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione'] as const) {
    const low = queuedGlobals([{ track, delta: -100 }]);
    assert.equal(low.globals[track], track === 'Opinione' ? -10 : 1);
    const high = queuedGlobals([{ track, delta: 100 }]);
    assert.equal(high.globals[track], track === 'Nucleare' ? 15 : 10);
  }
  const effects = [
    { track: 'Nucleare', delta: 100 }, { track: 'Sanzioni', delta: 100 }, { track: 'Crisi Bellica', delta: -100 },
  ] as const;
  for (const ordering of [effects, [...effects].reverse(), [effects[1], effects[2], effects[0]]]) {
    const next = queuedGlobals([...ordering]); assert.equal(next.result!.reason, 'war'); assert.deepEqual(next.result!.winners, []);
  }
  assert.equal(queuedGlobals([{ track: 'Nucleare', delta: 100 }, { track: 'Nucleare', delta: -1 }]).result!.reason, 'nuclear');
});
test('BOT presence condition distinguishes the acting subject from the Iran territory', () => {
  const s = fixture(); unit(s, 'Iran', 'IRGC');
  assert.equal(botCondition(s, 'Iran', 'La Coalizione ha unità in Iran'), false);
  unit(s, 'Coalizione', 'Convenzionale');
  assert.equal(botCondition(s, 'Iran', 'La Coalizione ha unità in Iran'), true);
  s.globals.Nucleare = 10; s.globals['Crisi Bellica'] = 4;
  assert.equal(botCondition(s, 'Coalizione', 'Nucleare ≥ 10, Crisi Bellica ≥ 4 e la Coalizione ha unità in Iran'), true);
});
test('BOT fallback territory order is the printed chapter-14 order, not catalog board order', () => {
  let s = fixture(); s.turnIndex = s.order.indexOf('Cina'); s.players.Cina.bot = true;
  s.players.Cina.tracks.Economia = 1; s.globals['Crisi Bellica'] = 6;
  s.deck = [FACTION_CARDS.find(c => !c.special && c.options.every(o => o.boost.faction !== 'Cina'))!.id];
  s.botDecks.Cina.Economia = ['BOT-CN-E6'];
  s = reduce(s, 'Cina', { type: 'advance-bot' }, rng);
  const infrastructure = s.units.find(u => u.faction === 'Cina' && UNITS.find(d => d.id === u.type)?.name === 'Infrastrutture')!;
  assert.equal(TERRITORIES.find(t => t.id === infrastructure.territory)!.name, 'Iraq');
});
test('every card has three options and BOT decks contain exactly six cards with explicit P1/P2', () => {
  assert.equal(FACTION_CARDS.length, 347);
  FACTION_CARDS.forEach(card => { assert.equal(card.options.length, 3, card.id); assert.equal(new Set(card.options.map(o => o.boost.faction)).size, 3, card.id); });
  for (const f of FACTIONS) for (const t of TRACKS) {
    const deck = BOT_CARDS.filter(c => c.faction === f && c.track === t); assert.equal(deck.length, 6);
    deck.forEach(c => { assert.ok(c.condition && c.priority1 && c.priority2); });
  }
});
test('public action logs describe card/option, OP actions and effects without exposing private hands/objectives/intelligence', () => {
  let s = fixture(); const card = FACTION_CARDS.find(c => c.cost === 4)!; s.players.Iran.hand = [card.id];
  s = reduce(s, 'Iran', { type: 'begin-ops', cardId: card.id }, rng);
  s = reduce(s, 'Iran', { type: 'develop', track: 'Economia', correlation: 0 }, rng);
  assert.ok(s.log.some(l => l.includes(`[${card.id}]`) && l.includes('4 OP')));
  assert.ok(s.log.some(l => l.includes('Sviluppo Economia')));
  assert.ok(s.log.some(l => l.includes('Economia 4 → 5')));
  s = ops(fixture(), 'Russia'); s.players.Coalizione.hand = ['PRIVATE-HAND']; s.players.Russia.objectives = ['PRIVATE-OBJECTIVE'];
  const intel = UNITS.find(u => u.faction === 'Russia' && u.name === 'Intelligence')!;
  s = reduce(s, 'Russia', { type: 'deploy', unitId: intel.id, territoryId: 'siria', target: 'Coalizione' }, rng);
  assert.ok(s.log.some(l => l.includes('schiera Intelligence in Siria')));
  assert.ok(!s.log.some(l => /PRIVATE-HAND|PRIVATE-OBJECTIVE/.test(l)));
  assert.deepEqual(s.intel.Russia[0].hand, ['PRIVATE-HAND']);
});
test('BOT log exposes the exact revealed BOT card ID and executed priority', () => {
  let s = fixture(); s.players.Iran.bot = true; s.players.Iran.tracks.Economia = 1;
  s.deck = [FACTION_CARDS.find(c => !c.special && c.options.every(o => o.boost.faction !== 'Iran'))!.id];
  s.botDecks.Iran.Economia = ['BOT-IR-E1'];
  s = reduce(s, 'Iran', { type: 'advance-bot' }, rng);
  assert.ok(s.log.some(l => l.includes('[BOT-IR-E1]') && l.includes('P2')));
});
test('a unit rotates on its first real round end and expires only on its second real round end', () => {
  let s = ops(fixture(), 'Europa'); s.lap = 2; s.turnIndex = 4; s.deck = []; s.discard = [];
  FACTIONS.forEach(f => { s.players[f].hand = []; });
  const placed = unit(s, 'Iran', 'IRGC');
  const neutral = EVENTS.find(e => !e.globals.some(c => c.track === 'Crisi Bellica' && c.delta < 0))!;
  s.eventDeck = [neutral.id, neutral.id];
  s = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.equal(s.units.find(u => u.id === placed.id)!.rotated, true);
  s = ops(s, 'Europa'); s.lap = 2; s.turnIndex = 4;
  s = reduce(s, 'Europa', { type: 'finish-ops' }, rng);
  assert.ok(!s.units.some(u => u.id === placed.id));
});
test('peacekeepers have a three-per-territory limit even when a fourth shared slot remains', () => {
  const s = fixture(), def = UNITS.find(u => u.name === 'Caschi blu')!, t = TERRITORIES.find(t => t.name === 'Siria')!;
  for (let i = 0; i < 3; i++) unit(s, 'Europa', 'Caschi blu', 'Siria');
  assert.equal(s.units.length, 3); assert.equal(t.capacity, 4); assert.equal(canDeploy(s, 'Europa', def.id, t.id), false);
});
test('every simple printed numeric BOT condition respects its threshold on both sides', () => {
  let checked = 0;
  for (const card of BOT_CARDS) {
    const m = card.condition.match(/^(?:(Iran|Coalizione|Russia|Cina|Europa)\s+)?(Economia|Militare|Diplomazia|Consenso|Nucleare|Sanzioni|Crisi Bellica|Opinione)\s*([≥≤])\s*(−?\d+)$/);
    if (!m) continue;
    checked++;
    const threshold = Number(m[4].replace('−', '-'));
    for (const value of [threshold - 1, threshold, threshold + 1]) {
      const s = fixture();
      if (m[2] in s.globals) s.globals[m[2] as keyof typeof s.globals] = value;
      else s.players[(m[1] ?? card.faction) as Faction].tracks[m[2] as keyof typeof s.players.Iran.tracks] = value;
      assert.equal(botCondition(s, card.faction, card.condition), m[3] === '≥' ? value >= threshold : value <= threshold, `${card.id}/${value}`);
    }
  }
  assert.ok(checked >= 80);
});

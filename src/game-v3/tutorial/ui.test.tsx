import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import GuidedGame from './GuidedGame';
import CombatIntro, { ATTACK, BATTLE, COMBAT_SCENES, DEFENSE } from './CombatIntro';
import RoundIntro, { ROUND_SCENES, ROUND_SEEN_KEY, valuesAt } from './RoundIntro';
import ComponentsIntro, { INTRO_SEEN_KEY, MUSIC_SRC, SCENES, framing, stepMs } from './ComponentsIntro';
import { STORAGE_KEY, choose, currentLesson, freshSession, recommendedChoice, replaySession, type Session } from './model';

test('public tutorial renders semantic controls, genuine board, five factions, three-option introduction', () => {
  const html = renderToStaticMarkup(<GuidedGame onExit={() => {}} onPlay={() => {}} />);
  for (const label of ['Partita', 'guidata', 'Indietro', 'Avanti', 'Ricomincia', 'Velocità', 'Salta il tutorial', 'Perché?', 'Iran', 'Coalizione', 'Russia', 'Cina', 'Europa', 'Mediazione UE']) assert.ok(html.includes(label), label);
  assert.ok(html.includes('/assets/tabletop-v3/board.jpg'));
  assert.ok(html.includes('aria-label="Controlli del tutorial"'));
  assert.ok(html.includes('guide-preview-options'));
  assert.ok(html.includes('/assets/tabletop-v3/faction-cards/C097.jpg?v=2026-11-23-base'));
  assert.ok(html.includes('Fronte originale: Mediazione UE'));
  assert.ok(html.includes('chi la provoca è escluso dalla vittoria'));
  assert.ok(!html.includes('tutti perdono'));
  assert.ok(!html.includes('supabase'));
});
test('resumed summary is computed, accessible and contains both completion actions', () => {
  let session: Session = freshSession();
  while (currentLesson(replaySession(session)).id !== 'summary') session = choose(session, recommendedChoice(replaySession(session))!.id);
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem: (key: string) => key === STORAGE_KEY ? JSON.stringify(session) : null },
    matchMedia: () => ({ matches: true }),
  } });
  try {
    const html = renderToStaticMarkup(<GuidedGame onExit={() => {}} onPlay={() => {}} />);
    assert.ok(html.includes('Tutorial completato'));
    assert.ok(html.includes('Inizia una partita vera'));
    assert.ok(html.includes('Rigioca il tutorial'));
    assert.ok(html.includes('data-reduced-motion="true"'));
    assert.ok(html.includes('Stato finale dei tracciati'));
    assert.ok(html.includes('3 PV'));
    assert.ok(html.includes('al massimo una volta per round'));
    assert.ok(html.includes('non occupano riquadri'));
    assert.ok(!html.includes('caselle condivise'));
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});
test('first visit opens the animated components introduction over the guided game', () => {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem: (key: string) => store[key] ?? null, setItem: (key: string, value: string) => { store[key] = value; } },
    matchMedia: () => ({ matches: false }),
  } });
  try {
    const html = renderToStaticMarkup(<GuidedGame onExit={() => {}} onPlay={() => {}} />);
    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('Cinque potenze, una crisi'));
    assert.ok(html.includes('Salta l’introduzione'));
    assert.ok(html.includes('Mediazione UE'), 'the guided game stays rendered underneath');
    store[INTRO_SEEN_KEY] = '1';
    const again = renderToStaticMarkup(<GuidedGame onExit={() => {}} onPlay={() => {}} />);
    assert.ok(!again.includes('Cinque potenze, una crisi'));
    assert.ok(again.includes('I componenti del gioco'), 'the introduction can be reopened');
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});
test('every introduction scene renders real component art that exists on disk', () => {
  const seen = new Set<string>();
  SCENES.forEach((scene, i) => scene.steps.forEach((_, j) => {
    const html = renderToStaticMarkup(<ComponentsIntro onClose={() => {}} initialScene={i} initialStep={j} />);
    assert.ok(html.includes(scene.title), scene.id);
    for (const [, src] of html.matchAll(/src="([^"]+)"/g)) seen.add(src.split('?')[0]);
    if (i === SCENES.length - 1) assert.ok(html.includes('Inizia la partita guidata'));
  }));
  assert.ok(seen.size >= 15);
  for (const src of seen) {
    assert.ok(src.startsWith('/'), src);
    assert.ok(existsSync(`public${decodeURIComponent(src)}`), `missing ${src}`);
  }
});
test('framing keeps the zoomed image inside the frame', () => {
  for (const scene of SCENES) for (const step of scene.steps) {
    const m = /translate\(([-\d.]+)%, ([-\d.]+)%\) scale\(([\d.]+)\)/.exec(String(framing(step.focus).transform))!;
    const [tx, ty, s] = m.slice(1).map(Number);
    assert.ok(s >= 1 && s <= 3);
    assert.ok(tx <= 0 && tx >= 100 - 100 * s - 1e-9 && ty <= 0 && ty >= 100 - 100 * s - 1e-9);
  }
});
test('introduction gives enough reading time and offers themed background music', () => {
  for (const scene of SCENES) for (const step of scene.steps) assert.ok(stepMs(step.text) >= 6500 && stepMs(step.text) >= step.text.length * 60, step.text);
  assert.ok(existsSync(`public${MUSIC_SRC.split('?')[0]}`));
  const html = renderToStaticMarkup(<ComponentsIntro onClose={() => {}} />);
  assert.ok(html.includes('<audio') && html.includes('loop'));
  assert.ok(html.includes('Musica'));
});
test('round animation follows the printed event and card and runs after the components', () => {
  assert.deepEqual(valuesAt(1).globals, { Nucleare: 6, Sanzioni: 4, 'Crisi Bellica': 7, Opinione: 1 });
  assert.equal(valuesAt(1).tracks.Iran.Consenso, 4);
  const end = valuesAt(4);
  assert.equal(end.tracks.Europa.Diplomazia, 8);
  assert.equal(end.tracks.Cina.Diplomazia, 4);
  assert.equal(end.globals['Crisi Bellica'], 8);
  assert.equal(end.pv, 0);
  const seen = new Set<string>();
  ROUND_SCENES.forEach((scene, i) => scene.steps.forEach((_, j) => {
    assert.equal(scene.stages.length, scene.steps.length, scene.id);
    const html = renderToStaticMarkup(<RoundIntro onClose={() => {}} initialScene={i} initialStep={j} />);
    assert.ok(html.includes(scene.title));
    for (const [, src] of html.matchAll(/src="([^"]+)"/g)) seen.add(src.split('?')[0]);
  }));
  for (const src of seen) assert.ok(existsSync(`public${decodeURIComponent(src)}`), `missing ${src}`);
  const store: Record<string, string> = { [INTRO_SEEN_KEY]: '1' };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem: (key: string) => store[key] ?? null, setItem: (key: string, value: string) => { store[key] = value; } },
    matchMedia: () => ({ matches: false }),
  } });
  try {
    const html = renderToStaticMarkup(<GuidedGame onExit={() => {}} onPlay={() => {}} />);
    assert.ok(html.includes('Si scopre l’Evento'), 'round animation opens once the components were seen');
    assert.ok(html.includes('Come si gioca un round'));
    store[ROUND_SEEN_KEY] = '1';
    assert.ok(!renderToStaticMarkup(<GuidedGame onExit={() => {}} onPlay={() => {}} />).includes('Si scopre l’Evento'));
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});
test('combat animation shows exactly the guided game battle computed by the engine', () => {
  let session: Session = freshSession(), crisisBefore = 0, consensusBefore = 0;
  while (currentLesson(replaySession(session)).id !== 'special') {
    const t = replaySession(session);
    if (currentLesson(t).id === 'declare') { crisisBefore = t.game.globals['Crisi Bellica']; consensusBefore = t.game.players.Iran.tracks.Consenso; }
    session = choose(session, recommendedChoice(t)!.id);
  }
  const t = replaySession(session), c = t.game.combat!;
  assert.deepEqual([c.attacker, c.defender, c.territory, c.support.Russia], ['Coalizione', 'Iran', 'iraq', 'defender']);
  assert.deepEqual(c.dice, BATTLE.dice);
  assert.equal(c.attack, ATTACK); assert.equal(c.defense, DEFENSE);
  assert.deepEqual([crisisBefore, t.game.globals['Crisi Bellica']], BATTLE.crisis);
  assert.equal(t.game.players.Coalizione.tracks.Militare, BATTLE.military.Coalizione);
  assert.equal(t.game.players.Iran.tracks.Militare, BATTLE.military.Iran);
  while (currentLesson(replaySession(session)).id !== 'oil') session = choose(session, recommendedChoice(replaySession(session))!.id);
  assert.deepEqual([consensusBefore, replaySession(session).game.players.Iran.tracks.Consenso], BATTLE.consensus);
  const seen = new Set<string>();
  COMBAT_SCENES.forEach((scene, i) => scene.steps.forEach((_, j) => {
    const html = renderToStaticMarkup(<CombatIntro onClose={() => {}} initialScene={i} initialStep={j} />);
    assert.ok(html.includes(scene.title));
    for (const [, src] of html.matchAll(/src="([^"]+)"/g)) seen.add(src.split('?')[0]);
  }));
  for (const src of seen) assert.ok(existsSync(`public${decodeURIComponent(src)}`), `missing ${src}`);
});

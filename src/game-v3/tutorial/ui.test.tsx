import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import GuidedGame from './GuidedGame';
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

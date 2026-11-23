import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import GuidedGame from './GuidedGame';
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

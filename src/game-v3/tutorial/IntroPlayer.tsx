import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import './components-intro.css';

export type Focus = { x: number; y: number; w: number; h: number };      // percentuali dell'immagine
export interface IntroStep { text: string; focus?: Focus }
export interface IntroScene { id: string; kicker: string; title: string; steps: IntroStep[] }
export const FULL: Focus = { x: 0, y: 0, w: 100, h: 100 };

/** Tempo di lettura: base per l'animazione più circa 15 caratteri al secondo. */
export function stepMs(text: string) { return Math.max(6500, 3000 + text.length * 65); }
export const MUSIC_SRC = '/assets/tabletop-v3/audio/tema-intro.mp3?v=2026-11-26';
export const MUSIC_KEY = 'linea-rossa.guided-components.music';
const MUSIC_VOLUME = 0.35;
function musicPreference() {
  try { return typeof window === 'undefined' || window.localStorage.getItem(MUSIC_KEY) !== 'off'; } catch { return true; }
}

/** Inquadra il riquadro richiesto: scala e sposta l'immagine senza lasciare bordi vuoti. */
export function framing(f: Focus = FULL): CSSProperties {
  const scale = Math.min(3, 0.92 * Math.min(100 / f.w, 100 / f.h));
  const s = Math.max(1, scale);
  const clamp = (v: number) => Math.min(0, Math.max(100 - 100 * s, v));
  const tx = clamp(50 - (f.x + f.w / 2) * s), ty = clamp(50 - (f.y + f.h / 2) * s);
  return { transform: `translate(${tx}%, ${ty}%) scale(${s})` };
}

export function Framed({ src, alt, focus, ratio }: { src: string; alt: string; focus?: Focus; ratio: number }) {
  return <div className="intro-frame" style={{ '--ratio': ratio } as CSSProperties}>
    <div className="intro-frame-inner" style={framing(focus)}>
      <img src={src} alt={alt} />
      {focus && focus !== FULL && <span className="intro-highlight" style={{ left: `${focus.x}%`, top: `${focus.y}%`, width: `${focus.w}%`, height: `${focus.h}%` }} />}
    </div>
  </div>;
}

export function FlipCard({ back, front, alt, flipped }: { back: string; front: string; alt: string; flipped: boolean }) {
  return <div className={`intro-flip ${flipped ? 'is-flipped' : ''}`}>
    <div className="intro-flip-inner">
      <img className="intro-flip-back" src={back} alt="" />
      <img className="intro-flip-front" src={front} alt={alt} />
    </div>
  </div>;
}

export interface PlayerProps { onClose: () => void; reduced?: boolean; initialScene?: number; initialStep?: number }
interface Props<S extends IntroScene> extends PlayerProps {
  scenes: S[]; label: string; render: (scene: S, step: number) => ReactNode;
  finalLabel?: string; onFinish?: () => void;
}

/** Lettore comune delle animazioni introduttive: scorre da solo, si sfoglia, ha musica e tempi di lettura. */
export function IntroPlayer<S extends IntroScene>({ scenes: SCENES, label, render, finalLabel = 'Inizia la partita guidata', onFinish, onClose, reduced = false, initialScene = 0, initialStep = 0 }: Props<S>) {
  const [scene, setScene] = useState(initialScene);
  const [step, setStep] = useState(initialStep);
  const [playing, setPlaying] = useState(!reduced);
  const [music, setMusic] = useState(musicPreference);
  const closeButton = useRef<HTMLButtonElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const current = SCENES[scene];
  const last = scene === SCENES.length - 1 && step === current.steps.length - 1;
  const duration = stepMs(current.steps[step].text);

  function next() {
    if (step < current.steps.length - 1) setStep(step + 1);
    else if (scene < SCENES.length - 1) { setScene(scene + 1); setStep(0); }
    else setPlaying(false);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
    else if (scene > 0) { setScene(scene - 1); setStep(SCENES[scene - 1].steps.length - 1); }
  }
  function goTo(i: number) { setScene(i); setStep(0); }

  useEffect(() => {
    if (!playing || last) return;
    const timer = setTimeout(next, duration);
    return () => clearTimeout(timer);
  });
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (!music) { a.pause(); return; }
    a.volume = 0;
    let fade: ReturnType<typeof setInterval> | undefined;
    a.play().then(() => {
      fade = setInterval(() => { a.volume = Math.min(MUSIC_VOLUME, a.volume + 0.02); if (a.volume >= MUSIC_VOLUME && fade) clearInterval(fade); }, 80);
    }).catch(() => setMusic(false)); // il browser blocca l'audio finché non si interagisce con la pagina
    return () => { if (fade) clearInterval(fade); };
  }, [music]);
  useEffect(() => () => audio.current?.pause(), []);
  function toggleMusic() {
    const on = !music;
    setMusic(on);
    try { window.localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch { /* preferenza non salvabile */ }
  }
  useEffect(() => { closeButton.current?.focus(); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { setPlaying(false); next(); }
      else if (e.key === 'ArrowLeft') { setPlaying(false); prev(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title" data-reduced-motion={reduced}>
    <div className="intro-panel">
      <header className="intro-top">
        <span className="intro-kicker">{current.kicker}</span>
        <audio ref={audio} src={MUSIC_SRC} loop preload="auto" />
        <button className="intro-music" onClick={toggleMusic} aria-pressed={music} title={music ? 'Disattiva la musica' : 'Attiva la musica'}>{music ? <Volume2 size={15} /> : <VolumeX size={15} />} Musica</button>
        <button ref={closeButton} className="intro-skip" onClick={onClose}>Salta l’introduzione <X size={15} /></button>
      </header>
      <div className="intro-stage" key={current.id}>
        {render(current, step)}
      </div>
      <section className="intro-text">
        <h2 id="intro-title">{current.title}</h2>
        <p key={`${scene}-${step}`} aria-live="polite">{current.steps[step].text}</p>
        <div className={`intro-timer ${playing && !last ? 'is-running' : ''}`} key={`timer-${scene}-${step}-${playing}`} style={{ '--step-ms': `${duration}ms` } as CSSProperties} aria-hidden="true"><i /></div>
        {current.steps.length > 1 && <div className="intro-substeps" aria-hidden="true">{current.steps.map((_, i) => <i key={i} className={i <= step ? 'is-on' : ''} />)}</div>}
      </section>
      <footer className="intro-controls">
        <button onClick={() => { setPlaying(false); prev(); }} disabled={scene === 0 && step === 0}><ArrowLeft size={16} /> Indietro</button>
        <button onClick={() => setPlaying(!playing)} aria-pressed={playing}>{playing ? <><Pause size={16} /> Pausa</> : <><Play size={16} /> Riproduci</>}</button>
        <nav className="intro-dots" aria-label={label}>{SCENES.map((s, i) =>
          <button key={s.id} className={i === scene ? 'is-current' : i < scene ? 'is-done' : ''} onClick={() => { setPlaying(false); goTo(i); }} aria-label={s.title} aria-current={i === scene ? 'step' : undefined} />)}</nav>
        {last ? <button className="intro-primary" onClick={onFinish ?? onClose}>{finalLabel} <ArrowRight size={16} /></button>
          : <button className="intro-primary" onClick={() => { setPlaying(false); next(); }}>Avanti <ArrowRight size={16} /></button>}
      </footer>
    </div>
  </div>;
}

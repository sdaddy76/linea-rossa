import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Flag, Play } from 'lucide-react';
import { ANIMATION_LIST, AnimationOverlay, animationMinutes, type AnimationId } from './animations';
import './rules-library.css';

/** Pagina "Regole animate": tutte le animazioni del regolamento, senza passare dalla partita guidata. */
export default function RulesLibrary({ onExit, onTutorial, initial }: { onExit: () => void; onTutorial: () => void; initial?: AnimationId }) {
  const [open, setOpen] = useState<AnimationId | null>(initial ?? null);
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  const total = ANIMATION_LIST.reduce((n, a) => n + animationMinutes(a), 0);
  return <main className="rules-library">
    <div className="rules-library-shell">
      <header><button onClick={onExit}><ArrowLeft size={16} /> Torna a Linea Rossa</button></header>
      <section className="rules-library-title">
        <p><Flag size={14} /> Impara le regole</p>
        <h1>Regole <span>animate</span></h1>
        <p className="rules-library-sub">Il regolamento di Linea Rossa spiegato con brevi animazioni, con le carte e i componenti veri. Guardale in ordine oppure scegli solo quella che ti serve: in tutto circa {total} minuti.</p>
        <button className="rules-library-cta" onClick={() => setOpen(ANIMATION_LIST[0].id)}><Play size={16} /> Guarda dall’inizio</button>
      </section>
      <ol className="rules-library-grid">{ANIMATION_LIST.map((a, i) =>
        <li key={a.id}><button onClick={() => setOpen(a.id)}>
          <span className="rules-library-art"><img src={a.art} alt="" loading="lazy" /><b>{i + 1}</b></span>
          <strong>{a.title}</strong><span>{a.text}</span>
          <small><Clock size={13} /> {animationMinutes(a)} min</small>
        </button></li>)}</ol>
      <section className="rules-library-guided">
        <div><strong>Vuoi provare con le tue mani?</strong><span>La partita guidata ti fa giocare due round con il motore vero del gioco.</span></div>
        <button onClick={onTutorial}>Partita guidata</button>
      </section>
    </div>
    {open && <AnimationOverlay id={open} reduced={reduced} onClose={() => setOpen(null)}
      {...(() => {
        const i = ANIMATION_LIST.findIndex(a => a.id === open), next = ANIMATION_LIST[i + 1];
        return next ? { finalLabel: `Avanti: ${next.title}`, onFinish: () => setOpen(next.id) } : { finalLabel: 'Torna all’elenco' };
      })()} />}
  </main>;
}

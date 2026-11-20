import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getFactionCardFront } from '@/data/card-graphics';
import { eventFrontArt, botFrontArt, EVENT_BACK } from './art';
import { FACTION_CARDS } from './catalog';
import { confirmedCues, cueDuration, enqueueCues, openingEvent, type CardCue } from './card-motion';
import type { SavedTabletop } from './online';
import './card-motion.css';

const PREFERENCE_KEY = 'linea-rossa.card-motion.reduced';
export function useCardMotion(saved: SavedTabletop | null, gameId?: string) {
  const [queue, setQueue] = useState<CardCue[]>(() => saved ? openingEvent(saved.state) : []);
  const previous = useRef({ saved, gameId });
  const [reduced, setReduced] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    try { setReduced(window.localStorage.getItem(PREFERENCE_KEY) === 'true'); } catch { /* optional */ }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const old = previous.current;
    if (old.gameId !== gameId || !old.saved) {
      setQueue(saved ? openingEvent(saved.state) : []);
    } else if (saved && saved.revision > old.saved.revision) {
      const incoming = confirmedCues(old.saved.state, saved.state, saved.revision);
      setQueue(queue => enqueueCues(queue, incoming));
    }
    previous.current = { saved, gameId };
  }, [saved, gameId]);
  const active = queue[0];
  const reduceMotion = reduced || systemReduced;
  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => setQueue(queue =>
      queue[0]?.key === active.key ? queue.slice(1) : queue), cueDuration(active, reduceMotion));
    return () => window.clearTimeout(timeout);
  }, [active, reduceMotion]);
  return {
    active, reduced: reduceMotion, systemReduced,
    setReduced(value: boolean) {
      setReduced(value);
      try { window.localStorage.setItem(PREFERENCE_KEY, String(value)); } catch { /* optional */ }
    },
    dismiss() { setQueue(queue => queue.slice(1)); },
  };
}

export function CardMotion({ cue, reduced, onDismiss }: {
  cue?: CardCue; reduced: boolean; onDismiss: () => void;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const definition = FACTION_CARDS.find(c => c.id === cue?.cardId);
  const src = cue?.kind === 'event' ? eventFrontArt(cue.cardId!)
    : cue?.kind === 'bot' ? botFrontArt(cue.cardId!)
    : definition ? getFactionCardFront(definition.id, definition.origin) : null;
  // An always-mounted live region announces updates, without focus theft.
  return <div className="card-motion-layer" aria-live="polite" aria-atomic="true" data-reduced-motion={reduced}>
    {cue && <section key={cue.key} className={`card-motion-notice card-motion-${cue.kind}${definition?.special ? ' card-motion-special' : ''}`} aria-label="Carta confermata"
      style={{ '--card-motion-duration': `${cueDuration(cue, reduced)}ms` } as CSSProperties}>
      <div className="card-motion-caption">
        <span>{cue.kind === 'event' ? 'Evento rivelato' : cue.actor ? `${cue.actor} · carta giocata` : 'Tracciati aggiornati'}</span>
        <button type="button" onClick={onDismiss} aria-label="Salta questa animazione">Salta ×</button>
      </div>
      {cue.kind !== 'effects' && <div className="card-motion-perspective">
        <div className="card-motion-flip">
          {cue.kind === 'event' && <div className="card-motion-back" aria-hidden="true"><img src={EVENT_BACK} alt=""/></div>}
          <div className="card-motion-face">
            {src && failedImage !== src
              ? <img src={src} alt={cue.title} onError={() => setFailedImage(src)}/>
              : <div className="card-motion-text-card"><small>{cue.cardId} · {definition?.origin ?? cue.actor}</small>
                <h2>{cue.title}</h2>{definition && <strong>{definition.cost} OP</strong>}
                <p>{cue.detail}</p></div>}
          </div>
        </div>
      </div>}
      <div className="card-motion-description">
        <strong>{cue.title}</strong><p>{cue.detail}</p>
        {cue.changes.length > 0 && <ul aria-label="Variazioni confermate">{cue.changes.map((change, index) =>
          <li key={`${cue.key}-${index}`} style={{animationDelay: `${400 + index * 120}ms`}}
            className={change.after > change.before ? 'card-motion-up' : 'card-motion-down'}>
            <span>{change.target}</span><b>{change.after - change.before > 0 ? '+' : ''}{change.after - change.before}</b>
            <small>{change.before} → {change.after}</small>
          </li>)}</ul>}
        {cue.destination && <small className="card-motion-destination">→ {cue.destination}</small>}
      </div>
    </section>}
  </div>;
}

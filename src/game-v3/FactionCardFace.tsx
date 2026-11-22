import { useState, type CSSProperties } from 'react';
import { getFactionCardFront } from '@/data/card-graphics';
import type { FactionCard, TrackChange } from './catalog-types';
import './faction-card-face.css';

// Reuse the existing faction illustrations, never impersonate an original front.
const ART: Record<FactionCard['origin'], string> = {
  Iran: '/card-art/iran_art.png', Coalizione: '/card-art/coalizione_art.png',
  Russia: '/card-art/russia_art.png', Cina: '/card-art/cina_art.png',
  Europa: '/card-art/europa_art.png', Neutrale: '/card-art/evento_art.png',
};
const COLORS: Record<FactionCard['origin'], string> = {
  Iran: '#4ade80', Coalizione: '#60a5fa', Russia: '#f87171',
  Cina: '#fbbf24', Europa: '#a78bfa', Neutrale: '#cbd5e1',
};
const delta = (c: TrackChange) => `${c.faction} · ${c.track} ${c.delta > 0 ? '+' : '−'}${Math.abs(c.delta)}`;

/** One presentation for hand, enlarged card, public catalog and played cards.
 * Engine catalog remains the sole source of effects, not legacy illustration text. */
export function FactionCardFace({ card, compact = false }: { card: FactionCard; compact?: boolean }) {
  const original = getFactionCardFront(card.id, card.origin);
  const [failed, setFailed] = useState<string | null>(null);
  if (original && failed !== original) return <span className="faction-card-original" data-card-id={card.id} data-card-source="original">
    <img src={original} alt={`${card.id} · ${card.name} · fronte originale`} loading="lazy" draggable={false} onError={() => setFailed(original)} />
  </span>;
  return <span className={`faction-card-face${compact ? ' faction-card-compact' : ''}`}
    data-card-id={card.id} data-card-source="digital" style={{ '--faction-accent': COLORS[card.origin] } as CSSProperties}>
    <span className="faction-card-top"><span>{card.id} · {card.origin}</span><strong>{card.cost} OP</strong></span>
    <strong className="faction-card-title">{card.name}</strong>
    <img className="faction-card-art" src={ART[card.origin]} alt={`Illustrazione di fazione · ${card.origin}`} loading="lazy" draggable={false} />
    {!compact && <span className="faction-card-options">{card.options.map((option, index) =>
      <span key={index} className="faction-card-option">
        <b style={{ color: COLORS[option.boost.faction] }}>{'ABC'[index]} · {delta(option.boost)}</b>
        <span>↳ {delta(option.correlation)}</span>
        {option.globals.length > 0 && <span className="faction-card-globals">{option.globals.map(c => `${c.track} ${c.delta > 0 ? '+' : '−'}${Math.abs(c.delta)}`).join(' · ')}</span>}
      </span>)}</span>}
    <span className="faction-card-footer">{card.special ? 'SPECIALE · rimossa dopo l’uso' : 'MAZZO FAZIONI'}<small>Fronte digitale · catalogo aggiornato</small></span>
  </span>;
}

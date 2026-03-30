// =============================================
// LINEA ROSSA — CardVisual.tsx
// Layout TCG professionale con:
// - Dorso: identico per tutte le carte
// - Fronte:
//   Top-left: badge OP | Top-right: logo fazione in cerchio
//   Left strip: prerequisiti (fazione, costo, condizioni)
//   Centro: titolo + artwork illustrazione
//   Sotto artwork: descrizione effetti
//   Sotto descrizione: modificatori tracciati
//   Right edge: indicatore carte speciali/sbloccate
//   Bordo colorato per tipo carta
// =============================================
import { useState } from 'react';
import type { GameCard } from '@/types/game';
import type { DeckCard } from '@/types/game';
import CardDetailModal from './CardDetailModal';

// ─── Asset ───────────────────────────────────
export const CARD_ART: Record<string, string> = {
  Iran:       '/card-art/iran_art.png',
  Coalizione: '/card-art/coalizione_art.png',
  Russia:     '/card-art/russia_art.png',
  Cina:       '/card-art/cina_art.png',
  Europa:     '/card-art/europa_art.png',
  Neutrale:   '/card-art/evento_art.png',
};
export const CARD_BACK = '/card-art/back.png';

// ─── Colori per tipo carta (bordo) ───────────
export const CARD_TYPE_BORDER: Record<string, string> = {
  Militare:    '#ef4444',
  Diplomatico: '#3b82f6',
  Economico:   '#22c55e',
  Segreto:     '#a78bfa',
  Media:       '#f97316',
  Evento:      '#94a3b8',
  Politico:    '#f59e0b',
};

// ─── Icone per tipo carta ─────────────────────
export const CARD_TYPE_ICON: Record<string, string> = {
  Militare:    '⚔️',
  Diplomatico: '🤝',
  Economico:   '💰',
  Segreto:     '🔒',
  Media:       '📡',
  Evento:      '🌍',
  Politico:    '🏛️',
};

// ─── Emoji bandiera per fazione ──────────────
export const FACTION_FLAG: Record<string, string> = {
  Iran:       '🇮🇷',
  Coalizione: '🇺🇸',
  Russia:     '🇷🇺',
  Cina:       '🇨🇳',
  Europa:     '🇪🇺',
  Neutrale:   '🌐',
};

// ─── Colore per fazione ───────────────────────
export const FACTION_COLOR: Record<string, string> = {
  Iran:       '#22c55e',
  Coalizione: '#3b82f6',
  Russia:     '#ef4444',
  Cina:       '#f59e0b',
  Europa:     '#8b5cf6',
  Neutrale:   '#94a3b8',
};

// ─── Tracciati ────────────────────────────────
const TRACK_INFO: Record<string, { icon: string; label: string; posGood: boolean }> = {
  nucleare:  { icon: '☢️', label: 'Nuc',  posGood: false },
  sanzioni:  { icon: '💰', label: 'San',  posGood: false },
  opinione:  { icon: '🌍', label: 'Op',   posGood: true  },
  defcon:    { icon: '🎯', label: 'DEF',  posGood: false },
  risorse:   { icon: '⚡', label: 'Ris',  posGood: true  },
  stabilita: { icon: '🛡️', label: 'Stab', posGood: true  },
};

// ─── Calcola delta effetti a valore medio 5 ──
function getEffectDeltas(card: GameCard | DeckCard) {
  if (!('effects' in card) || !card.effects) return [];
  const e = card.effects as Record<string, ((v: number) => number) | undefined>;
  return Object.entries(e)
    .map(([key, fn]) => {
      if (!fn) return null;
      const ref = key === 'defcon' ? 6 : key === 'opinione' ? 0 : 5;
      const result = fn(ref);
      const delta = result - ref;
      if (delta === 0) return null;
      const info = TRACK_INFO[key];
      if (!info) return null;
      return { key, ...info, delta };
    })
    .filter(Boolean) as Array<{ key: string; icon: string; label: string; posGood: boolean; delta: number }>;
}

// ─── Prerequisiti (interpretati dalla carta) ─
function getPrerequisites(card: GameCard | DeckCard) {
  const prereqs: string[] = [];
  prereqs.push(`Faz: ${(card.faction as string).slice(0, 3)}`);
  prereqs.push(`OP: ${card.op_points}`);
  if ('deck_type' in card && card.deck_type === 'speciale') {
    prereqs.push('★ SPEC');
  }
  // Condizioni implicite dagli effetti
  if ('effects' in card && card.effects) {
    const e = card.effects as Record<string, ((v: number) => number) | undefined>;
    if (e.defcon) {
      const atLow = e.defcon(4) !== e.defcon(8);
      if (atLow) prereqs.push('DEFCON≤3');
    }
    if (e.nucleare) {
      const highNuc = e.nucleare(12) > e.nucleare(5);
      if (highNuc) prereqs.push('Nuc≥10');
    }
  }
  return prereqs;
}

// ─── Props ───────────────────────────────────
interface CardVisualProps {
  card: GameCard | DeckCard;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  selected?: boolean;
  flipped?: boolean;   // dorso visibile
  onClick?: () => void;
  showDetailOnClick?: boolean;
}

// ─── Dimensioni per size ─────────────────────
const SIZES = {
  sm: { w: 90,  h: 126, scale: 0.6 },
  md: { w: 130, h: 182, scale: 0.85 },
  lg: { w: 160, h: 224, scale: 1.0  },
};

// ─── Componente Fronte ───────────────────────
function CardFront({ card, scale }: { card: GameCard | DeckCard; scale: number }) {
  const faction    = card.faction as string;
  const cardType   = card.card_type as string;
  const artUrl     = CARD_ART[faction] ?? CARD_ART['Neutrale'];
  const borderColor = CARD_TYPE_BORDER[cardType] ?? '#445566';
  const factionColor = FACTION_COLOR[faction] ?? '#94a3b8';
  const typeIcon   = CARD_TYPE_ICON[cardType] ?? '🃏';
  const flag       = FACTION_FLAG[faction] ?? '🌐';
  const description = 'description' in card ? (card as GameCard).description : undefined;
  const deltas     = getEffectDeltas(card);
  const prereqs    = getPrerequisites(card);
  const isSpecial  = 'deck_type' in card && card.deck_type === 'speciale';

  // Base font/spacing scaled to card size
  const fs = (base: number) => Math.max(6, Math.round(base * scale));

  return (
    // Carta intera
    <div
      className="absolute inset-0 rounded-xl overflow-hidden flex"
      style={{
        background: '#0d111e',
        border: `${Math.max(1.5, 2 * scale)}px solid ${borderColor}`,
        boxShadow: `0 0 0 ${Math.max(1, scale)}px #0a0e1a inset`,
      }}
    >
      {/* ── STRIP SINISTRA: prerequisiti ── */}
      <div
        className="flex flex-col items-center justify-start py-1 gap-0.5"
        style={{
          width: Math.round(22 * scale),
          background: `linear-gradient(180deg, ${borderColor}22, ${borderColor}11)`,
          borderRight: `1px solid ${borderColor}44`,
          minWidth: Math.round(22 * scale),
        }}
      >
        {/* Tipo carta (icona ruotata) */}
        <div
          className="font-mono font-black text-center"
          style={{
            fontSize: fs(9),
            color: borderColor,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            lineHeight: 1.1,
            padding: '2px 1px',
          }}
        >
          {typeIcon}
        </div>
        <div style={{ height: Math.round(2 * scale), width: '70%', background: borderColor + '44', borderRadius: 1 }} />
        {/* Prerequisiti */}
        {prereqs.map((p, i) => (
          <div
            key={i}
            className="font-mono text-center"
            style={{
              fontSize: fs(7),
              color: i === 0 ? factionColor : borderColor,
              fontWeight: i < 2 ? 800 : 600,
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              lineHeight: 1.0,
              padding: '1px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {p}
          </div>
        ))}
      </div>

      {/* ── CORPO CENTRALE ── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ padding: `${Math.round(3*scale)}px ${Math.round(3*scale)}px` }}>

        {/* ── HEADER: OP + nome carta + flag fazione ── */}
        <div className="flex items-start" style={{ gap: Math.round(2*scale), marginBottom: Math.round(2*scale) }}>
          {/* Badge OP */}
          <div
            className="rounded font-black font-mono flex items-center justify-center shrink-0"
            style={{
              width:  Math.round(16 * scale),
              height: Math.round(16 * scale),
              fontSize: fs(10),
              background: `#0a0e1a`,
              border: `${Math.max(1, scale)}px solid ${borderColor}`,
              color: borderColor,
              boxShadow: `0 0 ${Math.round(4*scale)}px ${borderColor}66`,
            }}
          >
            {card.op_points}
          </div>
          {/* Nome carta */}
          <p
            className="font-black font-mono text-white leading-tight flex-1 min-w-0"
            style={{
              fontSize: fs(8.5),
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
              lineHeight: 1.15,
            }}
          >
            {card.card_name}
          </p>
          {/* Flag fazione in cerchio */}
          <div
            className="rounded-full flex items-center justify-center shrink-0 border"
            style={{
              width:  Math.round(16 * scale),
              height: Math.round(16 * scale),
              fontSize: fs(10),
              background: `${factionColor}18`,
              borderColor: `${factionColor}66`,
            }}
          >
            {flag}
          </div>
        </div>

        {/* ── ARTWORK ILLUSTRAZIONE ── */}
        <div
          className="relative overflow-hidden"
          style={{
            height: Math.round(52 * scale),
            borderRadius: Math.round(4 * scale),
            border: `1px solid ${borderColor}55`,
            marginBottom: Math.round(2 * scale),
          }}
        >
          <img
            src={artUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.7) saturate(1.1)' }}
          />
          {/* Tipo in overlay artwork */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center px-1 py-0.5"
            style={{ background: '#0a0e1aaa', fontSize: fs(7) }}
          >
            <span style={{ color: borderColor, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
              {typeIcon} {cardType}
            </span>
            {isSpecial && (
              <span
                className="ml-auto font-mono font-bold"
                style={{ fontSize: fs(6.5), color: '#f59e0b' }}
              >★ SPEC</span>
            )}
          </div>
        </div>

        {/* ── DESCRIZIONE EFFETTI ── */}
        {description && (
          <p
            className="font-mono italic text-[#99aabb] leading-tight"
            style={{
              fontSize: fs(7.5),
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
              marginBottom: Math.round(2 * scale),
              lineHeight: 1.2,
            }}
          >
            {description}
          </p>
        )}

        {/* ── MODIFICATORI TRACCIATI ── */}
        {deltas.length > 0 && (
          <div
            className="rounded flex flex-wrap"
            style={{
              gap: Math.round(1.5 * scale),
              padding: `${Math.round(2*scale)}px`,
              background: '#060d18',
              border: `1px solid #1e3a5f`,
              marginTop: 'auto',
            }}
          >
            {deltas.map(d => {
              const positive = d.posGood ? d.delta > 0 : d.delta < 0;
              const color = positive ? '#22c55e' : '#ef4444';
              return (
                <div
                  key={d.key}
                  className="flex items-center font-mono font-bold"
                  style={{
                    fontSize: fs(7),
                    color,
                    background: `${color}14`,
                    border: `1px solid ${color}33`,
                    borderRadius: Math.round(3 * scale),
                    padding: `${Math.round(1*scale)}px ${Math.round(2.5*scale)}px`,
                    gap: Math.round(1 * scale),
                  }}
                >
                  <span>{d.icon}</span>
                  <span style={{ fontSize: fs(6.5) }}>{d.delta > 0 ? '+' : ''}{d.delta}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ID carta ── */}
        <p
          className="font-mono text-[#2a3a4a] text-right"
          style={{ fontSize: fs(6.5), marginTop: Math.round(1*scale) }}
        >
          {card.card_id}
        </p>
      </div>

      {/* ── STRIP DESTRA: carte sbloccate / speciali ── */}
      <div
        className="flex flex-col items-center justify-center"
        style={{
          width: Math.round(14 * scale),
          background: isSpecial
            ? `linear-gradient(180deg, #f59e0b22, #f59e0b11)`
            : `linear-gradient(180deg, ${borderColor}11, transparent)`,
          borderLeft: `1px solid ${isSpecial ? '#f59e0b44' : borderColor + '22'}`,
          minWidth: Math.round(14 * scale),
        }}
      >
        {isSpecial ? (
          <>
            <span style={{ fontSize: fs(8), writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#f59e0b', fontWeight: 900 }}>★</span>
            <span
              className="font-mono font-black"
              style={{
                fontSize: fs(6),
                color: '#f59e0b',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                letterSpacing: '0.05em',
              }}
            >SPEC</span>
          </>
        ) : (
          <div
            style={{
              width: Math.max(2, Math.round(3 * scale)),
              height: '60%',
              background: `linear-gradient(180deg, ${borderColor}88, ${borderColor}22)`,
              borderRadius: 2,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Componente Dorso ────────────────────────
function CardBack({ scale }: { scale: number }) {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden"
      style={{
        border: `${Math.max(1.5, 2*scale)}px solid #8b0000`,
        boxShadow: `0 0 0 ${Math.max(1, scale)}px #3a0000 inset`,
      }}
    >
      <img
        src={CARD_BACK}
        alt="Dorso carta"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// ─── Componente principale ───────────────────
export default function CardVisual({
  card,
  size = 'md',
  disabled = false,
  selected = false,
  flipped = false,
  onClick,
  showDetailOnClick = true,
}: CardVisualProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [isFlipped, setIsFlipped] = useState(flipped);

  const { w, h, scale } = SIZES[size];

  const handleClick = () => {
    if (disabled) return;
    if (showDetailOnClick && !isFlipped) {
      setShowDetail(true);
    }
    onClick?.();
  };

  return (
    <>
      <div
        style={{
          width: w,
          height: h,
          position: 'relative',
          flexShrink: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: selected ? `translateY(-${Math.round(8*scale)}px) scale(1.04)` : undefined,
          perspective: 800,
        }}
        className={`select-none ${!disabled ? 'hover:scale-105 hover:-translate-y-1' : ''} transition-all duration-150`}
        onClick={handleClick}
      >
        {/* Glow selezione */}
        {selected && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none z-30"
            style={{
              boxShadow: `0 0 0 2px #00ff88, 0 0 ${Math.round(16*scale)}px #00ff8866`,
            }}
          />
        )}

        {/* Carta (fronte o dorso) */}
        {isFlipped
          ? <CardBack scale={scale} />
          : <CardFront card={card} scale={scale} />
        }

        {/* Bottone flip (debug / anteprima) */}
        {!disabled && process.env.NODE_ENV === 'development' && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsFlipped(f => !f); }}
            className="absolute top-0.5 right-0.5 z-40 rounded-full opacity-50 hover:opacity-100"
            style={{ fontSize: 8, background: '#333', color: '#fff', padding: '1px 3px' }}
          >↺</button>
        )}
      </div>

      {showDetail && !isFlipped && (
        <CardDetailModal card={card} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}

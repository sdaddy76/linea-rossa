// =============================================
// LINEA ROSSA — Componente visivo carta
// Mostra la carta come una vera carta da gioco
// con artwork per fazione, tipo, punti OP e descrizione
// =============================================
import { useState } from 'react';
import type { GameCard } from '@/types/game';
import type { DeckCard } from '@/types/game';
import CardDetailModal from './CardDetailModal';

// ─── Artwork per fazione ──────────────────────
export const CARD_ART: Record<string, string> = {
  Iran:       '/card-art/iran.png',
  Coalizione: '/card-art/coalizione.png',
  Russia:     '/card-art/russia.png',
  Cina:       '/card-art/cina.png',
  Europa:     '/card-art/europa.png',
  Neutrale:   '/card-art/evento.png',
  Evento:     '/card-art/evento.png',
};

// ─── Colori per fazione ───────────────────────
export const FACTION_COLOR: Record<string, string> = {
  Iran:       '#22c55e',
  Coalizione: '#3b82f6',
  Russia:     '#ef4444',
  Cina:       '#f59e0b',
  Europa:     '#8b5cf6',
  Neutrale:   '#94a3b8',
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

// ─── Colore bordo per tipo carta ──────────────
export const CARD_TYPE_BORDER: Record<string, string> = {
  Militare:    '#ef4444',
  Diplomatico: '#3b82f6',
  Economico:   '#22c55e',
  Segreto:     '#a78bfa',
  Media:       '#f97316',
  Evento:      '#94a3b8',
  Politico:    '#f59e0b',
};

// ─── Props ────────────────────────────────────
interface CardVisualProps {
  card: GameCard | DeckCard;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  showDetailOnClick?: boolean;
}

// ─── Componente carta ─────────────────────────
export default function CardVisual({
  card,
  size = 'md',
  disabled = false,
  selected = false,
  onClick,
  showDetailOnClick = true,
}: CardVisualProps) {
  const [showDetail, setShowDetail] = useState(false);

  const faction = card.faction as string;
  const cardType = card.card_type as string;
  const artUrl = CARD_ART[faction] ?? CARD_ART['Neutrale'];
  const factionColor = FACTION_COLOR[faction] ?? '#94a3b8';
  const typeIcon = CARD_TYPE_ICON[cardType] ?? '🃏';
  const typeBorder = CARD_TYPE_BORDER[cardType] ?? '#334455';
  const description = 'description' in card ? card.description : undefined;

  // Dimensioni in base alla size
  const dims = {
    sm: { w: 80,  h: 112, nameSize: 9,  opSize: 14, artH: 52  },
    md: { w: 110, h: 154, nameSize: 10, opSize: 18, artH: 72  },
    lg: { w: 140, h: 196, nameSize: 11, opSize: 22, artH: 96  },
  }[size];

  const handleClick = () => {
    if (disabled) return;
    if (showDetailOnClick) {
      setShowDetail(true);
    }
    onClick?.();
  };

  return (
    <>
      {/* ── Carta ── */}
      <div
        onClick={handleClick}
        style={{
          width: dims.w,
          height: dims.h,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: selected ? 'translateY(-8px) scale(1.04)' : undefined,
          flexShrink: 0,
        }}
        className={`relative rounded-xl overflow-hidden select-none
          ${!disabled ? 'hover:scale-105 hover:-translate-y-1' : ''}
          transition-all duration-150`}
      >
        {/* Bordo luminoso fazione */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-20"
          style={{
            boxShadow: selected
              ? `0 0 0 2px ${factionColor}, 0 0 16px ${factionColor}66`
              : `0 0 0 1.5px ${typeBorder}99`,
          }}
        />

        {/* Sfondo artwork */}
        <div className="absolute inset-0 z-0">
          <img
            src={artUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.55) saturate(1.1)' }}
          />
          {/* Gradiente overlay bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 0%,
                transparent 35%,
                ${factionColor}22 55%,
                #0a0e1aee 75%,
                #0a0e1a 100%
              )`,
            }}
          />
        </div>

        {/* ── Top bar: tipo + OP ── */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-1.5 py-1"
          style={{ background: '#0a0e1acc' }}
        >
          <span style={{ fontSize: dims.nameSize - 1 }}>{typeIcon}</span>
          <span
            className="font-mono font-black"
            style={{
              fontSize: dims.nameSize - 1,
              color: typeBorder,
              letterSpacing: '0.05em',
            }}
          >
            {cardType}
          </span>
        </div>

        {/* ── Centro: immagine ── */}
        <div style={{ height: dims.artH }} className="relative z-5 mt-5" />

        {/* ── Badge OP al centro ── */}
        <div
          className="absolute z-10 rounded-full flex items-center justify-center font-black font-mono border-2"
          style={{
            width: dims.opSize + 8,
            height: dims.opSize + 8,
            bottom: dims.h * 0.38,
            right: 6,
            fontSize: dims.opSize - 2,
            backgroundColor: '#0a0e1a',
            borderColor: factionColor,
            color: factionColor,
            boxShadow: `0 0 8px ${factionColor}88`,
          }}
        >
          {card.op_points}
        </div>

        {/* ── Bottom: nome carta ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-1.5 pb-1.5 pt-1"
          style={{ background: 'linear-gradient(to bottom, transparent, #0a0e1a)' }}
        >
          <p
            className="font-mono font-bold leading-tight text-white"
            style={{
              fontSize: dims.nameSize,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {card.card_name}
          </p>
          {description && size === 'lg' && (
            <p
              className="font-mono text-[#8899aa] mt-0.5 leading-tight"
              style={{
                fontSize: dims.nameSize - 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>
          )}
          {/* ID carta */}
          <p
            className="font-mono text-[#334455] mt-0.5"
            style={{ fontSize: dims.nameSize - 2 }}
          >
            {card.card_id} · {faction}
          </p>
        </div>
      </div>

      {/* ── Modale dettaglio ── */}
      {showDetail && (
        <CardDetailModal
          card={card}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

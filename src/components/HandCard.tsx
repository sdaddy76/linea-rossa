// =============================================
// LINEA ROSSA — HandCard
// Click sulla carta → apre CardPeek (pannello espanso dal basso)
// Dal peek si può selezionare e giocare la carta.
// =============================================
import { useState } from 'react';
import type { DeckCard } from '@/types/game';
import type { GameCard } from '@/data/mazzi';
import type { GameState } from '@/types/game';
import {
  FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS,
} from '@/lib/factionColors';
import CardVisual, { FACTION_COLOR, CARD_TYPE_BORDER } from './CardVisual';
import CardPeek from './CardPeek';

export { FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS };

// ── ClassicHandCard ───────────────────────────────────────────────────────────
interface ClassicHandCardProps {
  card: GameCard;
  faction: string;
  gameState: GameState;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function ClassicHandCard({ card, selected, disabled, onToggle }: ClassicHandCardProps) {
  const [peekOpen, setPeekOpen] = useState(false);
  const borderColor = CARD_TYPE_BORDER[card.card_type as string] ?? '#445566';

  const handleCardClick = () => {
    if (disabled) return;
    // Click sulla carta: apre il peek (non seleziona direttamente)
    setPeekOpen(true);
  };

  return (
    <>
      <div className="relative flex flex-col items-center select-none">
        <CardVisual
          card={card}
          size="md"
          selected={selected}
          disabled={disabled}
          showDetailOnClick={false}
          onClick={handleCardClick}
        />

        {/* Indicatore selezione */}
        {selected && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: borderColor }} />
            <span className="text-[8px] font-mono font-bold" style={{ color: borderColor }}>SELEZIONATA</span>
          </div>
        )}
      </div>

      {peekOpen && (
        <CardPeek
          card={card}
          disabled={disabled}
          onClose={() => setPeekOpen(false)}
          onPlay={() => {
            onToggle(); // seleziona la carta
          }}
        />
      )}
    </>
  );
}

// ── UnifiedHandCard ───────────────────────────────────────────────────────────
interface UnifiedHandCardProps {
  dc: DeckCard;
  myFaction: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function UnifiedHandCard({ dc, myFaction, selected, disabled, onToggle }: UnifiedHandCardProps) {
  const [peekOpen, setPeekOpen] = useState(false);
  const ownerFaction = (dc.owner_faction ?? dc.faction) as string;
  const isMyOwn      = ownerFaction === myFaction;
  const ownerColor   = FACTION_COLOR[ownerFaction] ?? '#8899aa';

  return (
    <>
      <div className="relative flex flex-col items-center select-none">
        <div className="relative">
          <CardVisual
            card={dc}
            size="md"
            selected={selected}
            disabled={disabled}
            showDetailOnClick={false}
            onClick={() => { if (!disabled) setPeekOpen(true); }}
          />
          {/* Badge "solo OP" per carte altrui */}
          {!isMyOwn && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <span
                className="px-1.5 py-0.5 rounded font-mono text-[8px] font-bold"
                style={{ backgroundColor: '#f9731622', border: '1px solid #f9731644', color: '#f97316' }}
              >⚠ solo OP</span>
            </div>
          )}
        </div>

        {/* Indicatore selezione */}
        {selected && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isMyOwn ? ownerColor : '#f97316' }} />
            <span className="text-[8px] font-mono font-bold"
              style={{ color: isMyOwn ? ownerColor : '#f97316' }}>
              {isMyOwn ? 'SELEZIONATA' : 'COME OP'}
            </span>
          </div>
        )}
      </div>

      {peekOpen && (
        <CardPeek
          card={dc}
          myFaction={myFaction}
          disabled={disabled}
          onClose={() => setPeekOpen(false)}
          onPlay={() => onToggle()}
        />
      )}
    </>
  );
}

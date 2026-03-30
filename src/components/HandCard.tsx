// =============================================
// LINEA ROSSA — HandCard
// Carta della mano con layout TCG completo.
// - Click sulla carta: seleziona / deseleziona
// - Icona 🔍: apre modale dettaglio senza selezionare
// =============================================
import { useState } from 'react';
import type { DeckCard } from '@/types/game';
import type { GameCard } from '@/data/mazzi';
import type { GameState } from '@/types/game';
import {
  FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS,
} from '@/lib/factionColors';
import CardVisual, { FACTION_COLOR, CARD_TYPE_BORDER } from './CardVisual';
import CardDetailModal from './CardDetailModal';

export { FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS };

// ── HandCard (modalità classica) ─────────────────────────────────────────────
interface ClassicHandCardProps {
  card: GameCard;
  faction: string;
  gameState: GameState;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function ClassicHandCard({ card, selected, disabled, onToggle }: ClassicHandCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const factionColor = FACTION_COLOR[card.faction as string] ?? '#22c55e';
  const typeBorder   = CARD_TYPE_BORDER[card.card_type as string] ?? '#445566';

  return (
    <>
      <div className="relative flex flex-col items-center select-none">
        {/* Carta grafica */}
        <CardVisual
          card={card}
          size="md"
          selected={selected}
          disabled={disabled}
          showDetailOnClick={false}
          onClick={() => { if (!disabled) onToggle(); }}
        />

        {/* Pulsante dettaglio (lente) */}
        {!disabled && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
            className="absolute top-1 left-1 z-20 w-5 h-5 rounded-full flex items-center justify-center
              text-[9px] font-bold transition-all opacity-60 hover:opacity-100"
            style={{
              backgroundColor: '#0a0e1acc',
              border: `1px solid ${factionColor}55`,
              color: factionColor,
            }}
            title="Dettaglio carta"
          >🔍</button>
        )}

        {/* Indicatore selezione */}
        {selected && (
          <div
            className="absolute -bottom-4 left-0 right-0 flex items-center justify-center gap-1"
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: typeBorder }}
            />
            <span
              className="text-[8px] font-mono font-bold"
              style={{ color: typeBorder }}
            >SELEZIONATA</span>
          </div>
        )}
      </div>

      {showDetail && (
        <CardDetailModal
          card={card}
          onClose={() => setShowDetail(false)}
          onPlay={!disabled && !selected ? onToggle : undefined}
        />
      )}
    </>
  );
}

// ── UnifiedHandCard (modalità unificata) ─────────────────────────────────────
interface UnifiedHandCardProps {
  dc: DeckCard;
  myFaction: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function UnifiedHandCard({ dc, myFaction, selected, disabled, onToggle }: UnifiedHandCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const ownerFaction = (dc.owner_faction ?? dc.faction) as string;
  const isMyOwn      = ownerFaction === myFaction;
  const ownerColor   = FACTION_COLOR[ownerFaction] ?? '#8899aa';

  return (
    <>
      <div className="relative flex flex-col items-center select-none">
        {/* Carta grafica */}
        <CardVisual
          card={dc}
          size="md"
          selected={selected}
          disabled={disabled}
          showDetailOnClick={false}
          onClick={() => { if (!disabled) onToggle(); }}
        />

        {/* Badge "solo OP" per carte altrui */}
        {!isMyOwn && (
          <div
            className="absolute bottom-6 left-0 right-0 flex justify-center"
          >
            <span
              className="px-1.5 py-0.5 rounded font-mono text-[8px] font-bold"
              style={{
                backgroundColor: '#f9731622',
                border: '1px solid #f9731644',
                color: '#f97316',
              }}
            >⚠ solo OP</span>
          </div>
        )}

        {/* Pulsante dettaglio */}
        {!disabled && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
            className="absolute top-1 left-1 z-20 w-5 h-5 rounded-full flex items-center justify-center
              text-[9px] font-bold transition-all opacity-60 hover:opacity-100"
            style={{
              backgroundColor: '#0a0e1acc',
              border: `1px solid ${ownerColor}55`,
              color: ownerColor,
            }}
            title="Dettaglio carta"
          >🔍</button>
        )}

        {/* Avviso evento automatico */}
        {!isMyOwn && selected && (
          <p className="mt-1 text-[8px] font-mono text-[#f97316] text-center max-w-[130px]">
            🔁 Evento attivato auto dopo OP
          </p>
        )}
      </div>

      {showDetail && (
        <CardDetailModal
          card={dc}
          onClose={() => setShowDetail(false)}
          onPlay={!disabled && !selected ? onToggle : undefined}
        />
      )}
    </>
  );
}

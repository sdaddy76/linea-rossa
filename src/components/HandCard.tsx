// =============================================
// LINEA ROSSA — HandCard
// Click sulla carta → apre CardPeek (pannello espanso dal basso)
// Dal peek si può selezionare e giocare la carta.
// =============================================
import { useState, useMemo } from 'react';
import type { DeckCard } from '@/types/game';
import type { GameCard } from '@/data/mazzi';
import { MAZZI_PER_FAZIONE, MAZZI_SPECIALI, MAZZO_NEUTRALE } from '@/data/mazzi';
import type { GameState } from '@/types/game';
import {
  FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS,
} from '@/lib/factionColors';
import CardVisual, { FACTION_COLOR, CARD_TYPE_BORDER } from './CardVisual';
import CardPeek from './CardPeek';

// ── Lookup globale tutte le carte (costruito una volta sola al caricamento del modulo) ──
// Usato da UnifiedHandCard per arricchire le DeckCard con il campo `effects`
const TUTTE_LE_CARTE_DEFINIZIONI: GameCard[] = [
  ...Object.values(MAZZI_PER_FAZIONE).flat(),
  ...Object.values(MAZZI_SPECIALI).flat(),
  ...MAZZO_NEUTRALE,
];

/** Dato un DeckCard (senza effects), restituisce la GameCard completa con effects, se trovata */
function enrichDeckCard(dc: DeckCard): DeckCard | GameCard {
  const def = TUTTE_LE_CARTE_DEFINIZIONI.find(c => c.card_id === dc.card_id);
  if (!def) return dc;
  // Merge: i campi del DB (card_id, card_name, op_points…) restano, effects viene aggiunto
  return { ...def, ...dc, effects: def.effects } as unknown as GameCard;
}

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

  // FIX: arricchisce il DeckCard (privo di `effects`) con la definizione completa
  // da mazzi.ts, così CardPeek può mostrare i modificatori dei tracciati.
  const richCard = useMemo(() => enrichDeckCard(dc), [dc]);

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
          card={richCard}
          myFaction={myFaction}
          disabled={disabled}
          onClose={() => setPeekOpen(false)}
          onPlay={() => onToggle()}
        />
      )}
    </>
  );
}

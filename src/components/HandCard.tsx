// =============================================
// LINEA ROSSA — HandCard
// Carta della mano: può essere mostrata in modalità
// "grafica" (artwork AI) o "testuale" (lista compatta).
// Click sulla carta → modale dettaglio.
// =============================================
import { useState } from 'react';
import type { DeckCard } from '@/types/game';
import type { GameCard } from '@/data/mazzi';
import type { GameState } from '@/types/game';
import {
  FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS,
} from '@/lib/factionColors';
import CardVisual from './CardVisual';
import CardDetailModal from './CardDetailModal';

export { FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS };

// ── EffectPill ────────────────────────────────────────────────────────────────
interface EffectPill { icon: string; val: number; posColor: string; negColor: string; label: string }

function EffPill({ icon, val, posColor, negColor }: EffectPill) {
  const color = val > 0 ? posColor : negColor;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
      {icon}{val > 0 ? '+' : ''}{val}
    </span>
  );
}

// ── HandCard (modalità classica) ─────────────────────────────────────────────
interface ClassicHandCardProps {
  card: GameCard;
  faction: string;
  gameState: GameState;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function ClassicHandCard({ card, faction, gameState, selected, disabled, onToggle }: ClassicHandCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const typeColor = CARD_TYPE_COLORS[card.card_type] ?? '#8899aa';
  const factionColor = FACTION_COLORS[faction] ?? '#22c55e';

  // Effetti contestualizzati
  const eff = card.effects;
  const myRis  = (gameState[`risorse_${faction.toLowerCase()}` as keyof GameState]  as number) ?? 5;
  const myStab = (gameState[`stabilita_${faction.toLowerCase()}` as keyof GameState] as number) ?? 5;
  const pills: EffectPill[] = [
    { icon: '☢️', val: eff.nucleare?.(gameState.nucleare) ?? 0,  posColor: '#22c55e', negColor: '#ef4444', label: 'Nucleare' },
    { icon: '💰', val: eff.sanzioni?.(gameState.sanzioni) ?? 0,  posColor: '#3b82f6', negColor: '#f59e0b', label: 'Sanzioni' },
    { icon: '🌍', val: eff.opinione?.(gameState.opinione) ?? 0,  posColor: '#22c55e', negColor: '#ef4444', label: 'Opinione' },
    { icon: '🎯', val: eff.defcon?.(gameState.defcon)   ?? 0,   posColor: '#ef4444', negColor: '#22c55e', label: 'DEFCON' },
    { icon: '⚡', val: eff.risorse?.(myRis)             ?? 0,   posColor: '#f59e0b', negColor: '#ef4444', label: 'Risorse' },
    { icon: '🛡️', val: eff.stabilita?.(myStab)          ?? 0,   posColor: '#22d3ee', negColor: '#ef4444', label: 'Stabilità' },
  ].filter(p => p.val !== 0);

  return (
    <>
      {/* ── Vista grafica + testo compatto ── */}
      <div
        className={`relative flex flex-col items-center gap-0 select-none
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Carta visuale (artwork) */}
        <CardVisual
          card={card}
          size="md"
          selected={selected}
          disabled={disabled}
          showDetailOnClick={false}
          onClick={() => {
            if (!disabled) {
              // Primo click = seleziona/deseleziona; doppio click (o icona 🔍) = dettaglio
              onToggle();
            }
          }}
        />

        {/* Bottone dettaglio sopra la carta (icona lente) */}
        {!disabled && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
            className="absolute top-1 left-1 z-20 w-6 h-6 rounded-full flex items-center justify-center
              text-[10px] font-bold transition-all opacity-70 hover:opacity-100"
            style={{ backgroundColor: '#0a0e1acc', border: `1px solid ${factionColor}44`, color: factionColor }}
            title="Vedi dettaglio carta"
          >
            🔍
          </button>
        )}

        {/* Pills effetti (se selezionata, mostra sotto) */}
        {selected && pills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 max-w-[110px] justify-center">
            {pills.slice(0, 3).map((p, i) => <EffPill key={i} {...p} />)}
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
  const ownerColor   = FACTION_COLORS[ownerFaction] ?? '#8899aa';

  return (
    <>
      <div
        className={`relative flex flex-col items-center select-none
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Carta visuale con bordo speciale se carta altrui */}
        <div className="relative">
          <CardVisual
            card={dc}
            size="md"
            selected={selected}
            disabled={disabled}
            showDetailOnClick={false}
            onClick={() => { if (!disabled) onToggle(); }}
          />

          {/* Badge "altrui" sovrapposto */}
          {!isMyOwn && (
            <div
              className="absolute bottom-7 left-0 right-0 mx-auto w-fit px-1.5 py-0.5 rounded font-mono text-[8px]
                font-bold text-center z-20"
              style={{ backgroundColor: '#f9731622', border: '1px solid #f9731644', color: '#f97316' }}
            >
              ⚠ solo OP
            </div>
          )}

          {/* Bottone dettaglio */}
          {!disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
              className="absolute top-1 left-1 z-20 w-6 h-6 rounded-full flex items-center justify-center
                text-[10px] font-bold transition-all opacity-70 hover:opacity-100"
              style={{ backgroundColor: '#0a0e1acc', border: `1px solid ${ownerColor}44`, color: ownerColor }}
              title="Vedi dettaglio carta"
            >
              🔍
            </button>
          )}
        </div>

        {/* Avviso evento automatico per carte altrui */}
        {!isMyOwn && selected && (
          <p className="mt-1 text-[9px] font-mono text-[#f97316] leading-tight text-center max-w-[110px]">
            🔁 Evento auto dopo uso OP
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

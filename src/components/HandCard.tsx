// =============================================
// LINEA ROSSA — HandCard
// Carta della mano: stile "carta da gioco" verticale.
// Usato sia in modalità classica che unificata.
// =============================================
import type { DeckCard } from '@/types/game';
import type { GameCard } from '@/data/mazzi';
import type { GameState } from '@/types/game';
import {
  FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS, CARD_TYPE_ICONS,
} from '@/lib/factionColors';

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
  const typeColor = CARD_TYPE_COLORS[card.card_type] ?? '#8899aa';
  const typeIcon  = CARD_TYPE_ICONS[card.card_type]  ?? '🃏';
  const factionColor = FACTION_COLORS[faction] ?? '#22c55e';

  // Effetti contestualizzati
  const eff = card.effects;
  const myRis  = (gameState[`risorse_${faction.toLowerCase()}` as keyof GameState]  as number) ?? 5;
  const myStab = (gameState[`stabilita_${faction.toLowerCase()}` as keyof GameState] as number) ?? 5;
  const pills: EffectPill[] = [
    { icon: '☢️', val: eff.nucleare?.(gameState.nucleare) ?? 0,  posColor: '#22c55e', negColor: '#ef4444', label: 'Nucleare' },
    { icon: '💰', val: eff.sanzioni?.(gameState.sanzioni) ?? 0,  posColor: '#3b82f6', negColor: '#f59e0b', label: 'Sanzioni' },
    { icon: '🎯', val: eff.defcon?.(gameState.defcon)     ?? 0,  posColor: '#22c55e', negColor: '#ef4444', label: 'DEFCON' },
    { icon: '🌍', val: eff.opinione?.(gameState.opinione) ?? 0,  posColor: '#8b5cf6', negColor: '#ec4899', label: 'Opinione' },
    { icon: '📦', val: eff.risorse?.(myRis)               ?? 0,  posColor: '#f59e0b', negColor: '#8899aa', label: 'Risorse' },
    { icon: '🏛️', val: eff.stabilita?.(myStab)            ?? 0,  posColor: '#22c55e', negColor: '#ef4444', label: 'Stabilità' },
  ].filter(p => p.val !== 0);

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`group relative w-full text-left rounded-xl border-2 overflow-hidden
        transition-all duration-200 select-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${selected ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'}`}
      style={{
        borderColor:     selected ? factionColor : `${typeColor}50`,
        backgroundColor: selected ? `${factionColor}10` : '#0d1424',
        boxShadow:       selected ? `0 0 18px ${factionColor}30, 0 0 0 1px ${factionColor}` : 'none',
      }}>

      {/* Banda colorata tipo in alto */}
      <div className="h-1 w-full" style={{ backgroundColor: typeColor }} />

      <div className="p-3">
        {/* Riga 1: icona tipo + nome + OP */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base shrink-0">{typeIcon}</span>
            <p className="font-black font-mono text-xs text-white leading-tight">
              {card.card_name}
            </p>
          </div>
          {/* Badge OP */}
          <div className="shrink-0 flex flex-col items-center justify-center
            w-8 h-8 rounded-lg border-2 font-black font-mono text-sm"
            style={{ borderColor: typeColor, color: typeColor, backgroundColor: `${typeColor}15` }}>
            {card.op_points}
          </div>
        </div>

        {/* Tipo + deck_type */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ color: typeColor, backgroundColor: `${typeColor}20` }}>
            {card.card_type}
          </span>
          {card.deck_type === 'speciale' && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded
              bg-[#8b5cf620] text-[#8b5cf6] border border-[#8b5cf640]">
              ★ SPECIALE
            </span>
          )}
        </div>

        {/* Descrizione */}
        <p className="font-mono text-[10px] text-[#6677aa] leading-relaxed line-clamp-2 mb-2">
          {card.description}
        </p>

        {/* Effetti */}
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pills.map((p, i) => <EffPill key={i} {...p} />)}
          </div>
        )}

        {/* Indicatore selezione */}
        {selected && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: factionColor }} />
            <span className="text-[10px] font-mono font-bold"
              style={{ color: factionColor }}>
              SELEZIONATA — scegli azione ↓
            </span>
          </div>
        )}
      </div>
    </button>
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
  const ownerFaction = (dc.owner_faction ?? dc.faction) as string;
  const isMyOwn      = ownerFaction === myFaction;
  const ownerColor   = FACTION_COLORS[ownerFaction] ?? '#8899aa';
  const typeColor    = CARD_TYPE_COLORS[dc.card_type] ?? '#8899aa';
  const typeIcon     = CARD_TYPE_ICONS[dc.card_type]  ?? '🃏';

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`group relative w-full text-left rounded-xl border-2 overflow-hidden
        transition-all duration-200 select-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${selected ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'}`}
      style={{
        borderColor:     selected ? (isMyOwn ? ownerColor : '#f97316') : `${ownerColor}40`,
        backgroundColor: selected ? `${ownerColor}10` : `${ownerColor}06`,
        boxShadow:       selected
          ? `0 0 18px ${isMyOwn ? ownerColor : '#f97316'}30, 0 0 0 1px ${isMyOwn ? ownerColor : '#f97316'}`
          : 'none',
      }}>

      {/* Banda superiore con colore proprietario */}
      <div className="h-1 w-full" style={{ backgroundColor: ownerColor }} />

      <div className="p-3">
        {/* Riga 1: flag fazione + nome + OP */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm shrink-0">{FACTION_FLAGS[ownerFaction] ?? '🎴'}</span>
            <p className="font-black font-mono text-xs text-white leading-tight">
              {dc.card_name}
            </p>
          </div>
          {/* Badge OP con colore fazione */}
          <div className="shrink-0 flex flex-col items-center justify-center
            w-8 h-8 rounded-lg border-2 font-black font-mono text-sm"
            style={{ borderColor: ownerColor, color: ownerColor, backgroundColor: `${ownerColor}15` }}>
            {dc.op_points}
          </div>
        </div>

        {/* Riga 2: tipo + fazione + badge altrui/propria */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="text-base">{typeIcon}</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ color: typeColor, backgroundColor: `${typeColor}20` }}>
            {dc.card_type}
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ color: ownerColor, backgroundColor: `${ownerColor}15`, border: `1px solid ${ownerColor}30` }}>
            {ownerFaction}
          </span>
          {isMyOwn ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded
              bg-[#22c55e15] text-[#22c55e] border border-[#22c55e30]">
              tua — evt / op
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded
              bg-[#f9731615] text-[#f97316] border border-[#f9731630]">
              ⚠ altrui — solo op
            </span>
          )}
        </div>

        {/* Descrizione breve (card_id come fallback) */}
        <p className="font-mono text-[10px] text-[#556677] leading-relaxed line-clamp-1">
          {dc.card_id}
        </p>

        {/* Avviso evento automatico per carte altrui */}
        {!isMyOwn && (
          <p className="mt-1.5 text-[9px] font-mono text-[#f97316] leading-tight">
            🔁 Dopo l'uso come OP l'evento si attiva automaticamente
          </p>
        )}

        {/* Indicatore selezione */}
        {selected && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isMyOwn ? ownerColor : '#f97316' }} />
            <span className="text-[10px] font-mono font-bold"
              style={{ color: isMyOwn ? ownerColor : '#f97316' }}>
              {isMyOwn ? 'SCEGLI: evento o OP ↓' : 'USA COME OP ↓'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

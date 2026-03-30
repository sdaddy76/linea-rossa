// =============================================
// LINEA ROSSA — CardDetailModal.tsx
// Modale a schermo intero — layout fedele al fronte TCG:
// Artwork hero | OP + flag | Tipo + nome | Prerequisiti
// Descrizione | Modificatori tracciati | Metadati
// =============================================
import { useEffect } from 'react';
import type { GameCard, DeckCard } from '@/types/game';
import {
  CARD_ART,
  CARD_TYPE_BORDER,
  CARD_TYPE_ICON,
  FACTION_FLAG,
  FACTION_COLOR,
} from './CardVisual';

interface CardDetailModalProps {
  card: GameCard | DeckCard;
  onClose: () => void;
  onPlay?: () => void;
}

// ─── Tracciati ────────────────────────────────
const TRACK_INFO: Record<string, { icon: string; label: string; posGood: boolean }> = {
  nucleare:  { icon: '☢️', label: 'Nucleare',  posGood: false },
  sanzioni:  { icon: '💰', label: 'Sanzioni',  posGood: false },
  opinione:  { icon: '🌍', label: 'Opinione',  posGood: true  },
  defcon:    { icon: '🎯', label: 'DEFCON',    posGood: false },
  risorse:   { icon: '⚡', label: 'Risorse',   posGood: true  },
  stabilita: { icon: '🛡️', label: 'Stabilità', posGood: true  },
};

function getDeltas(card: GameCard | DeckCard) {
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

function getPrerequisites(card: GameCard | DeckCard): string[] {
  const out: string[] = [];
  out.push(`Fazione: ${card.faction as string}`);
  out.push(`Costo: ${card.op_points} OP`);
  if ('deck_type' in card && card.deck_type === 'speciale') out.push('★ Carta Speciale');
  if ('effects' in card && card.effects) {
    const e = card.effects as Record<string, ((v: number) => number) | undefined>;
    if (e.defcon) {
      const atLow = e.defcon(4) !== e.defcon(8);
      if (atLow) out.push('Condizione: DEFCON ≤ 3');
    }
    if (e.nucleare) {
      const atHigh = e.nucleare(12) > e.nucleare(5);
      if (atHigh) out.push('Condizione: Nucleare ≥ 10');
    }
  }
  return out;
}

export default function CardDetailModal({ card, onClose, onPlay }: CardDetailModalProps) {
  const faction      = card.faction as string;
  const cardType     = card.card_type as string;
  const artUrl       = CARD_ART[faction] ?? CARD_ART['Neutrale'];
  const borderColor  = CARD_TYPE_BORDER[cardType] ?? '#445566';
  const factionColor = FACTION_COLOR[faction] ?? '#94a3b8';
  const typeIcon     = CARD_TYPE_ICON[cardType] ?? '🃏';
  const flag         = FACTION_FLAG[faction] ?? '🌐';
  const description  = 'description' in card ? (card as GameCard).description : undefined;
  const isSpecial    = 'deck_type' in card && card.deck_type === 'speciale';
  const deltas       = getDeltas(card);
  const prereqs      = getPrerequisites(card);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: '#000000cc', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 0 1px #0a0e1a, 0 0 60px ${factionColor}33`,
          background: '#0d1220',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Chiudi ── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full flex items-center justify-center
            font-bold text-xs transition-colors"
          style={{ backgroundColor: '#1e3a5f99', color: '#8899aa' }}
        >✕</button>

        {/* ── ARTWORK HERO ── */}
        <div className="relative flex-shrink-0" style={{ height: 160 }}>
          <img
            src={artUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.6) saturate(1.2)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 30%, ${factionColor}18 70%, #0d1220 100%)`,
            }}
          />
          {/* Badge OP */}
          <div
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex flex-col items-center
              justify-center border-2 font-mono"
            style={{
              backgroundColor: '#0a0e1a',
              borderColor: borderColor,
              boxShadow: `0 0 16px ${borderColor}88`,
            }}
          >
            <span className="font-black text-lg leading-none" style={{ color: borderColor }}>
              {card.op_points}
            </span>
            <span className="text-[7px] text-[#8899aa] uppercase tracking-widest">OP</span>
          </div>
          {/* ID */}
          <div
            className="absolute bottom-4 left-4 px-1.5 py-0.5 rounded font-mono text-xs"
            style={{ backgroundColor: '#0a0e1acc', color: '#445566' }}
          >
            {card.card_id}
          </div>
        </div>

        {/* ── CORPO SCROLLABILE ── */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ── HEADER: tipo + nome + fazione ── */}
          <div className="flex items-start gap-2">
            {/* Flag fazione in cerchio */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border text-xl"
              style={{
                backgroundColor: `${factionColor}18`,
                borderColor: `${factionColor}55`,
              }}
            >{flag}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border"
                  style={{ backgroundColor: `${borderColor}14`, borderColor: `${borderColor}44`, color: borderColor }}
                >
                  {typeIcon} {cardType}
                </span>
                {isSpecial && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border
                    bg-[#f59e0b14] border-[#f59e0b44] text-[#f59e0b]">
                    ★ SPECIALE
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black font-mono text-white leading-tight">
                {card.card_name}
              </h2>
              <p className="text-xs font-mono" style={{ color: factionColor }}>{faction}</p>
            </div>
          </div>

          {/* Divisore */}
          <div className="h-px" style={{ backgroundColor: borderColor + '44' }} />

          {/* ── PREREQUISITI ── */}
          <div>
            <p className="text-[9px] font-mono font-bold text-[#445566] uppercase tracking-widest mb-1.5">
              📋 Prerequisiti per giocare
            </p>
            <div className="flex flex-wrap gap-1.5">
              {prereqs.map((p, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: i === 0 ? `${factionColor}14` : `${borderColor}10`,
                    borderColor: i === 0 ? `${factionColor}44` : `${borderColor}33`,
                    color: i === 0 ? factionColor : borderColor,
                  }}
                >{p}</span>
              ))}
            </div>
          </div>

          {/* ── DESCRIZIONE ── */}
          {description && (
            <div
              className="p-3 rounded-xl border text-sm font-mono text-[#aabbcc] leading-relaxed italic"
              style={{ backgroundColor: '#060d18', borderColor: '#1e3a5f' }}
            >
              "{description}"
            </div>
          )}

          {/* ── MODIFICATORI TRACCIATI ── */}
          {deltas.length > 0 && (
            <div>
              <p className="text-[9px] font-mono font-bold text-[#445566] uppercase tracking-widest mb-1.5">
                📊 Modificatori tracciati (valore medio)
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {deltas.map(d => {
                  const positive = d.posGood ? d.delta > 0 : d.delta < 0;
                  const color = positive ? '#22c55e' : '#ef4444';
                  return (
                    <div
                      key={d.key}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-mono"
                      style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}33`,
                      }}
                    >
                      <span className="text-sm">{d.icon}</span>
                      <div className="flex-1">
                        <p className="text-[9px] text-[#667788] leading-none">{d.label}</p>
                        <p
                          className="font-black text-sm leading-none"
                          style={{ color }}
                        >
                          {d.delta > 0 ? '+' : ''}{d.delta}
                        </p>
                      </div>
                      <span
                        className="text-xs font-black"
                        style={{ color: positive ? '#22c55e' : '#ef4444' }}
                      >
                        {positive ? '▲' : '▼'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {deltas.length === 0 && (
            <p className="text-xs font-mono text-[#334455] italic text-center py-1">
              Effetti condizionali — varia in base allo stato del gioco
            </p>
          )}

          {/* ── METADATI ── */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Mazzo', value: ('deck_type' in card ? card.deck_type : '—') as string },
              { label: 'Costo OP', value: String(card.op_points) },
              { label: 'Fazione', value: (faction as string).slice(0, 8) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-2 rounded-lg text-center border"
                style={{ backgroundColor: '#060d18', borderColor: '#1e3a5f' }}
              >
                <p className="text-[8px] font-mono text-[#445566] uppercase tracking-wider">{label}</p>
                <p className="text-xs font-mono font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* ── AZIONI ── */}
          <div className="flex gap-2 pt-1">
            {onPlay && (
              <button
                onClick={() => { onClose(); onPlay(); }}
                className="flex-1 py-3 rounded-xl font-mono font-black text-sm tracking-wider"
                style={{
                  background: `linear-gradient(135deg, ${borderColor}, ${borderColor}aa)`,
                  color: '#0a0e1a',
                  boxShadow: `0 0 16px ${borderColor}44`,
                }}
              >
                ▶ Gioca questa carta
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl font-mono text-sm border transition-all text-[#8899aa]"
              style={{ borderColor: '#1e3a5f', backgroundColor: '#060d18' }}
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

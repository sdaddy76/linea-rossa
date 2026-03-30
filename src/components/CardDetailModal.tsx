// =============================================
// LINEA ROSSA — Modale dettaglio carta
// Mostra la carta a schermo intero con grafica,
// valori degli effetti e tutte le informazioni
// =============================================
import { useEffect } from 'react';
import type { GameCard, DeckCard } from '@/types/game';
import {
  CARD_ART,
  FACTION_COLOR,
  CARD_TYPE_ICON,
  CARD_TYPE_BORDER,
} from './CardVisual';

interface CardDetailModalProps {
  card: GameCard | DeckCard;
  onClose: () => void;
  onPlay?: () => void;        // pulsante "Gioca carta" opzionale
}

// ─── Descrizione leggibile degli effetti ─────
function buildEffectSummary(card: GameCard | DeckCard): string[] {
  const lines: string[] = [];

  // Per GameCard abbiamo la funzione effects
  if ('effects' in card && card.effects) {
    const e = card.effects as Record<string, ((v: number) => number) | undefined>;
    const trackNames: Record<string, string> = {
      nucleare: '☢️ Nucleare',
      sanzioni: '💰 Sanzioni',
      opinione: '🌍 Opinione',
      defcon: '🎯 DEFCON',
      risorse: '⚡ Risorse',
      stabilita: '🛡️ Stabilità',
    };
    for (const [key, fn] of Object.entries(e)) {
      if (!fn) continue;
      const name = trackNames[key] ?? key;
      // Calcola effetto su valore medio per dare un'idea
      const mid = fn(5);
      const sign = mid > 0 ? `+${mid}` : `${mid}`;
      const delta = mid - 5;
      const label = delta > 0
        ? `+${delta} (valore medio)`
        : delta < 0
        ? `${delta} (valore medio)`
        : 'condizionale';
      lines.push(`${name}: ${label}`);
    }
  }
  return lines;
}

// ─── Indicatori effetti visivi ────────────────
const TRACK_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  nucleare: { icon: '☢️', color: '#22c55e', label: 'Nucleare' },
  sanzioni: { icon: '💰', color: '#3b82f6', label: 'Sanzioni' },
  opinione: { icon: '🌍', color: '#ec4899', label: 'Opinione' },
  defcon:   { icon: '🎯', color: '#8b5cf6', label: 'DEFCON' },
  risorse:  { icon: '⚡', color: '#f59e0b', label: 'Risorse' },
  stabilita:{ icon: '🛡️', color: '#22d3ee', label: 'Stabilità' },
};

function EffectPills({ card }: { card: GameCard | DeckCard }) {
  if (!('effects' in card) || !card.effects) return null;
  const e = card.effects as Record<string, ((v: number) => number) | undefined>;

  const pills = Object.keys(e)
    .filter(k => !!e[k])
    .map(key => {
      const info = TRACK_ICONS[key];
      if (!info) return null;
      const fn = e[key]!;
      // Confronta f(5) vs 5 per capire la direzione
      const val = fn(5);
      const delta = val - 5;
      const direction = delta > 0 ? '▲' : delta < 0 ? '▼' : '◆';
      const color = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#f59e0b';
      return { key, ...info, direction, color, delta };
    })
    .filter(Boolean);

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map(p => p && (
        <div
          key={p.key}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold"
          style={{
            backgroundColor: `${p.color}14`,
            borderColor: `${p.color}44`,
            color: p.color,
          }}
        >
          <span>{p.icon}</span>
          <span>{p.label}</span>
          <span
            className="px-1 rounded font-black text-[10px]"
            style={{ backgroundColor: `${p.color}22`, color: p.color }}
          >
            {p.direction}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principale ─────────────────────
export default function CardDetailModal({ card, onClose, onPlay }: CardDetailModalProps) {
  const faction = card.faction as string;
  const cardType = card.card_type as string;
  const artUrl = CARD_ART[faction] ?? CARD_ART['Neutrale'];
  const factionColor = FACTION_COLOR[faction] ?? '#94a3b8';
  const typeIcon = CARD_TYPE_ICON[cardType] ?? '🃏';
  const typeBorder = CARD_TYPE_BORDER[cardType] ?? '#334455';
  const description = 'description' in card ? (card as GameCard).description : undefined;

  // Blocca scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Chiudi con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
          boxShadow: `0 0 0 1px ${typeBorder}66, 0 0 60px ${factionColor}33`,
          background: '#0d1220',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* ── Pulsante chiudi ── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center
            font-bold text-sm transition-colors"
          style={{
            backgroundColor: '#1e3a5f',
            color: '#8899aa',
          }}
        >
          ✕
        </button>

        {/* ── Artwork fazione (hero) ── */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={artUrl}
            alt={`${faction} artwork`}
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.65) saturate(1.2)' }}
          />
          {/* Gradiente bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 20%,
                ${factionColor}22 60%,
                #0d1220 100%
              )`,
            }}
          />
          {/* Badge OP in overlay */}
          <div
            className="absolute bottom-4 right-4 w-14 h-14 rounded-full flex flex-col items-center
              justify-center border-2 font-mono"
            style={{
              backgroundColor: '#0a0e1a',
              borderColor: factionColor,
              boxShadow: `0 0 20px ${factionColor}88`,
            }}
          >
            <span className="font-black text-xl" style={{ color: factionColor, lineHeight: 1 }}>
              {card.op_points}
            </span>
            <span className="text-[8px] text-[#8899aa] uppercase tracking-widest">OP</span>
          </div>

          {/* ID carta */}
          <div
            className="absolute bottom-4 left-4 px-2 py-0.5 rounded font-mono text-xs"
            style={{ backgroundColor: '#0a0e1acc', color: '#445566' }}
          >
            {card.card_id}
          </div>
        </div>

        {/* ── Corpo carta ── */}
        <div className="p-5 space-y-4">

          {/* Nome + tipo */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono font-bold border"
                style={{
                  backgroundColor: `${typeBorder}14`,
                  borderColor: `${typeBorder}44`,
                  color: typeBorder,
                }}
              >
                {typeIcon} {cardType}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono font-bold border"
                style={{
                  backgroundColor: `${factionColor}14`,
                  borderColor: `${factionColor}44`,
                  color: factionColor,
                }}
              >
                {faction}
              </span>
            </div>
            <h2
              className="text-xl font-black font-mono text-white leading-tight"
            >
              {card.card_name}
            </h2>
          </div>

          {/* Separatore */}
          <div className="h-px" style={{ backgroundColor: typeBorder + '44' }} />

          {/* Descrizione */}
          {description && (
            <div
              className="p-3 rounded-xl border text-sm font-mono text-[#aabbcc] leading-relaxed italic"
              style={{ backgroundColor: '#060d18', borderColor: '#1e3a5f' }}
            >
              "{description}"
            </div>
          )}

          {/* Effetti visivi */}
          <div>
            <p className="text-[10px] font-mono font-bold text-[#445566] uppercase tracking-widest mb-2">
              Effetti sui tracciati
            </p>
            <EffectPills card={card} />
            {(!('effects' in card) || Object.keys((card as GameCard).effects ?? {}).length === 0) && (
              <p className="text-xs font-mono text-[#334455] italic">Nessun effetto diretto sui tracciati</p>
            )}
          </div>

          {/* Separatore */}
          <div className="h-px" style={{ backgroundColor: '#1e3a5f' }} />

          {/* Metadati */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tipo mazzo', value: ('deck_type' in card ? card.deck_type : '—') as string },
              { label: 'Punti OP', value: String(card.op_points) },
              { label: 'Fazione', value: faction },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-2 rounded-lg text-center border"
                style={{ backgroundColor: '#060d18', borderColor: '#1e3a5f' }}
              >
                <p className="text-[9px] font-mono text-[#445566] uppercase tracking-wider">{label}</p>
                <p className="text-sm font-mono font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Pulsanti azione */}
          <div className="flex gap-2 pt-1">
            {onPlay && (
              <button
                onClick={() => { onClose(); onPlay(); }}
                className="flex-1 py-3 rounded-xl font-mono font-black text-sm tracking-wider transition-all"
                style={{
                  background: `linear-gradient(135deg, ${factionColor}, ${factionColor}bb)`,
                  color: '#0a0e1a',
                  boxShadow: `0 0 20px ${factionColor}44`,
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

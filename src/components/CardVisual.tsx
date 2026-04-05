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
import { isGoodForFaction } from '@/lib/cardColors';

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
  // ─── Globali ───────────────────────────────────────────────────────────────
  nucleare:  { icon: '☢️', label: 'Nucleare Iraniano (1-15)',           posGood: false },
  sanzioni:  { icon: '🔒', label: 'Sanzioni Internazionali (1-20)',      posGood: false },
  opinione:  { icon: '📣', label: 'Opinione Globale (-10/+10)',           posGood: true  },
  defcon:    { icon: '🚨', label: 'DEFCON — Allerta Guerra (1-10)',       posGood: true  },
  risorse:   { icon: '💵', label: 'Risorse Proprie',                      posGood: true  },
  stabilita: { icon: '⚖️', label: 'Stabilità Interna',                   posGood: true  },
  // ─── Iran 🇮🇷 ───────────────────────────────────────────────────────────────
  risorse_iran:               { icon: '💵', label: '🇮🇷 Risorse Iran',                posGood: true },
  forze_militari_iran:        { icon: '⚔️', label: '🇮🇷 Forze Militari Iran',        posGood: true },
  tecnologia_nucleare_iran:   { icon: '🔬', label: '🇮🇷 Tecnologia Nucleare Iran',   posGood: true },
  stabilita_iran:             { icon: '⚖️', label: '🇮🇷 Stabilità Iran',             posGood: true },
  // ─── Coalizione 🇺🇸 ─────────────────────────────────────────────────────────
  risorse_coalizione:                  { icon: '💵', label: '🇺🇸 Risorse Coalizione',             posGood: true },
  influenza_diplomatica_coalizione:    { icon: '🤝', label: '🇺🇸 Influenza Diplomatica',          posGood: true },
  tecnologia_avanzata_coalizione:      { icon: '💻', label: '🇺🇸 Tecnologia Avanzata',            posGood: true },
  supporto_pubblico_coalizione:        { icon: '📢', label: '🇺🇸 Supporto Pubblico',              posGood: true },
  stabilita_coalizione:                { icon: '⚖️', label: '🇺🇸 Stabilità Coalizione',           posGood: true },
  // ─── Russia 🇷🇺 ──────────────────────────────────────────────────────────────
  risorse_russia:             { icon: '💵', label: '🇷🇺 Risorse Russia',              posGood: true },
  influenza_militare_russia:  { icon: '🎖️', label: '🇷🇺 Influenza Militare Russia',  posGood: true },
  veto_onu_russia:            { icon: '🏛️', label: '🇷🇺 Veto ONU Russia (0-3)',       posGood: true },
  stabilita_economica_russia: { icon: '📊', label: '🇷🇺 Stabilità Economica Russia',  posGood: true },
  stabilita_russia:           { icon: '⚖️', label: '🇷🇺 Stabilità Russia',            posGood: true },
  // ─── Cina 🇨🇳 ────────────────────────────────────────────────────────────────
  risorse_cina:               { icon: '💵', label: '🇨🇳 Risorse Cina',               posGood: true },
  influenza_commerciale_cina: { icon: '🏪', label: '🇨🇳 Influenza Commerciale Cina', posGood: true },
  cyber_warfare_cina:         { icon: '🖥️', label: '🇨🇳 Cyber Warfare Cina',         posGood: true },
  stabilita_rotte_cina:       { icon: '🚢', label: '🇨🇳 Stabilità Rotte Cina',        posGood: true },
  stabilita_cina:             { icon: '⚖️', label: '🇨🇳 Stabilità Cina',              posGood: true },
  // ─── Europa 🇪🇺 ──────────────────────────────────────────────────────────────
  risorse_europa:              { icon: '💵', label: '🇪🇺 Risorse Europa',              posGood: true },
  influenza_diplomatica_europa:{ icon: '🕊️', label: '🇪🇺 Influenza Diplomatica EU',   posGood: true },
  aiuti_umanitari_europa:      { icon: '❤️', label: '🇪🇺 Aiuti Umanitari Europa',     posGood: true },
  coesione_ue_europa:          { icon: '🌐', label: '🇪🇺 Coesione UE',                posGood: true },
  stabilita_europa:            { icon: '⚖️', label: '🇪🇺 Stabilità Europa',           posGood: true },
};

// Valori medi realistici usati per la preview dei badge
const DEFAULT_VALS: Record<string, number> = {
  nucleare:  5,
  sanzioni:  10,
  opinione:  0,
  defcon:    7,
  risorse:   5,
  stabilita: 5,
  risorse_iran: 5, forze_militari_iran: 5, tecnologia_nucleare_iran: 5, stabilita_iran: 5,
  risorse_coalizione: 5, influenza_diplomatica_coalizione: 5, tecnologia_avanzata_coalizione: 5, supporto_pubblico_coalizione: 5, stabilita_coalizione: 5,
  risorse_russia: 5, influenza_militare_russia: 5, veto_onu_russia: 2, stabilita_economica_russia: 5, stabilita_russia: 5,
  risorse_cina: 5, influenza_commerciale_cina: 5, cyber_warfare_cina: 5, stabilita_rotte_cina: 5, stabilita_cina: 5,
  risorse_europa: 5, influenza_diplomatica_europa: 5, aiuti_umanitari_europa: 5, coesione_ue_europa: 5, stabilita_europa: 5,
};

// ─── Calcola delta effetti con valori medi realistici ──
function getEffectDeltas(card: GameCard | DeckCard) {
  if (!('effects' in card) || !card.effects) return [];
  const e = card.effects as Record<string, ((v: number) => number) | undefined>;
  return Object.entries(e)
    .map(([key, fn]) => {
      if (!fn) return null;
      const ref = DEFAULT_VALS[key] ?? 5;
      const result = fn(ref);
      const delta = result; // fn restituisce già il delta
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
  if ('deck_type' in card && (card.deck_type === 'speciale' || card.deck_type === 'speciale_locked')) {
    prereqs.push('★ SPEC');
  }
  if ('unlocks_special' in card && (card as {unlocks_special?:boolean}).unlocks_special) {
    prereqs.push('✦ SBLOCCA');
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
  const isSpecial  = 'deck_type' in card && (card.deck_type === 'speciale' || card.deck_type === 'speciale_locked');
  const unlocksSpec = 'unlocks_special' in card && (card as {unlocks_special?:boolean}).unlocks_special === true;

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
              <span className="absolute top-1 right-1 text-[7px] px-1 py-0.5 rounded font-mono font-bold"
                style={{ background: '#f59e0b22', border: '1px solid #f59e0b55', color: '#f59e0b' }}
              >★ SPEC</span>
            )}
            {unlocksSpec && (
              <span className="absolute top-1 left-1 text-[7px] px-1 py-0.5 rounded font-mono font-bold"
                style={{ background: '#a855f722', border: '1px solid #a855f755', color: '#a855f7' }}
              >✦</span>
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
              const isGood = isGoodForFaction(d.key, d.delta, (card.faction as string) ?? 'Neutrale');
              const color = isGood ? '#22c55e' : '#ef4444';
              const displayVal = Math.abs(d.delta);
              const sign = d.delta > 0 ? '+' : '-';
              return (
                <div
                  key={d.key}
                  title={d.label}
                  className="flex items-center font-mono font-bold cursor-help"
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
                  <span style={{ fontSize: fs(6.5) }}>{sign}{displayVal}</span>
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

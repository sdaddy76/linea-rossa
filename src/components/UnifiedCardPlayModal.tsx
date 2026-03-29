// =============================================
// LINEA ROSSA — UnifiedCardPlayModal
// Modale scelta modalità gioco carta nel mazzo unificato:
//
// ┌─ Carta PROPRIA fazione ──────────────────┐
// │  [🎴 Gioca come EVENTO]                  │
// │  [⚙️  Gioca come PUNTI OP (N OP)]        │
// └──────────────────────────────────────────┘
//
// ┌─ Carta ALTRUI fazione ───────────────────┐
// │  Puoi usarla solo come OP.               │
// │  Dopo la tua azione, l'evento della      │
// │  carta si attiva automaticamente.        │
// │  [⚙️  USA COME PUNTI OP (N OP)]          │
// └──────────────────────────────────────────┘
// =============================================
import { useState } from 'react';
import type { DeckCard, Faction } from '@/types/game';
import { FACTION_COLORS, FACTION_FLAGS, CARD_TYPE_COLORS } from '@/lib/factionColors';

interface Props {
  card: DeckCard;
  myFaction: Faction;
  onPlay: (mode: 'event' | 'ops') => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function UnifiedCardPlayModal({ card, myFaction, onPlay, onCancel, loading }: Props) {
  const [hovered, setHovered] = useState<'event' | 'ops' | null>(null);

  const ownerFaction = (card.owner_faction ?? card.faction) as Faction;
  const isMyCard     = ownerFaction === myFaction;
  const ownerColor   = FACTION_COLORS[ownerFaction] ?? '#8899aa';
  const myColor      = FACTION_COLORS[myFaction]    ?? '#8899aa';
  const cardTypeColor = CARD_TYPE_COLORS[card.card_type] ?? '#8899aa';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>

      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#0d1424', border: `2px solid ${ownerColor}44` }}>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${ownerColor}22` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Fazione proprietaria */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{FACTION_FLAGS[ownerFaction]}</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: ownerColor }}>
                  Carta {ownerFaction}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ color: cardTypeColor, backgroundColor: `${cardTypeColor}15`,
                    border: `1px solid ${cardTypeColor}30` }}>
                  {card.card_type}
                </span>
              </div>
              {/* Nome carta */}
              <h2 className="font-black font-mono text-white text-lg leading-tight truncate">
                {card.card_name}
              </h2>
              <p className="text-[10px] font-mono text-[#556677] mt-0.5">{card.card_id}</p>
            </div>
            {/* OP badge */}
            <div className="shrink-0 text-center">
              <div className="text-2xl font-black font-mono" style={{ color: ownerColor }}>
                {card.op_points}
              </div>
              <div className="text-[9px] font-mono text-[#556677]">OP</div>
            </div>
          </div>
        </div>

        {/* ── Corpo ── */}
        <div className="px-5 py-4 space-y-4">

          {/* Banner carta propria / altrui */}
          {isMyCard ? (
            <div className="p-3 rounded-xl"
              style={{ backgroundColor: `${myColor}10`, border: `1px solid ${myColor}30` }}>
              <p className="text-[11px] font-mono font-bold" style={{ color: myColor }}>
                ✅ Carta della tua fazione
              </p>
              <p className="text-[10px] font-mono text-[#8899aa] mt-0.5">
                Puoi scegliere se giocarla come <strong className="text-white">Evento</strong> (applica
                gli effetti meccanici) oppure come <strong className="text-white">Punti Operazione</strong>
                {' '}(usa i {card.op_points} OP per azioni militari/diplomatiche).
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-[#f97316]30 bg-[#f9731608]">
              <p className="text-[11px] font-mono font-bold text-[#f97316]">
                ⚠️ Carta di un'altra fazione ({ownerFaction})
              </p>
              <p className="text-[10px] font-mono text-[#8899aa] mt-0.5">
                Puoi usarla <strong className="text-white">solo come Punti OP</strong>.
                Subito dopo la tua azione, l'evento della carta{' '}
                <strong className="text-[#f97316]">si attiva automaticamente</strong>
                {' '}e i suoi effetti vengono applicati.
              </p>
            </div>
          )}

          {/* Bottoni scelta */}
          <div className={`grid gap-3 ${isMyCard ? 'grid-cols-2' : 'grid-cols-1'}`}>

            {/* EVENTO — solo se carta propria */}
            {isMyCard && (
              <button
                onClick={() => onPlay('event')}
                disabled={loading}
                onMouseEnter={() => setHovered('event')}
                onMouseLeave={() => setHovered(null)}
                className="relative p-4 rounded-xl flex flex-col items-center gap-2 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: hovered === 'event' ? `${myColor}20` : `${myColor}10`,
                  border: `2px solid ${hovered === 'event' ? myColor : myColor + '50'}`,
                  transform: hovered === 'event' ? 'scale(1.02)' : 'scale(1)',
                }}>
                <span className="text-3xl">🎴</span>
                <div className="text-center">
                  <p className="font-black font-mono text-sm" style={{ color: myColor }}>
                    GIOCA EVENTO
                  </p>
                  <p className="text-[10px] font-mono text-[#8899aa] mt-0.5">
                    Applica gli effetti della carta
                  </p>
                </div>
              </button>
            )}

            {/* PUNTI OP */}
            <button
              onClick={() => onPlay('ops')}
              disabled={loading}
              onMouseEnter={() => setHovered('ops')}
              onMouseLeave={() => setHovered(null)}
              className="relative p-4 rounded-xl flex flex-col items-center gap-2 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: hovered === 'ops' ? '#33445520' : '#33445510',
                border: `2px solid ${hovered === 'ops' ? '#556677' : '#334455'}`,
                transform: hovered === 'ops' ? 'scale(1.02)' : 'scale(1)',
              }}>
              <span className="text-3xl">⚙️</span>
              <div className="text-center">
                <p className="font-black font-mono text-sm text-white">
                  USA {card.op_points} PUNTI OP
                </p>
                <p className="text-[10px] font-mono text-[#8899aa] mt-0.5">
                  {isMyCard
                    ? 'Usa solo i punti (nessun effetto)'
                    : `Poi l'evento ${ownerFaction} si attiva auto`}
                </p>
              </div>
              {/* Badge avviso evento auto per carta altrui */}
              {!isMyCard && (
                <div className="absolute -top-2 -right-2 text-[9px] font-mono font-bold
                  px-1.5 py-0.5 rounded-full bg-[#f97316] text-[#0a0e1a]">
                  + EVT AUTO
                </div>
              )}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
              <span className="text-[#00ff88] font-mono text-xs">Elaborazione...</span>
            </div>
          )}
        </div>

        {/* ── Footer: Annulla ── */}
        <div className="px-5 pb-5">
          <button onClick={onCancel} disabled={loading}
            className="w-full py-2.5 border border-[#1e2a3a] rounded-xl font-mono text-xs
              text-[#556677] hover:text-[#8899aa] hover:border-[#334455]
              transition-colors disabled:opacity-40">
            ✕ Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

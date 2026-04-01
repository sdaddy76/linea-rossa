// =============================================
// LINEA ROSSA — CardPeek.tsx
// Pannello di anteprima espansa che appare sopra la mano
// quando l'utente clicca una carta.
// Mostra la carta a dimensione 'lg' con tutti i dettagli
// leggibili, senza occupare l'intero schermo.
// =============================================
import type { GameCard, DeckCard } from '@/types/game';
import CardVisual, {
  CARD_TYPE_BORDER, FACTION_COLOR, FACTION_FLAG,
  CARD_TYPE_ICON, CARD_ART,
} from './CardVisual';

interface CardPeekProps {
  card: GameCard | DeckCard;
  myFaction?: string;           // per distinguere carte proprie/altrui (mazzo unificato)
  onClose: () => void;
  onPlay: () => void;           // seleziona la carta per giocarla
  disabled?: boolean;
}

// ─── Tracciati ────────────────────────────────
const TRACK_INFO: Record<string, { icon: string; label: string; posGood: boolean }> = {
  nucleare:  { icon: '☢️', label: 'Nucleare',  posGood: false },
  sanzioni:  { icon: '💰', label: 'Sanzioni',  posGood: false },
  opinione:  { icon: '🌍', label: 'Opinione',  posGood: true  },
  defcon:    { icon: '⚔️', label: 'DEFCON',    posGood: false },
  risorse:   { icon: '💵', label: 'Risorse',   posGood: true  },
  stabilita: { icon: '🏛️', label: 'Stabilità', posGood: true  },
};

// Valori medi realistici usati per la preview dei badge
const DEFAULT_VALS: Record<string, number> = {
  nucleare:  5,   // scala 0-15, valore medio
  sanzioni:  10,  // scala 1-20, valore medio
  opinione:  0,   // scala -10..+10, neutro
  defcon:    7,   // scala 1-10, tensione latente
  risorse:   5,   // scala 0-10, valore medio
  stabilita: 5,   // scala 0-10, valore medio
};

function getDeltas(card: GameCard | DeckCard) {
  if (!('effects' in card) || !card.effects) return [];
  const e = card.effects as Record<string, ((v: number) => number) | undefined>;
  return Object.entries(e)
    .map(([key, fn]) => {
      if (!fn) return null;
      const ref = DEFAULT_VALS[key] ?? 5;
      const delta = fn(ref) - ref;
      if (delta === 0) return null;
      const info = TRACK_INFO[key];
      if (!info) return null;
      return { key, ...info, delta };
    })
    .filter(Boolean) as Array<{ key: string; icon: string; label: string; posGood: boolean; delta: number }>;
}

export default function CardPeek({ card, myFaction, onClose, onPlay, disabled = false }: CardPeekProps) {
  const faction      = card.faction as string;
  const cardType     = card.card_type as string;
  const borderColor  = CARD_TYPE_BORDER[cardType] ?? '#445566';
  const factionColor = FACTION_COLOR[faction] ?? '#94a3b8';
  const typeIcon     = CARD_TYPE_ICON[cardType] ?? '🃏';
  const flag         = FACTION_FLAG[faction] ?? '🌐';
  const artUrl       = CARD_ART[faction] ?? CARD_ART['Neutrale'];
  const description  = 'description' in card ? (card as GameCard).description : undefined;
  const isSpecial    = 'deck_type' in card && (card.deck_type === 'speciale' || card.deck_type === 'speciale_locked');
  const unlocksSpec   = 'unlocks_special' in card && (card as {unlocks_special?:boolean}).unlocks_special === true;
  const deltas       = getDeltas(card);
  const ownerFaction = 'owner_faction' in card ? (card.owner_faction ?? card.faction) as string : faction;
  const isMyOwn      = !myFaction || ownerFaction === myFaction;

  return (
    // Overlay semi-trasparente — click fuori chiude
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-0"
      style={{ backgroundColor: '#00000077', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Pannello scorrevole dal basso */}
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-hidden"
        style={{
          background: '#0d1220',
          border: `1.5px solid ${borderColor}`,
          borderBottom: 'none',
          boxShadow: `0 -8px 40px ${factionColor}22`,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Drag handle ── */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#334455]" />
        </div>

        {/* ── Contenuto scrollabile ── */}
        <div className="overflow-y-auto flex-1 px-4 pb-5 pt-1">
          <div className="flex gap-4 items-start">

            {/* ── Carta grande (lg) ── */}
            <div className="shrink-0">
              <CardVisual
                card={card}
                size="lg"
                disabled={disabled}
                showDetailOnClick={false}
              />
            </div>

            {/* ── Info destra ── */}
            <div className="flex-1 min-w-0 space-y-2.5">

              {/* Nome + tipo + fazione */}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border"
                    style={{ backgroundColor: `${borderColor}14`, borderColor: `${borderColor}44`, color: borderColor }}
                  >{typeIcon} {cardType}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border"
                    style={{ backgroundColor: `${factionColor}14`, borderColor: `${factionColor}44`, color: factionColor }}
                  >{flag} {faction}</span>
                  {isSpecial && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{background:'#f59e0b14',border:'1px solid #f59e0b44',color:'#f59e0b'}}>★ SPEC</span>
                  )}
                  {unlocksSpec && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{background:'#a855f720',border:'1px solid #a855f766',color:'#a855f7'}}>✦ SBLOCCA SPECIALE</span>
                  )}
                  {!isMyOwn && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold
                      bg-[#f9731614] border border-[#f9731644] text-[#f97316]">⚠ carta altrui</span>
                  )}
                </div>
                <h3 className="text-base font-black font-mono text-white leading-tight">
                  {card.card_name}
                </h3>
                <p className="text-[10px] font-mono text-[#445566] mt-0.5">{card.card_id} · OP {card.op_points}</p>
              </div>

              {/* Descrizione */}
              {description && (
                <p className="text-xs font-mono text-[#99aabb] italic leading-relaxed
                  p-2 rounded-lg border border-[#1e3a5f] bg-[#060d18]">
                  "{description}"
                </p>
              )}

              {/* Modificatori tracciati */}
              {deltas.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono font-bold text-[#445566] uppercase tracking-widest mb-1">
                    📊 Effetti sui tracciati
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {deltas.map(d => {
                      const positive = d.posGood ? d.delta > 0 : d.delta < 0;
                      const color = positive ? '#22c55e' : '#ef4444';
                      // Mostra sempre +N se benefico, -N se dannoso (indipendente dal segno grezzo)
                      const displayVal = Math.abs(d.delta);
                      const displaySign = positive ? '+' : '-';
                      return (
                        <div
                          key={d.key}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-xs font-bold"
                          style={{ backgroundColor: `${color}12`, borderColor: `${color}33`, color }}
                        >
                          <span>{d.icon}</span>
                          <span>{displaySign}{displayVal}</span>
                          <span className="text-[10px]">{positive ? '▲' : '▼'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Avviso evento automatico */}
              {!isMyOwn && (
                <p className="text-[9px] font-mono text-[#f97316] leading-snug p-1.5 rounded
                  bg-[#f9731610] border border-[#f9731630]">
                  🔁 Usata come OP → evento di {ownerFaction} si attiva automaticamente
                </p>
              )}
            </div>
          </div>

          {/* ── Azioni ── */}
          {!disabled && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { onPlay(); onClose(); }}
                className="flex-1 py-3 rounded-xl font-mono font-black text-sm tracking-wider transition-all"
                style={{
                  background: isMyOwn
                    ? `linear-gradient(135deg, ${borderColor}, ${borderColor}aa)`
                    : 'linear-gradient(135deg, #f97316, #ea6600)',
                  color: '#0a0e1a',
                  boxShadow: `0 0 16px ${isMyOwn ? borderColor : '#f97316'}44`,
                }}
              >
                {isMyOwn ? `▶ Seleziona e gioca` : `▶ Usa come OP`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl font-mono text-sm border text-[#8899aa]"
                style={{ borderColor: '#1e3a5f', backgroundColor: '#060d18' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

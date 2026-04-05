// =============================================
// LINEA ROSSA — CardPeek.tsx
// Pannello di anteprima espansa che appare sopra la mano
// quando l'utente clicca una carta.
// Mostra la carta a dimensione 'lg' con tutti i dettagli
// leggibili + 4 pulsanti azione unificati.
// =============================================
import type { GameCard, DeckCard } from '@/types/game';
import { isGoodForFaction } from '@/lib/cardColors';
import CardVisual, {
  CARD_TYPE_BORDER, FACTION_COLOR, FACTION_FLAG,
  CARD_TYPE_ICON, CARD_ART,
} from './CardVisual';

interface CardPeekProps {
  card: GameCard | DeckCard;
  myFaction?: string;              // per distinguere carte proprie/altrui (mazzo unificato)
  onClose: () => void;
  onPlay?: () => void;             // retrocompatibilità: singolo bottone legacy
  onPlayEvento?: () => void;       // gioca come evento — applica effetti tracciati
  onPlayInfluenza?: () => void;    // usa OP per influenza territorio
  onPlayAttacco?: () => void;      // usa OP per attacco militare
  onPlayAcquisto?: () => void;     // usa OP per acquisto risorse/unità
  disabled?: boolean;
  isMyTurn?: boolean;
}

// ─── Tracciati ────────────────────────────────
const TRACK_INFO: Record<string, { icon: string; label: string; posGood: boolean }> = {
  // ─── Globali ───────────────────────────────────────────────────────────────
  nucleare:  { icon: '☢️',  label: 'Nucleare Iraniano (1-15)',           posGood: false },
  sanzioni:  { icon: '🔒',  label: 'Sanzioni Internazionali (1-20)',      posGood: false },
  opinione:  { icon: '📣',  label: 'Opinione Globale (-10/+10)',           posGood: true  },
  defcon:    { icon: '🚨',  label: 'DEFCON — Allerta Guerra (1-10)',       posGood: true  },
  risorse:   { icon: '💰',  label: 'Risorse Proprie',                      posGood: true  },
  stabilita: { icon: '🏗️', label: 'Stabilità Interna',                   posGood: true  },
  // ─── Iran 🇮🇷 ───────────────────────────────────────────────────────────────
  risorse_iran:               { icon: '💵', label: '🇮🇷 Risorse Iran',                posGood: true },
  forze_militari_iran:        { icon: '⚔️', label: '🇮🇷 Forze Militari Iran',        posGood: true },
  tecnologia_nucleare_iran:   { icon: '🔬', label: '🇮🇷 Tecnologia Nucleare Iran',   posGood: true },
  stabilita_iran:             { icon: '🕌', label: '🇮🇷 Stabilità Iran',             posGood: true },
  // ─── Coalizione 🇺🇸 ─────────────────────────────────────────────────────────
  risorse_coalizione:                  { icon: '🪖', label: '🇺🇸 Risorse Militari',             posGood: true },
  influenza_diplomatica_coalizione:    { icon: '🤝', label: '🇺🇸 Influenza Diplomatica',        posGood: true },
  tecnologia_avanzata_coalizione:      { icon: '💻', label: '🇺🇸 Tecnologia Avanzata',          posGood: true },
  supporto_pubblico_coalizione:        { icon: '📢', label: '🇺🇸 Supporto Pubblico',            posGood: true },
  stabilita_coalizione:                { icon: '🗽', label: '🇺🇸 Stabilità Coalizione',         posGood: true },
  // ─── Russia 🇷🇺 ──────────────────────────────────────────────────────────────
  risorse_russia:             { icon: '🛢️', label: '🇷🇺 Risorse Russia',              posGood: true },
  influenza_militare_russia:  { icon: '🎖️', label: '🇷🇺 Influenza Militare',          posGood: true },
  veto_onu_russia:            { icon: '🏛️', label: '🇷🇺 Veto ONU Russia (0-3)',       posGood: true },
  stabilita_economica_russia: { icon: '📊', label: '🇷🇺 Stabilità Economica',          posGood: true },
  stabilita_russia:           { icon: '🐻', label: '🇷🇺 Stabilità Russia',             posGood: true },
  // ─── Cina 🇨🇳 ────────────────────────────────────────────────────────────────
  risorse_cina:               { icon: '🏭', label: '🇨🇳 Potenza Economica Cina',      posGood: true },
  influenza_commerciale_cina: { icon: '🏪', label: '🇨🇳 Influenza Commerciale',       posGood: true },
  cyber_warfare_cina:         { icon: '🖥️', label: '🇨🇳 Cyber Warfare',              posGood: true },
  stabilita_rotte_cina:       { icon: '🚢', label: '🇨🇳 Stabilità Rotte',            posGood: true },
  stabilita_cina:             { icon: '🐉', label: '🇨🇳 Stabilità Cina',             posGood: true },
  // ─── Europa 🇪🇺 ───────────────────────────────────────────────────────────────
  risorse_europa:               { icon: '⚡',  label: '🇪🇺 Stabilità Energetica',    posGood: true },
  influenza_diplomatica_europa: { icon: '🕊️', label: '🇪🇺 Influenza Diplomatica',   posGood: true },
  aiuti_umanitari_europa:       { icon: '❤️', label: '🇪🇺 Aiuti Umanitari',         posGood: true },
  coesione_ue_europa:           { icon: '🌐', label: '🇪🇺 Coesione UE',             posGood: true },
  stabilita_europa:             { icon: '🏰', label: '🇪🇺 Stabilità Europa',         posGood: true },
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

function getDeltas(card: GameCard | DeckCard) {
  if (!('effects' in card) || !card.effects) return [];
  const e = card.effects as Record<string, ((v: number) => number) | undefined>;
  return Object.entries(e)
    .map(([key, fn]) => {
      if (!fn) return null;
      const ref = DEFAULT_VALS[key] ?? 5;
      const delta = fn(ref);  // fn restituisce già il delta (es. -2), non il nuovo valore
      if (delta === 0) return null;
      const info = TRACK_INFO[key];
      if (!info) return null;
      return { key, ...info, delta };
    })
    .filter(Boolean) as Array<{ key: string; icon: string; label: string; posGood: boolean; delta: number }>;
}

export default function CardPeek({
  card,
  myFaction,
  onClose,
  onPlay,
  onPlayEvento,
  onPlayInfluenza,
  onPlayAttacco,
  onPlayAcquisto,
  disabled = false,
  isMyTurn = false,
}: CardPeekProps) {
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

  // Determina se mostrare i nuovi 4 pulsanti oppure il bottone legacy
  const hasNewActions = onPlayEvento || onPlayInfluenza || onPlayAttacco || onPlayAcquisto;
  const hasLegacyPlay = !hasNewActions && onPlay;

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
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Drag handle ── */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#334455]" />
        </div>

        {/* ── Contenuto scrollabile ── */}
        <div className="overflow-y-auto flex-1 px-4 pb-2 pt-1">
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
                      const cardFaction = (card.faction as string) ?? 'Neutrale';
                      const isGood = isGoodForFaction(d.key, d.delta, cardFaction);
                      const color = isGood ? '#22c55e' : '#ef4444';
                      // Segno e freccia REALI sempre (rispecchiano il delta effettivo)
                      const displayVal = Math.abs(d.delta);
                      const sign = d.delta > 0 ? '+' : '-';
                      const arrow = d.delta > 0 ? '▲' : '▼';
                      return (
                        <div
                          key={d.key}
                          title={d.label}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-xs font-bold cursor-help"
                          style={{ backgroundColor: `${color}12`, borderColor: `${color}33`, color }}
                        >
                          <span>{d.icon}</span>
                          <span>{sign}{displayVal}</span>
                          <span className="text-[10px]">{arrow}</span>
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
        </div>

        {/* ══════════════════════════════════════════
            SEZIONE AZIONI — fuori dallo scroll,
            sempre visibile in fondo al pannello
        ══════════════════════════════════════════ */}

        {/* ── Nuovi 4 pulsanti azione (flusso unificato) ── */}
        {isMyTurn && !disabled && hasNewActions && (
          <div className="px-4 pb-4 pt-3 border-t border-[#1e3a5f] space-y-2">
            <p className="text-[#445566] font-mono text-[10px] uppercase tracking-widest mb-2">
              Come vuoi giocare questa carta?
            </p>

            {onPlayEvento && (
              <button
                onClick={() => { onPlayEvento(); }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[.98]"
                title="Gioca come EVENTO: applica gli effetti meccanici ai tracciati"
                style={{
                  background: '#22c55e20',
                  border: '1.5px solid #22c55e55',
                  color: '#22c55e',
                }}
              >
                ⚡ Gioca come EVENTO
                <span className="text-[10px] opacity-60">— applica effetti tracciati</span>
              </button>
            )}

            {onPlayInfluenza && (
              <button
                onClick={() => { onPlayInfluenza(); }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[.98]"
                title="Usa i Punti Operazione per piazzare influenza in un territorio"
                style={{
                  background: '#3b82f620',
                  border: '1.5px solid #3b82f655',
                  color: '#3b82f6',
                }}
              >
                🌍 Usa OP — Influenza Territorio
                <span className="text-[10px] opacity-60">— {card.op_points} OP disponibili</span>
              </button>
            )}

            {onPlayAttacco && (
              <button
                onClick={() => { onPlayAttacco(); }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[.98]"
                title="Usa i Punti Operazione per attaccare un territorio nemico"
                style={{
                  background: '#ef444420',
                  border: '1.5px solid #ef444455',
                  color: '#ef4444',
                }}
              >
                ⚔️ Usa OP — Attacco Militare
                <span className="text-[10px] opacity-60">— {card.op_points} OP disponibili</span>
              </button>
            )}

            {onPlayAcquisto && (
              <button
                onClick={() => { onPlayAcquisto(); }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[.98]"
                title="Usa i Punti Operazione per acquistare unità militari o risorse"
                style={{
                  background: '#f59e0b20',
                  border: '1.5px solid #f59e0b55',
                  color: '#f59e0b',
                }}
              >
                🏭 Usa OP — Acquista Unità/Risorse
                <span className="text-[10px] opacity-60">— {card.op_points} OP disponibili</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-mono text-[#445566] border border-[#1e3a5f] hover:border-[#445566] transition-all"
            >
              ✕ Annulla
            </button>
          </div>
        )}

        {/* ── Bottone legacy (retrocompatibilità) ── */}
        {!disabled && hasLegacyPlay && (
          <div className="px-4 pb-4 pt-3 border-t border-[#1e3a5f]">
            <div className="flex gap-2">
              <button
                onClick={() => { onPlay!(); onClose(); }}
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
          </div>
        )}

        {/* ── Nessuna azione disponibile (non è il tuo turno) ── */}
        {(!isMyTurn || disabled) && !hasLegacyPlay && (
          <div className="px-4 pb-4 pt-3 border-t border-[#1e3a5f]">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-mono text-[#445566] border border-[#1e3a5f] hover:border-[#445566] transition-all"
            >
              ✕ Chiudi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

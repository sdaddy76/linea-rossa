// =============================================
// LINEA ROSSA — Pagina di Gioco Online
// Layout: plancia completa in alto, azioni in basso
// =============================================
import { useEffect, useState, useMemo, useRef } from 'react';
import { useOnlineGameStore } from '@/store/onlineGameStore';
import type { Faction, GameState } from '@/types/game';
import { MAZZI_PER_FAZIONE, MAZZI_SPECIALI } from '@/data/mazzi';
import type { GameCard } from '@/types/game';
import MilitaryMarket from '@/components/MilitaryMarket';
import { calcolaCosto, getForzeMilitari } from '@/lib/militaryMarket';
import TerritoryMap from '@/components/TerritoryMap';
import CombatPanel from '@/components/CombatPanel';
import PlayerActionPanel from '@/components/PlayerActionPanel';
import type { PlayerActionType, PlayerActionPayload } from '@/components/PlayerActionPanel';
import type { TerritoryState } from '@/components/TerritoryMap';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import type { CombatOutcome } from '@/lib/combatEngine';
import EventoModal from '@/components/EventoModal';
import UnifiedCardPlayModal from '@/components/UnifiedCardPlayModal';
import OpsActionModal from '@/components/OpsActionModal';
import { ClassicHandCard, UnifiedHandCard } from '@/components/HandCard';
import { FACTION_FLAGS, FACTION_COLORS, CARD_TYPE_COLORS } from '@/lib/factionColors';
import type { EventoCard } from '@/data/eventi';
import ObjectivesModal from '@/components/ObjectivesModal';

// ─── Colori fazione ───────────────────────────
// Importati da @/lib/factionColors

// ─── Definizione tracciati ────────────────────
interface TrackZone { from: number; to: number; color: string; bg: string; label: string; }
interface TrackDef {
  id: string; label: string; icon: string; min: number; max: number;
  color: string; zones: TrackZone[];
  getValue: (s: GameState) => number;
  winLabel?: string; winValue?: number; winDir?: 'up' | 'down';
}

const TRACKS: TrackDef[] = [
  {
    id: 'nucleare', label: 'Nucleare Iraniano', icon: '☢️', min: 1, max: 15, color: '#22c55e',
    getValue: s => s.nucleare, winLabel: 'BREAKOUT', winValue: 15, winDir: 'up',
    zones: [
      { from: 1,  to: 4,  color: '#22c55e', bg: '#22c55e22', label: 'Ricerca' },
      { from: 5,  to: 8,  color: '#84cc16', bg: '#84cc1622', label: 'Sviluppo' },
      { from: 9,  to: 11, color: '#f59e0b', bg: '#f59e0b22', label: 'Avanzato' },
      { from: 12, to: 13, color: '#f97316', bg: '#f97316aa', label: 'Critico' },
      { from: 14, to: 15, color: '#ef4444', bg: '#ef444433', label: 'Breakout' },
    ],
  },
  {
    id: 'sanzioni', label: 'Sanzioni / Stabilità', icon: '💰', min: 1, max: 10, color: '#3b82f6',
    getValue: s => s.sanzioni, winLabel: 'COLLASSO', winValue: 10, winDir: 'up',
    zones: [
      { from: 1,  to: 3,  color: '#22c55e', bg: '#22c55e22', label: 'Lievi' },
      { from: 4,  to: 6,  color: '#f59e0b', bg: '#f59e0b22', label: 'Moderate' },
      { from: 7,  to: 8,  color: '#f97316', bg: '#f9731622', label: 'Gravi' },
      { from: 9,  to: 10, color: '#ef4444', bg: '#ef444433', label: 'Collasso' },
    ],
  },
  {
    id: 'defcon', label: 'DEFCON', icon: '🎯', min: 1, max: 10, color: '#8b5cf6',
    getValue: s => s.defcon, winLabel: 'GUERRA', winValue: 1, winDir: 'down',
    zones: [
      { from: 8,  to: 10, color: '#22c55e', bg: '#22c55e22', label: 'Pace' },
      { from: 6,  to: 7,  color: '#84cc16', bg: '#84cc1622', label: 'Attenzione' },
      { from: 4,  to: 5,  color: '#f59e0b', bg: '#f59e0b22', label: 'Tensione' },
      { from: 2,  to: 3,  color: '#f97316', bg: '#f9731622', label: 'Allerta' },
      { from: 1,  to: 1,  color: '#ef4444', bg: '#ef444433', label: 'Guerra' },
    ],
  },
  {
    id: 'opinione', label: 'Opinione Globale', icon: '🌍', min: -10, max: 10, color: '#ec4899',
    getValue: s => s.opinione,
    zones: [
      { from: -10, to: -6, color: '#22c55e', bg: '#22c55e22', label: 'Pro-Iran' },
      { from: -5,  to: -1, color: '#84cc16', bg: '#84cc1622', label: 'Simpatia' },
      { from: 0,   to: 0,  color: '#8899aa', bg: '#8899aa22', label: 'Neutrale' },
      { from: 1,   to: 5,  color: '#60a5fa', bg: '#60a5fa22', label: 'Pressione' },
      { from: 6,   to: 10, color: '#3b82f6', bg: '#3b82f633', label: 'Isolamento' },
    ],
  },
];

// ─── Definizione tracciati per-fazione ────────
interface FactionTrackZone { from: number; to: number; color: string; bg: string; label: string; }
interface FactionTrackDef {
  id: string; label: string; icon: string; min: number; max: number;
  color: string; zones: FactionTrackZone[];
  isPO?: boolean;      // tracciato che determina i Punti Operazione
  isIndicator?: boolean; // indicatore (non tracciato principale)
}

// ─── Zone comuni riutilizzabili ───────────────
const ZONE_STANDARD: FactionTrackZone[] = [
  { from: 1,  to: 2,  color: '#ef4444', bg: '#ef444422', label: 'Critico' },
  { from: 3,  to: 4,  color: '#f97316', bg: '#f9731622', label: 'Basso' },
  { from: 5,  to: 6,  color: '#f59e0b', bg: '#f59e0b22', label: 'Medio' },
  { from: 7,  to: 8,  color: '#84cc16', bg: '#84cc1622', label: 'Alto' },
  { from: 9,  to: 10, color: '#22c55e', bg: '#22c55e22', label: 'Massimo' },
];
const ZONE_MILITARI_15: FactionTrackZone[] = [
  { from: 1,  to: 3,  color: '#ef4444', bg: '#ef444422', label: 'Scarso' },
  { from: 4,  to: 6,  color: '#f97316', bg: '#f9731622', label: 'Limitato' },
  { from: 7,  to: 9,  color: '#f59e0b', bg: '#f59e0b22', label: 'Adeguato' },
  { from: 10, to: 12, color: '#84cc16', bg: '#84cc1622', label: 'Forte' },
  { from: 13, to: 15, color: '#22c55e', bg: '#22c55e22', label: 'Dominante' },
];
const ZONE_ECONOMICA_12: FactionTrackZone[] = [
  { from: 1,  to: 3,  color: '#ef4444', bg: '#ef444422', label: 'Debole' },
  { from: 4,  to: 6,  color: '#f97316', bg: '#f9731622', label: 'In crescita' },
  { from: 7,  to: 9,  color: '#f59e0b', bg: '#f59e0b22', label: 'Sviluppata' },
  { from: 10, to: 12, color: '#22c55e', bg: '#22c55e22', label: 'Potenza' },
];
const ZONE_NUCLEARE_IRAN: FactionTrackZone[] = [
  { from: 1,  to: 3,  color: '#22c55e', bg: '#22c55e22', label: 'Ricerca' },
  { from: 4,  to: 6,  color: '#84cc16', bg: '#84cc1622', label: 'Sviluppo' },
  { from: 7,  to: 8,  color: '#f59e0b', bg: '#f59e0b22', label: 'Avanzato' },
  { from: 9,  to: 10, color: '#ef4444', bg: '#ef444422', label: 'Critico' },
];
const ZONE_VETO: FactionTrackZone[] = [
  { from: 0,  to: 0,  color: '#ef4444', bg: '#ef444422', label: 'Esauriti' },
  { from: 1,  to: 1,  color: '#f97316', bg: '#f9731622', label: '1 rimasto' },
  { from: 2,  to: 2,  color: '#f59e0b', bg: '#f59e0b22', label: '2 rimasti' },
  { from: 3,  to: 3,  color: '#22c55e', bg: '#22c55e22', label: 'Pieno' },
];
const ZONE_STABILITA: FactionTrackZone[] = [
  { from: 1,  to: 2,  color: '#ef4444', bg: '#ef444422', label: 'Collasso' },
  { from: 3,  to: 4,  color: '#f97316', bg: '#f9731622', label: 'Instabile' },
  { from: 5,  to: 6,  color: '#f59e0b', bg: '#f59e0b22', label: 'Precaria' },
  { from: 7,  to: 8,  color: '#84cc16', bg: '#84cc1622', label: 'Stabile' },
  { from: 9,  to: 10, color: '#22c55e', bg: '#22c55e22', label: 'Solida' },
];

// ─── Tracciati per-fazione dal regolamento ────
const FACTION_TRACKS: Record<string, FactionTrackDef[]> = {
  Iran: [
    { id: 'risorse_iran',             label: 'Risorse Economiche', icon: '💰', min: 1, max: 10, color: '#f59e0b', zones: ZONE_STANDARD,       isPO: true },
    { id: 'forze_militari_iran',      label: 'Forze Militari',     icon: '⚔️', min: 1, max: 10, color: '#ef4444', zones: ZONE_STANDARD },
    { id: 'tecnologia_nucleare_iran', label: 'Tecnologia Nucleare',icon: '☢️', min: 1, max: 10, color: '#22c55e', zones: ZONE_NUCLEARE_IRAN },
    { id: 'stabilita_iran',           label: 'Stabilità Interna',  icon: '🏛️', min: 1, max: 10, color: '#a78bfa', zones: ZONE_STABILITA,      isIndicator: true },
  ],
  Coalizione: [
    { id: 'risorse_coalizione',               label: 'Risorse Militari',      icon: '🪖', min: 1, max: 15, color: '#3b82f6', zones: ZONE_MILITARI_15, isPO: true },
    { id: 'influenza_diplomatica_coalizione', label: 'Influenza Diplomatica', icon: '🤝', min: 1, max: 10, color: '#60a5fa', zones: ZONE_STANDARD },
    { id: 'tecnologia_avanzata_coalizione',   label: 'Tecnologia Avanzata',   icon: '🛸', min: 1, max: 10, color: '#818cf8', zones: ZONE_STANDARD },
    { id: 'supporto_pubblico_coalizione',     label: 'Supporto Pubblico',     icon: '📊', min: 1, max: 10, color: '#c084fc', zones: ZONE_STABILITA, isIndicator: true },
  ],
  Russia: [
    { id: 'risorse_russia',           label: 'Energia / Risorse',  icon: '⛽', min: 1, max: 10, color: '#f97316', zones: ZONE_STANDARD,  isPO: true },
    { id: 'influenza_militare_russia',label: 'Influenza Militare', icon: '🪖', min: 1, max: 10, color: '#ef4444', zones: ZONE_STANDARD },
    { id: 'veto_onu_russia',          label: 'Veto ONU',           icon: '🏛️', min: 0, max: 3,  color: '#fbbf24', zones: ZONE_VETO },
    { id: 'stabilita_economica_russia',label:'Stabilità Economica',icon: '💹', min: 1, max: 10, color: '#a3e635', zones: ZONE_STABILITA, isIndicator: true },
  ],
  Cina: [
    { id: 'risorse_cina',              label: 'Potenza Economica',   icon: '💴', min: 1, max: 12, color: '#f59e0b', zones: ZONE_ECONOMICA_12, isPO: true },
    { id: 'influenza_commerciale_cina',label: 'Influenza Commerciale',icon:'🛒', min: 1, max: 10, color: '#fbbf24', zones: ZONE_STANDARD },
    { id: 'cyber_warfare_cina',        label: 'Cyber Warfare',       icon: '💻', min: 1, max: 10, color: '#34d399', zones: ZONE_STANDARD },
    { id: 'stabilita_rotte_cina',      label: 'Stabilità Rotte',     icon: '🚢', min: 1, max: 10, color: '#6ee7b7', zones: ZONE_STABILITA, isIndicator: true },
  ],
  Europa: [
    { id: 'risorse_europa',             label: 'Stabilità Energetica', icon: '⚡', min: 1, max: 10, color: '#8b5cf6', zones: ZONE_STANDARD,  isPO: true },
    { id: 'influenza_diplomatica_europa',label:'Influenza Diplomatica',icon: '🤝', min: 1, max: 10, color: '#a78bfa', zones: ZONE_STANDARD },
    { id: 'aiuti_umanitari_europa',     label: 'Aiuti Umanitari',      icon: '🏥', min: 1, max: 10, color: '#c084fc', zones: ZONE_STANDARD },
    { id: 'coesione_ue_europa',         label: 'Coesione Interna UE',  icon: '🇪🇺', min: 1, max: 10, color: '#7c3aed', zones: ZONE_STABILITA, isIndicator: true },
  ],
};

// ─── Componente singolo segmento numerato ─────
function Segment({
  n, isActive, zoneColor, zoneBg, isPulse,
}: {
  n: number; isActive: boolean; zoneColor: string; zoneBg: string; isPulse: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center rounded font-mono text-[10px] font-bold
        transition-all duration-500 select-none
        ${isActive ? 'ring-2 ring-white scale-110 z-10 shadow-lg' : ''}
        ${isPulse && isActive ? 'animate-pulse' : ''}`}
      style={{
        width: 28, height: 28,
        backgroundColor: isActive ? zoneColor : zoneBg,
        color: isActive ? '#0a0e1a' : zoneColor,
        border: `1px solid ${zoneColor}55`,
        boxShadow: isActive ? `0 0 10px ${zoneColor}aa` : 'none',
      }}
    >
      {n}
    </div>
  );
}

// ─── Tracciato completo (orizzontale con segmenti) ─
function FullTrack({
  track, value, prevValue,
}: {
  track: TrackDef; value: number; prevValue?: number;
}) {
  const range = Array.from({ length: track.max - track.min + 1 }, (_, i) => track.min + i);
  const delta = prevValue !== undefined ? value - prevValue : 0;

  const getZone = (n: number) =>
    track.zones.find(z => n >= z.from && n <= z.to) ??
    { color: '#8899aa', bg: '#8899aa22', label: '' };

  const currentZone = getZone(value);
  const isPulse = (track.id === 'nucleare' && value >= 12) ||
                  (track.id === 'sanzioni' && value >= 9) ||
                  (track.id === 'defcon'   && value <= 4);

  return (
    <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-3 space-y-2">
      {/* Header tracciato */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{track.icon}</span>
          <span className="font-mono text-xs font-bold text-white">{track.label}</span>
          {/* Badge zona corrente */}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
            style={{ color: currentZone.color, backgroundColor: `${currentZone.color}20`, border: `1px solid ${currentZone.color}40` }}>
            {currentZone.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Delta ultimo turno */}
          {delta !== 0 && (
            <span className={`text-[10px] font-mono font-bold px-1 rounded ${
              delta > 0 ? 'text-[#22c55e] bg-[#22c55e20]' : 'text-[#ef4444] bg-[#ef444420]'
            }`}>
              {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
            </span>
          )}
          {/* Valore corrente grande */}
          <span className="font-mono text-xl font-bold" style={{ color: currentZone.color }}>
            {value}
          </span>
          <span className="text-[10px] text-[#334455] font-mono">/{track.max}</span>
        </div>
      </div>

      {/* Segmenti numerati */}
      <div className="flex flex-wrap gap-1 items-center">
        {range.map(n => {
          const z = getZone(n);
          return (
            <Segment key={n} n={n}
              isActive={n === value}
              zoneColor={z.color} zoneBg={z.bg}
              isPulse={isPulse} />
          );
        })}
        {/* Indicatore vittoria */}
        {track.winLabel && (
          <div className="ml-1 flex items-center gap-1">
            <span className="text-[#ef4444] text-xs">→</span>
            <span className="text-[10px] font-mono text-[#ef4444] font-bold">{track.winLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tracciato singolo per-fazione (visivo, con segmenti) ────────────────
function FactionSingleTrack({
  track, value, factionColor,
}: { track: FactionTrackDef; value: number; factionColor: string }) {
  const activeZone = track.zones.find(z => value >= z.from && value <= z.to) ?? track.zones[0];
  const pct = ((value - track.min) / (track.max - track.min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-[#8899aa] flex items-center gap-1">
          {track.icon} {track.label}
          {track.isPO && (
            <span className="text-[8px] font-bold px-1 rounded" style={{ color: factionColor, backgroundColor: `${factionColor}22` }}>PO</span>
          )}
          {track.isIndicator && (
            <span className="text-[8px] font-bold px-1 rounded text-[#8899aa] bg-[#1e2a3a]">IND</span>
          )}
        </span>
        <span className="font-mono text-xs font-bold" style={{ color: activeZone.color }}>
          {value}/{track.max} · {activeZone.label}
        </span>
      </div>
      {/* Barra segmentata */}
      <div className="flex gap-0.5 h-4">
        {Array.from({ length: track.max - track.min + 1 }, (_, i) => {
          const v = track.min + i;
          const zone = track.zones.find(z => v >= z.from && v <= z.to);
          const isActive = v <= value;
          return (
            <div key={v} className="flex-1 rounded-sm transition-all duration-300"
              style={{
                backgroundColor: isActive ? (zone?.color ?? factionColor) : '#1e2a3a',
                opacity: isActive ? 1 : 0.3,
                boxShadow: isActive && v === value ? `0 0 6px ${zone?.color ?? factionColor}88` : 'none',
              }} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Card tracciati per singola fazione ──────────────────────────────────
function FactionTrackCard({
  faction, gameState,
}: { faction: string; gameState: import('@/types/game').GameState }) {
  const fc = FACTION_COLORS[faction] ?? '#8899aa';
  const tracks = FACTION_TRACKS[faction] ?? [];

  return (
    <div className="rounded-xl border p-4 space-y-2"
      style={{ backgroundColor: '#0d1117', borderColor: `${fc}44` }}>
      {/* Header fazione */}
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: `${fc}22` }}>
        <span className="text-xl">{FACTION_FLAGS[faction]}</span>
        <span className="font-mono text-sm font-bold" style={{ color: fc }}>{faction}</span>
      </div>
      {/* Tracciati — separati da linea sottile prima dell'indicatore */}
      <div className="space-y-2.5">
        {tracks.map((track, idx) => {
          const value = (gameState[track.id as keyof typeof gameState] as number) ?? track.min;
          const showDivider = idx > 0 && track.isIndicator && !tracks[idx - 1].isIndicator;
          return (
            <div key={track.id}>
              {showDivider && <div className="border-t border-dashed my-1" style={{ borderColor: `${fc}22` }} />}
              <FactionSingleTrack track={track} value={value} factionColor={fc} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGINA PRINCIPALE ────────────────────────
export default function GamePage({ onBack }: { onBack: () => void }) {
  const {
    game, gameState, players, myFaction, moves, deckCards,
    loading, isBotThinking, error, gameOverInfo, notification,
    playCard, startGame, clearError, setNotification, buyMilitaryResources,
    loadTerritories, deployUnit, attackTerritory, addInfluence,
    runBotTurn, playCardUnified, playCardOps, drawCards, myHand,
    territories: terrRecords, militaryUnits: unitRecords,
    profile, session,
    myObjectives, assignObjectivesToFaction,
  } = useOnlineGameStore();

  // L'host è chi ha creato la partita (game.created_by === utente corrente)
  const isHost = !!(game && (session?.user?.id ?? profile?.id) && game.created_by === (session?.user?.id ?? profile?.id));

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showHand, setShowHand] = useState(true);
  const [prevState, setPrevState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<'plancia' | 'fazioni' | 'mappa'>('plancia');
  const [showMarket, setShowMarket] = useState(false);
  const [showCombat, setShowCombat] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryId | null>(null);

  // ── Mazzo unificato: carta selezionata per la scelta modale ─────────────────
  // selectedUnifiedCard = DeckCard.id (UUID) della carta in mano selezionata
  const [selectedUnifiedCard, setSelectedUnifiedCard] = useState<string | null>(null);
  // Quando il giocatore sceglie "USA PUNTI OP" → mostra OpsActionModal
  const [showOpsModal, setShowOpsModal] = useState(false);
  const isUnified = game?.game_mode === 'unified';
  // Mano corrente nel mazzo unificato (DeckCard con status='in_hand' e held_by_faction=me)
  const myHandCards = isUnified ? myHand() : [];
  // Carta selezionata per il modale
  const unifiedCardToPlay = myHandCards.find(dc => dc.id === selectedUnifiedCard) ?? null;

  // ── Sistema eventi ───────────────────────────────────────────────────────
  // Logica: all'inizio di OGNI turno (quando active_faction torna a 'Iran' con
  // un nuovo current_turn) viene pescato UN evento, gli effetti sono applicati
  // automaticamente nel DB da chi è host (o dalla prima istanza che li vede),
  // e il modale viene mostrato a TUTTI i giocatori in sola lettura.
  // L'evento pescato è salvato in game_state.last_event_id / last_event_turn
  // così è sincronizzato via real-time per tutti.

  const [eventoCorrente, setEventoCorrente] = useState<EventoCard | null>(null);
  const applicandoEventoRef = useRef(false); // lock anti-race tra tab multipli
  const [showObjectives, setShowObjectives] = useState(false);

  // Carica territori e unità a inizio partita
  useEffect(() => {
    if (game?.id) loadTerritories();
  }, [game?.id]);

  // Converti recordset DB → struttura TerritoryState per TerritoryMap
  const territoryState = useMemo<TerritoryState>(() => {
    const state: TerritoryState = {};
    for (const t of terrRecords) {
      state[t.territory] = {
        influences: {
          Iran: t.inf_iran,
          Coalizione: t.inf_coalizione,
          Russia: t.inf_russia,
          Cina: t.inf_cina,
          Europa: t.inf_europa,
        } as Record<Faction, number>,
        units: {},
      };
    }
    for (const u of unitRecords) {
      if (!state[u.territory]) state[u.territory] = { influences: {}, units: {} };
      if (!state[u.territory].units![u.faction as Faction])
        state[u.territory].units![u.faction as Faction] = {};
      (state[u.territory].units![u.faction as Faction] as Record<string, number>)[u.unit_type] = u.quantity;
    }
    return state;
  }, [terrRecords, unitRecords]);

  // Pool unità personale
  const myUnitsPool = useMemo<Partial<Record<UnitType, number>>>(() => {
    if (!gameState || !myFaction) return {};
    const key = `units_${myFaction.toLowerCase()}` as keyof typeof gameState;
    return (gameState[key] as Record<string, number>) ?? {};
  }, [gameState, myFaction]);

  // ── Pesca + applica evento all'inizio di ogni nuovo turno (entrambe le modalità) ──
  // Trigger: active_faction === 'Iran' (= inizio nuovo turno numerato).
  // Funziona sia in modalità classica che unificata.
  // Solo l'host pesca e applica i delta; tutti ricevono l'aggiornamento via real-time.
  useEffect(() => {
    if (!game || !gameState || game.status !== 'active') return;
    if (gameState.active_faction !== 'Iran') return;

    const turnNum = game.current_turn;

    // Evento già registrato per questo turno → mostra il modale a tutti
    if (gameState.last_event_turn === turnNum && gameState.last_event_id) {
      import('@/data/eventi').then(({ getEventoById }) => {
        const ev = getEventoById(gameState.last_event_id!) as EventoCard | undefined;
        if (ev && eventoCorrente?.event_id !== ev.event_id) {
          setTimeout(() => setEventoCorrente(ev), 400);
        }
      });
      return;
    }

    // Nessun evento ancora per questo turno → solo l'host lo applica
    if (!isHost) return;

    // Reset del lock se rimasto da un turno precedente (guard anti-stale)
    // Forziamo il reset se il turnNum è cambiato rispetto all'ultima esecuzione
    const lockKey = `evento_lock_turn_${game.id}`;
    const lastLockedTurn = Number(sessionStorage.getItem(lockKey) ?? -1);
    if (lastLockedTurn === turnNum) return;          // già in esecuzione per questo turno
    sessionStorage.setItem(lockKey, String(turnNum)); // marca il turno corrente come "in lavorazione"
    applicandoEventoRef.current = true;

    const storageKey = `eventi_usati_${game.id}`;
    let usati: string[] = [];
    try { usati = JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { usati = []; }

    import('@/data/eventi').then(({ pescaEvento: pesca }) => {
      const evento = (pesca as (u: string[]) => EventoCard)(usati);
      usati = [...usati, evento.event_id];
      try { localStorage.setItem(storageKey, JSON.stringify(usati)); } catch { /* ignore */ }

      const ef = evento.effects;
      const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
      const gs = gameState;
      const updates: Record<string, number | string> = {
        last_event_turn: turnNum,
        last_event_id:   evento.event_id,
      };
      if (ef.delta_nucleare)           updates.nucleare           = clamp((gs.nucleare           ?? 1) + ef.delta_nucleare,           1, 15);
      if (ef.delta_sanzioni)           updates.sanzioni           = clamp((gs.sanzioni           ?? 5) + ef.delta_sanzioni,           1, 10);
      if (ef.delta_opinione)           updates.opinione           = clamp((gs.opinione           ?? 0) + ef.delta_opinione,          -10, 10);
      if (ef.delta_defcon)             updates.defcon             = clamp((gs.defcon             ?? 10) + ef.delta_defcon,            1, 10);
      if (ef.delta_risorse_iran)       updates.risorse_iran       = clamp((gs.risorse_iran       ?? 5) + ef.delta_risorse_iran,       1, 15);
      if (ef.delta_risorse_coalizione) updates.risorse_coalizione = clamp((gs.risorse_coalizione ?? 5) + ef.delta_risorse_coalizione, 1, 15);
      if (ef.delta_risorse_russia)     updates.risorse_russia     = clamp((gs.risorse_russia     ?? 5) + ef.delta_risorse_russia,     1, 15);
      if (ef.delta_risorse_cina)       updates.risorse_cina       = clamp((gs.risorse_cina       ?? 5) + ef.delta_risorse_cina,       1, 15);
      if (ef.delta_risorse_europa)     updates.risorse_europa     = clamp((gs.risorse_europa     ?? 5) + ef.delta_risorse_europa,     1, 15);
      if (ef.delta_stabilita_iran)     updates.stabilita_iran     = clamp((gs.stabilita_iran     ?? 5) + ef.delta_stabilita_iran,     1, 10);

      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase.from('game_state').update(updates).eq('game_id', game.id).then(({ error }) => {
          if (error) {
            // Se le colonne last_event_* non esistono, mostriamo solo il modale localmente
            console.warn('[evento] update fallito (colonne mancanti?):', error.message);
            setTimeout(() => setEventoCorrente(evento), 400);
          } else {
            useOnlineGameStore.setState(s => ({
              gameState: { ...s.gameState!, ...updates },
            }));
            setTimeout(() => setEventoCorrente(evento), 400);
          }
          applicandoEventoRef.current = false;
        });
      });
    });
  }, [gameState?.active_faction, game?.current_turn, game?.status,
      // Dipendenze last_event_* per sincronizzare i non-host con il DB
      gameState?.last_event_turn, gameState?.last_event_id]);

  // Chiude il modale (solo UI, gli effetti sono già applicati nel DB)
  const chiudiEvento = () => setEventoCorrente(null);

  // Traccia lo stato precedente per mostrare i delta
  useEffect(() => {
    if (gameState) {
      const t = setTimeout(() => setPrevState(gameState), 600);
      return () => clearTimeout(t);
    }
  }, [gameState?.nucleare, gameState?.sanzioni, gameState?.defcon, gameState?.opinione]);

  // Dismiss notifica
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification, setNotification]);

  // ── Watchdog bot: se è il turno di un bot ma isBotThinking=false → riavvia ──
  useEffect(() => {
    if (!game || !gameState || game.status !== 'active') return;
    if (isBotThinking) return;
    const activeFaction = gameState.active_faction;
    const activePlayer  = players.find(p => p.faction === activeFaction);
    if (!activePlayer?.is_bot) return;
    // Bot bloccato → riavvia dopo 2.5s
    const t = setTimeout(() => {
      runBotTurn();
    }, 2500);
    return () => clearTimeout(t);
  }, [gameState?.active_faction, isBotThinking, game?.status]);

  if (!game || !gameState) return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-4xl animate-pulse">☢️</div>
        <p className="text-[#00ff88] font-mono">Caricamento partita...</p>
      </div>
    </div>
  );

  const isMyTurn = gameState.active_faction === myFaction;
  const activeColor = FACTION_COLORS[gameState.active_faction] ?? '#00ff88';

  // ── Costruisce la mano del giocatore da deckCards (DB) ──────────────────
  // deckCards contiene le carte con status='available' caricate da Supabase.
  // Se la partita non è ancora avviata (lobby), mostra l'anteprima statica.
  const buildHand = (): GameCard[] => {
    if (!myFaction) return [];

    if (game.status === 'active') {
      // Partita avviata: mostra solo le carte in mano al giocatore (in_hand + held_by_faction=me)
      const handIds = new Set(
        deckCards
          .filter(dc =>
            dc.status === 'in_hand' &&
            dc.held_by_faction === myFaction
          )
          .map(dc => dc.card_id)
      );
      if (handIds.size === 0) return [];

      // Recupera le definizioni complete (effetti) dall'array statico
      const allDefs = [
        ...(MAZZI_PER_FAZIONE[myFaction] ?? []),
        ...(MAZZI_SPECIALI[myFaction] ?? []),
      ];
      return allDefs.filter(c => handIds.has(c.card_id));
    } else {
      // Partita non ancora avviata: mostra anteprima prime 6 carte
      return [
        ...(MAZZI_PER_FAZIONE[myFaction] ?? []),
        ...(MAZZI_SPECIALI[myFaction] ?? []),
      ].slice(0, 6);
    }
  };
  const myCards = buildHand();

  // ── Contatore carte rimanenti nel mazzo (non ancora pescate) ────────────
  const deckRemaining = isUnified
    ? deckCards.filter(dc => dc.status === 'available' && !dc.held_by_faction).length
    : deckCards.filter(dc => dc.faction === myFaction && dc.status === 'available' && !dc.held_by_faction).length;

  const getRisorse = (f: string) =>
    (gameState[`risorse_${f.toLowerCase()}` as keyof GameState] as number) ?? 5;
  const getStabilita = (f: string) =>
    (gameState[`stabilita_${f.toLowerCase()}` as keyof GameState] as number) ?? 5;

  // Valori tracciati per-fazione (risorse/stabilità mostrano quello della fazione attiva o del giocatore)
  const displayFaction = myFaction ?? gameState.active_faction;
  const trackValues: Record<string, number> = {
    nucleare:  gameState.nucleare,
    sanzioni:  gameState.sanzioni,
    defcon:    gameState.defcon,
    opinione:  gameState.opinione,
    risorse:   getRisorse(displayFaction),
    stabilita: getStabilita(displayFaction),
  };
  const prevValues: Record<string, number | undefined> = {
    nucleare:  prevState?.nucleare,
    sanzioni:  prevState?.sanzioni,
    defcon:    prevState?.defcon,
    opinione:  prevState?.opinione,
    risorse:   prevState ? (prevState[`risorse_${displayFaction.toLowerCase()}` as keyof GameState] as number) : undefined,
    stabilita: prevState ? (prevState[`stabilita_${displayFaction.toLowerCase()}` as keyof GameState] as number) : undefined,
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">

      {/* ─── NOTIFICA TOAST ─── */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
          bg-[#111827] border border-[#00ff88] rounded-xl px-4 py-2.5
          text-[#00ff88] font-mono text-sm shadow-2xl shadow-[#00ff8840]
          flex items-center gap-2 max-w-sm">
          <span>{notification}</span>
        </div>
      )}

      {/* ─── GAME OVER ─── */}
      {gameOverInfo && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#111827] border-2 border-[#00ff88] rounded-2xl p-8 max-w-md w-full text-center
            shadow-2xl shadow-[#00ff8840]">
            <div className="text-6xl mb-4">{gameOverInfo.winner ? FACTION_FLAGS[gameOverInfo.winner] ?? '🏆' : '💥'}</div>
            <h2 className="text-2xl font-bold text-[#00ff88] font-mono mb-2">PARTITA CONCLUSA</h2>
            <p className="text-white font-mono text-lg mb-1">
              {gameOverInfo.winner ? `✅ Vince: ${gameOverInfo.winner}` : '❌ Nessun vincitore'}
            </p>
            <p className="text-[#8899aa] font-mono text-sm mb-6">{gameOverInfo.message}</p>
            <button onClick={onBack}
              className="px-6 py-3 bg-[#00ff88] text-[#0a0e1a] font-bold font-mono rounded-xl
                hover:bg-[#00dd77] transition-colors">
              ← TORNA ALLA LOBBY
            </button>
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div className="bg-[#0d1421] border-b border-[#1e3a5f] px-4 py-2.5 shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3">
          {/* Titolo */}
          <div className="flex items-center gap-3">
            <span className="text-lg">☢️</span>
            <div>
              <h1 className="text-sm font-bold text-white font-mono leading-tight">{game.name}</h1>
              <p className="text-[10px] text-[#8899aa] font-mono">
                Turno <span className="text-white">{game.current_turn}</span>/{game.max_turns}
                &nbsp;·&nbsp;
                <span className="text-[#00ff88]">{game.code}</span>
              </p>
            </div>
          </div>

          {/* Turno attivo */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#8899aa]">
              {players.map(p => (
                <div key={p.faction}
                  className={`px-2 py-1 rounded border transition-all ${
                    gameState.active_faction === p.faction
                      ? 'border-current font-bold scale-105'
                      : 'border-[#1e2a3a] opacity-50'
                  }`}
                  style={{ color: FACTION_COLORS[p.faction], borderColor: gameState.active_faction === p.faction ? FACTION_COLORS[p.faction] : undefined }}>
                  {FACTION_FLAGS[p.faction]}{p.is_bot ? '🤖' : '👤'}
                </div>
              ))}
            </div>
            {isBotThinking && (
              <div className="px-2 py-1 bg-[#f59e0b20] border border-[#f59e0b] rounded
                text-[#f59e0b] text-[10px] font-mono animate-pulse">
                🤖 {gameState.active_faction} sta pensando...
              </div>
            )}
            {isMyTurn && !isBotThinking && (
              <div className="px-2 py-1 bg-[#00ff8820] border border-[#00ff88] rounded
                text-[#00ff88] text-[10px] font-mono animate-pulse font-bold">
                ✅ IL TUO TURNO
              </div>
            )}
            <button onClick={onBack}
              className="text-[#8899aa] hover:text-white font-mono text-xs
                border border-[#334455] rounded px-2 py-1 transition-colors ml-2">
              ◀ LOBBY
            </button>
            {myFaction && (
              <button onClick={() => setShowObjectives(true)}
                className="text-[#8b5cf6] hover:text-white font-mono text-xs
                  border border-[#8b5cf640] hover:border-[#8b5cf6] rounded px-2 py-1
                  transition-colors bg-[#8b5cf608]"
                title="Visualizza i tuoi obiettivi segreti">
                🎯 OBJ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CORPO PRINCIPALE ─── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto p-3 space-y-3">

          {/* ═══ PLANCIA TRACCIATI ═══ */}
          <div>
            {/* Tab plancia / fazioni */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {(['plancia', 'fazioni', 'mappa'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all ${
                    activeTab === t
                      ? 'bg-[#00ff88] text-[#0a0e1a]'
                      : 'border border-[#1e3a5f] text-[#8899aa] hover:text-white'
                  }`}>
                  {t === 'plancia' ? '📊 PLANCIA TRACCIATI' : t === 'fazioni' ? '🎭 FAZIONI & RISORSE' : '🗺 TEATRO OPERATIVO'}
                </button>
              ))}
            </div>

            {/* TAB: PLANCIA */}
            {activeTab === 'plancia' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {TRACKS.map(track => (
                  <FullTrack
                    key={track.id}
                    track={track}
                    value={trackValues[track.id]}
                    prevValue={prevValues[track.id]}
                  />
                ))}
              </div>
            )}

            {/* TAB: FAZIONI */}
            {activeTab === 'fazioni' && (
              <div className="space-y-3">
                {/* Header info turno attivo */}
                <div className="flex items-center gap-3 p-2 rounded-lg border border-[#1e3a5f] bg-[#0d1117]">
                  <span className="font-mono text-[10px] text-[#8899aa]">🎭 STATO FAZIONI &amp; RISORSE</span>
                  <span className="font-mono text-[10px] text-[#334455]">·</span>
                  <span className="font-mono text-[10px] text-[#8899aa]">
                    Turno attivo: <span className="text-[#00ff88] font-bold">{gameState.active_faction ?? '—'}</span>
                  </span>
                </div>

                {/* Griglia card tracciati per-fazione */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {players.map(p => {
                    const fc = FACTION_COLORS[p.faction];
                    const isActive = gameState.active_faction === p.faction;
                    return (
                      <div key={p.faction} className="space-y-2">
                        {/* Badge giocatore sopra la card */}
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px]" style={{ color: fc }}>
                              {p.is_bot ? `🤖 Bot (${p.bot_difficulty})` : `👤 ${p.profile?.username ?? 'Umano'}`}
                            </span>
                            {p.faction === myFaction && (
                              <span className="font-mono text-[10px] font-bold text-[#00ff88]">← TU</span>
                            )}
                          </div>
                          {isActive && (
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: fc, backgroundColor: `${fc}25` }}>
                              {isBotThinking ? '🤖 pensa...' : '▶ IN GIOCO'}
                            </span>
                          )}
                        </div>
                        {/* Card tracciati */}
                        <FactionTrackCard
                          faction={p.faction}
                          gameState={gameState}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: MAPPA / TEATRO OPERATIVO */}
            {activeTab === 'mappa' && (
              <div className="flex flex-col gap-3">
                <TerritoryMap
                  territories={territoryState}
                  myFaction={myFaction}
                  isMyTurn={isMyTurn}
                  selectedTerritory={selectedTerritory}
                  attackMode={showCombat}
                  onSelectTerritory={id => {
                    setSelectedTerritory(id);
                    if (!showCombat) setShowCombat(true);
                  }}
                />

                {/* Pulsante apri pannello combattimento */}
                {isMyTurn && !showCombat && (
                  <button
                    onClick={() => setShowCombat(true)}
                    className="w-full py-2.5 bg-[#7f1d1d] hover:bg-[#dc2626]
                      text-white font-mono font-bold rounded-lg text-sm transition-all
                      border border-[#dc2626] shadow-lg shadow-[#dc262630]">
                    ⚔️ APRI PANNELLO OPERAZIONI MILITARI
                  </button>
                )}

                {/* Pannello combattimento inline */}
                {showCombat && myFaction && gameState && (
                  <div className="bg-[#0a0e1a] border border-[#7f1d1d] rounded-xl p-4">
                    <CombatPanel
                      myFaction={myFaction}
                      gameState={gameState}
                      territories={territoryState}
                      myUnitsPool={myUnitsPool}
                      onDeploy={async (territory, unitType, qty) => {
                        await deployUnit(territory, unitType, qty);
                      }}
                      onAttack={async ({ territory, defender, unitsUsed, outcome }) => {
                        await attackTerritory({
                          territory,
                          defender,
                          unitsUsed,
                          attackForce: outcome.attackForce,
                          defenseForce: outcome.defenseForce,
                          result: outcome.result,
                          infChangeAtk: outcome.infChangeAttacker,
                          infChangeDef: outcome.infChangeDefender,
                          defconChange: outcome.defconChange,
                          attackerUnitsLost: outcome.attackerUnitsLost,
                          stabilityChange: outcome.stabilityChange,
                          description: outcome.description,
                        });
                      }}
                      onClose={() => setShowCombat(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ ZONA AZIONI: carte + log (su due colonne) ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            {/* ── CARTE / AZIONI ── */}
            <div className="space-y-2">
              {/* Debug bar — rimuovere dopo test */}
              <div className="px-3 py-1 bg-[#0a0e1a] border border-[#334455] rounded text-[9px] font-mono text-[#556677] flex flex-wrap gap-2">
                <span>myFaction=<b className="text-[#00ff88]">{myFaction ?? 'NULL'}</b></span>
                <span>active=<b className="text-[#f59e0b]">{gameState.active_faction}</b></span>
                <span>isMyTurn=<b className={isMyTurn ? 'text-[#00ff88]' : 'text-[#ef4444]'}>{String(isMyTurn)}</b></span>
                <span>botThinking=<b className={isBotThinking ? 'text-[#ef4444]' : 'text-[#22c55e]'}>{String(isBotThinking)}</b></span>
                <span>cards=<b className="text-white">{myCards.length}</b></span>
                <span>deckCards(store)=<b className="text-white">{deckCards.filter(d=>d.faction===myFaction).length}</b></span>
              </div>

              {/* Banner turno */}
              <div className={`px-4 py-2.5 rounded-xl border text-center ${
                isMyTurn && !isBotThinking
                  ? 'border-[#00ff88] bg-[#00ff8815]'
                  : isBotThinking
                    ? 'border-[#f59e0b] bg-[#f59e0b10]'
                    : 'border-[#1e3a5f] bg-[#111827]'
              }`}>
                {isMyTurn && !isBotThinking ? (
                  <p className="text-[#00ff88] font-mono font-bold text-sm">
                    ✅ È IL TUO TURNO — Seleziona e gioca una carta!
                  </p>
                ) : isBotThinking ? (
                  <p className="text-[#f59e0b] font-mono text-sm animate-pulse">
                    🤖 {FACTION_FLAGS[gameState.active_faction]} {gameState.active_faction} sta elaborando la strategia...
                  </p>
                ) : (
                  <p className="text-[#8899aa] font-mono text-sm">
                    ⏳ In attesa del turno di {FACTION_FLAGS[gameState.active_faction]}{' '}
                    <span style={{ color: activeColor }}>{gameState.active_faction}</span>
                  </p>
                )}
              </div>

              {/* Avvia partita */}
              {game.status === 'lobby' && (
                <button onClick={startGame} disabled={loading}
                  className="w-full py-3 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                    text-[#0a0e1a] font-bold font-mono rounded-xl tracking-widest shadow-lg
                    shadow-[#00ff8840] text-sm">
                  {loading ? '⏳ AVVIO IN CORSO...' : '🚀 AVVIA PARTITA'}
                </button>
              )}

              {/* Mano carte del giocatore (MAZZO UNIFICATO) */}
              {isUnified && myFaction && game.status === 'active' && (
                <div className="bg-[#111827] border border-[#f97316] border-opacity-40 rounded-xl">
                  <button className="w-full flex items-center justify-between px-4 py-2.5 border-b border-[#1e3a5f]"
                    onClick={() => setShowHand(!showHand)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎴</span>
                      <span className="font-mono text-xs font-bold text-white">Mano — {myFaction}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#f9731620] text-[#f97316]">
                        MAZZO UNIFICATO
                      </span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        myHandCards.length === 0 ? 'text-[#ef4444] bg-[#ef444420]'
                          : 'text-[#22c55e] bg-[#22c55e20]'}`}>
                        {myHandCards.length} in mano
                      </span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        deckRemaining === 0 ? 'text-[#ef4444] bg-[#ef444420]'
                          : deckRemaining <= 10 ? 'text-[#f59e0b] bg-[#f59e0b20]'
                          : 'text-[#8899aa] bg-[#ffffff10]'}`}>
                        🗂 {deckRemaining} nel mazzo
                      </span>
                    </div>
                    <span className="text-[#8899aa] font-mono text-xs">{showHand ? '▲' : '▼'}</span>
                  </button>

                  {showHand && (
                    <div className="p-3">
                      {myHandCards.length === 0 && (
                        <p className="text-[#ef4444] font-mono text-xs text-center py-4">
                          🎴 Nessuna carta in mano
                        </p>
                      )}
                      {/* Vista a ventaglio orizzontale */}
                      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a5f transparent' }}>
                        {myHandCards.map(dc => (
                          <div key={dc.id} className="snap-start shrink-0">
                            <UnifiedHandCard
                              dc={dc}
                              myFaction={myFaction!}
                              selected={selectedUnifiedCard === dc.id}
                              disabled={!isMyTurn || isBotThinking}
                              onToggle={() => setSelectedUnifiedCard(
                                selectedUnifiedCard === dc.id ? null : dc.id
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mano carte del giocatore (MAZZO CLASSICO) */}
              {!isUnified && myFaction && game.status === 'active' && (
                <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl">
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5
                      border-b border-[#1e3a5f]"
                    onClick={() => setShowHand(!showHand)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{FACTION_FLAGS[myFaction]}</span>
                      <span className="font-mono text-xs font-bold text-white">
                        Le tue carte — {myFaction}
                      </span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        myCards.length === 0
                          ? 'text-[#ef4444] bg-[#ef444420]'
                          : myCards.length <= 3
                          ? 'text-[#f59e0b] bg-[#f59e0b20]'
                          : 'text-[#22c55e] bg-[#22c55e20]'
                      }`}>
                        {game.status === 'active'
                          ? `${myCards.length} in mano`
                          : `${myCards.length} anteprima`}
                      </span>
                      {game.status === 'active' && (
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          deckRemaining === 0 ? 'text-[#ef4444] bg-[#ef444420]'
                            : deckRemaining <= 5 ? 'text-[#f59e0b] bg-[#f59e0b20]'
                            : 'text-[#8899aa] bg-[#ffffff10]'}`}>
                          🗂 {deckRemaining} nel mazzo
                        </span>
                      )}
                    </div>
                    <span className="text-[#8899aa] font-mono text-xs">
                      {showHand ? '▲ NASCONDI' : '▼ MOSTRA'}
                    </span>
                  </button>

                    {showHand && (
                      <div className="p-3">
                        {myCards.length === 0 && (
                          <p className="text-[#ef4444] font-mono text-xs text-center py-4">
                            🃏 Mazzo esaurito — nessuna carta disponibile
                          </p>
                        )}
                        {/* Vista a ventaglio orizzontale */}
                        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
                          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a5f transparent' }}>
                          {myCards.map(card => (
                            <div key={card.card_id} className="snap-start shrink-0">
                              <ClassicHandCard
                                card={card}
                                faction={myFaction!}
                                gameState={gameState}
                                selected={selectedCard === card.card_id}
                                disabled={!isMyTurn || isBotThinking}
                                onToggle={() => setSelectedCard(
                                  selectedCard === card.card_id ? null : card.card_id
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Azioni carta selezionata */}
                  {selectedCard && isMyTurn && (() => {
                    const cardDef = myCards.find(c => c.card_id === selectedCard);
                    if (!cardDef || !myFaction || !gameState) return null;
                    return (
                      <div className="p-3 border-t border-[#1e3a5f]">
                        {!showActionPanel ? (
                          <button
                            onClick={() => setShowActionPanel(true)}
                            disabled={loading}
                            className="w-full py-2.5 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                              text-[#0a0e1a] font-bold font-mono rounded-lg text-sm tracking-wider
                              shadow-lg shadow-[#00ff8830] transition-all">
                            {loading ? '⏳ ELABORAZIONE...' : '▶ GIOCA — SCEGLI AZIONE'}
                          </button>
                        ) : (
                          <PlayerActionPanel
                            card={cardDef}
                            myFaction={myFaction}
                            state={gameState}
                            selectedTerritory={selectedTerritory}
                            territories={territoryState}
                            onCancel={() => { setShowActionPanel(false); setSelectedCard(null); }}
                            onAction={async (actionType: PlayerActionType, payload: PlayerActionPayload) => {
                              // 1. INFLUENZA: influenza applicata solo su successo, carta SEMPRE scartata
                              if (actionType === 'influenza') {
                                if (payload.diceSuccess && payload.targetTerritory && (payload.influenceDelta ?? 0) > 0) {
                                  await addInfluence(payload.targetTerritory, payload.influenceDelta!);
                                }
                                // carta sempre scartata e turno passa, successo o fallimento
                                await playCard(selectedCard!);

                              // 2. TRACCIATO: applica delta al tracciato, poi gioca carta
                              } else if (actionType === 'tracciato' && payload.trackKey && payload.trackDelta) {
                                // Aggiorna direttamente il tracciato su Supabase tramite gameState update
                                const { supabase } = await import('@/integrations/supabase/client');
                                const { game: g, gameState: gs } = useOnlineGameStore.getState();
                                if (g && gs) {
                                  const cur = (gs as Record<string, number>)[payload.trackKey] ?? 0;
                                  const next = Math.min(15, Math.max(0, cur + (payload.trackDelta ?? 0)));
                                  await supabase.from('game_state')
                                    .update({ [payload.trackKey]: next })
                                    .eq('game_id', g.id);
                                  useOnlineGameStore.setState(s => ({
                                    gameState: { ...s.gameState!, [payload.trackKey!]: next },
                                  }));
                                }
                                await playCard(selectedCard!);

                              // 3. EVENTO / ACQUISTO: gioca direttamente la carta
                              } else {
                                await playCard(selectedCard!);
                              }

                              setSelectedCard(null);
                              setShowActionPanel(false);
                            }}
                          />
                        )}
                      </div>
                    );
                  })()}

                  {/* Pulsante Mercato Risorse Militari */}
                  {(myFaction === 'Iran' || myFaction === 'Coalizione') && game.status === 'active' && (() => {
                    const forzeMil = getForzeMilitari(myFaction, {
                      forze_militari_iran: gameState.forze_militari_iran ?? 5,
                      forze_militari_coalizione: gameState.forze_militari_coalizione ?? 5,
                      risorse_russia: gameState.risorse_russia,
                      risorse_cina: gameState.risorse_cina,
                      risorse_europa: gameState.risorse_europa,
                    });
                    const costoOp = calcolaCosto({
                      defcon: gameState.defcon,
                      sanzioni: gameState.sanzioni,
                      forzeMilitari: forzeMil,
                      carteOpDisponibili: myCards.reduce((s, c) => s + c.op_points, 0),
                      faction: myFaction,
                    }).costoOp;
                    const factionCol = FACTION_COLORS[myFaction];
                    return (
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => setShowMarket(true)}
                          className="w-full py-2 rounded-lg border font-mono text-xs font-bold
                            flex items-center justify-center gap-2 transition-all hover:opacity-90"
                          style={{
                            borderColor: `${factionCol}60`,
                            backgroundColor: `${factionCol}12`,
                            color: factionCol,
                          }}>
                          <span>⚔️</span>
                          <span>MERCATO RISORSE MILITARI</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: `${factionCol}25`, border: `1px solid ${factionCol}50` }}>
                            {costoOp} OP/unità
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Mercato Risorse Militari — overlay */}
              {/* ── Modale Evento (turno Iran) ── */}
              {eventoCorrente && (
                <EventoModal
                  evento={eventoCorrente}
                  onConfirm={chiudiEvento}
                  isMyTurn={isMyTurn}
                  currentFaction={gameState?.active_faction ?? 'Iran'}
                />
              )}

              {/* ── Modale gioco carta unificata ── */}
              {unifiedCardToPlay && myFaction && (
                <UnifiedCardPlayModal
                  card={unifiedCardToPlay}
                  myFaction={myFaction}
                  loading={loading}
                  onCancel={() => setSelectedUnifiedCard(null)}
                  onPlay={async (mode) => {
                    if (mode === 'ops') {
                      // Apri OpsActionModal per scegliere l'azione
                      setShowOpsModal(true);
                    } else {
                      await playCardUnified(unifiedCardToPlay.id, mode);
                      setSelectedUnifiedCard(null);
                    }
                  }}
                />
              )}

              {/* ── Modale azioni OP ── */}
              {showOpsModal && unifiedCardToPlay && myFaction && gameState && (
                <OpsActionModal
                  card={unifiedCardToPlay}
                  myFaction={myFaction}
                  gameState={gameState}
                  territories={terrRecords}
                  militaryUnits={unitRecords}
                  loading={loading}
                  onCancel={() => { setShowOpsModal(false); setSelectedUnifiedCard(null); }}
                  onBuyUnits={async (unitType, qty, _opSpent) => {
                    await playCardOps(unifiedCardToPlay.id, 'buy', { unitType, qty });
                    setShowOpsModal(false); setSelectedUnifiedCard(null);
                  }}
                  onInfluence={async (territory, opSpent) => {
                    await playCardOps(unifiedCardToPlay.id, 'influence', { territory, opSpent });
                    setShowOpsModal(false); setSelectedUnifiedCard(null);
                  }}
                  onAttack={async (params) => {
                    await playCardOps(unifiedCardToPlay.id, 'attack', {
                      territory: params.territory,
                      unitTypes: params.unitTypes,
                      attackForce: params.attackForce,
                      defenseForce: params.defenseForce,
                      result: params.result,
                      infChangeAtk: params.infChangeAtk,
                      infChangeDef: params.infChangeDef,
                      defconChange: params.defconChange,
                      description: params.description,
                      attackerUnitsLost: params.attackerUnitsLost,
                      stabilityChange: params.stabilityChange,
                    });
                    setShowOpsModal(false); setSelectedUnifiedCard(null);
                  }}
                />
              )}



              {showMarket && myFaction && gameState && (
                <MilitaryMarket
                  faction={myFaction}
                  gameState={gameState}
                  carteOpDisponibili={myCards.reduce((s, c) => s + c.op_points, 0)}
                  isMyTurn={isMyTurn && !isBotThinking}
                  onAcquista={async (qtà, costoTot) => {
                    await buyMilitaryResources(qtà, costoTot);
                  }}
                  onClose={() => setShowMarket(false)}
                />
              )}

              {/* Errori */}
              {error && (
                <div className="bg-[#ff000015] border border-[#ff4444] rounded-lg p-3
                  flex items-center justify-between">
                  <p className="text-[#ff6666] font-mono text-xs">⚠️ {error}</p>
                  <button onClick={clearError} className="text-[#ff6666] text-xs ml-2">✕</button>
                </div>
              )}
            </div>

            {/* ── LOG MOSSE ── */}
            <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e3a5f]">
                <h3 className="text-xs font-mono text-[#8899aa] font-bold">📜 LOG MOSSE</h3>
                <span className="text-[10px] font-mono text-[#334455]">{moves.length} mosse</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
                {moves.length === 0 && (
                  <p className="text-[#334455] font-mono text-xs text-center py-6">
                    Nessuna mossa ancora
                  </p>
                )}
                {moves.map((move, i) => {
                  const fc = FACTION_COLORS[move.faction] ?? '#8899aa';
                  return (
                    <div key={move.id ?? i}
                      className="p-2.5 rounded-lg bg-[#0a0e1a] border border-[#1e2a3a]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{FACTION_FLAGS[move.faction]}</span>
                          <span className="font-mono text-xs font-bold" style={{ color: fc }}>
                            {move.faction}
                          </span>
                          {move.is_bot_move && (
                            <span className="text-[10px] text-[#8899aa] font-mono bg-[#8899aa20] px-1 rounded">🤖</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#334455] font-mono">T{move.turn_number}</span>
                      </div>
                      <p className="font-mono text-xs text-white font-bold">{move.card_name}</p>
                      {/* Deltas */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {move.delta_nucleare !== 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded ${move.delta_nucleare > 0 ? 'text-[#22c55e] bg-[#22c55e20]' : 'text-[#ef4444] bg-[#ef444420]'}`}>
                            ☢️{move.delta_nucleare > 0 ? '+' : ''}{move.delta_nucleare}
                          </span>
                        )}
                        {move.delta_sanzioni !== 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded ${move.delta_sanzioni > 0 ? 'text-[#3b82f6] bg-[#3b82f620]' : 'text-[#f59e0b] bg-[#f59e0b20]'}`}>
                            💰{move.delta_sanzioni > 0 ? '+' : ''}{move.delta_sanzioni}
                          </span>
                        )}
                        {move.delta_defcon !== 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded ${move.delta_defcon < 0 ? 'text-[#ef4444] bg-[#ef444420]' : 'text-[#22c55e] bg-[#22c55e20]'}`}>
                            🎯{move.delta_defcon > 0 ? '+' : ''}{move.delta_defcon}
                          </span>
                        )}
                        {move.delta_opinione !== 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded text-[#ec4899] bg-[#ec489920]`}>
                            🌍{move.delta_opinione > 0 ? '+' : ''}{move.delta_opinione}
                          </span>
                        )}
                        {move.delta_risorse !== 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded ${move.delta_risorse > 0 ? 'text-[#f59e0b] bg-[#f59e0b20]' : 'text-[#8899aa] bg-[#8899aa20]'}`}>
                            📦{move.delta_risorse > 0 ? '+' : ''}{move.delta_risorse}
                          </span>
                        )}
                      </div>
                      {move.bot_reason && (
                        <p className="text-[10px] text-[#445566] font-mono mt-1 italic line-clamp-1">
                          ↳ {move.bot_reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>{/* fine grid azioni */}
        </div>{/* fine max-w */}
      </div>{/* fine overflow */}

      {/* ─── MODALE OBIETTIVI SEGRETI ─── */}
      {showObjectives && myFaction && (
        <ObjectivesModal
          myFaction={myFaction}
          gameState={gameState}
          myObjectives={myObjectives}
          onClose={() => setShowObjectives(false)}
          onAssignNew={() => assignObjectivesToFaction(myFaction)}
        />
      )}
    </div>
  );
}

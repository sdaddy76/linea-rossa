// =============================================
// LINEA ROSSA — Pagina di Gioco Online
// Layout: plancia completa in alto, azioni in basso
// =============================================
import { useEffect, useState } from 'react';
import { useOnlineGameStore } from '@/store/onlineGameStore';
import type { Faction, GameState } from '@/types/game';
import { MAZZI_PER_FAZIONE, MAZZI_SPECIALI } from '@/data/mazzi';
import type { GameCard } from '@/types/game';

// ─── Colori fazione ───────────────────────────
const FACTION_FLAGS: Record<string, string> = {
  Iran: '🇮🇷', Coalizione: '🇺🇸', Russia: '🇷🇺', Cina: '🇨🇳', Europa: '🇪🇺',
};
const FACTION_COLORS: Record<string, string> = {
  Iran: '#22c55e', Coalizione: '#3b82f6', Russia: '#ef4444', Cina: '#f59e0b', Europa: '#8b5cf6',
};
const CARD_TYPE_COLORS: Record<string, string> = {
  Militare: '#ef4444', Diplomatico: '#3b82f6', Economico: '#f59e0b',
  Segreto: '#8b5cf6', Media: '#ec4899', Evento: '#f97316', Politico: '#6b7280',
};

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
    id: 'defcon', label: 'DEFCON', icon: '🎯', min: 1, max: 5, color: '#8b5cf6',
    getValue: s => s.defcon, winLabel: 'GUERRA', winValue: 1, winDir: 'down',
    zones: [
      { from: 5,  to: 5,  color: '#22c55e', bg: '#22c55e22', label: 'Pace' },
      { from: 4,  to: 4,  color: '#84cc16', bg: '#84cc1622', label: 'Attenzione' },
      { from: 3,  to: 3,  color: '#f59e0b', bg: '#f59e0b22', label: 'Tensione' },
      { from: 2,  to: 2,  color: '#f97316', bg: '#f9731622', label: 'Allerta' },
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
  {
    id: 'risorse', label: 'Risorse Economiche', icon: '📦', min: 1, max: 10, color: '#f59e0b',
    getValue: s => s.risorse_iran, // mostrato per Iran; le altre fazioni sotto
    zones: [
      { from: 1,  to: 2,  color: '#ef4444', bg: '#ef444422', label: 'Crisi' },
      { from: 3,  to: 5,  color: '#f59e0b', bg: '#f59e0b22', label: 'Scarso' },
      { from: 6,  to: 8,  color: '#84cc16', bg: '#84cc1622', label: 'Stabile' },
      { from: 9,  to: 10, color: '#22c55e', bg: '#22c55e22', label: 'Abbond.' },
    ],
  },
  {
    id: 'stabilita', label: 'Stabilità Interna', icon: '🛡', min: 1, max: 10, color: '#a78bfa',
    getValue: s => s.stabilita_iran,
    zones: [
      { from: 1,  to: 2,  color: '#ef4444', bg: '#ef444422', label: 'Collasso' },
      { from: 3,  to: 5,  color: '#f97316', bg: '#f9731622', label: 'Instabile' },
      { from: 6,  to: 8,  color: '#84cc16', bg: '#84cc1622', label: 'Stabile' },
      { from: 9,  to: 10, color: '#22c55e', bg: '#22c55e22', label: 'Solida' },
    ],
  },
];

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
                  (track.id === 'defcon'   && value <= 2);

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

// ─── Mini-barra risorse/stabilità per-fazione ─
function FactionResourceBar({
  faction, risorse, stabilita,
}: { faction: string; risorse: number; stabilita: number }) {
  const fc = FACTION_COLORS[faction] ?? '#8899aa';
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm w-5">{FACTION_FLAGS[faction]}</span>
      <span className="font-mono text-[10px] font-bold w-20" style={{ color: fc }}>{faction}</span>
      {/* Risorse */}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="w-2 h-3 rounded-sm transition-all duration-300"
            style={{
              backgroundColor: i < risorse ? '#f59e0b' : '#1e2a3a',
              opacity: i < risorse ? 1 : 0.4,
            }} />
        ))}
      </div>
      <span className="font-mono text-[10px] text-[#f59e0b] w-4">{risorse}</span>
      {/* Stabilità */}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="w-2 h-3 rounded-sm transition-all duration-300"
            style={{
              backgroundColor: i < stabilita ? '#a78bfa' : '#1e2a3a',
              opacity: i < stabilita ? 1 : 0.4,
            }} />
        ))}
      </div>
      <span className="font-mono text-[10px] text-[#a78bfa] w-4">{stabilita}</span>
    </div>
  );
}

// ─── PAGINA PRINCIPALE ────────────────────────
export default function GamePage({ onBack }: { onBack: () => void }) {
  const {
    game, gameState, players, myFaction, moves, deckCards,
    loading, isBotThinking, error, gameOverInfo, notification,
    playCard, startGame, clearError, setNotification,
  } = useOnlineGameStore();

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showHand, setShowHand] = useState(true);
  const [prevState, setPrevState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<'plancia' | 'fazioni'>('plancia');

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
      // Partita avviata: usa le carte reali del mazzo (filtrate per fazione)
      const availableIds = new Set(
        deckCards
          .filter(dc => dc.faction === myFaction)
          .map(dc => dc.card_id)
      );
      if (availableIds.size === 0) return []; // mazzo esaurito

      // Recupera le definizioni complete (effetti) dall'array statico
      const allDefs = [
        ...(MAZZI_PER_FAZIONE[myFaction] ?? []),
        ...(MAZZI_SPECIALI[myFaction] ?? []),
      ];
      return allDefs.filter(c => availableIds.has(c.card_id));
    } else {
      // Partita non ancora avviata: mostra anteprima prime 6 carte
      return [
        ...(MAZZI_PER_FAZIONE[myFaction] ?? []),
        ...(MAZZI_SPECIALI[myFaction] ?? []),
      ].slice(0, 6);
    }
  };
  const myCards = buildHand();

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
          </div>
        </div>
      </div>

      {/* ─── CORPO PRINCIPALE ─── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto p-3 space-y-3">

          {/* ═══ PLANCIA TRACCIATI ═══ */}
          <div>
            {/* Tab plancia / fazioni */}
            <div className="flex items-center gap-2 mb-2">
              {(['plancia', 'fazioni'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all ${
                    activeTab === t
                      ? 'bg-[#00ff88] text-[#0a0e1a]'
                      : 'border border-[#1e3a5f] text-[#8899aa] hover:text-white'
                  }`}>
                  {t === 'plancia' ? '📊 PLANCIA TRACCIATI' : '🎭 FAZIONI & RISORSE'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tabella risorse/stabilità */}
                <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4">
                  <h3 className="text-xs font-mono text-[#8899aa] font-bold mb-3 border-b border-[#1e3a5f] pb-2">
                    💰 RISORSE &nbsp;·&nbsp; 🛡 STABILITÀ
                  </h3>
                  <div className="space-y-1">
                    {players.map(p => (
                      <FactionResourceBar
                        key={p.faction}
                        faction={p.faction}
                        risorse={getRisorse(p.faction)}
                        stabilita={getStabilita(p.faction)}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[#334455] font-mono mt-2">
                    🟡 = Risorse &nbsp;&nbsp; 🟣 = Stabilità
                  </p>
                </div>

                {/* Stato fazioni */}
                <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4">
                  <h3 className="text-xs font-mono text-[#8899aa] font-bold mb-3 border-b border-[#1e3a5f] pb-2">
                    🎭 STATO FAZIONI
                  </h3>
                  <div className="space-y-2">
                    {players.map(p => {
                      const fc = FACTION_COLORS[p.faction];
                      const isActive = gameState.active_faction === p.faction;
                      return (
                        <div key={p.faction}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                            isActive
                              ? 'border-current bg-opacity-10'
                              : 'border-[#1e2a3a]'
                          }`}
                          style={{ borderColor: isActive ? fc : undefined, backgroundColor: isActive ? `${fc}12` : undefined }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{FACTION_FLAGS[p.faction]}</span>
                            <div>
                              <p className="font-mono text-xs font-bold" style={{ color: fc }}>
                                {p.faction}
                                {p.faction === myFaction && (
                                  <span className="ml-1 text-[#00ff88]">← TU</span>
                                )}
                              </p>
                              <p className="font-mono text-[10px] text-[#8899aa]">
                                {p.is_bot
                                  ? `🤖 Bot · ${p.bot_difficulty}`
                                  : `👤 ${p.profile?.username ?? 'Umano'}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            {isActive && (
                              <div className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                style={{ color: fc, backgroundColor: `${fc}25` }}>
                                {isBotThinking ? '🤖 pensa...' : '▶ IN GIOCO'}
                              </div>
                            )}
                            <p className="font-mono text-[10px] text-[#f59e0b]">
                              💰 {getRisorse(p.faction)}/10 &nbsp; 🛡 {getStabilita(p.faction)}/10
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ ZONA AZIONI: carte + log (su due colonne) ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            {/* ── CARTE / AZIONI ── */}
            <div className="space-y-2">
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

              {/* Mano carte del giocatore */}
              {myFaction && game.status === 'active' && (
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
                          ? `${myCards.length} rimaste`
                          : `${myCards.length} in mazzo`}
                      </span>
                    </div>
                    <span className="text-[#8899aa] font-mono text-xs">
                      {showHand ? '▲ NASCONDI' : '▼ MOSTRA'}
                    </span>
                  </button>

                    {showHand && (
                      <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                        {myCards.length === 0 && (
                          <p className="text-[#ef4444] font-mono text-xs text-center py-4">
                            🃏 Mazzo esaurito — nessuna carta disponibile
                          </p>
                        )}
                      {myCards.map(card => {
                        const typeColor = CARD_TYPE_COLORS[card.card_type] ?? '#8899aa';
                        const isSelected = selectedCard === card.card_id;
                        return (
                          <button key={card.card_id}
                            onClick={() => setSelectedCard(isSelected ? null : card.card_id)}
                            disabled={!isMyTurn || isBotThinking}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-[#00ff88] bg-[#00ff8815] ring-1 ring-[#00ff88]'
                                : 'border-[#1e2a3a] hover:border-[#2a3a5a] bg-[#0a0e1a]'
                            } ${(!isMyTurn || isBotThinking) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono font-bold text-xs text-white truncate">
                                  {card.card_name}
                                </p>
                                <p className="font-mono text-[10px] text-[#8899aa] mt-0.5 line-clamp-2">
                                  {card.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: typeColor, backgroundColor: `${typeColor}20` }}>
                                  {card.card_type}
                                </span>
                                <span className="text-[10px] font-mono text-[#f59e0b]">OP {card.op_points}</span>
                                {card.deck_type === 'speciale' && (
                                  <span className="text-[10px] font-mono text-[#8b5cf6]">★ SPEC</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Pulsante gioca carta */}
                  {selectedCard && isMyTurn && (
                    <div className="p-3 border-t border-[#1e3a5f]">
                      <button
                        onClick={() => { playCard(selectedCard); setSelectedCard(null); }}
                        disabled={loading}
                        className="w-full py-2.5 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                          text-[#0a0e1a] font-bold font-mono rounded-lg text-sm tracking-wider
                          shadow-lg shadow-[#00ff8830] transition-all">
                        {loading ? '⏳ ELABORAZIONE...' : '▶ GIOCA LA CARTA SELEZIONATA'}
                      </button>
                    </div>
                  )}
                </div>
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
    </div>
  );
}

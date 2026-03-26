// =============================================
// LINEA ROSSA — Pagina di Gioco Online
// =============================================
import { useEffect, useState } from 'react';
import { useOnlineGameStore } from '@/store/onlineGameStore';
import type { Faction } from '@/types/game';
import { MAZZI_PER_FAZIONE, MAZZI_SPECIALI } from '@/data/mazzi';

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

interface TrackBarProps {
  label: string; value: number; min: number; max: number;
  color: string; icon: string;
}
function TrackBar({ label, value, min, max, color, icon }: TrackBarProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-[#8899aa]">{icon} {label}</span>
        <span className="font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function GamePage({ onBack }: { onBack: () => void }) {
  const {
    game, gameState, players, myFaction, moves,
    loading, isBotThinking, error, gameOverInfo, notification,
    playCard, startGame, clearError, setNotification,
  } = useOnlineGameStore();

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showHand, setShowHand] = useState(true);

  // Dismissi notifica dopo 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification, setNotification]);

  if (!game || !gameState) return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <p className="text-[#00ff88] font-mono animate-pulse">Caricamento partita...</p>
    </div>
  );

  const isMyTurn = gameState.active_faction === myFaction;
  const activeColor = FACTION_COLORS[gameState.active_faction] ?? '#00ff88';

  // Costruisci mano del giocatore (prime 5 carte disponibili del mazzo)
  const myCards = myFaction
    ? [...(MAZZI_PER_FAZIONE[myFaction] ?? []), ...(MAZZI_SPECIALI[myFaction] ?? [])]
        .slice(0, 6)
    : [];

  const getRisorse = (f: string) => {
    const key = `risorse_${f.toLowerCase()}` as keyof typeof gameState;
    return (gameState[key] as number) ?? 5;
  };
  const getStabilita = (f: string) => {
    const key = `stabilita_${f.toLowerCase()}` as keyof typeof gameState;
    return (gameState[key] as number) ?? 5;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">

      {/* NOTIFICA */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#111827] border border-[#00ff88]
          rounded-xl p-3 text-[#00ff88] font-mono text-sm shadow-xl max-w-xs animate-pulse">
          {notification}
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameOverInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111827] border-2 border-[#00ff88] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">{gameOverInfo.winner ? FACTION_FLAGS[gameOverInfo.winner] ?? '🏆' : '💥'}</div>
            <h2 className="text-2xl font-bold text-[#00ff88] font-mono mb-2">PARTITA CONCLUSA</h2>
            <p className="text-white font-mono text-lg mb-1">
              {gameOverInfo.winner ? `Vince: ${gameOverInfo.winner}` : 'Nessun vincitore'}
            </p>
            <p className="text-[#8899aa] font-mono text-sm mb-6">{gameOverInfo.message}</p>
            <button onClick={onBack}
              className="px-6 py-3 bg-[#00ff88] text-[#0a0e1a] font-bold font-mono rounded-xl">
              TORNA ALLA LOBBY
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#111827] border-b border-[#1e3a5f] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">☢️</span>
            <div>
              <h1 className="text-sm font-bold text-white font-mono">{game.name}</h1>
              <p className="text-xs text-[#8899aa] font-mono">
                Turno {game.current_turn}/{game.max_turns} · Codice: <span className="text-[#00ff88]">{game.code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Fazione attiva */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{ borderColor: activeColor, backgroundColor: `${activeColor}15` }}>
              <span>{FACTION_FLAGS[gameState.active_faction]}</span>
              <span className="font-mono text-xs font-bold" style={{ color: activeColor }}>
                {gameState.active_faction}
                {isBotThinking && ' 🤖...'}
              </span>
            </div>
            {/* Bot thinking indicator */}
            {isBotThinking && (
              <div className="px-2 py-1 bg-[#f59e0b20] border border-[#f59e0b] rounded text-[#f59e0b] text-xs font-mono animate-pulse">
                🤖 BOT
              </div>
            )}
            <button onClick={onBack} className="text-[#8899aa] hover:text-white font-mono text-xs border border-[#334455] rounded px-2 py-1">
              ◀ LOBBY
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* COLONNA SINISTRA: Tracciati globali */}
          <div className="space-y-4">
            <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-mono text-[#8899aa] font-bold border-b border-[#1e3a5f] pb-2">
                📊 TRACCIATI GLOBALI
              </h3>
              <TrackBar label="Nucleare Iraniano" value={gameState.nucleare} min={1} max={15}
                color="#22c55e" icon="☢️" />
              <TrackBar label="Sanzioni/Pressione" value={gameState.sanzioni} min={1} max={10}
                color="#3b82f6" icon="💰" />
              <TrackBar label="DEFCON" value={gameState.defcon} min={1} max={5}
                color={gameState.defcon <= 2 ? '#ef4444' : gameState.defcon === 3 ? '#f59e0b' : '#22c55e'} icon="🎯" />
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8899aa]">🌍 Opinione</span>
                  <span className="font-bold" style={{ color: gameState.opinione >= 0 ? '#3b82f6' : '#22c55e' }}>
                    {gameState.opinione > 0 ? '+' : ''}{gameState.opinione}
                  </span>
                </div>
                <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 bg-[#22c55e30]" />
                    <div className="w-px bg-[#334455]" />
                    <div className="flex-1 bg-[#3b82f630]" />
                  </div>
                  <div className="absolute h-full w-1 bg-[#00ff88] transition-all duration-500 rounded-full"
                    style={{ left: `${((gameState.opinione + 10) / 20) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Fazioni */}
            <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-mono text-[#8899aa] font-bold border-b border-[#1e3a5f] pb-2">
                🎭 FAZIONI
              </h3>
              {players.map(p => (
                <div key={p.faction} className={`flex items-center justify-between p-2 rounded-lg border ${
                  gameState.active_faction === p.faction
                    ? 'border-[#00ff88] bg-[#00ff8810]'
                    : 'border-[#1e2a3a]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{FACTION_FLAGS[p.faction]}</span>
                    <div>
                      <p className="font-mono text-xs font-bold" style={{ color: FACTION_COLORS[p.faction] }}>
                        {p.faction}
                      </p>
                      <p className="font-mono text-[10px] text-[#8899aa]">
                        {p.is_bot ? `🤖 Bot (${p.bot_difficulty})` : `👤 ${p.profile?.username ?? 'Umano'}`}
                        {p.faction === myFaction && ' ← TU'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-[#f59e0b]">💰 {getRisorse(p.faction)}</p>
                    <p className="font-mono text-xs text-[#22c55e]">🛡 {getStabilita(p.faction)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLONNA CENTRALE: Mano giocatore + azioni */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stato turno */}
            <div className={`p-3 rounded-xl border text-center ${
              isMyTurn
                ? 'border-[#00ff88] bg-[#00ff8815] animate-pulse'
                : 'border-[#1e3a5f] bg-[#111827]'
            }`}>
              {isMyTurn ? (
                <p className="text-[#00ff88] font-mono font-bold text-sm">
                  ✅ È IL TUO TURNO — Gioca una carta!
                </p>
              ) : isBotThinking ? (
                <p className="text-[#f59e0b] font-mono text-sm">
                  🤖 {gameState.active_faction} sta pensando...
                </p>
              ) : (
                <p className="text-[#8899aa] font-mono text-sm">
                  ⏳ Turno di {FACTION_FLAGS[gameState.active_faction]} {gameState.active_faction}
                </p>
              )}
            </div>

            {/* Avvia partita se in lobby */}
            {game.status === 'lobby' && (
              <button onClick={startGame} disabled={loading}
                className="w-full py-3 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                  text-[#0a0e1a] font-bold font-mono rounded-xl tracking-widest shadow-lg">
                {loading ? '⏳ AVVIO...' : '🚀 AVVIA PARTITA'}
              </button>
            )}

            {/* Mano carte */}
            {myFaction && game.status === 'active' && (
              <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono text-[#8899aa] font-bold">
                    🃏 LE TUE CARTE ({FACTION_FLAGS[myFaction]} {myFaction})
                  </h3>
                  <button onClick={() => setShowHand(!showHand)}
                    className="text-[#8899aa] text-xs font-mono hover:text-white">
                    {showHand ? '▲' : '▼'}
                  </button>
                </div>
                {showHand && (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {myCards.map(card => {
                      const typeColor = CARD_TYPE_COLORS[card.card_type] ?? '#8899aa';
                      const isSelected = selectedCard === card.card_id;
                      return (
                        <button key={card.card_id}
                          onClick={() => setSelectedCard(isSelected ? null : card.card_id)}
                          disabled={!isMyTurn || isBotThinking}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-[#00ff88] bg-[#00ff8815]'
                              : 'border-[#1e2a3a] hover:border-[#334455] bg-[#0a0e1a]'
                          } ${(!isMyTurn || isBotThinking) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-mono font-bold text-xs text-white">{card.card_name}</p>
                              <p className="font-mono text-[10px] text-[#8899aa] mt-0.5">{card.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                style={{ color: typeColor, backgroundColor: `${typeColor}20` }}>
                                {card.card_type}
                              </span>
                              <span className="text-[10px] font-mono text-[#f59e0b]">
                                OP {card.op_points}
                              </span>
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
                {selectedCard && isMyTurn && (
                  <button
                    onClick={() => { playCard(selectedCard); setSelectedCard(null); }}
                    disabled={loading}
                    className="w-full mt-3 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                      text-[#0a0e1a] font-bold font-mono rounded-lg text-sm tracking-wider">
                    {loading ? '⏳' : '▶ GIOCA CARTA'}
                  </button>
                )}
              </div>
            )}

            {/* Errori */}
            {error && (
              <div className="bg-[#ff000015] border border-[#ff4444] rounded-lg p-3 flex items-center justify-between">
                <p className="text-[#ff6666] font-mono text-xs">⚠️ {error}</p>
                <button onClick={clearError} className="text-[#ff6666] text-xs">✕</button>
              </div>
            )}
          </div>

          {/* COLONNA DESTRA: Log mosse */}
          <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-4">
            <h3 className="text-xs font-mono text-[#8899aa] font-bold border-b border-[#1e3a5f] pb-2 mb-3">
              📜 LOG MOSSE
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {moves.length === 0 && (
                <p className="text-[#334455] font-mono text-xs text-center py-4">
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
                        <span>{FACTION_FLAGS[move.faction]}</span>
                        <span className="font-mono text-xs font-bold" style={{ color: fc }}>
                          {move.faction}
                        </span>
                        {move.is_bot_move && (
                          <span className="text-[10px] text-[#8899aa] font-mono">🤖</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#334455] font-mono">T{move.turn_number}</span>
                    </div>
                    <p className="font-mono text-xs text-white">{move.card_name}</p>
                    {/* Delta tracciati */}
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
                        <span className={`text-[10px] font-mono px-1 rounded ${move.delta_defcon > 0 ? 'text-[#22c55e] bg-[#22c55e20]' : 'text-[#ef4444] bg-[#ef444420]'}`}>
                          🎯{move.delta_defcon > 0 ? '+' : ''}{move.delta_defcon}
                        </span>
                      )}
                    </div>
                    {move.bot_reason && (
                      <p className="text-[10px] text-[#334455] font-mono mt-1 italic truncate">
                        {move.bot_reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

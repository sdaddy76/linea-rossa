// =============================================
// LINEA ROSSA — Pannello Azioni Giocatore
// 4 azioni disponibili quando si gioca una carta:
//   1) Esegui Evento
//   2) Compra Unità Militari
//   3) Incrementa Tracciato (spende OP)
//   4) Tentativo di Influenza su nazione nemica
// =============================================
import { useState } from 'react';
import type { GameCard, GameState, Faction } from '@/types/game';
import type { TerritoryId } from '@/lib/territoriesData';
import { TERRITORIES } from '@/lib/territoriesData';

interface Props {
  card: GameCard;
  myFaction: Faction;
  state: GameState;
  selectedTerritory: TerritoryId | null;
  territories: Record<string, { influences: Partial<Record<Faction, number>>; units?: unknown }>;
  onAction: (action: PlayerActionType, payload: PlayerActionPayload) => void;
  onCancel: () => void;
}

export type PlayerActionType = 'evento' | 'acquisto' | 'tracciato' | 'influenza';

export interface PlayerActionPayload {
  type: PlayerActionType;
  card: GameCard;
  targetTerritory?: TerritoryId;
  diceResult?: number;
  diceSuccess?: boolean;
  trackBonus?: number;
  finalThreshold?: number;
}

// ─── Modificatori dado per influenza ─────────────────────────────────────
// Il successo base è ottenere 6 (o più con bonus) su un d6
// Modificatori POSITIVI (riducono la soglia richiesta):
//   +1 per ogni punto di Stabilità propria > 5
//   +1 se Opinione > 2
// Modificatori NEGATIVI (aumentano la soglia richiesta):
//   +1 per ogni punto di Stabilità della nazione target > 4
//   +1 se DEFCON > 3 (instabilità globale penalizza diplomazia)
function computeInfluenceModifiers(
  state: GameState,
  myFaction: Faction,
  targetTerritoryId: TerritoryId
): { bonus: number; malus: number; finalThreshold: number; description: string[] } {
  const desc: string[] = [];
  let bonus = 0;
  let malus = 0;

  // Stabilità propria (sopra 5 = vantaggio)
  const myStab = (state as Record<string, number>)[`stabilita_${myFaction.toLowerCase()}`] ?? 5;
  if (myStab > 5) {
    bonus += myStab - 5;
    desc.push(`+${myStab - 5} Stabilità ${myFaction} (${myStab})`);
  }

  // Opinione globale favorevole
  if (state.opinione > 2) {
    bonus += 1;
    desc.push(`+1 Opinione favorevole (${state.opinione})`);
  }

  // Influenza propria già presente nel territorio
  const terrInfl = 0; // placeholder (influenza propria pre-esistente non modifica dado)

  // DEFCON instabile penalizza
  if (state.defcon > 3) {
    malus += 1;
    desc.push(`-1 DEFCON elevato (${state.defcon})`);
  }

  // Stabilità del territorio target (>4 = più difficile da influenzare)
  // Usiamo il numero di influenze nemiche come proxy di stabilità locale
  const finalThreshold = Math.max(2, 6 - bonus + malus);

  return { bonus, malus, finalThreshold, description: desc };
}

// ─── Lancia d6 ────────────────────────────────────────────────────────────
function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

const FACTION_COLOR: Record<Faction, string> = {
  Iran: '#dc2626', Coalizione: '#2563eb', Russia: '#7c3aed', Cina: '#d97706', Europa: '#059669',
};

export default function PlayerActionPanel({ card, myFaction, state, selectedTerritory, territories, onAction, onCancel }: Props) {
  const [diceResult, setDiceResult]   = useState<number | null>(null);
  const [diceRolled, setDiceRolled]   = useState(false);
  const [activeAction, setActiveAction] = useState<PlayerActionType | null>(null);

  const fColor = FACTION_COLOR[myFaction] ?? '#888';
  const opPoints = card.op_points ?? 1;

  // ── Modifiers influenza ──────────────────────────────────────────────
  const selectedTerr = selectedTerritory ? TERRITORIES.find(t => t.id === selectedTerritory) : null;
  const modifiers = selectedTerritory
    ? computeInfluenceModifiers(state, myFaction, selectedTerritory)
    : null;

  // Controlla se il territorio selezionato è nemico (ha influenza di altri)
  const terrData = selectedTerritory ? territories[selectedTerritory] : null;
  const terrInfluences = terrData?.influences ?? {};
  const myInfluence   = (terrInfluences as Record<string, number>)[myFaction] ?? 0;
  const totalInfluence = Object.values(terrInfluences as Record<string, number>).reduce((a, b) => a + b, 0);
  const hasEnemyInfluence = totalInfluence > myInfluence;

  // ── Azione: Tiro dado influenza ──────────────────────────────────────
  const handleDiceRoll = () => {
    if (!selectedTerritory || !modifiers) return;
    const result = rollD6();
    setDiceResult(result);
    setDiceRolled(true);
    const success = result >= modifiers.finalThreshold;
    onAction('influenza', {
      type: 'influenza',
      card,
      targetTerritory: selectedTerritory,
      diceResult: result,
      diceSuccess: success,
      finalThreshold: modifiers.finalThreshold,
    });
  };

  // ── Azione diretta (senza dado) ──────────────────────────────────────
  const handleDirectAction = (type: PlayerActionType) => {
    setActiveAction(type);
    onAction(type, { type, card });
  };

  return (
    <div className="bg-[#0d1b2a] border border-[#1e3a5f] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-mono">Carta selezionata</p>
          <p className="text-white font-bold text-sm mt-0.5">{card.name}</p>
          <p className="text-xs mt-1" style={{ color: fColor }}>
            ⚡ {opPoints} PO — {myFaction}
          </p>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white text-lg leading-none mt-1">✕</button>
      </div>

      <p className="text-xs text-gray-400 border-t border-[#1e3a5f] pt-3 font-mono">
        Scegli come giocare questa carta:
      </p>

      {/* ── Griglia 4 azioni ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">

        {/* 1. Esegui Evento */}
        <button
          onClick={() => handleDirectAction('evento')}
          className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f] hover:border-[#00ff88] hover:bg-[#00ff8808] transition-all text-left group"
        >
          <span className="text-xl">🎭</span>
          <span className="text-xs font-bold text-white group-hover:text-[#00ff88]">Esegui Evento</span>
          <span className="text-xs text-gray-500">Applica l'effetto della carta</span>
        </button>

        {/* 2. Compra Unità */}
        <button
          onClick={() => handleDirectAction('acquisto')}
          className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f] hover:border-[#f59e0b] hover:bg-[#f59e0b08] transition-all text-left group"
        >
          <span className="text-xl">⚔️</span>
          <span className="text-xs font-bold text-white group-hover:text-[#f59e0b]">Compra Unità</span>
          <span className="text-xs text-gray-500">Usa {opPoints} OP per unità militari</span>
        </button>

        {/* 3. Incrementa Tracciato */}
        <button
          onClick={() => handleDirectAction('tracciato')}
          className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f] hover:border-[#3b82f6] hover:bg-[#3b82f608] transition-all text-left group"
        >
          <span className="text-xl">📈</span>
          <span className="text-xs font-bold text-white group-hover:text-[#3b82f6]">Incrementa Tracciato</span>
          <span className="text-xs text-gray-500">
            +{opPoints} OP al tuo tracciato
            <br />
            <span className="text-yellow-500 text-[10px]">⚠ La carta decurta {opPoints} OP al turno</span>
          </span>
        </button>

        {/* 4. Tentativo Influenza */}
        <button
          onClick={() => setActiveAction('influenza')}
          disabled={!selectedTerritory}
          className={`flex flex-col items-start gap-1 p-3 rounded-lg border transition-all text-left group
            ${selectedTerritory
              ? 'border-[#1e3a5f] hover:border-[#ec4899] hover:bg-[#ec489908] cursor-pointer'
              : 'border-[#1e2a3a] opacity-40 cursor-not-allowed'
            }`}
        >
          <span className="text-xl">🌐</span>
          <span className={`text-xs font-bold text-white ${selectedTerritory ? 'group-hover:text-[#ec4899]' : ''}`}>
            Tentativo Influenza
          </span>
          <span className="text-xs text-gray-500">
            {selectedTerritory ? `▶ ${selectedTerr?.label}` : 'Seleziona nazione sulla mappa'}
          </span>
        </button>
      </div>

      {/* ── Pannello espanso: Influenza ────────────────────────────── */}
      {activeAction === 'influenza' && selectedTerritory && modifiers && (
        <div className="border border-[#ec489940] rounded-lg p-3 space-y-3 bg-[#1a0a15]">
          <p className="text-xs font-bold text-[#ec4899] uppercase tracking-wide">
            🎲 Tentativo di Influenza — {selectedTerr?.label}
          </p>

          {/* Stato corrente territorio */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/20 rounded p-2">
              <p className="text-gray-400 mb-1">Influenza attuale</p>
              {Object.entries(terrInfluences as Record<string, number>).filter(([, v]) => v > 0).map(([f, v]) => (
                <div key={f} className="flex justify-between">
                  <span style={{ color: FACTION_COLOR[f as Faction] ?? '#aaa' }}>{f}</span>
                  <span className="text-white font-mono">{v} ■</span>
                </div>
              ))}
              {totalInfluence === 0 && <span className="text-gray-500">Nessuna</span>}
            </div>
            <div className="bg-black/20 rounded p-2 space-y-1">
              <p className="text-gray-400 mb-1">Modificatori dado</p>
              {modifiers.description.map((d, i) => (
                <p key={i} className="text-green-400 text-[10px]">✓ {d}</p>
              ))}
              {modifiers.description.length === 0 && <p className="text-gray-500 text-[10px]">Nessun modificatore</p>}
            </div>
          </div>

          {/* Soglia richiesta */}
          <div className="flex items-center justify-between bg-black/30 rounded px-3 py-2">
            <span className="text-xs text-gray-400">Soglia successo (d6 ≥)</span>
            <span className="text-xl font-bold font-mono" style={{ color: fColor }}>
              {modifiers.finalThreshold}
            </span>
          </div>

          {/* Tiro dado */}
          {!diceRolled ? (
            <button
              onClick={handleDiceRoll}
              className="w-full py-2.5 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold rounded-lg text-sm transition-colors"
            >
              🎲 Lancia il Dado
            </button>
          ) : (
            <div className={`rounded-lg p-3 text-center border-2 ${
              diceResult! >= modifiers.finalThreshold
                ? 'border-green-400 bg-green-900/20'
                : 'border-red-400 bg-red-900/20'
            }`}>
              <div className="text-4xl font-bold font-mono mb-1">
                {diceResult}
              </div>
              <p className={`text-sm font-bold ${
                diceResult! >= modifiers.finalThreshold ? 'text-green-400' : 'text-red-400'
              }`}>
                {diceResult! >= modifiers.finalThreshold
                  ? `✅ SUCCESSO! +1 segnalino a ${selectedTerr?.label}`
                  : `❌ Fallito (necessario ≥ ${modifiers.finalThreshold})`
                }
              </p>
            </div>
          )}

          <button
            onClick={() => { setActiveAction(null); setDiceRolled(false); setDiceResult(null); }}
            className="text-xs text-gray-500 hover:text-gray-300 w-full text-center"
          >
            ← Torna alle azioni
          </button>
        </div>
      )}
    </div>
  );
}

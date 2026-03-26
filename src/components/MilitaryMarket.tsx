// =============================================
// LINEA ROSSA — Componente Mercato Risorse Militari
// Pannello acquisto con costi dinamici in base a
// DEFCON × Sanzioni × Tracciato Militare fazione
// =============================================
import { useState, useMemo } from 'react';
import type { Faction, GameState } from '@/types/game';
import {
  calcolaCosto,
  calcolaRisorseAcquistabili,
  coloreCosto,
  labelTracciato,
  getForzeMilitari,
  COSTO_BASE_OP,
  type MarketState,
} from '@/lib/militaryMarket';

interface Props {
  faction: Faction;
  gameState: GameState;
  carteOpDisponibili: number;        // OP disponibili per questa fazione
  isMyTurn: boolean;
  onAcquista: (qtà: number, costoOpTotale: number) => Promise<void>;
  onClose: () => void;
}

const FACTION_COLORS: Record<string, string> = {
  Iran: '#22c55e', Coalizione: '#3b82f6', Russia: '#ef4444',
  Cina: '#f59e0b', Europa: '#8b5cf6',
};

const FACTION_FLAGS: Record<string, string> = {
  Iran: '🇮🇷', Coalizione: '🇺🇸', Russia: '🇷🇺', Cina: '🇨🇳', Europa: '🇪🇺',
};

function MoltiplicatoreRow({ label, mult, desc }: { label: string; mult: number; desc: string }) {
  const isBonus   = mult < 1.0;
  const isMalus   = mult > 1.0;
  const isNeutral = mult === 1.0;
  const color = isBonus ? '#22c55e' : isMalus ? '#f97316' : '#8899aa';
  const symbol = isBonus ? '▼' : isMalus ? '▲' : '—';

  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-300 text-[11px]">{desc}</span>
        <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[11px]"
          style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
          {symbol} ×{mult.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function DefconBar({ defcon }: { defcon: number }) {
  const colors = ['#ef4444','#f97316','#f59e0b','#84cc16','#22c55e'];
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(v => (
        <div key={v} className="flex-1 h-2 rounded-sm transition-all"
          style={{ backgroundColor: v <= defcon ? colors[v-1] : '#1e293b', opacity: v === defcon ? 1 : 0.4 }} />
      ))}
    </div>
  );
}

function TrackBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className="flex-1 h-2 rounded-sm transition-all"
          style={{ backgroundColor: i < value ? color : '#1e293b' }} />
      ))}
    </div>
  );
}

export default function MilitaryMarket({ faction, gameState, carteOpDisponibili, isMyTurn, onAcquista, onClose }: Props) {
  const [qtaSelezionata, setQtaSelezionata] = useState(1);
  const [loading, setLoading] = useState(false);

  const forzeMilitari = getForzeMilitari(faction, {
    forze_militari_iran: gameState.forze_militari_iran ?? 5,
    forze_militari_coalizione: gameState.forze_militari_coalizione ?? 5,
    risorse_russia: gameState.risorse_russia,
    risorse_cina: gameState.risorse_cina,
    risorse_europa: gameState.risorse_europa,
  });

  const marketState: MarketState = {
    defcon: gameState.defcon,
    sanzioni: gameState.sanzioni,
    forzeMilitari,
    carteOpDisponibili,
    faction,
  };

  const costoUnitario = useMemo(() => calcolaCosto(marketState), [
    gameState.defcon, gameState.sanzioni, forzeMilitari, carteOpDisponibili, faction
  ]);

  const maxAcquistabile = useMemo(() =>
    calcolaRisorseAcquistabili(marketState, carteOpDisponibili),
    [costoUnitario, carteOpDisponibili]
  );

  const costoTotale = costoUnitario.costoOp * qtaSelezionata;
  const puoAcquistare = isMyTurn && carteOpDisponibili >= costoTotale && qtaSelezionata > 0;
  const colore = FACTION_COLORS[faction] ?? '#8899aa';

  // Risorsa corrente fazione
  const risorseAttuali = (() => {
    switch (faction) {
      case 'Iran':       return gameState.risorse_iran;
      case 'Coalizione': return gameState.risorse_coalizione;
      case 'Russia':     return gameState.risorse_russia;
      case 'Cina':       return gameState.risorse_cina;
      case 'Europa':     return gameState.risorse_europa;
    }
  })();

  async function handleAcquista() {
    if (!puoAcquistare) return;
    setLoading(true);
    try {
      await onAcquista(qtaSelezionata, costoTotale);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const defconLabels: Record<number, string> = { 5: 'PACE', 4: 'ATTENZIONE', 3: 'TENSIONE', 2: 'ALLERTA', 1: 'GUERRA' };
  const defconColors: Record<number, string> = { 5: '#22c55e', 4: '#84cc16', 3: '#f59e0b', 2: '#f97316', 1: '#ef4444' };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-[#0d1117] border border-[#1e3a5f] rounded-2xl shadow-2xl overflow-hidden"
        style={{ boxShadow: `0 0 40px ${colore}30` }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: `linear-gradient(135deg, ${colore}20, #0d111700)`, borderBottom: '1px solid #1e3a5f' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <h2 className="font-mono font-bold text-white text-sm">MERCATO RISORSE MILITARI</h2>
              <p className="text-xs text-gray-400">{FACTION_FLAGS[faction]} {faction} — {carteOpDisponibili} OP disponibili</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none font-light"
            aria-label="Chiudi">✕</button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Stato corrente ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* DEFCON */}
            <div className="bg-[#111827] rounded-xl p-3 border border-[#1e3a5f] space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎯</span>
                <span className="text-[10px] text-gray-400 font-mono">DEFCON</span>
              </div>
              <div className="text-center">
                <span className="font-mono font-black text-xl" style={{ color: defconColors[gameState.defcon] }}>
                  {gameState.defcon}
                </span>
                <p className="text-[9px] font-mono mt-0.5" style={{ color: defconColors[gameState.defcon] }}>
                  {defconLabels[gameState.defcon]}
                </p>
              </div>
              <DefconBar defcon={gameState.defcon} />
            </div>

            {/* Sanzioni */}
            <div className="bg-[#111827] rounded-xl p-3 border border-[#1e3a5f] space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">💰</span>
                <span className="text-[10px] text-gray-400 font-mono">SANZIONI</span>
              </div>
              <div className="text-center">
                <span className="font-mono font-black text-xl text-[#f59e0b]">{gameState.sanzioni}</span>
                <p className="text-[9px] font-mono text-gray-500 mt-0.5">/10</p>
              </div>
              <TrackBar value={gameState.sanzioni} max={10} color="#f59e0b" />
            </div>

            {/* Tracciato militare */}
            <div className="bg-[#111827] rounded-xl p-3 border border-[#1e3a5f] space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🪖</span>
                <span className="text-[10px] text-gray-400 font-mono">MILITARE</span>
              </div>
              <div className="text-center">
                <span className="font-mono font-black text-xl" style={{ color: colore }}>{forzeMilitari}</span>
                <p className="text-[9px] font-mono text-gray-500 mt-0.5">/10</p>
              </div>
              <TrackBar value={forzeMilitari} max={10} color={colore} />
            </div>
          </div>

          {/* ── Costo unitario con breakdown ── */}
          <div className="bg-[#111827] rounded-xl border border-[#1e3a5f] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Calcolo Costo per 1 Unità</span>
            </div>
            <div className="px-4 py-3 space-y-0.5">
              {/* Base */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-gray-400">Costo base</span>
                <span className="font-mono text-white">{COSTO_BASE_OP} OP</span>
              </div>
              <MoltiplicatoreRow
                label={`DEFCON ${gameState.defcon}`}
                mult={costoUnitario.breakdown.molDefcon}
                desc={costoUnitario.breakdown.defconLabel}
              />
              <MoltiplicatoreRow
                label="Sanzioni"
                mult={costoUnitario.breakdown.molSanzioni}
                desc={costoUnitario.breakdown.sanzioniLabel}
              />
              <MoltiplicatoreRow
                label={labelTracciato(faction)}
                mult={costoUnitario.breakdown.molMilitare}
                desc={costoUnitario.breakdown.militareLabel}
              />
              {/* Totale */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-mono text-white font-bold">Costo finale</span>
                <span className="font-mono font-black text-lg px-2.5 py-0.5 rounded-lg"
                  style={{
                    color: coloreCosto(costoUnitario.costoOp),
                    backgroundColor: `${coloreCosto(costoUnitario.costoOp)}20`,
                    border: `1px solid ${coloreCosto(costoUnitario.costoOp)}50`,
                  }}>
                  {costoUnitario.costoOp} OP
                </span>
              </div>
            </div>
          </div>

          {/* ── Selezione quantità ── */}
          <div className="bg-[#111827] rounded-xl p-4 border border-[#1e3a5f] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">QUANTITÀ DA ACQUISTARE</span>
              {maxAcquistabile > 0 && (
                <button onClick={() => setQtaSelezionata(maxAcquistabile)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
                  style={{ color: colore, backgroundColor: `${colore}20`, border: `1px solid ${colore}40` }}>
                  MAX ({maxAcquistabile})
                </button>
              )}
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQtaSelezionata(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-[#1e293b] text-white font-bold hover:bg-[#334155] transition-colors text-base flex items-center justify-center">−</button>
              <div className="flex-1">
                <input
                  type="range" min={1}
                  max={Math.max(1, maxAcquistabile)}
                  value={qtaSelezionata}
                  onChange={e => setQtaSelezionata(Number(e.target.value))}
                  className="w-full accent-current"
                  style={{ accentColor: colore }}
                />
              </div>
              <button
                onClick={() => setQtaSelezionata(q => Math.min(maxAcquistabile, q + 1))}
                className="w-8 h-8 rounded-lg bg-[#1e293b] text-white font-bold hover:bg-[#334155] transition-colors text-base flex items-center justify-center">+</button>
              <span className="font-mono font-black text-xl w-6 text-center" style={{ color: colore }}>{qtaSelezionata}</span>
            </div>

            {/* Riepilogo transazione */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center bg-[#0d1117] rounded-lg p-2">
                <p className="text-[10px] text-gray-500 font-mono">COSTO TOTALE</p>
                <p className="font-mono font-bold text-sm" style={{ color: coloreCosto(costoUnitario.costoOp) }}>{costoTotale} OP</p>
              </div>
              <div className="text-center bg-[#0d1117] rounded-lg p-2">
                <p className="text-[10px] text-gray-500 font-mono">OP RESIDUI</p>
                <p className="font-mono font-bold text-sm" style={{ color: carteOpDisponibili - costoTotale >= 0 ? '#22c55e' : '#ef4444' }}>
                  {carteOpDisponibili - costoTotale}
                </p>
              </div>
              <div className="text-center bg-[#0d1117] rounded-lg p-2">
                <p className="text-[10px] text-gray-500 font-mono">RISORSE → {risorseAttuali + qtaSelezionata}</p>
                <p className="font-mono font-bold text-sm text-[#22c55e]">
                  +{qtaSelezionata} ⬆
                </p>
              </div>
            </div>
          </div>

          {/* ── Avvisi contestuali ── */}
          {gameState.defcon <= 2 && (
            <div className="flex items-center gap-2 bg-[#ef444415] border border-[#ef444440] rounded-lg px-3 py-2">
              <span className="text-red-400 text-base">⚠️</span>
              <p className="text-xs text-red-300 font-mono">
                DEFCON {gameState.defcon}: prezzi in stato di emergenza (×{costoUnitario.breakdown.molDefcon.toFixed(1)})
              </p>
            </div>
          )}
          {faction === 'Iran' && gameState.sanzioni >= 7 && (
            <div className="flex items-center gap-2 bg-[#f9731615] border border-[#f9731640] rounded-lg px-3 py-2">
              <span className="text-orange-400 text-base">🚫</span>
              <p className="text-xs text-orange-300 font-mono">
                Sanzioni gravi: approvvigionamento difficile (×{costoUnitario.breakdown.molSanzioni.toFixed(1)})
              </p>
            </div>
          )}
          {!isMyTurn && (
            <div className="flex items-center gap-2 bg-[#f59e0b15] border border-[#f59e0b40] rounded-lg px-3 py-2">
              <span className="text-yellow-400 text-base">⏳</span>
              <p className="text-xs text-yellow-300 font-mono">Non è il tuo turno. Puoi visualizzare i prezzi ma non acquistare.</p>
            </div>
          )}
          {isMyTurn && maxAcquistabile === 0 && (
            <div className="flex items-center gap-2 bg-[#ef444415] border border-[#ef444440] rounded-lg px-3 py-2">
              <span className="text-red-400 text-base">💸</span>
              <p className="text-xs text-red-300 font-mono">OP insufficienti ({carteOpDisponibili} OP — servono {costoUnitario.costoOp} OP per 1 unità)</p>
            </div>
          )}

          {/* ── Bottone acquisto ── */}
          <button
            onClick={handleAcquista}
            disabled={!puoAcquistare || loading}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: puoAcquistare ? colore : '#1e293b',
              color: puoAcquistare ? '#0a0e1a' : '#8899aa',
              boxShadow: puoAcquistare ? `0 0 20px ${colore}50` : 'none',
            }}>
            {loading ? '⏳ Acquisto in corso...' :
              !isMyTurn ? '🔒 Non è il tuo turno' :
              !puoAcquistare ? `💸 OP insufficienti (${costoTotale} richiesti)` :
              `⚔️ ACQUISTA ${qtaSelezionata} UNITÀ — ${costoTotale} OP`}
          </button>
        </div>
      </div>
    </div>
  );
}

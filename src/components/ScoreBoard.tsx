// =============================================
// LINEA ROSSA — ScoreBoard
// Tab dedicato "🏆 Punteggi di questa partita":
//   A) Punteggi live calcolati con calcScores() — dettagliati con trend ↑↓
//   B) Modalità per fare punti (guida statica per fazione)
// =============================================
import React, { useMemo, useRef } from 'react';
import type { GameState } from '@/types/game';
import { calcScores } from '@/lib/botEngine';

// ── Costanti fazione ──────────────────────────────────────────────────
const FACTION_META: Record<
  string,
  { flag: string; color: string; emoji: string }
> = {
  Iran:       { flag: '🇮🇷', color: '#2d8a4e', emoji: '☢️' },
  Coalizione: { flag: '🇺🇸', color: '#1a6eb5', emoji: '🛡️' },
  Russia:     { flag: '🇷🇺', color: '#c0392b', emoji: '⚡' },
  Cina:       { flag: '🇨🇳', color: '#e74c3c', emoji: '💰' },
  Europa:     { flag: '🇪🇺', color: '#2980b9', emoji: '🕊️' },
};

// ── Dettaglio formula punteggio per fazione ──────────────────────────
interface ScoreDetail {
  label: string;
  value: number;
  multiplier?: number;
  sign: '+' | '-';
  emoji: string;
}

function buildScoreDetails(faction: string, state: GameState): { details: ScoreDetail[]; total: number } {
  const nuc  = state.nucleare       ?? 0;
  const san  = state.sanzioni       ?? 0;
  const rIra = state.risorse_iran   ?? 0;
  const rCoa = state.risorse_coalizione ?? 0;
  const rRus = state.risorse_russia ?? 0;
  const rCin = state.risorse_cina   ?? 0;
  const stRu = state.stabilita_russia ?? 0;
  const stCi = state.stabilita_cina   ?? 0;
  const stEu = state.stabilita_europa ?? 0;
  const def  = state.defcon         ?? 0;

  switch (faction) {
    case 'Iran':
      return {
        details: [
          { label: 'Nucleare', value: nuc,  multiplier: 2, sign: '+', emoji: '☢️' },
          { label: 'Risorse',  value: rIra, sign: '+', emoji: '💰' },
          { label: 'Sanzioni', value: san,  sign: '-', emoji: '⚖️' },
        ],
        total: Math.round(nuc * 2 + rIra - san),
      };
    case 'Coalizione':
      return {
        details: [
          { label: 'Sanzioni',  value: san,  multiplier: 2, sign: '+', emoji: '⚖️' },
          { label: 'Risorse',   value: rCoa, sign: '+', emoji: '💰' },
          { label: 'Nucleare',  value: nuc,  sign: '-', emoji: '☢️' },
        ],
        total: Math.round(san * 2 + rCoa - nuc),
      };
    case 'Russia':
      return {
        details: [
          { label: 'Risorse',   value: rRus, sign: '+', emoji: '💰' },
          { label: 'Stabilità', value: stRu, sign: '+', emoji: '🛡️' },
        ],
        total: Math.round(rRus + stRu),
      };
    case 'Cina':
      return {
        details: [
          { label: 'Risorse',   value: rCin, sign: '+', emoji: '💰' },
          { label: 'Stabilità', value: stCi, sign: '+', emoji: '🛡️' },
        ],
        total: Math.round(rCin + stCi),
      };
    case 'Europa':
      return {
        details: [
          { label: 'DEFCON',    value: def,  multiplier: 3, sign: '+', emoji: '🌐' },
          { label: 'Stabilità', value: stEu, sign: '+', emoji: '🕊️' },
        ],
        total: Math.round(def * 3 + stEu),
      };
    default:
      return { details: [], total: 0 };
  }
}

// ── Modalità per fare punti (statiche, derivate da calcScores) ────────
const SCORE_MODES: Array<{
  faction: string;
  formula: string;
  tips: string[];
}> = [
  {
    faction: 'Iran',
    formula: 'nucleare×2 + risorse_iran − sanzioni',
    tips: [
      'Alzare il tracciato Nucleare (+2 pt per livello)',
      'Aumentare risorse Iran (+1 pt per livello)',
      'Abbassare le Sanzioni (−1 pt per ogni punto sanzione)',
      'Controllare territori (bonus passivi su nucleare/risorse)',
    ],
  },
  {
    faction: 'Coalizione',
    formula: 'sanzioni×2 + risorse_coalizione − nucleare',
    tips: [
      'Alzare Sanzioni (+2 pt per livello, max 20)',
      'Aumentare risorse Coalizione (+1 pt)',
      'Abbassare Nucleare Iran (−1 pt per ogni livello nucleare)',
    ],
  },
  {
    faction: 'Russia',
    formula: 'risorse_russia + stabilita_russia',
    tips: [
      'Aumentare risorse Russia (+1 pt)',
      'Aumentare stabilità Russia (+1 pt)',
    ],
  },
  {
    faction: 'Cina',
    formula: 'risorse_cina + stabilita_cina',
    tips: [
      'Aumentare risorse Cina (+1 pt)',
      'Aumentare stabilità Cina (+1 pt)',
      'Controllare territori navali (bonus passivi)',
    ],
  },
  {
    faction: 'Europa',
    formula: 'defcon×3 + stabilita_europa',
    tips: [
      'Mantenere alto il DEFCON (+3 pt per livello DEFCON)',
      'Aumentare stabilità Europa (+1 pt)',
      'NON escalare — vincere senza abbassare DEFCON',
    ],
  },
];

const MAX_SCORE = 50; // barra proporzionale

interface ScoreBoardProps {
  gameState: GameState;
  myFaction: string | null;
  factions: string[];
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState, myFaction, factions }) => {
  // ── Calcola punteggi live ──────────────────────────────────────────
  const scores = useMemo(() => calcScores(gameState), [gameState]);

  // ── Memorizza punteggi precedenti per calcolare il trend ──────────
  const prevScoresRef = useRef<Record<string, number>>({});
  const prevScores = prevScoresRef.current;
  // aggiorna dopo il render
  React.useEffect(() => {
    prevScoresRef.current = { ...scores };
  }, [scores]);

  // Filtra e ordina solo fazioni che partecipano alla partita
  const sorted = useMemo(
    () =>
      factions
        .filter(f => scores[f] !== undefined)
        .map(f => ({ faction: f, score: scores[f] }))
        .sort((a, b) => b.score - a.score),
    [scores, factions],
  );

  // Mostra anche le modalità solo per le fazioni in gioco
  const modesFiltered = SCORE_MODES.filter(m => factions.includes(m.faction));

  return (
    <div className="space-y-4">

      {/* ═══ SEZIONE A: PUNTEGGI LIVE ═══ */}
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-sm font-bold text-[#00ff88]">🏆 Punteggi di questa partita</span>
          <span className="font-mono text-[10px] text-[#334455]">— aggiornati turno per turno</span>
        </div>

        <div className="space-y-3">
          {sorted.map((entry, idx) => {
            const meta = FACTION_META[entry.faction] ?? { flag: '🏳️', color: '#8899aa', emoji: '?' };
            const isMe = entry.faction === myFaction;
            const barWidth = Math.min(100, Math.max(0, (entry.score / MAX_SCORE) * 100));
            const barColor = meta.color;
            const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
            const prev = prevScores[entry.faction];
            const trendDiff = prev !== undefined ? entry.score - prev : 0;
            const trendIcon = trendDiff > 0 ? '↑' : trendDiff < 0 ? '↓' : '→';
            const trendColor = trendDiff > 0 ? '#00ff88' : trendDiff < 0 ? '#ff4444' : '#8899aa';

            // Dettaglio formula
            const { details } = buildScoreDetails(entry.faction, gameState);

            // Formula: ogni termine su riga separata, chiara e senza parentesi doppie

            return (
              <div
                key={entry.faction}
                className={`rounded-lg p-3 border transition-all ${
                  isMe
                    ? 'border-[#00ff88] bg-[#00ff8810]'
                    : 'border-[#1e3a5f] bg-[#0a0e1a]'
                }`}
              >
                {/* Riga nome + punteggio GRANDE + trend */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${rankColors[idx] ?? 'text-[#8899aa]'}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-base">{meta.flag}</span>
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: isMe ? '#00ff88' : meta.color }}
                    >
                      {entry.faction}
                    </span>
                    {isMe && (
                      <span className="font-mono text-[10px] font-bold text-[#00ff88] bg-[#00ff8822] px-1.5 py-0.5 rounded">
                        ← TU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Trend */}
                    {prev !== undefined && (
                      <span className="font-mono text-sm font-bold" style={{ color: trendColor }}>
                        {trendIcon}{Math.abs(trendDiff) > 0 ? Math.abs(trendDiff) : ''}
                      </span>
                    )}
                    {/* Punteggio GRANDE */}
                    <span
                      className="font-mono text-3xl font-black tabular-nums"
                      style={{ color: isMe ? '#00ff88' : meta.color }}
                    >
                      {entry.score}
                    </span>
                    <span className="font-mono text-xs text-[#8899aa] self-end mb-1">pt</span>
                  </div>
                </div>

                {/* Formula dettagliata — una riga per termine */}
                <div className="font-mono text-[10px] bg-[#0d1117] rounded px-2 py-1.5 mb-2 space-y-0.5">
                  {details.map((d, i) => {
                    const contribution = d.multiplier
                      ? d.value * d.multiplier
                      : d.value;
                    const signed = d.sign === '-' ? -contribution : contribution;
                    return (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-[#556677]">
                          {d.emoji} {d.label}
                        </span>
                        <span className="flex items-center gap-1 text-right">
                          <span className="text-[#445566]">
                            {d.value}{d.multiplier ? ` ×${d.multiplier}` : ''}
                          </span>
                          <span className={`font-bold ${signed >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            {signed >= 0 ? '+' : ''}{signed}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-2 border-t border-[#1e3a5f] pt-1 mt-1">
                    <span className="text-[#667788]">Totale</span>
                    <span className="font-black text-[#aabbcc]">{entry.score} pt</span>
                  </div>
                </div>

                {/* Barra proporzionale */}
                <div className="h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SEZIONE B: MODALITÀ PER FARE PUNTI ═══ */}
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-xs font-bold text-[#8899aa]">📖 COME FARE PUNTI</span>
          <span className="font-mono text-[10px] text-[#334455]">— guida strategie per fazione</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {modesFiltered.map(mode => {
            const meta = FACTION_META[mode.faction] ?? { flag: '🏳️', color: '#8899aa', emoji: '?' };
            const isMe = mode.faction === myFaction;

            return (
              <div
                key={mode.faction}
                className={`rounded-lg p-3 border ${
                  isMe ? 'border-[#00ff8860]' : 'border-[#1e3a5f]'
                } bg-[#0a0e1a]`}
              >
                {/* Header fazione */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{meta.emoji}</span>
                  <span className="text-base">{meta.flag}</span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isMe ? '#00ff88' : meta.color }}
                  >
                    {mode.faction.toUpperCase()}
                  </span>
                  {isMe && (
                    <span className="font-mono text-[9px] text-[#00ff88]">← TU</span>
                  )}
                </div>

                {/* Formula */}
                <div
                  className="font-mono text-[10px] px-2 py-1 rounded mb-2 border"
                  style={{
                    color: meta.color,
                    borderColor: `${meta.color}40`,
                    backgroundColor: `${meta.color}12`,
                  }}
                >
                  {mode.formula}
                </div>

                {/* Tips */}
                <ul className="space-y-1">
                  {mode.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#334455] text-[10px] mt-0.5 shrink-0">→</span>
                      <span className="font-mono text-[10px] text-[#8899aa] leading-tight">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;

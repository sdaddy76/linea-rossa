// =============================================
// LINEA ROSSA — ScoreBoard
// Tab dedicato "🏆 Punteggi":
//   A) Punteggi live calcolati con calcScores()
//   B) Modalità per fare punti (guida statica per fazione)
// =============================================
import React, { useMemo } from 'react';
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
          <span className="font-mono text-xs font-bold text-[#00ff88]">🏆 CLASSIFICA LIVE</span>
          <span className="font-mono text-[10px] text-[#334455]">— aggiornata in tempo reale</span>
        </div>

        <div className="space-y-2.5">
          {sorted.map((entry, idx) => {
            const meta = FACTION_META[entry.faction] ?? { flag: '🏳️', color: '#8899aa', emoji: '?' };
            const isMe = entry.faction === myFaction;
            const barWidth = Math.min(100, Math.max(0, (entry.score / MAX_SCORE) * 100));
            const barColor = meta.color;
            const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

            return (
              <div
                key={entry.faction}
                className={`rounded-lg p-3 border transition-all ${
                  isMe
                    ? 'border-[#00ff88] bg-[#00ff8810]'
                    : 'border-[#1e3a5f] bg-[#0a0e1a]'
                }`}
              >
                {/* Riga nome + punteggio */}
                <div className="flex items-center justify-between mb-1.5">
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
                  <span
                    className="font-mono text-lg font-bold"
                    style={{ color: isMe ? '#00ff88' : meta.color }}
                  >
                    {entry.score} pt
                  </span>
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

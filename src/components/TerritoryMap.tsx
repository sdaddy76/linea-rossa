// =============================================
// LINEA ROSSA — Mappa SVG Realistica v4
// ViewBox: 0 0 1100 750
// 13 stati giocabili + Stretto di Hormuz
// Cubi influenza iniziali visibili per stato
// =============================================

import { useState } from 'react';
import type { Faction } from '@/types/game';
import { UNITS } from '@/lib/territoriesData';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { getController } from '@/lib/combatEngine';

// ── Colori fazione ─────────────────────────────────────────────────────────
const FC: Record<Faction, string> = {
  Iran:       '#ef4444',
  Coalizione: '#3b82f6',
  Russia:     '#a855f7',
  Cina:       '#f59e0b',
  Europa:     '#10b981',
};
const FC_BG: Record<Faction, string> = {
  Iran:       '#ef444428',
  Coalizione: '#3b82f628',
  Russia:     '#a855f728',
  Cina:       '#f59e0b28',
  Europa:     '#10b98128',
};
const FACTIONS: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

export interface TerritoryState {
  [territory: string]: {
    influences: Partial<Record<Faction, number>>;
    units: Partial<Record<Faction, Partial<Record<UnitType, number>>>>;
  };
}

interface Props {
  territories: TerritoryState;
  myFaction: Faction | null;
  isMyTurn: boolean;
  onSelectTerritory?: (id: TerritoryId) => void;
  selectedTerritory?: TerritoryId | null;
  attackMode?: boolean;
}

interface TerrSVG {
  id: TerritoryId;
  label: string;
  path: string;
  labelPos: [number, number];
  type: 'casa' | 'strategico' | 'normale';
  pvPerRound: number;
  isNaval?: boolean;
  homeFaction?: Faction;
  cubeAnchor: [number, number];  // dove disegnare i cubi
  initialCubes: number;
  labelSize?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERCORSI SVG — ViewBox 0 0 1100 750
//
// Scala approssimativa:
//   X: lon 24°E = 20,  lon 62°E = 940    →  ~24 px/°
//   Y: lat 43°N = 20,  lat 11°N = 730    →  ~22 px/°
//
// Conversione rapida:
//   x = (lon - 24) * 24 + 20
//   y = (43 - lat) * 22 + 20
// ─────────────────────────────────────────────────────────────────────────────

const TERR_SVG: TerrSVG[] = [

  // ── TURCHIA  (36°N-42°N / 26°E-44°E) ─────────────────────────────────────
  {
    id: 'Turchia', label: 'TURCHIA', initialCubes: 4,
    type: 'normale', pvPerRound: 1,
    path: `M 44,20 L 500,20 L 500,55
           L 455,68 L 400,82 L 340,92 L 275,96
           L 210,92 L 155,80 L 100,65 L 55,50 Z`,
    labelPos: [275, 56],
    cubeAnchor: [56, 52],
    labelSize: 12,
  },

  // ── SIRIA  (33°N-37°N / 36°E-42°E) ───────────────────────────────────────
  {
    id: 'Siria', label: 'SIRIA', initialCubes: 2,
    type: 'normale', pvPerRound: 1,
    path: `M 300,96 L 500,96 L 508,110 L 512,192
           L 472,210 L 420,222 L 368,228 L 330,226 L 302,212
           L 295,172 Z`,
    labelPos: [404, 156],
    cubeAnchor: [302, 100],
    labelSize: 11,
  },

  // ── LIBANO  (33°N-34.5°N / 35.1°E-36.6°E) ────────────────────────────────
  {
    id: 'Libano', label: 'LIBANO', initialCubes: 2,
    type: 'normale', pvPerRound: 1,
    path: `M 268,165 L 300,165 L 300,212 L 268,220 Z`,
    labelPos: [212, 180],
    cubeAnchor: [175, 188],
    labelSize: 8,
  },

  // ── ISRAELE  (29.5°N-33.4°N / 34.2°E-35.9°E) ────────────────────────────
  {
    id: 'Israele', label: 'ISRAELE', initialCubes: 6,
    type: 'normale', pvPerRound: 1,
    path: `M 246,220 L 268,220 L 272,238 L 274,275 L 268,310
           L 256,314 L 244,310 L 236,275 L 234,245 Z`,
    labelPos: [192, 250],
    cubeAnchor: [148, 262],
    labelSize: 9,
  },

  // ── GIORDANIA  (29.2°N-33°N / 35.5°E-39.3°E) ─────────────────────────────
  {
    id: 'Giordania', label: 'GIORDANIA', initialCubes: 2,
    type: 'normale', pvPerRound: 1,
    path: `M 272,220 L 368,220 L 380,234 L 382,316
           L 340,323 L 296,320 L 268,316 L 268,310
           L 274,275 L 272,238 Z`,
    labelPos: [326, 268],
    cubeAnchor: [272, 318],
    labelSize: 9,
  },

  // ── EGITTO  (22°N-31°N / 24°E-37°E) ──────────────────────────────────────
  {
    id: 'Egitto', label: 'EGITTO', initialCubes: 4,
    type: 'normale', pvPerRound: 1,
    path: `M 20,278 L 198,278 L 228,222 L 248,222
           L 236,248 L 238,278 L 245,312 L 258,316
           L 254,342 L 248,375 L 250,422 L 226,465
           L 185,475 L 108,475 L 20,462 Z`,
    labelPos: [115, 385],
    cubeAnchor: [22, 280],
    labelSize: 11,
  },

  // ── IRAQ  (29°N-37.5°N / 38.8°E-48.6°E) ─────────────────────────────────
  {
    id: 'Iraq', label: 'IRAQ', initialCubes: 3,
    type: 'normale', pvPerRound: 1,
    path: `M 368,105 L 512,105 L 520,118 L 525,145
           L 558,162 L 572,188 L 572,260 L 558,282
           L 548,325 L 496,332 L 424,338 L 382,318
           L 380,236 L 368,222 Z`,
    labelPos: [470, 218],
    cubeAnchor: [370, 108],
    labelSize: 11,
  },

  // ── IRAN  (25°N-40°N / 44°E-63.5°E) ─────────────────────────────────────
  {
    id: 'Iran', label: 'IRAN', initialCubes: 6,
    type: 'casa', pvPerRound: 3, homeFaction: 'Iran', isNaval: true,
    path: `M 500,62 L 565,54 L 635,56 L 695,66 L 748,78
           L 800,95 L 848,122 L 886,152 L 908,188
           L 918,232 L 910,285 L 890,328 L 862,358
           L 828,378 L 786,385 L 748,382 L 710,368
           L 678,350 L 655,328 L 638,305 L 615,285
           L 585,278 L 558,278 L 572,260 L 572,188
           L 558,162 L 525,145 L 520,118 L 512,105
           L 508,88 L 500,72 Z`,
    labelPos: [730, 228],
    cubeAnchor: [504, 62],
    labelSize: 15,
  },

  // ── KUWAIT  (28.5°N-30.1°N / 46.5°E-48.5°E) ─────────────────────────────
  {
    id: 'Kuwait', label: 'KUWAIT', initialCubes: 2,
    type: 'normale', pvPerRound: 1,
    path: `M 548,322 L 598,318 L 604,338 L 598,358 L 565,360 L 548,350 Z`,
    labelPos: [575, 372],
    cubeAnchor: [548, 355],
    labelSize: 8,
  },

  // ── ARABIA SAUDITA  (16°N-32°N / 36.5°E-56°E) ───────────────────────────
  {
    id: 'ArabiaSaudita', label: 'ARABIA SAUDITA', initialCubes: 4,
    type: 'casa', pvPerRound: 3, homeFaction: 'Coalizione', isNaval: true,
    path: `M 254,342 L 382,332 L 424,338 L 496,332 L 548,350
           L 598,358 L 630,358 L 655,368 L 678,392 L 678,438
           L 660,476 L 635,505 L 590,535 L 530,552
           L 465,555 L 400,542 L 340,520 L 292,495
           L 265,468 L 248,438 L 252,402 L 248,375 Z`,
    labelPos: [440, 448],
    cubeAnchor: [258, 345],
    labelSize: 11,
  },

  // ── EMIRATI ARABI UNITI  (22.6°N-25.6°N / 51.5°E-56.4°E) ────────────────
  {
    id: 'EmiratiArabi', label: 'EMIRATI A.U.', initialCubes: 2,
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: `M 680,360 L 748,364 L 780,378 L 795,395
           L 790,422 L 772,436 L 744,444 L 716,442
           L 692,428 L 680,412 L 680,395 Z`,
    labelPos: [742, 455],
    cubeAnchor: [700, 460],
    labelSize: 8,
  },

  // ── OMAN  (16.7°N-24.7°N / 51.9°E-59.8°E) ────────────────────────────────
  {
    id: 'Oman', label: 'OMAN', initialCubes: 2,
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: `M 795,392 L 828,380 L 862,360 L 902,370
           L 932,405 L 950,452 L 954,502
           L 934,552 L 900,578 L 856,592
           L 814,588 L 774,570 L 746,542
           L 732,510 L 726,474 L 732,448
           L 744,436 L 772,436 L 790,422 Z`,
    labelPos: [850, 480],
    cubeAnchor: [798, 394],
    labelSize: 11,
  },

  // ── STRETTO DI HORMUZ  (zona navale) ─────────────────────────────────────
  {
    id: 'StrettoHormuz', label: 'HORMUZ ⭐', initialCubes: 0,
    type: 'strategico', pvPerRound: 2, isNaval: true,
    path: `M 748,380 L 788,383 L 795,395 L 780,378 L 750,368 Z`,
    labelPos: [706, 368],
    cubeAnchor: [750, 382],
    labelSize: 7,
  },
];

// ── Cubi influenza iniziali (quadratini grigi vuoti) ──────────────────────
function InitialCubes({ count, anchor }: { count: number; anchor: [number, number] }) {
  if (count === 0) return null;
  const C = 9; const G = 2.5; const PER_ROW = 3;
  return (
    <g opacity={0.75}>
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i}
          x={anchor[0] + (i % PER_ROW) * (C + G)}
          y={anchor[1] + Math.floor(i / PER_ROW) * (C + G)}
          width={C} height={C} rx={2}
          fill="#081420" stroke="#2a4060" strokeWidth={1.2}
        />
      ))}
      <text
        x={anchor[0] + Math.min(count, PER_ROW) * (C + G) + 2}
        y={anchor[1] + (Math.ceil(count / PER_ROW) - 1) * (C + G) + C - 1}
        fill="#3a6080" fontSize={8} fontFamily="monospace" fontWeight="bold"
      >×{count}</text>
    </g>
  );
}

// ── Quadrati influenza giocatori ───────────────────────────────────────────
function InfluenceSquares({ influences, anchor }: {
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const rows = FACTIONS
    .map(f => ({ faction: f, count: influences[f] ?? 0 }))
    .filter(r => r.count > 0);
  if (rows.length === 0) return null;

  const C = 8; const G = 2; const ROW_H = 11;
  return (
    <g>
      {rows.map((row, ri) =>
        Array.from({ length: Math.min(row.count, 6) }).map((_, si) => (
          <rect key={`${row.faction}-${si}`}
            x={anchor[0] + si * (C + G)}
            y={anchor[1] + ri * ROW_H}
            width={C} height={C} rx={2}
            fill={FC[row.faction]} opacity={0.9}
            stroke="#000" strokeWidth={0.5}
          />
        ))
      )}
    </g>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ terr, influences, x, y }: {
  terr: TerrSVG;
  influences: Partial<Record<Faction, number>>;
  x: number; y: number;
}) {
  const controller = getController(influences as Record<Faction, number>);
  const hasInfl = FACTIONS.some(f => (influences[f] ?? 0) > 0);
  const W = 225; const H = hasInfl ? 145 : 88;
  const tx = Math.min(x + 12, 860); const ty = Math.max(y - 8, 5);

  return (
    <g>
      <rect x={tx-4} y={ty-4} width={W} height={H} rx={8}
        fill="#080e1c" stroke="#1e3a5f" strokeWidth={1.3}
        filter="url(#shadow)" opacity={0.97} />
      <text x={tx+6} y={ty+15} fill="#00ff88" fontSize={11}
        fontWeight="bold" fontFamily="monospace">{terr.label}</text>
      <text x={tx+6} y={ty+28} fill="#8899aa" fontSize={7.5} fontFamily="monospace">
        {terr.type === 'casa' ? '🏠 Territorio Casa' : terr.type === 'strategico' ? '⭐ Strategico' : '📍 Normale'}
        {'  ·  '}{terr.pvPerRound} PV/round{terr.isNaval ? '  🚢' : ''}
      </text>
      <text x={tx+6} y={ty+40} fill="#3a6080" fontSize={7} fontFamily="monospace">
        Slot influenza: {terr.initialCubes}
      </text>
      <rect x={tx+2} y={ty+45} width={W-8} height={15} rx={3}
        fill={controller ? FC_BG[controller] : '#ffffff06'} />
      <text x={tx+8} y={ty+55} fill={controller ? FC[controller] : '#4b5563'}
        fontSize={8} fontFamily="monospace">
        {controller ? `✅ Controllato: ${controller}` : '⚪ Non controllato'}
      </text>
      {hasInfl && (
        <>
          <line x1={tx+2} y1={ty+63} x2={tx+W-8} y2={ty+63} stroke="#1e3a5f" strokeWidth={0.8} />
          <text x={tx+6} y={ty+74} fill="#94a3b8" fontSize={7.5}
            fontFamily="monospace" fontWeight="bold">INFLUENZE:</text>
          {FACTIONS.map((f, fi) => {
            const n = influences[f] ?? 0;
            if (n === 0) return null;
            return (
              <g key={f}>
                <text x={tx+6} y={ty+87+fi*12} fill={FC[f]} fontSize={8} fontFamily="monospace">{f}</text>
                {Array.from({ length: Math.min(n, 6) }).map((_, i) => (
                  <rect key={i}
                    x={tx+75+i*10} y={ty+79+fi*12}
                    width={8} height={8} rx={1.5}
                    fill={FC[f]} opacity={0.85} />
                ))}
                <text x={tx+152} y={ty+87+fi*12}
                  fill="#4b5563" fontSize={7} fontFamily="monospace">
                  {n}/{terr.initialCubes}
                </text>
              </g>
            );
          })}
        </>
      )}
    </g>
  );
}

// ── Helpers fill/stroke ────────────────────────────────────────────────────
function terrFill(ctrl: Faction | null, type: TerrSVG['type'], sel: boolean) {
  if (sel) return '#ffffff10';
  if (ctrl) return FC_BG[ctrl];
  return type === 'casa' ? '#0d1f35' : type === 'strategico' ? '#121e38' : '#091524';
}
function terrStroke(ctrl: Faction | null, type: TerrSVG['type'], sel: boolean) {
  if (sel) return '#00ff88';
  if (ctrl) return FC[ctrl];
  return type === 'strategico' ? '#8b5cf6' : type === 'casa' ? '#1e4a7f' : '#1e3a5f';
}

// ── Componente principale ──────────────────────────────────────────────────
export default function TerritoryMap({
  territories, myFaction, isMyTurn,
  onSelectTerritory, selectedTerritory, attackMode,
}: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);
  const [tooltipPos, setTooltipPos] = useState<[number, number]>([0, 0]);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTooltipPos([
      (e.clientX - r.left)  * (1100 / r.width),
      (e.clientY - r.top)   * (750  / r.height),
    ]);
  };

  return (
    <div className="relative w-full select-none" style={{ paddingBottom: '68.2%' }}>
      <div className="absolute inset-0">
        <svg viewBox="0 0 1100 750" className="w-full h-full"
          style={{ background: 'linear-gradient(160deg,#020a14 0%,#04101e 100%)', borderRadius: 12 }}
          onMouseMove={onMouseMove}
        >
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="130%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.85" />
            </filter>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Texture acqua (onde sottili) */}
            <pattern id="water" patternUnits="userSpaceOnUse" width="22" height="22">
              <rect width="22" height="22" fill="#031828" />
              <path d="M0,10 Q5.5,7 11,10 Q16.5,13 22,10" stroke="#04284a" strokeWidth="0.7" fill="none"/>
              <path d="M0,20 Q5.5,17 11,20 Q16.5,23 22,20" stroke="#04284a" strokeWidth="0.7" fill="none"/>
            </pattern>
          </defs>

          {/* ── SFONDO ACQUA ─────────────────────────────────────────────── */}
          <rect width="1100" height="750" fill="url(#water)" />

          {/* ── CORPI D'ACQUA con etichette ──────────────────────────────── */}
          {/* Mar Mediterraneo (NW) */}
          <path d="M 0,0 L 268,0 L 268,110 L 210,168 L 145,195 L 78,200 L 20,195 L 0,182 Z"
            fill="#031c35" stroke="#0a3a5f" strokeWidth={0.6} opacity={0.9} />
          <text x="55" y="112" fill="#0a4a72" fontSize={9} fontFamily="monospace" fontStyle="italic">
            MAR MEDITERRANEO
          </text>

          {/* Golfo Persico */}
          <path d={`M 548,318 L 574,325 L 604,332 L 630,342 L 655,358 L 678,382
                    L 678,408 L 660,428 L 635,438 L 602,442 L 572,438
                    L 548,422 L 535,408 L 525,392 L 515,372 L 505,355
                    L 502,338 L 510,325 Z`}
            fill="#031c35" stroke="#0a4a7a" strokeWidth={1.3} opacity={0.92} />
          <text x="545" y="400" fill="#0d5a7e" fontSize={8} fontFamily="monospace" fontStyle="italic">
            GOLFO{'\n'}PERSICO
          </text>
          <text x="545" y="412" fill="#0d5a7e" fontSize={8} fontFamily="monospace" fontStyle="italic">
            PERSICO
          </text>

          {/* Mar Rosso */}
          <path d={`M 185,475 L 226,465 L 250,422 L 248,375 L 252,402
                    L 248,438 L 265,468 L 240,502 L 215,535
                    L 192,565 L 175,598 L 162,640 L 175,700
                    L 140,750 L 0,750 L 0,562 L 20,462 L 108,475 Z`}
            fill="#031c35" stroke="#0a3a5f" strokeWidth={0.6} opacity={0.88} />
          <text x="60" y="572"
            fill="#0a4a72" fontSize={8} fontFamily="monospace" fontStyle="italic"
            transform="rotate(-72, 72, 555)">
            MAR ROSSO
          </text>

          {/* Mar Caspio */}
          <ellipse cx="792" cy="65" rx="55" ry="32"
            fill="#031c35" stroke="#0a3a5f" strokeWidth={0.8} opacity={0.82} />
          <text x="758" y="70" fill="#0a4a72" fontSize={7} fontFamily="monospace" fontStyle="italic">
            M. CASPIO
          </text>

          {/* Golfo di Aden / Mar d'Arabia */}
          <path d="M 590,610 L 1100,610 L 1100,750 L 545,750 Z"
            fill="#031c35" stroke="#0a3a5f" strokeWidth={0.5} opacity={0.7} />
          <text x="820" y="698" textAnchor="middle"
            fill="#0a4a72" fontSize={9} fontFamily="monospace" fontStyle="italic">
            MAR D'ARABIA
          </text>

          {/* Golfo di Oman */}
          <text x="855" y="375" fill="#0a4a72" fontSize={7.5}
            fontFamily="monospace" fontStyle="italic">GOLFO DI OMAN</text>

          {/* ── TERRITORI ─────────────────────────────────────────────────── */}
          {TERR_SVG.map(t => {
            const ts   = territories[t.id];
            const infl = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            const units = ts?.units ?? {};
            const ctrl = getController(infl as Record<Faction, number>);
            const isSel = selectedTerritory === t.id;
            const isHov = hovered === t.id;
            const hasFillInfl = FACTIONS.some(f => (infl[f] ?? 0) > 0);

            let totalUnits = 0;
            for (const um of Object.values(units))
              for (const q of Object.values(um ?? {})) totalUnits += q ?? 0;

            return (
              <g key={t.id}
                style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
                onClick={() => onSelectTerritory?.(t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {isSel && (
                  <path d={t.path} fill="none" stroke="#00ff88"
                    strokeWidth={10} opacity={0.18} filter="url(#glow)" />
                )}
                {isHov && !isSel && (
                  <path d={t.path} fill="none"
                    stroke={ctrl ? FC[ctrl] : '#ffffff'}
                    strokeWidth={6} opacity={0.12} filter="url(#glow2)" />
                )}

                {/* Corpo */}
                <path d={t.path}
                  fill={terrFill(ctrl, t.type, isSel)}
                  stroke={terrStroke(ctrl, t.type, isSel)}
                  strokeWidth={isSel ? 2.8 : t.type === 'casa' ? 2.2 : 1.4}
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.2s,stroke 0.2s', opacity: attackMode && !isSel ? 0.65 : 1 }}
                />

                {/* Indicatore casa */}
                {t.type === 'casa' && t.homeFaction && (
                  <circle cx={t.labelPos[0] + 22} cy={t.labelPos[1] - 9}
                    r={6} fill={FC[t.homeFaction]} opacity={0.92} />
                )}
                {/* Indicatore strategico */}
                {t.type === 'strategico' && (
                  <text x={t.labelPos[0] + 18} y={t.labelPos[1] - 3}
                    fontSize={12} style={{ pointerEvents: 'none' }}>⭐</text>
                )}

                {/* Nome territorio */}
                <text x={t.labelPos[0]} y={t.labelPos[1]}
                  textAnchor="middle"
                  fill={isSel ? '#00ff88' : isHov ? '#ffffff' : (ctrl ? FC[ctrl] : '#c8daf0')}
                  fontSize={t.labelSize ?? 10}
                  fontWeight={t.type === 'casa' || isSel ? 'bold' : '600'}
                  fontFamily="monospace" letterSpacing="1.5"
                  style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s' }}
                >
                  {t.label}
                </text>

                {/* PV badge */}
                {t.pvPerRound > 1 && (
                  <text x={t.labelPos[0]} y={t.labelPos[1] + 13}
                    textAnchor="middle"
                    fill={t.type === 'casa' ? '#f59e0b' : '#8b5cf6'}
                    fontSize={8} fontFamily="monospace" fontWeight="bold"
                    style={{ pointerEvents: 'none' }}>
                    {t.pvPerRound}PV
                  </text>
                )}

                {/* Cubi iniziali o influenze */}
                {!hasFillInfl
                  ? <InitialCubes count={t.initialCubes} anchor={t.cubeAnchor} />
                  : <InfluenceSquares influences={infl} anchor={t.cubeAnchor} />
                }

                {/* Badge unità */}
                {totalUnits > 0 && (
                  <g>
                    <circle cx={t.labelPos[0] + 30} cy={t.labelPos[1] - 8} r={9}
                      fill="#1e293b" stroke="#f59e0b" strokeWidth={1.5} />
                    <text x={t.labelPos[0] + 30} y={t.labelPos[1] - 4}
                      textAnchor="middle" fill="#f59e0b" fontSize={7.5}
                      fontWeight="bold" fontFamily="monospace"
                      style={{ pointerEvents: 'none' }}>
                      ⚔{totalUnits}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── CONNESSIONI NAVALI ─────────────────────────────────────────── */}
          {([
            [[690, 340], [760, 375]],  // Iran → Hormuz
            [[762, 380], [792, 392]],  // Hormuz → UAE
            [[762, 380], [825, 380]],  // Hormuz → Oman
            [[560, 348], [545, 375]],  // Kuwait → G.Persico
          ] as [number, number][][]).map(([a, b], i) => (
            <line key={i}
              x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
              stroke="#0d4a7a" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.6} />
          ))}

          {/* ── LEGENDA FAZIONI ───────────────────────────────────────────── */}
          <g transform="translate(16, 558)">
            <rect x={0} y={0} width={155} height={118} rx={8}
              fill="#060c18" stroke="#1e3a5f" strokeWidth={1} opacity={0.95} />
            <text x={8} y={17} fill="#94a3b8" fontSize={8}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">FAZIONI</text>
            {FACTIONS.map((f, i) => (
              <g key={f} transform={`translate(8,${28 + i * 17})`}>
                <rect x={0} y={-9} width={10} height={10} rx={2} fill={FC[f]} opacity={0.9} />
                <text x={15} y={0} fill={FC[f]} fontSize={8.5} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {/* ── LEGENDA CUBI ──────────────────────────────────────────────── */}
          <g transform="translate(180, 558)">
            <rect x={0} y={0} width={200} height={88} rx={8}
              fill="#060c18" stroke="#1e3a5f" strokeWidth={1} opacity={0.95} />
            <text x={8} y={17} fill="#94a3b8" fontSize={8}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">CUBI INFLUENZA</text>
            <rect x={8} y={25} width={10} height={10} rx={2}
              fill="#081420" stroke="#2a4060" strokeWidth={1.2} />
            <text x={22} y={35} fill="#4a6a8a" fontSize={8} fontFamily="monospace">
              □ = slot libero (regolamento)
            </text>
            {FACTIONS.slice(0, 3).map((f, i) => (
              <g key={f}>
                <rect x={8 + i * 62} y={44} width={10} height={10} rx={2} fill={FC[f]} opacity={0.9} />
                <text x={22 + i * 62} y={54} fill={FC[f]} fontSize={7.5} fontFamily="monospace">
                  {f.slice(0, 5)}.
                </text>
              </g>
            ))}
            <text x={8} y={75} fill="#3a6080" fontSize={7.5} fontFamily="monospace">
              ×N = numero slot disponibili
            </text>
          </g>

          {/* ── LEGENDA TERRITORIO ────────────────────────────────────────── */}
          <g transform="translate(390, 558)">
            <rect x={0} y={0} width={185} height={88} rx={8}
              fill="#060c18" stroke="#1e3a5f" strokeWidth={1} opacity={0.95} />
            <text x={8} y={17} fill="#94a3b8" fontSize={8}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">TIPO TERRITORIO</text>
            <circle cx={14} cy={32} r={6} fill="#ef4444" opacity={0.9} />
            <text x={24} y={37} fill="#94a3b8" fontSize={8} fontFamily="monospace">Casa (+3PV/round)</text>
            <text x={8} y={55} fill="#8b5cf6" fontSize={12}>⭐</text>
            <text x={24} y={57} fill="#94a3b8" fontSize={8} fontFamily="monospace">Strategico (+2PV)</text>
            <rect x={8} y={63} width={10} height={10} rx={2} fill="#091524" stroke="#1e3a5f" />
            <text x={24} y={73} fill="#94a3b8" fontSize={8} fontFamily="monospace">Normale (+1PV)</text>
          </g>

          {/* ── TITOLO ────────────────────────────────────────────────────── */}
          <text x={550} y={742} textAnchor="middle"
            fill="#1e4a7f" fontSize={9} fontFamily="monospace"
            fontWeight="bold" letterSpacing="3">
            TEATRO OPERATIVO — GOLFO PERSICO / MEDIO ORIENTE
          </text>

          {/* ── BARRA STATO ───────────────────────────────────────────────── */}
          {isMyTurn && (
            <g transform="translate(588, 14)">
              <rect x={0} y={0} width={495} height={26} rx={6}
                fill="#00ff8812" stroke="#00ff88" strokeWidth={1} />
              <text x={12} y={18} fill="#00ff88"
                fontSize={10} fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio per interagire
              </text>
            </g>
          )}
          {attackMode && (
            <g transform="translate(588, 44)">
              <rect x={0} y={0} width={495} height={26} rx={6}
                fill="#ef444412" stroke="#ef4444" strokeWidth={1} />
              <text x={12} y={18} fill="#ef4444"
                fontSize={10} fontFamily="monospace" fontWeight="bold">
                ⚔️ MODALITÀ ATTACCO — Seleziona il territorio bersaglio
              </text>
            </g>
          )}

          {/* ── TOOLTIP ───────────────────────────────────────────────────── */}
          {hovered && (() => {
            const t  = TERR_SVG.find(t => t.id === hovered)!;
            const ts = territories[hovered];
            const infl = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            return (
              <Tooltip terr={t} influences={infl}
                x={tooltipPos[0]} y={tooltipPos[1]} />
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

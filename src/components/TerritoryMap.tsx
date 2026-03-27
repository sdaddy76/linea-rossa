// =============================================
// LINEA ROSSA — Mappa SVG Vettoriale Realistica
// Regione: Golfo Persico / Medio Oriente
// Ogni territorio ha:
//   - Forma geografica semplificata (SVG path)
//   - Colore controllore
//   - Quadrati influenza per fazione
//   - Tooltip hover dettagliato
//   - Click per selezione
// ViewBox: 0 0 900 640
// Coordinate: lon 24-65°E → x, lat 11-43°N → y
// =============================================

import { useState } from 'react';
import type { Faction } from '@/types/game';
import { UNITS } from '@/lib/territoriesData';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { getController } from '@/lib/combatEngine';

// ── Colori fazione ────────────────────────────────────────────────────────
const FC: Record<Faction, string> = {
  Iran:       '#ef4444',
  Coalizione: '#3b82f6',
  Russia:     '#a855f7',
  Cina:       '#f59e0b',
  Europa:     '#10b981',
};
const FC_BG: Record<Faction, string> = {
  Iran:       '#ef444430',
  Coalizione: '#3b82f630',
  Russia:     '#a855f730',
  Cina:       '#f59e0b30',
  Europa:     '#10b98130',
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

// ── Definizione territory SVG paths ──────────────────────────────────────
// ViewBox 0 0 900 640 — origine top-left
// Lat/Lon → SVG: x=(lon-24)*21.95, y=(43-lat)*20
interface TerrSVG {
  id: TerritoryId;
  label: string;
  path: string;
  labelPos: [number, number];
  type: 'casa' | 'strategico' | 'normale';
  pvPerRound: number;
  isNaval?: boolean;
  homeFaction?: Faction;
  influenceAnchor: [number, number]; // dove disegnare i quadrati influenza
}

const TERR_SVG: TerrSVG[] = [
  // ── TURCHIA ──────────────────────────────────────────────────────────────
  {
    id: 'Turchia',
    label: 'Turchia',
    type: 'normale', pvPerRound: 1,
    path: 'M 45,10 L 448,10 L 448,55 L 400,72 L 335,88 L 258,96 L 185,88 L 112,72 L 45,55 Z',
    labelPos: [240, 52],
    influenceAnchor: [200, 65],
  },
  // ── SIRIA ─────────────────────────────────────────────────────────────────
  {
    id: 'Siria',
    label: 'Siria',
    type: 'normale', pvPerRound: 1,
    path: 'M 268,96 L 405,96 L 410,178 L 320,192 L 280,205 L 268,185 Z',
    labelPos: [334, 142],
    influenceAnchor: [290, 155],
  },
  // ── LIBANO ────────────────────────────────────────────────────────────────
  {
    id: 'Libano',
    label: 'Libano',
    type: 'normale', pvPerRound: 1,
    path: 'M 248,168 L 272,168 L 272,205 L 248,205 Z',
    labelPos: [218, 186],
    influenceAnchor: [249, 208],
  },
  // ── ISRAELE ───────────────────────────────────────────────────────────────
  {
    id: 'Israele',
    label: 'Israele',
    type: 'normale', pvPerRound: 1,
    path: 'M 235,205 L 255,205 L 258,228 L 250,272 L 238,272 L 232,228 Z',
    labelPos: [205, 236],
    influenceAnchor: [236, 275],
  },
  // ── GIORDANIA ─────────────────────────────────────────────────────────────
  {
    id: 'Giordania',
    label: 'Giordania',
    type: 'normale', pvPerRound: 1,
    path: 'M 258,205 L 322,205 L 322,295 L 258,295 Z',
    labelPos: [288, 248],
    influenceAnchor: [260, 298],
  },
  // ── EGITTO ────────────────────────────────────────────────────────────────
  {
    id: 'Egitto',
    label: 'Egitto',
    type: 'normale', pvPerRound: 1,
    // corpo rettangolare + penisola del Sinai
    path: 'M 22,250 L 198,250 L 228,205 L 248,205 L 258,250 L 258,295 L 248,295 L 248,440 L 22,440 Z',
    labelPos: [118, 355],
    influenceAnchor: [24, 252],
  },
  // ── IRAQ ──────────────────────────────────────────────────────────────────
  {
    id: 'Iraq',
    label: 'Iraq',
    type: 'normale', pvPerRound: 1,
    path: 'M 322,96 L 412,96 L 465,115 L 468,285 L 456,298 L 322,298 Z',
    labelPos: [388, 200],
    influenceAnchor: [324, 100],
  },
  // ── IRAN ──────────────────────────────────────────────────────────────────
  {
    id: 'Iran',
    label: 'Iran',
    type: 'casa', pvPerRound: 3, homeFaction: 'Iran', isNaval: true,
    path: 'M 460,68 L 560,60 L 640,65 L 710,85 L 755,115 L 800,140 L 812,205 L 800,295 L 755,338 L 695,358 L 638,355 L 595,335 L 555,305 L 522,285 L 468,285 L 465,115 Z',
    labelPos: [638, 205],
    influenceAnchor: [462, 70],
  },
  // ── KUWAIT ────────────────────────────────────────────────────────────────
  {
    id: 'Kuwait',
    label: 'Kuwait',
    type: 'normale', pvPerRound: 1,
    path: 'M 456,298 L 486,298 L 486,330 L 456,330 Z',
    labelPos: [471, 344],
    influenceAnchor: [456, 332],
  },
  // ── STRETTO DI HORMUZ ────────────────────────────────────────────────────
  {
    id: 'StrettoHormuz',
    label: 'Stretto di Hormuz',
    type: 'strategico', pvPerRound: 2, isNaval: true,
    // Zona navale tra Iran e UAE/Oman
    path: 'M 638,355 L 695,358 L 710,375 L 695,395 L 640,390 L 622,378 Z',
    labelPos: [666, 412],
    influenceAnchor: [622, 358],
  },
  // ── ARABIA SAUDITA ────────────────────────────────────────────────────────
  {
    id: 'ArabiaSaudita',
    label: 'Arabia Saudita',
    type: 'casa', pvPerRound: 3, homeFaction: 'Coalizione', isNaval: true,
    path: 'M 258,295 L 456,298 L 486,298 L 486,330 L 522,285 L 555,305 L 562,358 L 558,400 L 540,450 L 488,488 L 388,498 L 290,478 L 238,455 L 230,390 L 258,350 Z',
    labelPos: [380, 400],
    influenceAnchor: [260, 298],
  },
  // ── BAHRAIN ───────────────────────────────────────────────────────────────
  {
    id: 'Bahrain',
    label: 'Bahrain',
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: 'M 495,330 L 510,330 L 510,350 L 495,350 Z',
    labelPos: [502, 360],
    influenceAnchor: [495, 352],
  },
  // ── QATAR ─────────────────────────────────────────────────────────────────
  {
    id: 'Qatar',
    label: 'Qatar',
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: 'M 515,345 L 530,345 L 530,380 L 515,380 Z',
    labelPos: [538, 362],
    influenceAnchor: [515, 382],
  },
  // ── EMIRATI ARABI ────────────────────────────────────────────────────────
  {
    id: 'EmiratiArabi',
    label: 'Emirati Arabi',
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: 'M 562,358 L 638,355 L 640,390 L 562,395 Z',
    labelPos: [598, 382],
    influenceAnchor: [563, 360],
  },
  // ── OMAN ──────────────────────────────────────────────────────────────────
  {
    id: 'Oman',
    label: 'Oman',
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: 'M 640,390 L 695,395 L 755,338 L 800,295 L 838,370 L 845,460 L 800,530 L 720,545 L 640,530 L 600,490 L 588,455 L 588,412 Z',
    labelPos: [720, 458],
    influenceAnchor: [642, 392],
  },
  // ── YEMEN ─────────────────────────────────────────────────────────────────
  {
    id: 'Yemen',
    label: 'Yemen',
    type: 'normale', pvPerRound: 1, isNaval: true,
    path: 'M 238,455 L 540,450 L 588,455 L 600,490 L 520,530 L 390,542 L 252,518 Z',
    labelPos: [405, 492],
    influenceAnchor: [240, 458],
  },
];

// ── Colore fill del territorio ────────────────────────────────────────────
function terrFill(controller: Faction | null, type: TerrSVG['type'], isSelected: boolean): string {
  if (isSelected) return '#ffffff18';
  if (controller) return FC_BG[controller];
  if (type === 'casa') return '#0f2540';
  if (type === 'strategico') return '#1a2540';
  return '#0a1625';
}

function terrStroke(controller: Faction | null, type: TerrSVG['type'], isSelected: boolean): string {
  if (isSelected) return '#00ff88';
  if (controller) return FC[controller];
  if (type === 'strategico') return '#8b5cf6';
  return '#1e3a5f';
}

// ── Quadrati influenza ────────────────────────────────────────────────────
// Disegna fino a 5 quadrati colorati per fazione, impilati verticalmente
function InfluenceSquares({ influences, anchor }: {
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const rows: { faction: Faction; count: number }[] = [];
  for (const f of FACTIONS) {
    const n = influences[f] ?? 0;
    if (n > 0) rows.push({ faction: f, count: n });
  }
  if (rows.length === 0) return null;

  const SQ = 6; const GAP = 1.5; const ROW_H = 8;
  return (
    <g>
      {rows.map((row, ri) => {
        const y0 = anchor[1] + ri * ROW_H;
        return Array.from({ length: Math.min(row.count, 5) }).map((_, si) => (
          <rect key={`${row.faction}-${si}`}
            x={anchor[0] + si * (SQ + GAP)}
            y={y0}
            width={SQ} height={SQ}
            rx={1}
            fill={FC[row.faction]}
            opacity={0.85}
            stroke={FC[row.faction]}
            strokeWidth={0.5}
          />
        ));
      })}
    </g>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ terr, influences, allUnits, x, y }: {
  terr: TerrSVG;
  influences: Partial<Record<Faction, number>>;
  allUnits: Partial<Record<Faction, Partial<Record<UnitType, number>>>>;
  x: number; y: number;
}) {
  const controller = getController(influences as Record<Faction, number>);
  const hasUnits = Object.values(allUnits).some(um =>
    Object.values(um ?? {}).some(q => (q ?? 0) > 0)
  );

  const tx = Math.min(x + 8, 740);
  const ty = Math.max(y - 10, 5);

  return (
    <g>
      <rect x={tx - 4} y={ty - 4} width={210} height={hasUnits ? 145 : 115}
        rx={6} ry={6}
        fill="#0a0e1a" stroke="#1e3a5f" strokeWidth={1}
        filter="url(#shadow)" opacity={0.97}
      />
      {/* Nome */}
      <text x={tx + 4} y={ty + 12} fill="#00ff88" fontSize={9} fontWeight="bold" fontFamily="monospace">
        {terr.label}
      </text>
      {/* Tipo */}
      <text x={tx + 4} y={ty + 24} fill="#8899aa" fontSize={7} fontFamily="monospace">
        {terr.type === 'casa' ? '🏠 Territorio Casa' : terr.type === 'strategico' ? '⭐ Strategico' : '📍 Normale'}
        {'  •  '}{terr.pvPerRound} PV/round
        {terr.isNaval ? '  🚢' : ''}
      </text>
      {/* Controller */}
      <text x={tx + 4} y={ty + 36} fill={controller ? FC[controller] : '#4b5563'} fontSize={7.5} fontFamily="monospace">
        {controller ? `✅ ${controller}` : '⚪ Non controllato'}
      </text>
      {/* Linea separatrice */}
      <line x1={tx} y1={ty + 42} x2={tx + 202} y2={ty + 42} stroke="#1e3a5f" strokeWidth={0.8} />
      {/* Influenze */}
      <text x={tx + 4} y={ty + 52} fill="#94a3b8" fontSize={6.5} fontFamily="monospace" fontWeight="bold">
        INFLUENZE:
      </text>
      {FACTIONS.map((f, fi) => {
        const n = influences[f] ?? 0;
        if (n === 0) return null;
        return (
          <g key={f}>
            <text x={tx + 4} y={ty + 63 + fi * 10} fill={FC[f]} fontSize={7} fontFamily="monospace">
              {f}:
            </text>
            {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
              <rect key={i}
                x={tx + 65 + i * 8} y={ty + 55 + fi * 10}
                width={6} height={6} rx={1}
                fill={FC[f]} opacity={0.8}
              />
            ))}
            <text x={tx + 112} y={ty + 63 + fi * 10} fill="#4b5563" fontSize={6.5} fontFamily="monospace">
              {n}/5
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── Componente principale ─────────────────────────────────────────────────
export default function TerritoryMap({ territories, myFaction, isMyTurn, onSelectTerritory, selectedTerritory, attackMode }: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);
  const [tooltipPos, setTooltipPos] = useState<[number, number]>([0, 0]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 640 / rect.height;
    setTooltipPos([
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    ]);
  };

  return (
    <div className="relative w-full select-none" style={{ paddingBottom: '71.1%' }}>
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 900 640"
          className="w-full h-full"
          style={{ background: 'linear-gradient(160deg, #030a15 0%, #060e1e 100%)', borderRadius: 12 }}
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Ombra per tooltip */}
            <filter id="shadow" x="-5%" y="-5%" width="120%" height="130%">
              <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
            </filter>
            {/* Glow per territorio selezionato */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Tratteggio per territori navali */}
            <pattern id="naval" patternUnits="userSpaceOnUse" width="6" height="6">
              <line x1="0" y1="6" x2="6" y2="0" stroke="#1e3a5f" strokeWidth="0.5" />
            </pattern>
            {/* Griglia di sfondo */}
            <pattern id="grid" patternUnits="userSpaceOnUse" width="30" height="30">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0a1828" strokeWidth="0.4" />
            </pattern>
          </defs>

          {/* ── Sfondo griglia ──────────────────────────────────────────── */}
          <rect width="900" height="640" fill="url(#grid)" />

          {/* ── Corpi d'acqua ────────────────────────────────────────────── */}
          {/* Mar Mediterraneo */}
          <ellipse cx="120" cy="145" rx="115" ry="60"
            fill="#03243d" stroke="#0a3a5f" strokeWidth="0.8" opacity="0.8" />
          <text x="80" y="148" fill="#0d4a6e" fontSize="7" fontFamily="monospace" fontStyle="italic">
            MAR MEDITERRANEO
          </text>

          {/* Mar Rosso */}
          <path d="M 188,310 L 208,310 L 222,390 L 215,455 L 198,455 L 185,390 Z"
            fill="#03243d" stroke="#0a3a5f" strokeWidth="0.8" opacity="0.8" />
          <text x="155" y="385" fill="#0d4a6e" fontSize="6" fontFamily="monospace" fontStyle="italic"
            transform="rotate(-72, 188, 380)">
            MAR ROSSO
          </text>

          {/* Golfo Persico */}
          <path d="M 468,295 L 530,290 L 562,310 L 582,345 L 562,380 L 545,390 L 490,390 L 462,355 L 460,310 Z"
            fill="#03243d" stroke="#0a4a7a" strokeWidth="1" opacity="0.85" />
          <text x="488" y="348" fill="#0d5a7e" fontSize="6.5" fontFamily="monospace" fontStyle="italic">
            GOLFO PERSICO
          </text>

          {/* Mar d'Arabia / Oceano Indiano */}
          <path d="M 540,530 L 840,530 L 900,640 L 490,640 Z"
            fill="#03243d" stroke="#0a3a5f" strokeWidth="0.5" opacity="0.6" />
          <text x="660" y="590" fill="#0d4a6e" fontSize="7" fontFamily="monospace" fontStyle="italic">
            MAR D'ARABIA
          </text>

          {/* Mar Caspio (nord Iran) */}
          <ellipse cx="720" cy="68" rx="40" ry="22"
            fill="#03243d" stroke="#0a3a5f" strokeWidth="0.6" opacity="0.7" />
          <text x="692" y="72" fill="#0d4a6e" fontSize="5.5" fontFamily="monospace" fontStyle="italic">
            MAR CASPIO
          </text>

          {/* ── Territori ────────────────────────────────────────────────── */}
          {TERR_SVG.map(t => {
            const ts = territories[t.id];
            const influences = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            const allUnits = ts?.units ?? {};
            const controller = getController(influences as Record<Faction, number>);
            const isSelected = selectedTerritory === t.id;
            const isHovered = hovered === t.id;

            const fill   = terrFill(controller, t.type, isSelected);
            const stroke = terrStroke(controller, t.type, isSelected);
            const strokeW = isSelected ? 2.5 : t.type === 'casa' ? 1.8 : t.type === 'strategico' ? 1.5 : 1;

            return (
              <g key={t.id}
                style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
                onClick={() => onSelectTerritory?.(t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Alone glow per selezionato */}
                {isSelected && (
                  <path d={t.path}
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth={6}
                    opacity={0.25}
                    filter="url(#glow)"
                  />
                )}

                {/* Alone glow per hover */}
                {isHovered && !isSelected && (
                  <path d={t.path}
                    fill="none"
                    stroke={controller ? FC[controller] : '#ffffff'}
                    strokeWidth={4}
                    opacity={0.15}
                    filter="url(#glow)"
                  />
                )}

                {/* Corpo del territorio */}
                <path
                  d={t.path}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  strokeLinejoin="round"
                  className={attackMode && !isSelected ? '' : ''}
                  style={{
                    transition: 'fill 0.25s, stroke 0.25s',
                    opacity: attackMode && !isSelected ? 0.7 : 1,
                  }}
                />

                {/* Pattern navale (tratteggio) */}
                {t.isNaval && !controller && (
                  <path d={t.path}
                    fill="url(#naval)"
                    opacity={0.15}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Indicatore tipo casa / strategico */}
                {t.type === 'casa' && (
                  <circle cx={t.labelPos[0] - 14} cy={t.labelPos[1] - 6} r={4}
                    fill={t.homeFaction ? FC[t.homeFaction] : '#f59e0b'} opacity={0.85} />
                )}
                {t.type === 'strategico' && (
                  <polygon
                    points={`${t.labelPos[0] - 14},${t.labelPos[1] - 10} ${t.labelPos[0] - 10},${t.labelPos[1] - 3} ${t.labelPos[0] - 18},${t.labelPos[1] - 3}`}
                    fill="#8b5cf6" opacity={0.85}
                  />
                )}

                {/* Label territorio */}
                <text
                  x={t.labelPos[0]}
                  y={t.labelPos[1]}
                  textAnchor="middle"
                  fill={isSelected ? '#00ff88' : isHovered ? '#ffffff' : (controller ? FC[controller] : '#94a3b8')}
                  fontSize={t.type === 'casa' ? 8.5 : t.type === 'strategico' ? 7.5 : 7}
                  fontWeight={t.type === 'casa' || isSelected ? 'bold' : 'normal'}
                  fontFamily="monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s' }}
                >
                  {t.label}
                </text>

                {/* PV badge */}
                {t.pvPerRound > 1 && (
                  <text
                    x={t.labelPos[0]}
                    y={t.labelPos[1] + 9}
                    textAnchor="middle"
                    fill={t.type === 'casa' ? '#f59e0b' : '#8b5cf6'}
                    fontSize={6}
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {t.pvPerRound}PV
                  </text>
                )}

                {/* Quadrati influenza */}
                <InfluenceSquares
                  influences={influences}
                  anchor={t.influenceAnchor}
                />

                {/* Badge unità militari */}
                {(() => {
                  let total = 0;
                  for (const umap of Object.values(allUnits)) {
                    for (const q of Object.values(umap ?? {})) total += q ?? 0;
                  }
                  if (total === 0) return null;
                  return (
                    <g>
                      <circle cx={t.labelPos[0] + 22} cy={t.labelPos[1] - 8} r={7}
                        fill="#1e293b" stroke="#f59e0b" strokeWidth={1} />
                      <text x={t.labelPos[0] + 22} y={t.labelPos[1] - 5}
                        textAnchor="middle" fill="#f59e0b" fontSize={6.5} fontWeight="bold" fontFamily="monospace"
                        style={{ pointerEvents: 'none' }}>
                        ⚔{total}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* ── Connessioni navali (linee tratteggiate) ──────────────────── */}
          {[
            // Iran — Stretto Hormuz
            [[638, 335], [660, 365]] as [[number,number],[number,number]],
            // Stretto Hormuz — Emirati
            [[650, 370], [606, 370]] as [[number,number],[number,number]],
            // Stretto Hormuz — Oman
            [[668, 380], [680, 390]] as [[number,number],[number,number]],
            // Kuwait — Bahrain
            [[486, 315], [545, 342]] as [[number,number],[number,number]],
            // Bahrain — Qatar
            [[558, 342], [568, 360]] as [[number,number],[number,number]],
          ].map(([a, b], i) => (
            <line key={i}
              x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
              stroke="#0d4a7a" strokeWidth={1} strokeDasharray="3 3"
              opacity={0.5}
            />
          ))}

          {/* ── Legenda ──────────────────────────────────────────────────── */}
          <g transform="translate(12, 540)">
            <rect x={0} y={0} width={130} height={92} rx={6}
              fill="#060d1a" stroke="#1e3a5f" strokeWidth={1} opacity={0.92} />
            <text x={8} y={14} fill="#94a3b8" fontSize={6.5} fontFamily="monospace" fontWeight="bold">
              FAZIONI
            </text>
            {FACTIONS.map((f, i) => (
              <g key={f} transform={`translate(8, ${24 + i * 13})`}>
                <rect x={0} y={-6} width={8} height={8} rx={1}
                  fill={FC[f]} opacity={0.85} />
                <text x={12} y={1} fill={FC[f]} fontSize={7} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {/* ── Legenda tipo territorio ──────────────────────────────────── */}
          <g transform="translate(155, 540)">
            <rect x={0} y={0} width={130} height={68} rx={6}
              fill="#060d1a" stroke="#1e3a5f" strokeWidth={1} opacity={0.92} />
            <text x={8} y={14} fill="#94a3b8" fontSize={6.5} fontFamily="monospace" fontWeight="bold">
              TERRITORIO
            </text>
            <circle cx={12} cy={27} r={4} fill="#ef4444" opacity={0.85} />
            <text x={20} y={31} fill="#94a3b8" fontSize={7} fontFamily="monospace">Casa (+3 PV/round)</text>
            <polygon points="12,40 16,48 8,48" fill="#8b5cf6" opacity={0.85} />
            <text x={20} y={47} fill="#94a3b8" fontSize={7} fontFamily="monospace">Strategico (+2 PV)</text>
            <rect x={8} y={52} width={8} height={8} rx={1} fill="#3b82f6" opacity={0.85} />
            <text x={20} y={62} fill="#94a3b8" fontSize={7} fontFamily="monospace">= 1 quadrato influenza</text>
          </g>

          {/* ── Titolo mappa ─────────────────────────────────────────────── */}
          <g transform="translate(300, 620)">
            <text fill="#1e4a7f" fontSize={8} fontFamily="monospace" fontWeight="bold"
              letterSpacing="3" textAnchor="middle">
              🗺  TEATRO OPERATIVO — GOLFO PERSICO / MEDIO ORIENTE
            </text>
          </g>

          {/* ── Indicatore turno ─────────────────────────────────────────── */}
          {isMyTurn && (
            <g transform="translate(680, 12)">
              <rect x={0} y={0} width={210} height={22} rx={5}
                fill="#00ff8815" stroke="#00ff88" strokeWidth={1} />
              <text x={8} y={15} fill="#00ff88" fontSize={8.5} fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio
              </text>
            </g>
          )}

          {/* ── Attacco mode ─────────────────────────────────────────────── */}
          {attackMode && (
            <g transform="translate(680, 38)">
              <rect x={0} y={0} width={210} height={22} rx={5}
                fill="#ef444415" stroke="#ef4444" strokeWidth={1} />
              <text x={8} y={15} fill="#ef4444" fontSize={8.5} fontFamily="monospace" fontWeight="bold">
                ⚔️ SCEGLI TERRITORIO BERSAGLIO
              </text>
            </g>
          )}

          {/* ── Tooltip hover ────────────────────────────────────────────── */}
          {hovered && (() => {
            const t = TERR_SVG.find(t => t.id === hovered)!;
            const ts = territories[hovered];
            const influences = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            const allUnits = ts?.units ?? {};
            return (
              <Tooltip
                terr={t}
                influences={influences}
                allUnits={allUnits}
                x={tooltipPos[0]}
                y={tooltipPos[1]}
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

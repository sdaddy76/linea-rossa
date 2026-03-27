// =============================================
// LINEA ROSSA — Mappa Tattica con Plancia Realistica
// Sfondo: plancia_map.png | Overlay: aree cliccabili + cubi influenza
// ViewBox: 1920 x 1071  (coordinate calibrate sull'immagine originale)
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
  Iran:       '#ef444438',
  Coalizione: '#3b82f638',
  Russia:     '#a855f738',
  Cina:       '#f59e0b38',
  Europa:     '#10b98138',
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

// ─────────────────────────────────────────────────────────────────────────────
// Definizione territori — coordinate calibrate su immagine 1920×1071
// points:      poligono SVG cliccabile sovrapposto al territorio
// cubeAnchor:  punto di ancoraggio dove disegnare i cubi influenza
// ─────────────────────────────────────────────────────────────────────────────

interface TerrDef {
  id: TerritoryId;
  label: string;
  points: string;          // SVG polygon points
  cubeAnchor: [number, number];
  initialCubes: number;
  pvPerRound: number;
  type: 'casa' | 'strategico' | 'normale';
  homeFaction?: Faction;
  isNaval?: boolean;
}

const pts = (arr: [number,number][]): string => arr.map(([x,y]) => `${x},${y}`).join(' ');

const TERR_DEF: TerrDef[] = [
  {
    id: 'Turchia', label: 'TURCHIA',
    points: pts([[62,95],[395,70],[655,76],[800,100],[818,128],[800,200],[718,225],[510,242],[300,246],[115,206],[52,128]]),
    cubeAnchor: [115, 162], initialCubes: 4, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'Siria', label: 'SIRIA',
    points: pts([[530,242],[800,200],[835,172],[848,260],[845,302],[828,375],[758,394],[612,345],[535,265]]),
    cubeAnchor: [650, 260], initialCubes: 2, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'Libano', label: 'LIBANO',
    points: pts([[462,252],[528,252],[535,265],[520,282],[472,296],[448,270]]),
    cubeAnchor: [410, 295], initialCubes: 2, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'Israele', label: 'ISRAELE',
    points: pts([[430,252],[462,252],[528,312],[525,342],[505,425],[472,480],[438,490],[400,450],[402,305],[418,275]]),
    cubeAnchor: [345, 350], initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Coalizione',
  },
  {
    id: 'Giordania', label: 'GIORDANIA',
    points: pts([[528,252],[758,394],[730,428],[690,520],[632,545],[535,512],[402,450],[402,305],[528,312]]),
    cubeAnchor: [568, 442], initialCubes: 2, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'Egitto', label: 'EGITTO',
    points: pts([[35,268],[430,252],[418,275],[402,305],[402,450],[438,490],[415,515],[172,502],[35,452]]),
    cubeAnchor: [82, 392], initialCubes: 4, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'Iraq', label: 'IRAQ',
    points: pts([[800,200],[842,110],[922,108],[1010,138],[1075,232],[1075,272],[1055,342],[1010,380],[948,382],[862,345],[828,375],[758,394],[800,200]]),
    cubeAnchor: [920, 262], initialCubes: 3, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'Iran', label: 'IRAN',
    points: pts([[842,110],[1088,58],[1255,52],[1422,82],[1562,150],[1610,240],[1608,286],[1528,390],[1418,414],[1250,332],[1105,270],[1078,270],[1075,232],[1010,138],[922,108],[842,110]]),
    cubeAnchor: [1242, 218], initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Iran', isNaval: true,
  },
  {
    id: 'Kuwait', label: 'KUWAIT',
    points: pts([[1062,388],[1135,388],[1150,435],[1118,465],[1055,430],[1055,408]]),
    cubeAnchor: [1042, 470], initialCubes: 2, pvPerRound: 1, type: 'normale',
  },
  {
    id: 'ArabiaSaudita', label: 'ARABIA S.',
    points: pts([
      [402,450],[535,512],[632,545],[690,520],[730,428],[758,394],
      [828,375],[862,345],[948,382],[1010,380],[1055,342],[1075,272],[1078,270],
      [1105,270],[1150,435],[1118,465],[1055,430],[1155,475],[1145,502],
      [1105,522],[1048,550],[988,562],[928,552],[868,525],[808,495],
      [748,472],[688,470],[632,485],[578,510],[528,548],[494,595],
      [470,680],[468,740],[482,792],[542,838],[624,832],[668,798],
      [695,720],[688,664],[636,595],[558,555],[458,582],[438,675],
      [440,730],[460,782],[522,828],
    ]),
    cubeAnchor: [708, 622], initialCubes: 4, pvPerRound: 1, type: 'normale', isNaval: true,
  },
  {
    id: 'EmiratiArabi', label: 'UAE',
    points: pts([[1278,492],[1390,462],[1495,482],[1542,548],[1510,578],[1428,565],[1345,510],[1298,488]]),
    cubeAnchor: [1285, 590], initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
  },
  {
    id: 'Oman', label: 'OMAN',
    points: pts([[1352,468],[1495,482],[1542,548],[1580,672],[1515,762],[1425,752],[1340,655],[1335,595],[1365,492],[1352,468]]),
    cubeAnchor: [1440, 772], initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
  },
  {
    id: 'StrettoHormuz', label: 'HORMUZ',
    points: pts([[1228,420],[1278,418],[1318,450],[1302,484],[1260,490],[1218,464]]),
    cubeAnchor: [1168, 424], initialCubes: 0, pvPerRound: 2, type: 'strategico', isNaval: true,
  },
  {
    id: 'Yemen', label: 'YEMEN',
    points: pts([[655,692],[735,638],[832,618],[928,642],[978,682],[1005,768],[962,840],[880,860],[790,825],[712,756],[675,700]]),
    cubeAnchor: [788, 814], initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
  },
];

// ── Griglia cubi influenza ─────────────────────────────────────────────────
function CubeGrid({ initialCubes, influences, anchor }: {
  initialCubes: number;
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const C = 14; const G = 3; const PER_ROW = 3;
  const slots: Array<Faction | null> = [];
  for (const f of FACTIONS) for (let i = 0; i < (influences[f] ?? 0); i++) slots.push(f);
  const empty = Math.max(0, initialCubes - slots.length);
  for (let i = 0; i < empty; i++) slots.push(null);
  if (slots.length === 0) return null;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {slots.map((f, i) => {
        const col = i % PER_ROW; const row = Math.floor(i / PER_ROW);
        const x = anchor[0] + col * (C + G); const y = anchor[1] + row * (C + G);
        return (
          <rect key={i} x={x} y={y} width={C} height={C} rx={3}
            fill={f ? FC[f] : '#0a1628'}
            stroke={f ? '#000' : '#2a4060'}
            strokeWidth={f ? 0.8 : 1.2}
            opacity={f ? 0.92 : 0.72}
          />
        );
      })}
    </g>
  );
}

// ── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ terr, influences, x, y }: {
  terr: TerrDef;
  influences: Partial<Record<Faction, number>>;
  x: number; y: number;
}) {
  const controller = getController(influences as Record<Faction, number>);
  const rows = FACTIONS.filter(f => (influences[f] ?? 0) > 0);
  const W = 220; const H = 80 + rows.length * 16;
  const tx = Math.min(x + 18, 1680); const ty = Math.max(y - 10, 5);

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx - 5} y={ty - 5} width={W} height={H} rx={9}
        fill="#060d18" stroke="#1e3a5f" strokeWidth={1.5} opacity={0.97} />
      <text x={tx + 8} y={ty + 18} fill="#00ff88" fontSize={14}
        fontWeight="bold" fontFamily="monospace">{terr.label}</text>
      <text x={tx + 8} y={ty + 33} fill="#6b7a8d" fontSize={9} fontFamily="monospace">
        {terr.type === 'casa' ? `🏠 Casa (${terr.homeFaction})` :
         terr.type === 'strategico' ? '⭐ Strategico' : '📍 Normale'}
        {' · '}{terr.pvPerRound}PV/round{terr.isNaval ? ' 🚢' : ''}
      </text>
      <text x={tx + 8} y={ty + 47} fill="#3a6080" fontSize={8} fontFamily="monospace">
        Slot influenza: {terr.initialCubes}
      </text>
      <rect x={tx + 4} y={ty + 52} width={W - 12} height={16} rx={4}
        fill={controller ? FC_BG[controller] : '#ffffff08'} />
      <text x={tx + 10} y={ty + 63} fill={controller ? FC[controller] : '#4b5563'}
        fontSize={9} fontFamily="monospace">
        {controller ? `✅ Controllato: ${controller}` : '⚪ Non controllato'}
      </text>
      {rows.map((f, ri) => (
        <g key={f}>
          <text x={tx + 10} y={ty + 80 + ri * 16} fill={FC[f]}
            fontSize={9} fontFamily="monospace">{f}</text>
          {Array.from({ length: Math.min(influences[f] ?? 0, 6) }).map((_, si) => (
            <rect key={si} x={tx + 90 + si * 13} y={ty + 70 + ri * 16}
              width={11} height={11} rx={2} fill={FC[f]} opacity={0.88} />
          ))}
        </g>
      ))}
    </g>
  );
}

// ── Componente principale ──────────────────────────────────────────────────
export default function TerritoryMap({
  territories, myFaction, isMyTurn,
  onSelectTerritory, selectedTerritory, attackMode,
}: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);
  const [tooltipPos, setTooltipPos] = useState<[number,number]>([0,0]);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTooltipPos([
      (e.clientX - r.left) * (1920 / r.width),
      (e.clientY - r.top)  * (1071 / r.height),
    ]);
  };

  return (
    <div className="relative w-full select-none" style={{ paddingBottom: '55.8%' }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl">
        <svg
          viewBox="0 0 1920 1071"
          className="w-full h-full"
          style={{ display: 'block' }}
          onMouseMove={onMouseMove}
        >
          {/* ── SFONDO: plancia realistica ─────────────────────────── */}
          <image
            href="/plancia_map.png"
            x={0} y={0} width={1920} height={1071}
            preserveAspectRatio="xMidYMid slice"
          />

          {/* ── TERRITORI ─────────────────────────────────────────── */}
          {TERR_DEF.map(t => {
            const ts    = territories[t.id];
            const infl  = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            const units = ts?.units ?? {};
            const ctrl  = getController(infl as Record<Faction, number>);
            const isSel = selectedTerritory === t.id;
            const isHov = hovered === t.id;

            let totalUnits = 0;
            for (const um of Object.values(units))
              for (const q of Object.values(um ?? {})) totalUnits += q ?? 0;

            // colore fill/stroke: usa FC del controller se presente
            const fillColor  = ctrl ? FC_BG[ctrl] : (isHov ? '#ffffff12' : 'transparent');
            const strokeColor = isSel ? '#00ff88' : ctrl ? FC[ctrl] : (isHov ? '#ffffff55' : 'transparent');

            return (
              <g key={t.id}
                style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
                onClick={() => onSelectTerritory?.(t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Area cliccabile con highlight */}
                <polygon
                  points={t.points}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSel ? 3 : 2}
                  strokeLinejoin="round"
                  opacity={attackMode && !isSel ? 0.45 : 1}
                />

                {/* Glow selezione */}
                {isSel && (
                  <polygon
                    points={t.points}
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth={8}
                    opacity={0.18}
                    style={{ filter: 'blur(5px)' }}
                  />
                )}

                {/* Badge territorio casa */}
                {t.type === 'casa' && t.homeFaction && (
                  <circle
                    cx={t.cubeAnchor[0] - 18}
                    cy={t.cubeAnchor[1] - 18}
                    r={9}
                    fill={FC[t.homeFaction]}
                    opacity={0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Cubi influenza */}
                <CubeGrid
                  initialCubes={t.initialCubes}
                  influences={infl}
                  anchor={t.cubeAnchor}
                />

                {/* Badge unità militari */}
                {totalUnits > 0 && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle cx={t.cubeAnchor[0] + 48} cy={t.cubeAnchor[1] - 5} r={11}
                      fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
                    <text x={t.cubeAnchor[0] + 48} y={t.cubeAnchor[1]}
                      textAnchor="middle" fill="#f59e0b"
                      fontSize={10} fontWeight="bold" fontFamily="monospace">
                      {totalUnits}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── BANNER TURNO ──────────────────────────────────────── */}
          {isMyTurn && (
            <g transform="translate(420,14)">
              <rect x={0} y={0} width={620} height={30} rx={7}
                fill="#00ff8818" stroke="#00ff88" strokeWidth={1.2} />
              <text x={16} y={21} fill="#00ff88" fontSize={12}
                fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio per interagire
              </text>
            </g>
          )}
          {attackMode && (
            <g transform="translate(420,50)">
              <rect x={0} y={0} width={620} height={30} rx={7}
                fill="#ef444418" stroke="#ef4444" strokeWidth={1.2} />
              <text x={16} y={21} fill="#ef4444" fontSize={12}
                fontFamily="monospace" fontWeight="bold">
                ⚔️ MODALITÀ ATTACCO — Seleziona il territorio bersaglio
              </text>
            </g>
          )}

          {/* ── LEGENDA FAZIONI ──────────────────────────────────── */}
          <g transform="translate(18,870)">
            <rect x={0} y={0} width={152} height={118} rx={8}
              fill="#060d18dd" stroke="#1e3a5f" strokeWidth={1.2} />
            <text x={10} y={17} fill="#94a3b8" fontSize={9}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">INFLUENZE</text>
            {FACTIONS.map((f, i) => (
              <g key={f} transform={`translate(10,${26 + i * 18})`}>
                <rect x={0} y={-11} width={12} height={12} rx={2.5}
                  fill={FC[f]} opacity={0.9} />
                <text x={17} y={0} fill={FC[f]}
                  fontSize={9} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {/* ── TOOLTIP ──────────────────────────────────────────── */}
          {hovered && (() => {
            const t   = TERR_DEF.find(d => d.id === hovered)!;
            const ts  = territories[hovered];
            const infl = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            return <Tooltip terr={t} influences={infl} x={tooltipPos[0]} y={tooltipPos[1]} />;
          })()}
        </svg>
      </div>
    </div>
  );
}

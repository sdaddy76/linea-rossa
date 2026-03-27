// =============================================
// LINEA ROSSA — Mappa con Plancia Realistica
// Sfondo: immagine plancia + overlay SVG interattivo
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
  Iran:       '#ef444440',
  Coalizione: '#3b82f640',
  Russia:     '#a855f740',
  Cina:       '#f59e0b40',
  Europa:     '#10b98140',
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
// MAPPA: ViewBox 1376 x 768 (metà della risoluzione originale 2752x1536)
// Ogni territorio ha:
//   - hitPath: poligono SVG trasparente cliccabile
//   - labelPos: posizione del nome (non mostrato — già visibile sull'immagine)
//   - cubeAnchor: dove disegnare i quadratini influenza
//   - initialCubes: slot totali disponibili (regolamento)
// ─────────────────────────────────────────────────────────────────────────────

interface TerrDef {
  id: TerritoryId;
  label: string;
  hitPath: string;
  cubeAnchor: [number, number];
  initialCubes: number;
  pvPerRound: number;
  type: 'casa' | 'strategico' | 'normale';
  homeFaction?: Faction;
  isNaval?: boolean;
}

const TERR_DEF: TerrDef[] = [
  {
    id: 'Turchia', label: 'TURCHIA', initialCubes: 4, pvPerRound: 1, type: 'normale',
    hitPath: 'M 42,72 L 460,58 L 468,72 L 420,108 L 350,122 L 268,126 L 185,118 L 115,108 L 58,90 Z',
    cubeAnchor: [58, 130],
  },
  {
    id: 'Siria', label: 'SIRIA', initialCubes: 2, pvPerRound: 1, type: 'normale',
    hitPath: 'M 298,126 L 435,122 L 445,135 L 448,205 L 415,222 L 370,228 L 332,225 L 308,212 L 300,168 Z',
    cubeAnchor: [330, 205],
  },
  {
    id: 'Libano', label: 'LIBANO', initialCubes: 2, pvPerRound: 1, type: 'normale',
    hitPath: 'M 272,175 L 300,175 L 300,225 L 272,228 Z',
    cubeAnchor: [218, 198],
  },
  {
    id: 'Israele', label: 'ISRAELE', initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Coalizione',
    hitPath: 'M 258,228 L 278,228 L 282,248 L 284,285 L 278,318 L 265,322 L 252,318 L 245,285 L 242,252 Z',
    cubeAnchor: [195, 265],
  },
  {
    id: 'Giordania', label: 'GIORDANIA', initialCubes: 2, pvPerRound: 1, type: 'normale',
    hitPath: 'M 282,228 L 370,228 L 382,242 L 385,325 L 345,332 L 302,328 L 278,322 L 278,318 L 284,285 L 282,248 Z',
    cubeAnchor: [298, 328],
  },
  {
    id: 'Egitto', label: 'EGITTO', initialCubes: 4, pvPerRound: 1, type: 'normale',
    hitPath: 'M 18,285 L 202,285 L 238,228 L 258,228 L 242,252 L 245,285 L 252,318 L 258,328 L 252,358 L 245,392 L 248,438 L 225,478 L 182,488 L 102,488 L 18,472 Z',
    cubeAnchor: [22, 358],
  },
  {
    id: 'Iraq', label: 'IRAQ', initialCubes: 3, pvPerRound: 1, type: 'normale',
    hitPath: 'M 375,122 L 508,118 L 518,132 L 525,158 L 558,175 L 572,202 L 572,272 L 558,295 L 548,338 L 495,345 L 422,352 L 382,332 L 382,248 Z',
    cubeAnchor: [460, 298],
  },
  {
    id: 'Iran', label: 'IRAN', initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Iran', isNaval: true,
    hitPath: 'M 508,72 L 572,62 L 645,65 L 705,75 L 758,88 L 808,108 L 855,135 L 892,165 L 912,202 L 918,245 L 908,298 L 888,342 L 858,372 L 822,392 L 778,398 L 738,392 L 698,375 L 668,355 L 645,332 L 622,308 L 595,292 L 568,288 L 548,288 L 558,272 L 572,245 L 572,202 L 558,175 L 525,158 L 518,132 L 508,108 L 505,88 Z',
    cubeAnchor: [718, 245],
  },
  {
    id: 'Kuwait', label: 'KUWAIT', initialCubes: 2, pvPerRound: 1, type: 'normale',
    hitPath: 'M 548,335 L 598,330 L 605,350 L 598,368 L 565,370 L 548,360 Z',
    cubeAnchor: [548, 372],
  },
  {
    id: 'ArabiaSaudita', label: 'ARABIA SAUDITA', initialCubes: 4, pvPerRound: 1, type: 'normale', isNaval: true,
    hitPath: 'M 252,355 L 382,345 L 422,352 L 495,345 L 548,360 L 598,368 L 632,368 L 658,378 L 678,402 L 678,448 L 660,488 L 632,518 L 588,548 L 528,562 L 462,565 L 398,552 L 338,528 L 292,505 L 265,478 L 248,448 L 252,412 L 248,392 Z',
    cubeAnchor: [432, 515],
  },
  {
    id: 'EmiratiArabi', label: 'EMIRATI A.U.', initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
    hitPath: 'M 678,375 L 738,378 L 765,392 L 778,408 L 775,432 L 758,445 L 732,452 L 705,448 L 682,435 L 678,418 Z',
    cubeAnchor: [682, 455],
  },
  {
    id: 'Oman', label: 'OMAN', initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
    hitPath: 'M 778,405 L 822,392 L 858,372 L 895,382 L 922,415 L 938,458 L 942,505 L 922,555 L 890,582 L 848,595 L 808,590 L 768,572 L 742,545 L 728,512 L 722,478 L 728,452 L 740,442 L 758,445 L 775,432 Z',
    cubeAnchor: [835, 498],
  },
  {
    id: 'StrettoHormuz', label: 'HORMUZ', initialCubes: 0, pvPerRound: 2, type: 'strategico', isNaval: true,
    hitPath: 'M 738,388 L 778,392 L 778,405 L 765,392 L 740,382 Z',
    cubeAnchor: [695, 378],
  },
];

// ── Cubi influenza ─────────────────────────────────────────────────────────
function CubeGrid({
  initialCubes,
  influences,
  anchor,
}: {
  initialCubes: number;
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const C = 11; const G = 3; const PER_ROW = 3;
  const hasInfl = FACTIONS.some(f => (influences[f] ?? 0) > 0);

  if (!hasInfl && initialCubes === 0) return null;

  // Costruisci lista slot: per ogni fazione che ha influenza mostra cubi colorati,
  // i rimanenti come slot grigi vuoti
  const filledSlots: Array<{ faction: Faction | null }> = [];
  for (const f of FACTIONS) {
    const n = influences[f] ?? 0;
    for (let i = 0; i < n; i++) filledSlots.push({ faction: f });
  }
  const emptyCount = Math.max(0, initialCubes - filledSlots.length);
  for (let i = 0; i < emptyCount; i++) filledSlots.push({ faction: null });

  return (
    <g>
      {filledSlots.map((slot, i) => {
        const col = i % PER_ROW;
        const row = Math.floor(i / PER_ROW);
        const x = anchor[0] + col * (C + G);
        const y = anchor[1] + row * (C + G);
        return (
          <rect key={i}
            x={x} y={y} width={C} height={C} rx={2}
            fill={slot.faction ? FC[slot.faction] : '#0a1628'}
            stroke={slot.faction ? '#000' : '#2a4060'}
            strokeWidth={slot.faction ? 0.5 : 1}
            opacity={slot.faction ? 0.92 : 0.75}
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
  const W = 210; const H = 75 + rows.length * 14;
  const tx = Math.min(x + 14, 1150); const ty = Math.max(y - 10, 5);

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx - 4} y={ty - 4} width={W} height={H} rx={8}
        fill="#060d18" stroke="#1e3a5f" strokeWidth={1.2} opacity={0.97} />
      <text x={tx + 7} y={ty + 16} fill="#00ff88" fontSize={12}
        fontWeight="bold" fontFamily="monospace">{terr.label}</text>
      <text x={tx + 7} y={ty + 29} fill="#6b7a8d" fontSize={7.5} fontFamily="monospace">
        {terr.type === 'casa' ? `🏠 Territorio Casa (${terr.homeFaction})` :
         terr.type === 'strategico' ? '⭐ Strategico' : '📍 Normale'}
        {' · '}{terr.pvPerRound}PV/round{terr.isNaval ? ' 🚢' : ''}
      </text>
      <text x={tx + 7} y={ty + 42} fill="#3a6080" fontSize={7} fontFamily="monospace">
        Slot influenza: {terr.initialCubes}
      </text>
      <rect x={tx + 3} y={ty + 46} width={W - 10} height={14} rx={3}
        fill={controller ? FC_BG[controller] : '#ffffff08'} />
      <text x={tx + 9} y={ty + 56} fill={controller ? FC[controller] : '#4b5563'}
        fontSize={8} fontFamily="monospace">
        {controller ? `✅ ${controller}` : '⚪ Non controllato'}
      </text>
      {rows.map((f, ri) => (
        <g key={f}>
          <text x={tx + 9} y={ty + 70 + ri * 14} fill={FC[f]}
            fontSize={8} fontFamily="monospace">{f}</text>
          {Array.from({ length: Math.min(influences[f] ?? 0, 6) }).map((_, si) => (
            <rect key={si}
              x={tx + 80 + si * 11} y={ty + 62 + ri * 14}
              width={9} height={9} rx={1.5}
              fill={FC[f]} opacity={0.88} />
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
  const [tooltipPos, setTooltipPos] = useState<[number, number]>([0, 0]);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTooltipPos([
      (e.clientX - r.left) * (1376 / r.width),
      (e.clientY - r.top)  * (768  / r.height),
    ]);
  };

  return (
    <div className="relative w-full select-none" style={{ paddingBottom: '55.8%' }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <svg
          viewBox="0 0 1376 768"
          className="w-full h-full"
          style={{ display: 'block' }}
          onMouseMove={onMouseMove}
        >
          {/* ── SFONDO: immagine plancia ───────────────────────────────── */}
          <image
            href="/plancia_map.png"
            x={0} y={0}
            width={1376} height={768}
            preserveAspectRatio="xMidYMid slice"
          />

          {/* ── OVERLAY SCURO per leggibilità cubi ────────────────────── */}
          <rect width={1376} height={768} fill="transparent" />

          {/* ── TERRITORI ─────────────────────────────────────────────── */}
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

            return (
              <g key={t.id}
                style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
                onClick={() => onSelectTerritory?.(t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Area cliccabile trasparente */}
                <path
                  d={t.hitPath}
                  fill={
                    isSel ? (ctrl ? FC_BG[ctrl] : '#ffffff18') :
                    isHov ? (ctrl ? FC_BG[ctrl] : '#ffffff10') :
                    ctrl  ? FC_BG[ctrl] : 'transparent'
                  }
                  stroke={
                    isSel ? '#00ff88' :
                    isHov ? (ctrl ? FC[ctrl] : '#ffffff55') :
                    ctrl  ? FC[ctrl] : 'transparent'
                  }
                  strokeWidth={isSel ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  opacity={attackMode && !isSel ? 0.5 : 1}
                />

                {/* Glow selezione */}
                {isSel && (
                  <path d={t.hitPath} fill="none"
                    stroke="#00ff88" strokeWidth={6} opacity={0.2}
                    style={{ filter: 'blur(4px)' }} />
                )}

                {/* Icona casa/strategico */}
                {t.type === 'casa' && t.homeFaction && (
                  <circle
                    cx={t.cubeAnchor[0] - 14}
                    cy={t.cubeAnchor[1] - 14}
                    r={7} fill={FC[t.homeFaction]} opacity={0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Cubi influenza */}
                <CubeGrid
                  initialCubes={t.initialCubes}
                  influences={infl}
                  anchor={t.cubeAnchor}
                />

                {/* Badge unità */}
                {totalUnits > 0 && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle
                      cx={t.cubeAnchor[0] + 38}
                      cy={t.cubeAnchor[1] - 4}
                      r={9} fill="#1e293b" stroke="#f59e0b" strokeWidth={1.5}
                    />
                    <text
                      x={t.cubeAnchor[0] + 38}
                      y={t.cubeAnchor[1]}
                      textAnchor="middle" fill="#f59e0b"
                      fontSize={8} fontWeight="bold" fontFamily="monospace"
                    >
                      {totalUnits}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── BARRE STATO ───────────────────────────────────────────── */}
          {isMyTurn && (
            <g transform="translate(380, 10)">
              <rect x={0} y={0} width={615} height={26} rx={6}
                fill="#00ff8815" stroke="#00ff88" strokeWidth={1} />
              <text x={14} y={18} fill="#00ff88"
                fontSize={10} fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio per interagire
              </text>
            </g>
          )}
          {attackMode && (
            <g transform="translate(380, 40)">
              <rect x={0} y={0} width={615} height={26} rx={6}
                fill="#ef444415" stroke="#ef4444" strokeWidth={1} />
              <text x={14} y={18} fill="#ef4444"
                fontSize={10} fontFamily="monospace" fontWeight="bold">
                ⚔️ MODALITÀ ATTACCO — Seleziona il territorio bersaglio
              </text>
            </g>
          )}

          {/* ── LEGENDA FAZIONI (angolo in basso a sinistra, sopra l'immagine) ── */}
          <g transform="translate(12, 600)">
            <rect x={0} y={0} width={145} height={108} rx={7}
              fill="#060d18cc" stroke="#1e3a5f" strokeWidth={1} />
            <text x={8} y={16} fill="#94a3b8" fontSize={8}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">INFLUENZE</text>
            {FACTIONS.map((f, i) => (
              <g key={f} transform={`translate(8,${25 + i * 16})`}>
                <rect x={0} y={-9} width={10} height={10} rx={2}
                  fill={FC[f]} opacity={0.9} />
                <text x={15} y={0} fill={FC[f]}
                  fontSize={8.5} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {/* ── TOOLTIP ───────────────────────────────────────────────── */}
          {hovered && (() => {
            const t   = TERR_DEF.find(t => t.id === hovered)!;
            const ts  = territories[hovered];
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

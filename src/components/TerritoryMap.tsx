// =============================================
// LINEA ROSSA — TerritoryMap (coordinate calibrate su pixel reali)
// ViewBox 1920×1071
// cubeAnchor = misurato campionando pixel interni al territorio
// =============================================

import { useState } from 'react';
import type { Faction } from '@/types/game';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { getController } from '@/lib/combatEngine';

const FC: Record<Faction, string> = {
  Iran: '#ef4444', Coalizione: '#3b82f6', Russia: '#a855f7',
  Cina: '#f59e0b', Europa: '#10b981',
};
const FC_BG: Record<Faction, string> = {
  Iran: '#ef444435', Coalizione: '#3b82f635', Russia: '#a855f735',
  Cina: '#f59e0b35', Europa: '#10b98135',
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

// ── Helpers ───────────────────────────────────────────────────────────────
const p = (arr: [number, number][]) => arr.map(([x, y]) => `${x},${y}`).join(' ');

// ─────────────────────────────────────────────────────────────────────────
// DEFINIZIONE TERRITORI
// pts:        poligono cliccabile SVG (coord pixel 1920×1071)
// cubeAnchor: posizione cubi influenza — misurata campionando pixel reali
//             all'interno del territorio (temperatura 0, no stima)
// ─────────────────────────────────────────────────────────────────────────
interface TerrDef {
  id: TerritoryId;
  label: string;
  pts: [number, number][];
  cubeAnchor: [number, number]; // pixel reali del centro visivo del territorio
  initialCubes: number;
  pvPerRound: number;
  type: 'casa' | 'strategico' | 'normale';
  homeFaction?: Faction;
  isNaval?: boolean;
}

const TERR_DEF: TerrDef[] = [

  // ── TURCHIA ─────────────────────────────────────────────────────────────
  // Penisola arancio in alto, x≈60-700, y≈75-235
  {
    id: 'Turchia', label: 'TURCHIA',
    pts: [[60,120],[155,78],[500,75],[700,78],[700,235],
          [500,242],[285,248],[120,228],[60,188]],
    cubeAnchor: [350, 130],   // ← pixel campionato: RGB(133,83,29) ✓
    initialCubes: 4, pvPerRound: 1, type: 'normale',
  },

  // ── SIRIA ────────────────────────────────────────────────────────────────
  // Area blu sotto Turchia, x≈440-640, y≈235-390
  {
    id: 'Siria', label: 'SIRIA',
    pts: [[440,235],[640,235],[640,390],[440,390]],
    cubeAnchor: [530, 296],   // ← pixel campionato: RGB(81,86,73) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale',
  },

  // ── LIBANO ───────────────────────────────────────────────────────────────
  // Piccola striscia costiera
  {
    id: 'Libano', label: 'LIBANO',
    pts: [[430,255],[505,248],[528,268],[518,285],[470,298],[445,275]],
    cubeAnchor: [476, 276],   // ← pixel campionato: RGB(98,76,40) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale',
  },

  // ── ISRAELE ──────────────────────────────────────────────────────────────
  // Striscia costiera stretta
  {
    id: 'Israele', label: 'ISRAELE',
    pts: [[396,255],[430,255],[505,298],[500,390],
          [455,488],[430,488],[405,470],[396,445]],
    cubeAnchor: [443, 388],   // ← pixel campionato: RGB(78,86,65) ✓
    initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Coalizione',
  },

  // ── GIORDANIA ────────────────────────────────────────────────────────────
  // Sotto Siria, tra Israele e Iraq
  {
    id: 'Giordania', label: 'GIORDANIA',
    pts: [[440,235],[640,390],[720,390],[758,432],
          [738,468],[718,502],[695,525],[665,545],
          [632,548],[598,540],[565,526],[532,510],
          [502,492],[455,488],[500,390],[440,390]],
    cubeAnchor: [565, 430],   // ← pixel campionato: RGB(158,152,124) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale',
  },

  // ── EGITTO ───────────────────────────────────────────────────────────────
  // Grande territorio a sinistra
  {
    id: 'Egitto', label: 'EGITTO',
    pts: [[58,268],[396,255],[396,445],[405,470],
          [430,488],[408,512],[365,528],[305,532],
          [220,520],[130,495],[58,470]],
    cubeAnchor: [180, 426],   // ← pixel campionato: RGB(20,41,30) ✓
    initialCubes: 4, pvPerRound: 1, type: 'normale',
  },

  // ── IRAQ ─────────────────────────────────────────────────────────────────
  // L-shape: a destra di Turchia (nord) e a destra di Siria (sud)
  // x=700-975 in alto, x=640-975 in basso
  {
    id: 'Iraq', label: 'IRAQ',
    pts: [[700,75],[975,75],[975,390],[640,390],[640,235],[700,235]],
    cubeAnchor: [810, 280],   // ← pixel campionato: RGB(172,115,57) ✓
    initialCubes: 3, pvPerRound: 1, type: 'normale',
  },

  // ── IRAN ─────────────────────────────────────────────────────────────────
  // Grande territorio a destra, x≈975-1600, y≈60-415
  {
    id: 'Iran', label: 'IRAN',
    pts: [[975,75],[1600,60],[1600,415],
          [1345,415],[1158,378],[1055,348],[975,348]],
    cubeAnchor: [1150, 226],  // ← pixel campionato: RGB(54,80,61) ✓
    initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Iran', isNaval: true,
  },

  // ── KUWAIT ───────────────────────────────────────────────────────────────
  // Piccolo al Golfo, x≈720-805, y≈408-472
  {
    id: 'Kuwait', label: 'KUWAIT',
    pts: [[720,408],[805,408],[812,430],[808,458],
          [788,472],[762,472],[738,460],[722,438]],
    cubeAnchor: [762, 458],   // ← pixel campionato: RGB(183,132,79) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale',
  },

  // ── ARABIA SAUDITA ───────────────────────────────────────────────────────
  // Grande penisola arabica, sotto Giordania/Iraq/Kuwait
  {
    id: 'ArabiaSaudita', label: 'ARABIA S.',
    pts: [
      [396,445],[532,510],[565,526],[598,540],[632,548],
      [665,545],[695,525],[718,502],[738,468],[758,432],
      [720,390],[975,390],[1005,450],[1005,555],
      [958,548],[858,512],[758,478],[658,472],
      [558,500],[462,558],[445,652],[445,748],
      [478,800],[555,840],[642,826],[680,752],
      [670,658],[615,630],[528,618],[452,648],
      [432,718],[450,792],[508,830],[555,840],
    ],
    cubeAnchor: [640, 586],   // ← pixel campionato: RGB(77,80,39) ✓
    initialCubes: 4, pvPerRound: 1, type: 'normale', isNaval: true,
  },

  // ── EMIRATI ARABI (UAE) ──────────────────────────────────────────────────
  // Costa est della penisola, x≈820-975, y≈488-580
  {
    id: 'EmiratiArabi', label: 'UAE',
    pts: [[820,488],[945,465],[978,502],[975,555],
          [942,580],[878,578],[825,545],[820,510]],
    cubeAnchor: [874, 530],   // ← pixel campionato: RGB(192,135,78) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
  },

  // ── OMAN ─────────────────────────────────────────────────────────────────
  // Estremo est, x≈900-1105, y≈468-768
  {
    id: 'Oman', label: 'OMAN',
    pts: [[900,468],[1105,468],[1105,768],
          [958,762],[878,680],[862,578],[895,505]],
    cubeAnchor: [957, 632],   // ← pixel campionato: RGB(76,77,40) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
  },

  // ── STRETTO DI HORMUZ ────────────────────────────────────────────────────
  // Piccolo e strategico, x≈972-1068, y≈448-492
  {
    id: 'StrettoHormuz', label: 'HORMUZ',
    pts: [[972,448],[1068,446],[1072,478],[1058,492],
          [988,490],[968,472]],
    cubeAnchor: [1020, 466],  // ← pixel campionato: RGB(32,33,15) ✓
    initialCubes: 0, pvPerRound: 2, type: 'strategico', isNaval: true,
  },

  // ── YEMEN ────────────────────────────────────────────────────────────────
  // In basso al centro
  {
    id: 'Yemen', label: 'YEMEN',
    pts: [[608,692],[688,638],[788,618],[882,640],
          [932,682],[958,772],[915,842],[832,862],
          [742,825],[665,755],[625,700]],
    cubeAnchor: [770, 725],   // ← pixel campionato: RGB(71,73,38) ✓
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true,
  },
];

// ── Griglia cubi influenza — centrata sul cubeAnchor ─────────────────────
function CubeGrid({ initialCubes, influences, anchor }: {
  initialCubes: number;
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const C = 18; const G = 4; const PER_ROW = 3;
  const slots: Array<Faction | null> = [];
  for (const f of FACTIONS) for (let i = 0; i < (influences[f] ?? 0); i++) slots.push(f);
  const empty = Math.max(0, initialCubes - slots.length);
  for (let i = 0; i < empty; i++) slots.push(null);
  if (slots.length === 0) return null;

  const cols  = Math.min(slots.length, PER_ROW);
  const rows  = Math.ceil(slots.length / PER_ROW);
  const gridW = cols * C + (cols - 1) * G;
  const gridH = rows * C + (rows - 1) * G;
  const ox    = anchor[0] - gridW / 2;
  const oy    = anchor[1] - gridH / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {slots.map((f, i) => {
        const col = i % PER_ROW, row = Math.floor(i / PER_ROW);
        const x   = ox + col * (C + G), y = oy + row * (C + G);
        return (
          <rect key={i} x={x} y={y} width={C} height={C} rx={3}
            fill={f ? FC[f] : '#0a1628'}
            stroke={f ? '#000' : '#2a4060'}
            strokeWidth={f ? 1 : 1.5}
            opacity={f ? 0.94 : 0.75}/>
        );
      })}
    </g>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ terr, influences, mx, my }: {
  terr: TerrDef;
  influences: Partial<Record<Faction, number>>;
  mx: number; my: number;
}) {
  const ctrl = getController(influences as Record<Faction, number>);
  const rows = FACTIONS.filter(f => (influences[f] ?? 0) > 0);
  const W = 232; const H = 86 + rows.length * 18;
  const tx = Math.min(mx + 20, 1660); const ty = Math.max(my - 10, 4);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx-5} y={ty-5} width={W} height={H} rx={10}
        fill="#060d18" stroke="#1e3a5f" strokeWidth={1.5} opacity={0.97}/>
      <text x={tx+10} y={ty+19} fill="#00ff88" fontSize={15}
        fontWeight="bold" fontFamily="monospace">{terr.label}</text>
      <text x={tx+10} y={ty+34} fill="#6b7a8d" fontSize={9} fontFamily="monospace">
        {terr.type==='casa' ? `🏠 Casa ${terr.homeFaction}` :
         terr.type==='strategico' ? '⭐ Strategico' : '📍 Normale'}
        {' · '}{terr.pvPerRound}PV/round{terr.isNaval ? ' 🚢' : ''}
      </text>
      <text x={tx+10} y={ty+48} fill="#3a6080" fontSize={8.5} fontFamily="monospace">
        Slot: {terr.initialCubes}
      </text>
      <rect x={tx+5} y={ty+54} width={W-14} height={17} rx={4}
        fill={ctrl ? FC_BG[ctrl] : '#ffffff08'}/>
      <text x={tx+11} y={ty+65} fill={ctrl ? FC[ctrl] : '#4b5563'}
        fontSize={9} fontFamily="monospace">
        {ctrl ? `✅ Controllato: ${ctrl}` : '⚪ Non controllato'}
      </text>
      {rows.map((f, ri) => (
        <g key={f}>
          <text x={tx+11} y={ty+83+ri*18} fill={FC[f]} fontSize={9.5} fontFamily="monospace">{f}</text>
          {Array.from({length: Math.min(influences[f]??0,6)}).map((_,si) => (
            <rect key={si} x={tx+95+si*13} y={ty+73+ri*18}
              width={11} height={11} rx={2} fill={FC[f]} opacity={0.9}/>
          ))}
        </g>
      ))}
    </g>
  );
}

// ── Componente principale ─────────────────────────────────────────────────
export default function TerritoryMap({
  territories, myFaction, isMyTurn,
  onSelectTerritory, selectedTerritory, attackMode,
}: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);
  const [mPos, setMPos] = useState<[number,number]>([0,0]);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMPos([
      (e.clientX - r.left) * (1920 / r.width),
      (e.clientY - r.top)  * (1071 / r.height),
    ]);
  };

  return (
    <div className="relative w-full select-none" style={{ paddingBottom: '55.8%' }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
        <svg viewBox="0 0 1920 1071" className="w-full h-full"
          style={{ display: 'block' }} onMouseMove={onMouseMove}>

          <image href="/plancia_map.png" x={0} y={0}
            width={1920} height={1071} preserveAspectRatio="xMidYMid slice"/>

          {TERR_DEF.map(t => {
            const ts   = territories[t.id];
            const infl = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
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
                <polygon
                  points={p(t.pts)}
                  fill={isSel ? (ctrl ? FC_BG[ctrl] : '#ffffff22') :
                        isHov ? (ctrl ? FC_BG[ctrl] : '#ffffff12') :
                        ctrl  ? FC_BG[ctrl] : 'transparent'}
                  stroke={isSel ? '#00ff88' : ctrl ? FC[ctrl] : isHov ? '#ffffff55' : 'transparent'}
                  strokeWidth={isSel ? 3 : 2}
                  strokeLinejoin="round"
                  opacity={attackMode && !isSel ? 0.45 : 1}
                />
                {isSel && (
                  <polygon points={p(t.pts)} fill="none"
                    stroke="#00ff88" strokeWidth={9} opacity={0.15}
                    style={{ filter: 'blur(6px)' }}/>
                )}
                {t.type === 'casa' && t.homeFaction && (
                  <circle cx={t.cubeAnchor[0]} cy={t.cubeAnchor[1] - 30}
                    r={10} fill={FC[t.homeFaction]} opacity={0.9}
                    style={{ pointerEvents: 'none' }}/>
                )}
                <CubeGrid
                  initialCubes={t.initialCubes}
                  influences={infl}
                  anchor={t.cubeAnchor}
                />
                {totalUnits > 0 && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle cx={t.cubeAnchor[0]+34} cy={t.cubeAnchor[1]-26}
                      r={13} fill="#1e293b" stroke="#f59e0b" strokeWidth={2}/>
                    <text x={t.cubeAnchor[0]+34} y={t.cubeAnchor[1]-21}
                      textAnchor="middle" fill="#f59e0b"
                      fontSize={11} fontWeight="bold" fontFamily="monospace">
                      {totalUnits}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {isMyTurn && (
            <g transform="translate(430,14)">
              <rect x={0} y={0} width={620} height={32} rx={8}
                fill="#00ff8818" stroke="#00ff88" strokeWidth={1.2}/>
              <text x={16} y={22} fill="#00ff88" fontSize={13}
                fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio
              </text>
            </g>
          )}
          {attackMode && (
            <g transform="translate(430,52)">
              <rect x={0} y={0} width={620} height={32} rx={8}
                fill="#ef444418" stroke="#ef4444" strokeWidth={1.2}/>
              <text x={16} y={22} fill="#ef4444" fontSize={13}
                fontFamily="monospace" fontWeight="bold">
                ⚔️ MODALITÀ ATTACCO — Seleziona il bersaglio
              </text>
            </g>
          )}

          <g transform="translate(18,880)">
            <rect x={0} y={0} width={158} height={122} rx={8}
              fill="#060d18e0" stroke="#1e3a5f" strokeWidth={1.2}/>
            <text x={10} y={18} fill="#94a3b8" fontSize={9}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">INFLUENZE</text>
            {FACTIONS.map((f, i) => (
              <g key={f} transform={`translate(10,${27+i*19})`}>
                <rect x={0} y={-12} width={14} height={14} rx={3}
                  fill={FC[f]} opacity={0.92}/>
                <text x={19} y={0} fill={FC[f]} fontSize={10} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {hovered && (() => {
            const t   = TERR_DEF.find(d => d.id === hovered)!;
            const ts  = territories[hovered];
            const infl = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            return <Tooltip terr={t} influences={infl} mx={mPos[0]} my={mPos[1]}/>;
          })()}
        </svg>
      </div>
    </div>
  );
}

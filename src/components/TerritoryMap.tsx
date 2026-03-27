// =============================================
// LINEA ROSSA — TerritoryMap con plancia realistica
// ViewBox 1920×1071 | Poligoni calibrati su griglia pixel
// Cubi influenza grandi al centroide di ogni stato
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
const cx = (arr: [number, number][]) => Math.round(arr.reduce((s, v) => s + v[0], 0) / arr.length);
const cy = (arr: [number, number][]) => Math.round(arr.reduce((s, v) => s + v[1], 0) / arr.length);

// ── Definizione territori ─────────────────────────────────────────────────
// Coordinate su immagine 1920×1071 — poligoni non sovrapposti
// cubeAnchor = centroide matematico del poligono

interface TerrDef {
  id: TerritoryId;
  label: string;
  pts: [number, number][];
  cubeAnchor: [number, number];
  initialCubes: number;
  pvPerRound: number;
  type: 'casa' | 'strategico' | 'normale';
  homeFaction?: Faction;
  isNaval?: boolean;
}

const makeTerr = (
  id: TerritoryId, label: string,
  pts: [number,number][],
  initialCubes: number, pvPerRound: number,
  type: 'casa'|'strategico'|'normale',
  extra?: { homeFaction?: Faction; isNaval?: boolean }
): TerrDef => ({
  id, label, pts,
  cubeAnchor: [cx(pts), cy(pts)],
  initialCubes, pvPerRound, type,
  ...extra,
});

const TERR_DEF: TerrDef[] = [
  makeTerr('Turchia', 'TURCHIA',
    [[68,82],[700,82],[700,238],[500,244],[285,248],[118,224],[68,185]],
    4, 1, 'normale'),

  makeTerr('Siria', 'SIRIA',
    [[322,238],[700,238],[700,392],[322,392]],
    2, 1, 'normale'),

  makeTerr('Libano', 'LIBANO',
    [[434,252],[505,248],[528,268],[518,285],[472,296],[448,272]],
    2, 1, 'normale'),

  makeTerr('Israele', 'ISRAELE',
    [[398,252],[434,252],[525,392],[480,488],[412,478],[398,452]],
    6, 3, 'casa', { homeFaction: 'Coalizione' }),

  makeTerr('Giordania', 'GIORDANIA',
    [[322,392],[840,392],[730,432],[718,468],[705,498],[688,522],
     [658,540],[628,546],[596,542],[562,526],[530,510],[505,492],
     [480,488],[525,392]],
    2, 1, 'normale'),

  makeTerr('Egitto', 'EGITTO',
    [[35,268],[398,268],[398,452],[412,478],[415,510],
     [285,532],[118,492],[40,458]],
    4, 1, 'normale'),

  makeTerr('Iraq', 'IRAQ',
    [[700,82],[1075,82],[1075,392],[840,392],[700,392]],
    3, 1, 'normale'),

  makeTerr('Iran', 'IRAN',
    [[1075,82],[1618,62],[1618,415],[1492,412],[1418,412],
     [1342,392],[1278,355],[1222,312],[1165,282],[1105,270],[1075,270]],
    6, 3, 'casa', { homeFaction: 'Iran', isNaval: true }),

  makeTerr('Kuwait', 'KUWAIT',
    [[1058,392],[1138,392],[1150,412],[1148,440],[1132,458],
     [1108,462],[1085,458],[1062,445],[1055,425],[1055,405]],
    2, 1, 'normale'),

  makeTerr('ArabiaSaudita', 'ARABIA S.',
    [[480,510],[530,510],[658,545],[840,392],[1058,405],
     [1058,560],[978,560],[858,520],[758,478],[658,472],
     [558,500],[468,562],[448,652],[448,748],[482,798],
     [555,840],[645,822],[682,752],[672,658],[618,628],
     [528,618],[455,645],[432,718],[452,792],[508,830],[555,840]],
    4, 1, 'normale', { isNaval: true }),

  makeTerr('EmiratiArabi', 'UAE',
    [[1250,492],[1392,462],[1498,482],[1542,548],
     [1508,578],[1425,565],[1345,510],[1295,490]],
    2, 1, 'normale', { isNaval: true }),

  makeTerr('Oman', 'OMAN',
    [[1350,468],[1498,482],[1542,548],[1582,672],
     [1518,762],[1428,752],[1338,652],[1332,595],[1365,515]],
    2, 1, 'normale', { isNaval: true }),

  makeTerr('StrettoHormuz', 'HORMUZ',
    [[1225,418],[1278,415],[1320,448],[1315,472],
     [1292,488],[1255,488],[1218,462],[1218,440]],
    0, 2, 'strategico', { isNaval: true }),

  makeTerr('Yemen', 'YEMEN',
    [[652,692],[732,638],[835,618],[930,640],[978,685],
     [1005,772],[960,842],[878,862],[788,825],[712,755],[672,700]],
    2, 1, 'normale', { isNaval: true }),
];

// ── Griglia cubi influenza grande al centroide ────────────────────────────
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

  // Centra la griglia sull'anchor
  const cols = Math.min(slots.length, PER_ROW);
  const rows = Math.ceil(slots.length / PER_ROW);
  const gridW = cols * C + (cols - 1) * G;
  const gridH = rows * C + (rows - 1) * G;
  const ox = anchor[0] - gridW / 2;
  const oy = anchor[1] - gridH / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {slots.map((f, i) => {
        const col = i % PER_ROW;
        const row = Math.floor(i / PER_ROW);
        const x = ox + col * (C + G);
        const y = oy + row * (C + G);
        return (
          <rect key={i} x={x} y={y} width={C} height={C} rx={3}
            fill={f ? FC[f] : '#0a1628'}
            stroke={f ? '#000' : '#2a4060'}
            strokeWidth={f ? 1 : 1.5}
            opacity={f ? 0.94 : 0.75}
          />
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
  const W = 230; const H = 84 + rows.length * 18;
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
        Slot influenza: {terr.initialCubes}
      </text>
      <rect x={tx+5} y={ty+53} width={W-14} height={17} rx={4}
        fill={ctrl ? FC_BG[ctrl] : '#ffffff08'}/>
      <text x={tx+11} y={ty+64} fill={ctrl ? FC[ctrl] : '#4b5563'}
        fontSize={9} fontFamily="monospace">
        {ctrl ? `✅ Controllato: ${ctrl}` : '⚪ Non controllato'}
      </text>
      {rows.map((f, ri) => (
        <g key={f}>
          <text x={tx+11} y={ty+82+ri*18} fill={FC[f]}
            fontSize={9.5} fontFamily="monospace">{f}</text>
          {Array.from({length: Math.min(influences[f]??0, 6)}).map((_,si) => (
            <rect key={si} x={tx+95+si*13} y={ty+72+ri*18}
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

          {/* Sfondo: plancia realistica */}
          <image href="/plancia_map.png" x={0} y={0}
            width={1920} height={1071} preserveAspectRatio="xMidYMid slice"/>

          {/* Territori */}
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
                {/* Area cliccabile */}
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
                {/* Glow selezione */}
                {isSel && (
                  <polygon points={p(t.pts)} fill="none"
                    stroke="#00ff88" strokeWidth={9} opacity={0.15}
                    style={{ filter: 'blur(6px)' }}/>
                )}
                {/* Badge casa */}
                {t.type === 'casa' && t.homeFaction && (
                  <circle cx={t.cubeAnchor[0]} cy={t.cubeAnchor[1] - 32}
                    r={10} fill={FC[t.homeFaction]} opacity={0.9}
                    style={{ pointerEvents: 'none' }}/>
                )}
                {/* Cubi influenza — centrati nello stato */}
                <CubeGrid initialCubes={t.initialCubes} influences={infl}
                  anchor={t.cubeAnchor}/>
                {/* Badge unità */}
                {totalUnits > 0 && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle cx={t.cubeAnchor[0]+34} cy={t.cubeAnchor[1]-24}
                      r={13} fill="#1e293b" stroke="#f59e0b" strokeWidth={2}/>
                    <text x={t.cubeAnchor[0]+34} y={t.cubeAnchor[1]-19}
                      textAnchor="middle" fill="#f59e0b"
                      fontSize={11} fontWeight="bold" fontFamily="monospace">
                      {totalUnits}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Banner turno */}
          {isMyTurn && (
            <g transform="translate(430,14)">
              <rect x={0} y={0} width={640} height={32} rx={8}
                fill="#00ff8818" stroke="#00ff88" strokeWidth={1.2}/>
              <text x={16} y={22} fill="#00ff88" fontSize={13}
                fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio
              </text>
            </g>
          )}
          {attackMode && (
            <g transform="translate(430,52)">
              <rect x={0} y={0} width={640} height={32} rx={8}
                fill="#ef444418" stroke="#ef4444" strokeWidth={1.2}/>
              <text x={16} y={22} fill="#ef4444" fontSize={13}
                fontFamily="monospace" fontWeight="bold">
                ⚔️ MODALITÀ ATTACCO — Seleziona il bersaglio
              </text>
            </g>
          )}

          {/* Legenda fazioni */}
          <g transform="translate(18,880)">
            <rect x={0} y={0} width={158} height={122} rx={8}
              fill="#060d18e0" stroke="#1e3a5f" strokeWidth={1.2}/>
            <text x={10} y={18} fill="#94a3b8" fontSize={9}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">
              INFLUENZE
            </text>
            {FACTIONS.map((f, i) => (
              <g key={f} transform={`translate(10,${27+i*19})`}>
                <rect x={0} y={-12} width={14} height={14} rx={3}
                  fill={FC[f]} opacity={0.92}/>
                <text x={19} y={0} fill={FC[f]}
                  fontSize={10} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {/* Tooltip */}
          {hovered && (() => {
            const t    = TERR_DEF.find(d => d.id === hovered)!;
            const ts   = territories[hovered];
            const infl = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
            return <Tooltip terr={t} influences={infl} mx={mPos[0]} my={mPos[1]}/>;
          })()}
        </svg>
      </div>
    </div>
  );
}

// =============================================
// LINEA ROSSA — TerritoryMap
// Poligoni disegnati manualmente dall'utente sul tool interattivo
// cubeAnchor = centroide geometrico calcolato da ogni poligono
// =============================================


import { useState } from 'react';
import type { Faction } from '@/types/game';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { UNIT_MAP } from '@/lib/territoriesData';
import { getController } from '@/lib/combatEngine';


const FC: Record<Faction, string> = {
  Iran: '#ef4444', Coalizione: '#3b82f6', Russia: '#a855f7',
  Cina: '#f59e0b', Europa: '#10b981',
};
const FC_BG: Record<Faction, string> = {
  Iran: '#ef444435', Coalizione: '#3b82f635', Russia: '#a855f735',
  Cina: '#f59e0b35', Europa: '#10b98135',
};
const FC_SOLID: Record<Faction, string> = {
  Iran: '#c41c1c', Coalizione: '#1d4ed8', Russia: '#7c3aed',
  Cina: '#d97706', Europa: '#059669',
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

const p = (arr: [number, number][]) => arr.map(([x, y]) => `${x},${y}`).join(' ');

interface TerrDef {
  id: TerritoryId;
  label: string;
  pts: [number, number][];
  cubeAnchor: [number, number];
  maxSlots: number;   // slot totali visibili (capacità massima influenza)
  pvPerRound: number;
  type: 'casa' | 'strategico' | 'normale';
  homeFaction?: Faction;
  isNaval?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// TERRITORI — poligoni disegnati dall'utente + cubeAnchor = centroide reale
// ─────────────────────────────────────────────────────────────────────────
const TERR_DEF: TerrDef[] = [
  { id: 'Turchia', label: 'TURCHIA',
    pts: [[255,146],[205,198],[245,267],[329,287],[343,271],[407,295],[484,276],
          [529,300],[553,267],[610,268],[687,263],[752,254],[812,251],[834,254],
          [826,185],[837,168],[807,154],[795,119],[738,108],[651,125],[557,116],
          [533,107],[496,93],[423,88]],
    cubeAnchor: [518, 194], maxSlots: 4, pvPerRound: 1, type: 'normale' },

  { id: 'Siria', label: 'SIRIA',
    pts: [[531,308],[545,347],[556,376],[527,396],[558,428],[608,408],[712,354],
          [725,292],[761,263],[704,265],[618,270],[554,272]],
    cubeAnchor: [625, 332], maxSlots: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Libano', label: 'LIBANO',
    pts: [[523,325],[528,353],[546,354],[547,366],[529,386],[508,404],
          [495,404],[436,382],[437,364]],
    cubeAnchor: [494, 369], maxSlots: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Israele', label: 'ISRAELE',
    pts: [[492,406],[512,406],[509,470],[488,530],[464,468]],
    cubeAnchor: [491, 461], maxSlots: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Coalizione' },

  { id: 'Giordania', label: 'GIORDANIA',
    pts: [[497,529],[522,468],[520,423],[554,436],[627,401],[641,441],[573,463],
          [597,497],[587,513],[557,519],[530,543]],
    cubeAnchor: [561, 471], maxSlots: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Egitto', label: 'EGITTO',
    pts: [[136,454],[282,484],[357,456],[394,472],[459,474],[481,529],[471,589],
          [407,514],[396,527],[512,720],[132,721]],
    cubeAnchor: [300, 598], maxSlots: 4, pvPerRound: 1, type: 'normale' },

  { id: 'Iraq', label: 'IRAQ',
    pts: [[637,398],[646,440],[679,447],[835,543],[904,543],[932,511],[970,512],
          [945,477],[951,453],[932,429],[896,412],[874,370],[893,339],[896,310],
          [845,266],[778,256],[730,290],[725,356]],
    cubeAnchor: [809, 409], maxSlots: 3, pvPerRound: 1, type: 'normale' },

  { id: 'Iran', label: 'IRAN',
    pts: [[837,174],[829,179],[894,298],[892,363],[933,421],[961,474],[984,512],
          [996,500],[1019,505],[1032,502],[1084,579],[1156,612],[1191,624],
          [1219,621],[1276,600],[1301,644],[1407,660],[1442,672],[1465,632],
          [1506,602],[1487,565],[1422,511],[1451,473],[1446,457],[1416,453],
          [1406,364],[1428,316],[1422,285],[1366,264],[1335,245],[1288,232],
          [1263,220],[1182,257],[1165,274],[1103,286],[1031,257],[997,246],
          [993,220],[966,208],[968,182],[957,171],[910,199],[872,199]],
    cubeAnchor: [1191, 422], maxSlots: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Iran', isNaval: true },

  { id: 'Kuwait', label: 'KUWAIT',
    pts: [[967,519],[935,517],[914,543],[935,546],[945,562],[973,563]],
    cubeAnchor: [949, 539], maxSlots: 2, pvPerRound: 1, type: 'normale' },

  { id: 'ArabiaSaudita', label: 'ARABIA S.',
    pts: [[971,571],[1060,701],[1118,762],[1225,779],[1224,856],[1107,899],
          [1002,920],[945,966],[849,950],[794,947],[782,981],[642,802],[642,760],
          [593,713],[574,682],[504,586],[478,583],[493,541],[536,539],[553,526],
          [604,520],[611,498],[596,480],[641,464],[682,465],[755,508],[813,544]],
    cubeAnchor: [840, 728], maxSlots: 4, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'EmiratiArabi', label: 'UAE',
    pts: [[1097,714],[1134,753],[1215,765],[1239,718],[1246,689],[1262,687],
          [1262,645],[1230,672],[1208,698],[1186,712],[1165,719],[1130,716],[1110,717]],
    cubeAnchor: [1194, 721], maxSlots: 2, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'Oman', label: 'OMAN',
    pts: [[1271,696],[1253,728],[1244,762],[1253,788],[1234,863],[1136,903],
          [1130,920],[1163,969],[1216,970],[1268,942],[1329,902],[1351,852],
          [1394,778],[1348,736]],
    cubeAnchor: [1272, 846], maxSlots: 2, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'StrettoHormuz', label: 'HORMUZ',
    pts: [[1195,629],[1218,664],[1262,631],[1272,688],[1337,709],[1353,673],
          [1291,648],[1275,606],[1228,628]],
    cubeAnchor: [1281, 659], maxSlots: 0, pvPerRound: 2, type: 'strategico', isNaval: true },

  { id: 'Yemen', label: 'YEMEN',
    pts: [[1105,913],[1139,977],[1086,1022],[790,1026],[787,990],[802,955],
          [903,970],[950,978],[993,929]],
    cubeAnchor: [976, 982], maxSlots: 2, pvPerRound: 1, type: 'normale', isNaval: true },
];

// ─────────────────────────────────────────────────────────────────────────
// CUBI INFLUENZA — slot fissi visibili, colorati per fazione
// ─────────────────────────────────────────────────────────────────────────
function InfluenceCubes({ influences, anchor, maxSlots }: {
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
  maxSlots: number;
}) {
  if (maxSlots === 0) return null; // Stretto di Hormuz: nessuno slot

  // Costruisce array di slot: fazione o null (vuoto)
  const slots: (Faction | null)[] = [];
  for (const f of FACTIONS) {
    const n = Math.max(0, influences[f] ?? 0);
    for (let i = 0; i < n; i++) slots.push(f);
  }
  while (slots.length < maxSlots) slots.push(null);

  const SW = 26;   // larghezza slot
  const SH = 26;   // altezza slot
  const GAP = 4;   // spazio tra slot
  const totalW = maxSlots * SW + (maxSlots - 1) * GAP;
  const ox = anchor[0] - totalW / 2;
  const oy = anchor[1] - SH / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {slots.map((faction, i) => {
        const x = ox + i * (SW + GAP);
        const y = oy;
        const color = faction ? FC_SOLID[faction] : null;
        return (
          <g key={i}>
            {/* Ombra (solo slot pieno) */}
            {faction && (
              <rect x={x+2} y={y+2} width={SW} height={SH} rx={5}
                fill="#000" opacity={0.4} />
            )}
            {/* Slot: pieno = colore fazione, vuoto = contorno grigio */}
            <rect x={x} y={y} width={SW} height={SH} rx={5}
              fill={color ?? 'none'}
              stroke={color ?? '#ffffff30'}
              strokeWidth={faction ? 2 : 1.5}
              opacity={faction ? 0.95 : 0.55} />
            {/* Lettera iniziale fazione */}
            {faction && (
              <text x={x + SW/2} y={y + SH/2 + 4}
                textAnchor="middle"
                fill="#fff"
                fontSize={11}
                fontWeight="bold"
                fontFamily="monospace"
                style={{ userSelect: 'none' }}>
                {faction.slice(0, 1)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ICONE UNITÀ MILITARI
// ─────────────────────────────────────────────────────────────────────────
function UnitBadges({ units, anchor }: {
  units: Partial<Record<Faction, Partial<Record<UnitType, number>>>>;
  anchor: [number, number];
}) {
  type UnitEntry = { faction: Faction; unitType: UnitType; qty: number; icon: string };
  const entries: UnitEntry[] = [];
  for (const faction of FACTIONS) {
    const fUnits = units[faction];
    if (!fUnits) continue;
    for (const [utKey, qty] of Object.entries(fUnits)) {
      if (!qty || qty <= 0) continue;
      const ut = utKey as UnitType;
      const def = UNIT_MAP[ut];
      if (!def) continue;
      entries.push({ faction, unitType: ut, qty, icon: def.icon });
    }
  }
  if (!entries.length) return null;

  const BW = 46;
  const BH = 30;
  const GAP = 5;
  const PER_ROW = 3;
  const rows = Math.ceil(entries.length / PER_ROW);
  const totalH = rows * BH + (rows - 1) * GAP;
  const oy = anchor[1] + 22;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {entries.map(({ faction, unitType, qty, icon }, i) => {
        const col = i % PER_ROW;
        const row = Math.floor(i / PER_ROW);
        const colsThisRow = Math.min(PER_ROW, entries.length - row * PER_ROW);
        const rowW = colsThisRow * BW + (colsThisRow - 1) * GAP;
        const x = anchor[0] - rowW / 2 + col * (BW + GAP);
        const y = oy + row * (BH + GAP);
        const color = FC_SOLID[faction];
        return (
          <g key={`${faction}-${unitType}`}>
            {/* Ombra */}
            <rect x={x+2} y={y+2} width={BW} height={BH} rx={7} fill="#000" opacity={0.3} />
            {/* Badge sfondo */}
            <rect x={x} y={y} width={BW} height={BH} rx={7}
              fill="#0a1628" stroke={color} strokeWidth={2} opacity={0.97} />
            {/* Icona unità */}
            <text x={x + 13} y={y + BH/2 + 5}
              textAnchor="middle" fill="#fff" fontSize={14}
              style={{ userSelect: 'none' }}>
              {icon}
            </text>
            {/* Quantità */}
            <text x={x + BW - 10} y={y + BH/2 + 5}
              textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold"
              fontFamily="monospace" style={{ userSelect: 'none' }}>
              {qty}
            </text>
            {/* Pallino colore fazione in angolo */}
            <circle cx={x + BW - 5} cy={y + 5} r={4}
              fill={color} stroke="#000" strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ terr, influences, units, mx, my }: {
  terr: TerrDef;
  influences: Partial<Record<Faction, number>>;
  units: Partial<Record<Faction, Partial<Record<UnitType, number>>>>;
  mx: number; my: number;
}) {
  const ctrl = getController(influences as Record<Faction, number>);
  const inflRows = FACTIONS.filter(f => (influences[f] ?? 0) > 0);

  type URow = { faction: Faction; label: string; icon: string; qty: number };
  const unitRows: URow[] = [];
  for (const f of FACTIONS) {
    const fu = units[f];
    if (!fu) continue;
    for (const [ut, q] of Object.entries(fu)) {
      if (!q) continue;
      const def = UNIT_MAP[ut as UnitType];
      if (def) unitRows.push({ faction: f, label: def.label, icon: def.icon, qty: q });
    }
  }

  const W = 250;
  const H = 90 + inflRows.length * 18 + (unitRows.length ? 20 + unitRows.length * 16 : 0);
  const tx = Math.min(mx + 20, 1650);
  const ty = Math.max(my - 10, 4);

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx-5} y={ty-5} width={W} height={H} rx={10}
        fill="#060d18" stroke="#1e3a5f" strokeWidth={1.5} opacity={0.98} />
      <text x={tx+10} y={ty+19} fill="#00ff88" fontSize={15}
        fontWeight="bold" fontFamily="monospace">{terr.label}</text>
      <text x={tx+10} y={ty+33} fill="#6b7a8d" fontSize={9} fontFamily="monospace">
        {terr.type==='casa'?`🏠 ${terr.homeFaction}`:terr.type==='strategico'?'⭐ Strategico':'📍 Normale'} {' · '}{terr.pvPerRound}PV{terr.isNaval?' 🚢':''}
      </text>
      <line x1={tx} y1={ty+38} x2={tx+W-10} y2={ty+38} stroke="#1e3a5f" strokeWidth={1} />
      <text x={tx+10} y={ty+52} fill="#94a3b8" fontSize={10} fontFamily="monospace">
        {ctrl ? `✅ Controllato da ${ctrl}` : '⚪ Non controllato'}
      </text>
      {inflRows.map((f, ri) => (
        <text key={f} x={tx+10} y={ty+66+ri*18} fill={FC[f]} fontSize={10} fontFamily="monospace">
          {f}: {influences[f]}
        </text>
      ))}
      {unitRows.length > 0 && (
        <>
          <text x={tx+10} y={ty+66+inflRows.length*18+4} fill="#475569" fontSize={8} fontFamily="monospace">
            ── UNITÀ ──
          </text>
          {unitRows.map(({ faction, label, icon, qty }, ri) => (
            <text key={`${faction}-${label}`} x={tx+10} y={ty+78+inflRows.length*18+ri*16}
              fill={FC[faction]} fontSize={9} fontFamily="monospace">
              {icon} {label.slice(0, 22)}: {qty}
            </text>
          ))}
        </>
      )}
    </g>
  );
}

// ── Componente principale ────────────────────────────────────────────────
export default function TerritoryMap({
  territories, myFaction, isMyTurn,
  onSelectTerritory, selectedTerritory, attackMode,
}: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);
  const [mPos, setMPos] = useState<[number, number]>([0, 0]);

  const onMM = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMPos([
      (e.clientX - r.left) * (1920 / r.width),
      (e.clientY - r.top) * (1071 / r.height),
    ]);
  };

  return (
    <div className="relative w-full select-none" style={{ paddingBottom: '55.8%' }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
        <svg viewBox="0 0 1920 1071" className="w-full h-full"
          style={{ display: 'block' }} onMouseMove={onMM}>

          <image href="/plancia_map.png" x={0} y={0}
            width={1920} height={1071} preserveAspectRatio="xMidYMid slice" />

      {TERR_DEF.map(t => {
        const ts = territories[t.id] ?? { influences: {}, units: {} };
        const infl = ts.influences;
        const units = ts.units;
        const ctrl = getController(infl as Record<Faction, number>);
        const isSel = selectedTerritory === t.id;
        const isHov = hovered === t.id;
        const canAttack = attackMode && myFaction && ctrl !== myFaction;

        return (
          <g
            key={t.id}
            style={{ cursor: canAttack ? 'crosshair' : 'default' }}
            onClick={() => onSelectTerritory?.(t.id)}
            onMouseEnter={() => setHovered(t.id)}
            onMouseLeave={() => setHovered(null)}>

            {/* Poligono territorio */}
            <polygon points={p(t.pts)}
              fill={isSel ? (ctrl ? FC_BG[ctrl] : '#ffffff22') :
                    isHov ? (ctrl ? FC_BG[ctrl] : '#ffffff18') :
                    ctrl  ? FC_BG[ctrl] : '#ffffff0a'}
              stroke={isSel ? '#00ff88' : ctrl ? FC[ctrl] : isHov ? '#ffffffcc' : '#ffffff66'}
              strokeWidth={isSel ? 4 : isHov ? 3 : 2}
              strokeLinejoin="round"
              opacity={attackMode && !isSel ? 0.55 : 1} />

            {/* Glow selezione */}
            {isSel && (
              <polygon points={p(t.pts)} fill="none"
                stroke="#00ff88" strokeWidth={9} opacity={0.15}
                style={{ filter: 'blur(6px)' }} />
            )}

            {/* Badge casa fazione */}
            {t.type === 'casa' && t.homeFaction && (
              <circle
                cx={t.cubeAnchor[0]}
                cy={t.cubeAnchor[1] - 46}
                r={11}
                fill={FC_SOLID[t.homeFaction]}
                stroke="#fff" strokeWidth={2}
                opacity={0.9}
                style={{ pointerEvents: 'none' }} />
            )}

            {/* Nome stato — sempre visibile */}
            <g style={{ pointerEvents: 'none' }}>
              <text
                x={t.cubeAnchor[0]}
                y={t.cubeAnchor[1] - 18}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={13}
                fontWeight="bold"
                fontFamily="monospace"
                style={{ filter: 'drop-shadow(0 1px 3px #000)' }}
                opacity={0.92}
              >{t.label}</text>
            </g>

            {/* Cubi influenza (grandi e visibili) */}
            <InfluenceCubes influences={infl} anchor={t.cubeAnchor} maxSlots={t.maxSlots} />

            {/* Icone unità militari */}
            <UnitBadges units={units} anchor={t.cubeAnchor} />

          </g>
        );
      })}

      {/* Banner turno */}
      {isMyTurn && (
        <g transform="translate(430,14)">
          <rect x={0} y={0} width={620} height={32} rx={8}
            fill="#00ff8818" stroke="#00ff88" strokeWidth={1.2} />
          <text x={16} y={22} fill="#00ff88" fontSize={13}
            fontFamily="monospace" fontWeight="bold">
            ▶ È IL TUO TURNO — {myFaction?.toUpperCase()} — Scegli azione
          </text>
        </g>
      )}

      {/* Banner attacco */}
      {attackMode && (
        <g transform="translate(430,50)">
          <rect x={0} y={0} width={620} height={32} rx={8}
            fill="#ef444418" stroke="#ef4444" strokeWidth={1.2} />
          <text x={16} y={22} fill="#ef4444" fontSize={13}
            fontFamily="monospace" fontWeight="bold">
            ⚔ MODALITÀ ATTACCO — Seleziona territorio nemico
          </text>
        </g>
      )}

      {/* Legenda miniatura */}
      {hovered && (() => {
        const t = TERR_DEF.find(d => d.id === hovered)!;
        const ts = territories[t.id] ?? { influences: {}, units: {} };
        return (
          <g transform="translate(14,880)">
            <rect x={0} y={0} width={158} height={122} rx={8}
              fill="#060d18e0" stroke="#1e3a5f" strokeWidth={1.2} />
            <text x={10} y={18} fill="#94a3b8" fontSize={9}
              fontFamily="monospace">
              {t.type === 'casa' ? '🏠' : t.type === 'strategico' ? '⭐' : '📍'} {t.label}
            </text>
            <text x={10} y={32} fill="#475569" fontSize={8} fontFamily="monospace">
              {t.pvPerRound}PV/round {t.isNaval ? '🚢' : ''}
            </text>
            {FACTIONS.filter(f => (ts.influences[f] ?? 0) > 0).map((f, i) => (
              <text key={f} x={10} y={48+i*14} fill={FC[f]} fontSize={9} fontFamily="monospace">
                {f}: {ts.influences[f]}
              </text>
            ))}
          </g>
        );
      })()}

      {/* Tooltip hover */}
      {hovered && (() => {
        const t = TERR_DEF.find(d => d.id === hovered)!;
        const ts = territories[t.id] ?? { influences: {}, units: {} };
        return (
          <Tooltip
            terr={t}
            influences={ts.influences}
            units={ts.units}
            mx={mPos[0]} my={mPos[1]}
          />
        );
      })()}
        </svg>
      </div>
    </div>
  );
}

// =============================================
// LINEA ROSSA — TerritoryMap
// Poligoni disegnati manualmente dall'utente sul tool interattivo
// cubeAnchor = centroide geometrico calcolato da ogni poligono
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

const p = (arr: [number, number][]) => arr.map(([x, y]) => `${x},${y}`).join(' ');

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

// ─────────────────────────────────────────────────────────────────────────
// TERRITORI — poligoni disegnati dall'utente + cubeAnchor = centroide reale
// ─────────────────────────────────────────────────────────────────────────
const TERR_DEF: TerrDef[] = [

  { id: 'Turchia', label: 'TURCHIA',
    pts: [[255,146],[205,198],[245,267],[329,287],[343,271],[407,295],[484,276],
          [529,300],[553,267],[610,268],[687,263],[752,254],[812,251],[834,254],
          [826,185],[837,168],[807,154],[795,119],[738,108],[651,125],[557,116],
          [533,107],[496,93],[423,88]],
    cubeAnchor: [518, 194],
    initialCubes: 4, pvPerRound: 1, type: 'normale' },

  { id: 'Siria', label: 'SIRIA',
    pts: [[531,308],[545,347],[556,376],[527,396],[558,428],[608,408],[712,354],
          [725,292],[761,263],[704,265],[618,270],[554,272]],
    cubeAnchor: [625, 332],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Libano', label: 'LIBANO',
    pts: [[523,325],[528,353],[546,354],[547,366],[529,386],[508,404],
          [495,404],[436,382],[437,364]],
    cubeAnchor: [494, 369],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Israele', label: 'ISRAELE',
    pts: [[492,406],[512,406],[509,470],[488,530],[464,468]],
    cubeAnchor: [491, 461],
    initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Coalizione' },

  { id: 'Giordania', label: 'GIORDANIA',
    pts: [[497,529],[522,468],[520,423],[554,436],[627,401],[641,441],[573,463],
          [597,497],[587,513],[557,519],[530,543]],
    cubeAnchor: [561, 471],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Egitto', label: 'EGITTO',
    pts: [[136,454],[282,484],[357,456],[394,472],[459,474],[481,529],[471,589],
          [407,514],[396,527],[512,720],[132,721]],
    cubeAnchor: [300, 598],
    initialCubes: 4, pvPerRound: 1, type: 'normale' },

  { id: 'Iraq', label: 'IRAQ',
    pts: [[637,398],[646,440],[679,447],[835,543],[904,543],[932,511],[970,512],
          [945,477],[951,453],[932,429],[896,412],[874,370],[893,339],[896,310],
          [845,266],[778,256],[730,290],[725,356]],
    cubeAnchor: [809, 409],
    initialCubes: 3, pvPerRound: 1, type: 'normale' },

  { id: 'Iran', label: 'IRAN',
    pts: [[837,174],[829,179],[894,298],[892,363],[933,421],[961,474],[984,512],
          [996,500],[1019,505],[1032,502],[1084,579],[1156,612],[1191,624],
          [1219,621],[1276,600],[1301,644],[1407,660],[1442,672],[1465,632],
          [1506,602],[1487,565],[1422,511],[1451,473],[1446,457],[1416,453],
          [1406,364],[1428,316],[1422,285],[1366,264],[1335,245],[1288,232],
          [1263,220],[1182,257],[1165,274],[1103,286],[1031,257],[997,246],
          [993,220],[966,208],[968,182],[957,171],[910,199],[872,199]],
    cubeAnchor: [1191, 422],
    initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Iran', isNaval: true },

  { id: 'Kuwait', label: 'KUWAIT',
    pts: [[967,519],[935,517],[914,543],[935,546],[945,562],[973,563]],
    cubeAnchor: [949, 539],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'ArabiaSaudita', label: 'ARABIA S.',
    pts: [[971,571],[1060,701],[1118,762],[1225,779],[1224,856],[1107,899],
          [1002,920],[945,966],[849,950],[794,947],[782,981],[642,802],[642,760],
          [593,713],[574,682],[504,586],[478,583],[493,541],[536,539],[553,526],
          [604,520],[611,498],[596,480],[641,464],[682,465],[755,508],[813,544]],
    cubeAnchor: [840, 728],
    initialCubes: 4, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'EmiratiArabi', label: 'UAE',
    pts: [[1097,714],[1134,753],[1215,765],[1239,718],[1246,689],[1262,687],
          [1262,645],[1230,672],[1208,698],[1186,712],[1165,719],[1130,716],[1110,717]],
    cubeAnchor: [1194, 721],
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'Oman', label: 'OMAN',
    pts: [[1271,696],[1253,728],[1244,762],[1253,788],[1234,863],[1136,903],
          [1130,920],[1163,969],[1216,970],[1268,942],[1329,902],[1351,852],
          [1394,778],[1348,736]],
    cubeAnchor: [1272, 846],
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'StrettoHormuz', label: 'HORMUZ',
    pts: [[1195,629],[1218,664],[1262,631],[1272,688],[1337,709],[1353,673],
          [1291,648],[1275,606],[1228,628]],
    cubeAnchor: [1281, 659],
    initialCubes: 0, pvPerRound: 2, type: 'strategico', isNaval: true },

  { id: 'Yemen', label: 'YEMEN',
    pts: [[1105,913],[1139,977],[1086,1022],[790,1026],[787,990],[802,955],
          [903,970],[950,978],[993,929]],
    cubeAnchor: [976, 982],
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true },
];

// ── Griglia cubi influenza ────────────────────────────────────────────────
function CubeGrid({ initialCubes, influences, anchor }: {
  initialCubes: number;
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const C=18, G=4, PR=3;
  const slots: Array<Faction|null>=[];
  for (const f of FACTIONS) for (let i=0;i<(influences[f]??0);i++) slots.push(f);
  const empty=Math.max(0,initialCubes-slots.length);
  for (let i=0;i<empty;i++) slots.push(null);
  if (!slots.length) return null;
  const cols=Math.min(slots.length,PR), rows=Math.ceil(slots.length/PR);
  const gW=cols*C+(cols-1)*G, gH=rows*C+(rows-1)*G;
  const ox=anchor[0]-gW/2, oy=anchor[1]-gH/2;
  return (
    <g style={{pointerEvents:'none'}}>
      {slots.map((f,i)=>{
        const col=i%PR, row=Math.floor(i/PR);
        return <rect key={i} x={ox+col*(C+G)} y={oy+row*(C+G)} width={C} height={C} rx={3}
          fill={f?FC[f]:'#0a1628'} stroke={f?'#000':'#2a4060'}
          strokeWidth={f?1:1.5} opacity={f?0.94:0.75}/>;
      })}
    </g>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ terr, influences, mx, my }: {
  terr: TerrDef; influences: Partial<Record<Faction,number>>; mx:number; my:number;
}) {
  const ctrl=getController(influences as Record<Faction,number>);
  const rows=FACTIONS.filter(f=>(influences[f]??0)>0);
  const W=230, H=86+rows.length*18;
  const tx=Math.min(mx+20,1660), ty=Math.max(my-10,4);
  return (
    <g style={{pointerEvents:'none'}}>
      <rect x={tx-5} y={ty-5} width={W} height={H} rx={10}
        fill="#060d18" stroke="#1e3a5f" strokeWidth={1.5} opacity={0.97}/>
      <text x={tx+10} y={ty+19} fill="#00ff88" fontSize={15}
        fontWeight="bold" fontFamily="monospace">{terr.label}</text>
      <text x={tx+10} y={ty+33} fill="#6b7a8d" fontSize={9} fontFamily="monospace">
        {terr.type==='casa'?`🏠 ${terr.homeFaction}`:terr.type==='strategico'?'⭐ Strategico':'📍 Normale'}
        {' · '}{terr.pvPerRound}PV{terr.isNaval?' 🚢':''}
      </text>
      <rect x={tx+5} y={ty+40} width={W-14} height={17} rx={4}
        fill={ctrl?FC_BG[ctrl]:'#ffffff08'}/>
      <text x={tx+11} y={ty+51} fill={ctrl?FC[ctrl]:'#4b5563'}
        fontSize={9} fontFamily="monospace">
        {ctrl?`✅ ${ctrl}`:'⚪ Non controllato'}
      </text>
      {rows.map((f,ri)=>(
        <g key={f}>
          <text x={tx+11} y={ty+69+ri*18} fill={FC[f]} fontSize={9.5} fontFamily="monospace">{f}</text>
          {Array.from({length:Math.min(influences[f]??0,6)}).map((_,si)=>(
            <rect key={si} x={tx+95+si*13} y={ty+59+ri*18} width={11} height={11}
              rx={2} fill={FC[f]} opacity={0.9}/>
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
  const [hovered, setHovered]=useState<TerritoryId|null>(null);
  const [mPos, setMPos]=useState<[number,number]>([0,0]);

  const onMM=(e: React.MouseEvent<SVGSVGElement>)=>{
    const r=e.currentTarget.getBoundingClientRect();
    setMPos([(e.clientX-r.left)*(1920/r.width),(e.clientY-r.top)*(1071/r.height)]);
  };

  return (
    <div className="relative w-full select-none" style={{paddingBottom:'55.8%'}}>
      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
        <svg viewBox="0 0 1920 1071" className="w-full h-full"
          style={{display:'block'}} onMouseMove={onMM}>

          <image href="/plancia_map.png" x={0} y={0}
            width={1920} height={1071} preserveAspectRatio="xMidYMid slice"/>

          {TERR_DEF.map(t=>{
            const ts=territories[t.id];
            const infl=(ts?.influences??{}) as Partial<Record<Faction,number>>;
            const units=ts?.units??{};
            const ctrl=getController(infl as Record<Faction,number>);
            const isSel=selectedTerritory===t.id;
            const isHov=hovered===t.id;
            let totalUnits=0;
            for (const um of Object.values(units))
              for (const q of Object.values(um??{})) totalUnits+=q??0;
            return (
              <g key={t.id}
                style={{cursor:isMyTurn?'pointer':'default'}}
                onClick={()=>onSelectTerritory?.(t.id)}
                onMouseEnter={()=>setHovered(t.id)}
                onMouseLeave={()=>setHovered(null)}>
                <polygon points={p(t.pts)}
                  fill={isSel?(ctrl?FC_BG[ctrl]:'#ffffff22'):
                        isHov?(ctrl?FC_BG[ctrl]:'#ffffff12'):
                        ctrl?FC_BG[ctrl]:'transparent'}
                  stroke={isSel?'#00ff88':ctrl?FC[ctrl]:isHov?'#ffffff55':'transparent'}
                  strokeWidth={isSel?3:2} strokeLinejoin="round"
                  opacity={attackMode&&!isSel?0.45:1}/>
                {isSel&&<polygon points={p(t.pts)} fill="none"
                  stroke="#00ff88" strokeWidth={9} opacity={0.15}
                  style={{filter:'blur(6px)'}}/>}
                {t.type==='casa'&&t.homeFaction&&
                  <circle cx={t.cubeAnchor[0]} cy={t.cubeAnchor[1]-30}
                    r={10} fill={FC[t.homeFaction]} opacity={0.9}
                    style={{pointerEvents:'none'}}/>}
                <CubeGrid initialCubes={t.initialCubes} influences={infl} anchor={t.cubeAnchor}/>
                {totalUnits>0&&
                  <g style={{pointerEvents:'none'}}>
                    <circle cx={t.cubeAnchor[0]+34} cy={t.cubeAnchor[1]-26}
                      r={13} fill="#1e293b" stroke="#f59e0b" strokeWidth={2}/>
                    <text x={t.cubeAnchor[0]+34} y={t.cubeAnchor[1]-21}
                      textAnchor="middle" fill="#f59e0b"
                      fontSize={11} fontWeight="bold" fontFamily="monospace">
                      {totalUnits}
                    </text>
                  </g>}
              </g>
            );
          })}

          {isMyTurn&&
            <g transform="translate(430,14)">
              <rect x={0} y={0} width={620} height={32} rx={8}
                fill="#00ff8818" stroke="#00ff88" strokeWidth={1.2}/>
              <text x={16} y={22} fill="#00ff88" fontSize={13}
                fontFamily="monospace" fontWeight="bold">
                ▶ IL TUO TURNO — Clicca un territorio
              </text>
            </g>}
          {attackMode&&
            <g transform="translate(430,52)">
              <rect x={0} y={0} width={620} height={32} rx={8}
                fill="#ef444418" stroke="#ef4444" strokeWidth={1.2}/>
              <text x={16} y={22} fill="#ef4444" fontSize={13}
                fontFamily="monospace" fontWeight="bold">
                ⚔️ ATTACCO — Seleziona il bersaglio
              </text>
            </g>}

          <g transform="translate(18,880)">
            <rect x={0} y={0} width={158} height={122} rx={8}
              fill="#060d18e0" stroke="#1e3a5f" strokeWidth={1.2}/>
            <text x={10} y={18} fill="#94a3b8" fontSize={9}
              fontFamily="monospace" fontWeight="bold" letterSpacing="2">INFLUENZE</text>
            {FACTIONS.map((f,i)=>(
              <g key={f} transform={`translate(10,${27+i*19})`}>
                <rect x={0} y={-12} width={14} height={14} rx={3} fill={FC[f]} opacity={0.92}/>
                <text x={19} y={0} fill={FC[f]} fontSize={10} fontFamily="monospace">{f}</text>
              </g>
            ))}
          </g>

          {hovered&&(()=>{
            const t=TERR_DEF.find(d=>d.id===hovered)!;
            const ts=territories[hovered];
            const infl=(ts?.influences??{}) as Partial<Record<Faction,number>>;
            return <Tooltip terr={t} influences={infl} mx={mPos[0]} my={mPos[1]}/>;
          })()}
        </svg>
      </div>
    </div>
  );
}

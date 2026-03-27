// =============================================
// LINEA ROSSA — TerritoryMap
// Poligoni rilevati con algoritmo Watershed dall'immagine originale 1920×1071
// cubeAnchor = pixel interni misurati per campionamento diretto (temperatura 0)
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
// TERRITORI — poligoni watershed + anchor da campionamento pixel
// ─────────────────────────────────────────────────────────────────────────
const TERR_DEF: TerrDef[] = [

  { id: 'Turchia', label: 'TURCHIA',
    pts: [[735,98],[671,97],[635,61],[76,63],[75,135],[185,155],[210,196],
          [189,220],[220,232],[229,274],[309,295],[353,269],[417,299],[459,291],
          [493,242],[547,252],[548,280],[686,269],[674,217],[710,209],[643,166]],
    cubeAnchor: [350, 130],
    initialCubes: 4, pvPerRound: 1, type: 'normale' },

  { id: 'Siria', label: 'SIRIA',
    pts: [[757,261],[547,274],[533,247],[480,266],[498,288],[414,301],[345,271],
          [322,294],[329,341],[399,342],[452,320],[451,342],[541,348],[556,364],
          [545,382],[618,401],[710,356],[718,291]],
    cubeAnchor: [530, 270],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Libano', label: 'LIBANO',
    pts: [[508,248],[496,242],[483,253],[464,258],[463,275],[470,278],
          [474,290],[486,285],[506,286],[503,280],[492,276],[480,264],[509,250]],
    cubeAnchor: [475, 272],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Israele', label: 'ISRAELE',
    pts: [[326,296],[325,458],[381,458],[407,471],[444,471],[466,464],[484,439],
          [494,402],[508,384],[516,358],[527,352],[524,342],[461,342],[458,326],
          [474,313],[456,323],[423,323],[399,334],[394,343],[332,343],[326,339]],
    cubeAnchor: [442, 390],
    initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Coalizione' },

  { id: 'Giordania', label: 'GIORDANIA',
    pts: [[529,349],[518,357],[510,384],[496,402],[481,449],[462,468],[474,488],
          [486,536],[531,541],[555,520],[582,514],[597,497],[572,464],[637,446],
          [644,434],[629,399],[618,402],[610,391],[549,383],[552,361],[543,350]],
    cubeAnchor: [555, 430],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'Egitto', label: 'EGITTO',
    pts: [[122,514],[160,511],[173,513],[359,517],[355,482],[399,469],
          [324,457],[324,296],[226,264],[221,233],[188,212],[208,214],[122,514]],
    cubeAnchor: [175, 419],
    initialCubes: 4, pvPerRound: 1, type: 'normale' },

  { id: 'Iraq', label: 'IRAQ',
    pts: [[661,130],[673,161],[632,170],[660,179],[659,206],[699,210],[673,217],
          [677,266],[756,262],[720,291],[720,341],[893,335],[899,310],[864,299],
          [829,233],[825,186],[844,170],[806,154],[802,121],[731,106]],
    cubeAnchor: [810, 280],
    initialCubes: 3, pvPerRound: 1, type: 'normale' },

  { id: 'Iran', label: 'IRAN',
    pts: [[1611,234],[1329,69],[1283,64],[1251,97],[1040,296],[1071,309],
          [1066,339],[1090,356],[1340,340],[1419,340],[1477,323]],
    cubeAnchor: [1150, 226],
    initialCubes: 6, pvPerRound: 3, type: 'casa', homeFaction: 'Iran', isNaval: true },

  { id: 'Kuwait', label: 'KUWAIT',
    pts: [[718,408],[832,408],[840,432],[835,458],[812,472],
          [782,475],[752,468],[730,450],[722,428]],
    cubeAnchor: [762, 458],
    initialCubes: 2, pvPerRound: 1, type: 'normale' },

  { id: 'ArabiaSaudita', label: 'ARABIA S.',
    pts: [[903,549],[643,443],[531,543],[461,469],[560,781],
          [600,714],[688,803],[672,612],[857,653]],
    cubeAnchor: [640, 586],
    initialCubes: 4, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'EmiratiArabi', label: 'UAE',
    pts: [[928,510],[921,513],[791,513],[835,542],[854,543],
          [902,546],[906,545],[906,542],[916,531]],
    cubeAnchor: [874, 530],
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'Oman', label: 'OMAN',
    pts: [[866,587],[859,650],[914,682],[912,695],[978,680],[1013,661],
          [1038,655],[1032,625],[987,591],[976,564],[947,566],[936,550],[903,547]],
    cubeAnchor: [957, 632],
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true },

  { id: 'StrettoHormuz', label: 'HORMUZ',
    pts: [[975,445],[1068,443],[1072,478],[1058,492],[988,490],[968,472]],
    cubeAnchor: [1022, 466],
    initialCubes: 0, pvPerRound: 2, type: 'strategico', isNaval: true },

  { id: 'Yemen', label: 'YEMEN',
    pts: [[674,612],[676,757],[692,801],[670,847],[699,864],[930,690],
          [824,644],[816,615],[795,615],[771,628],[764,615],[728,624],[710,602]],
    cubeAnchor: [770, 725],
    initialCubes: 2, pvPerRound: 1, type: 'normale', isNaval: true },
];

// ── Griglia cubi influenza ────────────────────────────────────────────────
function CubeGrid({ initialCubes, influences, anchor }: {
  initialCubes: number;
  influences: Partial<Record<Faction, number>>;
  anchor: [number, number];
}) {
  const C = 18, G = 4, PR = 3;
  const slots: Array<Faction | null> = [];
  for (const f of FACTIONS) for (let i = 0; i < (influences[f] ?? 0); i++) slots.push(f);
  const empty = Math.max(0, initialCubes - slots.length);
  for (let i = 0; i < empty; i++) slots.push(null);
  if (!slots.length) return null;
  const cols = Math.min(slots.length, PR), rows = Math.ceil(slots.length / PR);
  const gW = cols*C+(cols-1)*G, gH = rows*C+(rows-1)*G;
  const ox = anchor[0]-gW/2, oy = anchor[1]-gH/2;
  return (
    <g style={{pointerEvents:'none'}}>
      {slots.map((f,i) => {
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
  terr: TerrDef; influences: Partial<Record<Faction, number>>; mx:number; my:number;
}) {
  const ctrl = getController(influences as Record<Faction, number>);
  const rows = FACTIONS.filter(f => (influences[f]??0)>0);
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
  const [hovered, setHovered] = useState<TerritoryId | null>(null);
  const [mPos, setMPos] = useState<[number,number]>([0,0]);

  const onMM = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMPos([(e.clientX-r.left)*(1920/r.width),(e.clientY-r.top)*(1071/r.height)]);
  };

  return (
    <div className="relative w-full select-none" style={{paddingBottom:'55.8%'}}>
      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
        <svg viewBox="0 0 1920 1071" className="w-full h-full"
          style={{display:'block'}} onMouseMove={onMM}>

          <image href="/plancia_map.png" x={0} y={0}
            width={1920} height={1071} preserveAspectRatio="xMidYMid slice"/>

          {TERR_DEF.map(t => {
            const ts   = territories[t.id];
            const infl = (ts?.influences??{}) as Partial<Record<Faction,number>>;
            const units= ts?.units??{};
            const ctrl = getController(infl as Record<Faction,number>);
            const isSel= selectedTerritory===t.id;
            const isHov= hovered===t.id;
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

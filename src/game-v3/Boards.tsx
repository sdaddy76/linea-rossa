import {useEffect, useState, type ReactNode} from 'react';
import {TERRITORIES, UNITS} from './catalog';
import {FACTIONS, TRACKS, type Faction, type GlobalTrack, type Track} from './catalog-types';
import {unitFrontArt} from './art';

export const COLORS: Record<Faction,string> = {Iran:'#4ade80',Coalizione:'#60a5fa',Russia:'#f87171',Cina:'#fbbf24',Europa:'#c4b5fd'};
export const SHORT: Record<Faction,string> = {Iran:'IR',Coalizione:'CO',Russia:'RU',Cina:'CN',Europa:'EU'};
const SPOTS: Record<string,[number,number]> = {
  turchia:[29.7,23],siria:[41.1,32.9],libano:[30.9,35.7],israele:[32,44.7],
  giordania:[40,42.9],egitto:[25.4,55.5],iraq:[54.7,34.5],iran:[71.3,31.2],
  kuwait:[62,45.4],bahrein:[64.8,53.3],qatar:[71,58.5],emirati:[68.4,66.4],
  oman:[79.4,70.5],'arabia-saudita':[48.3,55.1],hormuz:[76.6,53.4],yemen:[62.2,75.4],
};
export interface BoardUnit {id:string;faction:Faction;type:string;territory:string;deployedAt:number}
function Point({x,y,label,color,children}: {x:number;y:number;label:string;color:string;children:ReactNode}) {
  return <span title={label} aria-label={label} style={{left:`${x}%`,top:`${y}%`,background:color,transition:'left var(--guide-duration, 400ms) ease, top var(--guide-duration, 400ms) ease'}}
    className="absolute -translate-x-1/2 -translate-y-1/2 rounded border border-white text-black font-black text-[clamp(6px,0.7vw,12px)] px-[0.3%] min-w-[1.4%] text-center shadow-md pointer-events-none">{children}</span>;
}
function scorePoint(score:number):[number,number] {
  const n=Math.min(100,Math.max(0,score));
  if(n===0)return [3.4,3.3];
  if(n<=25)return [9.7+(n-1)*3.67,3.3];
  if(n<=50)return [97.2,8.5+(n-26)*3.48];
  if(n<=75)return [94.1-(n-51)*3.67,96.7];
  return [2.9,91.7-(n-76)*3.48];
}
export function TabletopBoard({globals,round,elapsed,units,pv,selected,onSelect}: {
  globals:Record<GlobalTrack,number>;round:number;elapsed:number;units:BoardUnit[];
  pv:Record<Faction,number>;selected:string;onSelect:(id:string)=>void;
}) {
  return <div>
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <div className="relative min-w-[780px]">
        <img data-image-slot="tabletop.board" src="/assets/tabletop-v3/board.jpg" alt="Tabellone ufficiale: territori, allineamenti, PV e tracciati globali" className="w-full h-auto"/>
        <Point x={8.2} y={74.8-(globals.Nucleare-1)*3.58} label={`Nucleare ${globals.Nucleare}`} color="#facc15">{globals.Nucleare}</Point>
        <Point x={85.8} y={51.6-(globals.Sanzioni-1)*3.01} label={`Sanzioni ${globals.Sanzioni}`} color="#fb923c">{globals.Sanzioni}</Point>
        <Point x={85.1} y={61.2+(globals['Crisi Bellica']-1)*2.62} label={`Crisi Bellica ${globals['Crisi Bellica']}`} color="#f87171">{globals['Crisi Bellica']}</Point>
        <Point x={18.9+(globals.Opinione+10)*3.54} y={89.9} label={`Opinione ${globals.Opinione}`} color="#f9a8d4">{globals.Opinione}</Point>
        <Point x={46.7+(round-1)*1.94} y={82.4} label={`Round ${round}, ${elapsed} round effettivi`} color="#fef08a">R</Point>
        {FACTIONS.map((f,i)=>{const [x,y]=scorePoint(pv[f]);return <Point key={f} x={x+(i-2)*0.25} y={y+(i-2)*0.55} label={`${f}: ${pv[f]} PV`} color={COLORS[f]}>{SHORT[f]}</Point>;})}
        {TERRITORIES.map(t=>{
          const pos=SPOTS[t.id];if(!pos)return null;
          const local=units.filter(u=>u.territory===t.id);
          return <div key={t.id} style={{left:`${pos[0]}%`,top:`${pos[1]}%`,width:`${t.capacity*1.62}%`}} className="absolute -translate-x-1/2 -translate-y-1/2 flex gap-px">
            {Array.from({length:t.capacity},(_,i)=>{const u=local[i];return <button key={i} onClick={()=>onSelect(t.id)} aria-label={`${t.name}, riquadro ${i+1}: ${u?`${u.faction}, ${UNITS.find(d=>d.id===u.type)?.name??u.type}`:'libero'}`}
              title={`${t.name}${u?` · ${u.faction} · ${u.deployedAt<elapsed?'ruotata, rientra a fine round':'nuova'}`:''}`}
              className={`aspect-square flex-1 rounded-sm border focus-visible:outline-white ${selected===t.id?'ring-1 ring-yellow-300':'border-transparent'}`}
              style={{background:u?COLORS[u.faction]:'transparent',transform:u&&u.deployedAt<elapsed?'rotate(90deg)':'none',color:'#020617'}}>
              {u&&<img src={unitFrontArt(u.type)} alt={`${u.faction}: ${UNITS.find(d=>d.id===u.type)?.name??u.type}`} className="block w-full h-full object-contain" />}
            </button>;})}
          </div>;
        })}
      </div>
    </div>
    <p className="my-2 text-xs text-slate-400">Scorri orizzontalmente su schermi piccoli. Seleziona un riquadro o un territorio qui sotto. Le unità ruotate rientrano a fine round.</p>
    <div className="flex flex-wrap gap-2">{TERRITORIES.map(t=><button key={t.id} onClick={()=>onSelect(t.id)} aria-pressed={selected===t.id} className={`text-xs rounded-lg border px-3 py-2 ${selected===t.id?'border-emerald-400 bg-emerald-950':'border-slate-700 bg-slate-900'}`}>{t.name} · {units.filter(u=>u.territory===t.id).length}/{t.capacity}</button>)}</div>
  </div>;
}
export function FactionBoard({faction,tracks,pv}: {faction:Faction;tracks:Record<Track,number>;pv:number}) {
  return <div className="overflow-x-auto rounded-xl border border-slate-700">
    <div className="relative min-w-[700px]">
      <FactionArtwork faction={faction}/>
      {TRACKS.map((track,i)=><Point key={track} x={(i%2===0?4.6:53.25)+(tracks[track]-1)*4.67} y={i<2?22.3:40.85} label={`${track} ${tracks[track]}`} color={COLORS[faction]}>{tracks[track]}</Point>)}
      <Point x={91.8} y={93.3} label={`${pv} PV`} color={COLORS[faction]}>{pv} PV</Point>
    </div>
  </div>;
}
function FactionArtwork({faction}: {faction:Faction}) {
  switch(faction) {
    case 'Iran': return <img data-image-slot="tabletop.board.iran" src="/assets/tabletop-v3/boards/Iran.jpg" alt="Plancia Iran" className="w-full h-auto"/>;
    case 'Coalizione': return <img data-image-slot="tabletop.board.coalizione" src="/assets/tabletop-v3/boards/Coalizione.jpg" alt="Plancia Coalizione" className="w-full h-auto"/>;
    case 'Russia': return <img data-image-slot="tabletop.board.russia" src="/assets/tabletop-v3/boards/Russia.jpg" alt="Plancia Russia" className="w-full h-auto"/>;
    case 'Cina': return <img data-image-slot="tabletop.board.cina" src="/assets/tabletop-v3/boards/Cina.jpg" alt="Plancia Cina" className="w-full h-auto"/>;
    case 'Europa': return <img data-image-slot="tabletop.board.europa" src="/assets/tabletop-v3/boards/Europa.jpg" alt="Plancia Europa" className="w-full h-auto"/>;
  }
}
export function UnitImage({id,name}: {id:string;name:string}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
    window.addEventListener('keydown',close);
    return ()=>window.removeEventListener('keydown',close);
  },[open]);
  return <>
    <button className="relative block w-full" onClick={()=>setOpen(true)} aria-label={`Ingrandisci ${name}`}>
      <img src={unitFrontArt(id)} alt={name} className="w-full h-auto object-contain" loading="lazy"/>
      {id==='IR-U04'&&<span className="absolute bottom-0 inset-x-0 bg-slate-950 text-[10px] px-2 py-1 text-white">Solo attacco · Lo Scudo annulla il bonus · Max 2 per territorio</span>}
    </button>
    {open&&<div role="dialog" aria-modal="true" aria-label={name} className="fixed inset-0 z-50 bg-black/95 overflow-auto p-5">
      <button autoFocus onClick={()=>setOpen(false)} className="rounded border bg-slate-800 px-4 py-2 mb-4">Chiudi {name}</button>
      <div className="relative max-w-2xl mx-auto"><img src={unitFrontArt(id)} alt={name} className="w-full h-auto"/>{id==='IR-U04'&&<p className="absolute bottom-0 inset-x-0 bg-slate-950 p-4 text-white">Solo attacco. Lo Scudo Missilistico difendente annulla il bonus +4. Massimo 2 per territorio.</p>}</div>
    </div>}
  </>;
}

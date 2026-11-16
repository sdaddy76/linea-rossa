import {useEffect, useState, type ReactNode} from 'react';
import {TERRITORIES, UNITS} from './catalog';
import {FACTIONS, TRACKS, type Faction, type GlobalTrack, type Track} from './catalog-types';
import {BOARD_ART, factionBoardArt, unitFrontArt} from './art';
import {territorySlot} from './board-layout';
import {occupiedSlots, territoryController, type PlacedInfluence, type EngineState} from './engine';

export const COLORS: Record<Faction,string> = {Iran:'#4ade80',Coalizione:'#60a5fa',Russia:'#f87171',Cina:'#fbbf24',Europa:'#c4b5fd'};
export const SHORT: Record<Faction,string> = {Iran:'IR',Coalizione:'CO',Russia:'RU',Cina:'CN',Europa:'EU'};
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
function turnMarkerPoint(position:number):[number,number] {
  const n=Math.min(100,Math.max(0,position));
  if(n===0)return [4.2,3.2];
  if(n<=25)return [8.5+(n-1)*3.7,3.2];
  if(n<=50)return [97.3,8.2+(n-26)*3.48];
  if(n<=75)return [96.5-(n-51)*3.72,96.7];
  return [3.1,91.7-(n-76)*3.48];
}
export function TabletopBoard({globals,round,elapsed,units,influence=[],gameState,pv,selected,onSelect}: {
  globals:Record<GlobalTrack,number>;round:number;elapsed:number;units:BoardUnit[];
  influence?:PlacedInfluence[]; gameState?:EngineState;
  pv:Record<Faction,number>;selected:string;onSelect:(id:string)=>void;
}) {
  const [zoom,setZoom]=useState(100);
  const territory=TERRITORIES.find(t=>t.id===selected);
  return <section aria-label="Mappa delle unità schierate" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-bold text-lg">Plancia generale · unità sui territori</h2>
        <p className="text-sm text-slate-300" aria-live="polite">{territory?.name} · {territory ? occupiedSlots(gameState ?? ({rulesRevision:'2026-11-16',units:units.map(u=>({...u,placedRound:u.deployedAt,rotated:false})),influence} as EngineState), selected).length : 0}/{territory?.capacity} riquadri occupati{territory && gameState && ` · controllo: ${territoryController(gameState, selected) ?? 'conteso'}`}</p></div>
      <div role="group" aria-label="Zoom della mappa" className="flex gap-2">
        {[100,150,200].map(value=><button key={value} type="button" aria-pressed={zoom===value} onClick={()=>setZoom(value)}
          className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-white ${zoom===value?'border-emerald-400 bg-emerald-950':'border-slate-600 bg-slate-900'}`}>{value}%</button>)}
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-700" tabIndex={0} role="region" aria-label="Tabellone scorrevole">
      <div data-board-map style={{width:`${zoom}%`,minWidth:`${1040*zoom/100}px`}} className="relative">
        <img data-image-slot="tabletop.board" src={BOARD_ART} alt="Tabellone ufficiale: territori, allineamenti, PV e tracciati globali" className="w-full h-auto"/>
        <Point x={8.2} y={74.8-(globals.Nucleare-1)*3.58} label={`Nucleare ${globals.Nucleare}`} color="#facc15">{globals.Nucleare}</Point>
        <Point x={85.8} y={51.6-(globals.Sanzioni-1)*3.01} label={`Sanzioni ${globals.Sanzioni}`} color="#fb923c">{globals.Sanzioni}</Point>
        <Point x={85.1} y={61.2+(globals['Crisi Bellica']-1)*2.62} label={`Crisi Bellica ${globals['Crisi Bellica']}`} color="#f87171">{globals['Crisi Bellica']}</Point>
        <Point x={18.9+(globals.Opinione+10)*3.54} y={89.9} label={`Opinione ${globals.Opinione}`} color="#f9a8d4">{globals.Opinione}</Point>
        {gameState?.rulesRevision === '2026-11-16' && (()=>{const [x,y]=turnMarkerPoint(gameState.turnMarker??0);return <Point x={x} y={y} label={`Segna-turni ${gameState.turnMarker??0}`} color="#fef08a">T</Point>;})()}
        {gameState?.rulesRevision !== '2026-11-16' && FACTIONS.map((f,i)=>{const [x,y]=scorePoint(pv[f]);return <Point key={f} x={x+(i-2)*0.25} y={y+(i-2)*0.55} label={`${f}: ${pv[f]} PV`} color={COLORS[f]}>{SHORT[f]}</Point>;})}
        {TERRITORIES.flatMap(t=>{
          const local=units.filter(u=>u.territory===t.id);
          const localInfluence=influence.filter(i=>i.territory===t.id);
          return Array.from({length:t.capacity},(_,i)=>{
            const u=local.find(unit=>unit.slot===i) ?? (local.every(unit=>unit.slot===undefined) ? local[i] : undefined);
            const marker=localInfluence.find(item=>item.slot===i), pos=territorySlot(t.id,i);
            const name=u?(UNITS.find(d=>d.id===u.type)?.name??u.type):'';
            const rotated=!!u&&u.deployedAt<elapsed;
            return <button key={`${t.id}-${i}`} type="button" onClick={()=>onSelect(t.id)}
              data-territory={t.id} data-slot={i+1} data-unit-id={u?.id} data-influence-id={marker?.id} data-faction={u?.faction ?? marker?.faction} data-rotated={u?rotated:undefined}
              aria-pressed={selected===t.id}
              aria-label={`${t.name}, riquadro ${i+1}: ${u?`${u.faction}, ${name}${rotated?', ruotata':''}`:marker?`Influenza ${marker.faction}`:'libero'}`}
              title={`${t.name} · ${u?`${u.faction} · ${name} · ${rotated?'ruotata, rientra a fine round':'nuova'}`:marker?`Influenza ${marker.faction} · permanente`:'riquadro libero: seleziona questo territorio'}`}
              className={`absolute min-w-0 p-0 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${selected===t.id?'ring-2 ring-yellow-300':'hover:ring-2 hover:ring-white'}`}
              style={{left:`${pos.x}%`,top:`${pos.y}%`,width:'1.5%',height:'2.25%',background:u?COLORS[u.faction]:marker?COLORS[marker.faction]:'transparent',borderColor:u?COLORS[u.faction]:marker?COLORS[marker.faction]:'transparent'}}>
              {u&&<><img src={unitFrontArt(u.type)} alt={`${u.faction}: ${name}`} draggable={false}
                className="block w-full h-full object-contain" style={{transform:rotated?'rotate(90deg)':'none'}}/>
                <span aria-hidden="true" className="absolute -bottom-1 -right-1 rounded-sm px-0.5 leading-tight font-black text-slate-950"
                  style={{background:COLORS[u.faction],fontSize:'clamp(6px, 0.6vw, 10px)'}}>{SHORT[u.faction]}</span></>}
              {!u&&marker&&<span className="block text-slate-950 font-black text-[clamp(7px,0.8vw,12px)]" aria-hidden="true">I</span>}
            </button>;
          });
        })}
      </div>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Colori delle fazioni">{FACTIONS.map(f=><span key={f} style={{color:COLORS[f]}}>{SHORT[f]} · {f} · {units.filter(u=>u.faction===f).length} unità</span>)}</div>
    <p className="my-2 text-xs text-slate-400">Unità e Influenza condividono i riquadri; l’Influenza è permanente. Seleziona un territorio sulla mappa per le operazioni. Le unità ruotate rientrano a fine round.</p>
    <div data-board-territories className="flex flex-wrap gap-2">{TERRITORIES.map(t=><button key={t.id} onClick={()=>onSelect(t.id)} aria-pressed={selected===t.id} className={`text-xs rounded-lg border px-3 py-2 ${selected===t.id?'border-emerald-400 bg-emerald-950':'border-slate-700 bg-slate-900'}`}>{t.name} · {units.filter(u=>u.territory===t.id).length}/{t.capacity}</button>)}</div>
  </section>;
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
    case 'Iran': return <img data-image-slot="tabletop.board.iran" src={factionBoardArt(faction)} alt="Plancia Iran" className="w-full h-auto"/>;
    case 'Coalizione': return <img data-image-slot="tabletop.board.coalizione" src={factionBoardArt(faction)} alt="Plancia Coalizione" className="w-full h-auto"/>;
    case 'Russia': return <img data-image-slot="tabletop.board.russia" src={factionBoardArt(faction)} alt="Plancia Russia" className="w-full h-auto"/>;
    case 'Cina': return <img data-image-slot="tabletop.board.cina" src={factionBoardArt(faction)} alt="Plancia Cina" className="w-full h-auto"/>;
    case 'Europa': return <img data-image-slot="tabletop.board.europa" src={factionBoardArt(faction)} alt="Plancia Europa" className="w-full h-auto"/>;
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

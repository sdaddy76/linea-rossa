import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {TERRITORIES, UNITS} from './catalog';
import {FACTIONS, TRACKS, type Faction, type GlobalTrack, type Track} from './catalog-types';
import {BOARD_ART, factionBoardArt, unitFrontArt} from './art';
import {territorySlot,perimeterPoint,globalTrackPoint,unitStackPoint,unitAnchorDescription,UNIT_ANCHORS,UNIT_TOKEN} from './board-layout';
import {occupiedSlots, territoryController, usesOfficialRules, usesLatestRules, type PlacedInfluence, type EngineState} from './engine';

export const COLORS: Record<Faction,string> = {Iran:'#4ade80',Coalizione:'#60a5fa',Russia:'#f87171',Cina:'#fbbf24',Europa:'#c4b5fd'};
export const SHORT: Record<Faction,string> = {Iran:'IR',Coalizione:'CO',Russia:'RU',Cina:'CN',Europa:'EU'};
export interface BoardUnit {id:string;faction:Faction;type:string;territory:string;deployedAt:number;slot?:number;rotated?:boolean}
function Point({x,y,label,color,children}: {x:number;y:number;label:string;color:string;children:ReactNode}) {
  return <span data-track-point title={label} aria-label={label} style={{left:`${x}%`,top:`${y}%`,background:color,transform:'translate(-50%, -50%)',transition:'left var(--guide-duration, 400ms) ease, top var(--guide-duration, 400ms) ease'}}
    className="absolute rounded border border-white text-black font-black text-[clamp(7px,0.7vw,12px)] px-1 min-w-4 text-center leading-tight shadow-md pointer-events-none">{children}</span>;
}
export function TabletopBoard({globals,elapsed,units,influence=[],gameState,pv,selected,onSelect}: {
  globals:Record<GlobalTrack,number>;round:number;elapsed:number;units:BoardUnit[];
  influence?:PlacedInfluence[]; gameState?:EngineState;
  pv:Record<Faction,number>;selected:string;onSelect:(id:string)=>void;
}) {
  const [zoom,setZoom]=useState(100);
  const [openStack,setOpenStack]=useState<{territory:string;faction:Faction}|null>(null);
  useEffect(()=>{ if(!openStack) return; const close=(e:KeyboardEvent)=>{ if(e.key==='Escape') setOpenStack(null); }; window.addEventListener('keydown',close); return ()=>window.removeEventListener('keydown',close); },[openStack]);
  const latest = !!gameState && usesLatestRules(gameState);
  const territory=TERRITORIES.find(t=>t.id===selected);
  const perimeterMarkers=FACTIONS.map(f=>({value:pv[f],label:`${f}: ${pv[f]} PV`,text:SHORT[f],color:COLORS[f]}));
  if(gameState&&usesOfficialRules(gameState))perimeterMarkers.push({value:gameState.turnMarker??0,label:`Segna-turni ${gameState.turnMarker??0}`,text:'T',color:'#fef08a'});
  const markerCells=[...new Set(perimeterMarkers.map(m=>Math.min(100,Math.max(0,Math.floor(m.value)))))];
  return <section aria-label="Mappa delle unità schierate" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-bold text-lg">Plancia generale · unità sui territori</h2>
        <p className="text-sm text-slate-300" aria-live="polite">{territory?.name} · {territory ? occupiedSlots(gameState ?? {rulesRevision:'2026-11-16',units:units.map(u=>({...u,placedRound:u.deployedAt,rotated:false})),influence}, selected).length : 0}/{territory?.capacity} riquadri occupati{territory && gameState && ` · controllo: ${territoryController(gameState, selected) ?? 'conteso'}`}</p></div>
      <div role="group" aria-label="Zoom della mappa" className="flex gap-2">
        {[100,150,200].map(value=><button key={value} type="button" aria-pressed={zoom===value} onClick={()=>setZoom(value)}
          className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-white ${zoom===value?'border-emerald-400 bg-emerald-950':'border-slate-600 bg-slate-900'}`}>{value}%</button>)}
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-700" tabIndex={0} role="region" aria-label="Tabellone scorrevole">
      <div data-board-map style={{width:`${zoom}%`,minWidth:zoom===100?undefined:`${Math.round(640*zoom/100)}px`}} className="relative">
        <img data-image-slot="tabletop.board" src={BOARD_ART} alt="Tabellone ufficiale: territori, allineamenti, PV e tracciati globali" className="w-full h-auto"/>
        {(['Nucleare','Sanzioni','Crisi Bellica','Opinione'] as GlobalTrack[]).map((track,i)=><Point key={track}
          {...globalTrackPoint(track,globals[track])} label={`${track} ${globals[track]}`} color={['#facc15','#fb923c','#f87171','#f9a8d4'][i]}>{globals[track]}</Point>)}
        {markerCells.map(value=>{
          const markers=perimeterMarkers.filter(m=>Math.min(100,Math.max(0,Math.floor(m.value)))===value),pos=perimeterPoint(value);
          return <span key={value} data-track-cell={value} data-track-point
            className="absolute grid place-items-center gap-px pointer-events-none"
            style={{left:`${pos.x}%`,top:`${pos.y}%`,transform:'translate(-50%, -50%)',gridTemplateColumns:`repeat(${Math.min(3,markers.length)},auto)`}}>
            {markers.map(m=><span key={m.label} title={m.label} aria-label={m.label}
              className="rounded-sm border border-white px-0.5 text-center text-black font-black leading-tight shadow-sm"
              style={{background:m.color,fontSize:'clamp(6px,0.65vw,11px)',minWidth:markers.length===1?'18px':'12px'}}>{m.text}</span>)}
          </span>;
        })}
        {TERRITORIES.flatMap(t=>{
          const local=latest ? [] : units.filter(u=>u.territory===t.id);
          const localInfluence=influence.filter(i=>i.territory===t.id);
          return Array.from({length:t.capacity},(_,i)=>{
            const u=local.find(unit=>unit.slot===i) ?? (local.every(unit=>unit.slot===undefined) ? local[i] : undefined);
            const marker=localInfluence.find(item=>item.slot===i), pos=territorySlot(t.id,i);
            const name=u?(UNITS.find(d=>d.id===u.type)?.name??u.type):'';
            const rotated=!!u&&(u.rotated ?? u.deployedAt<elapsed);
            return <button key={`${t.id}-${i}`} type="button" onClick={()=>onSelect(t.id)}
              data-territory={t.id} data-slot={i+1} data-unit-id={u?.id} data-influence-id={marker?.id} data-faction={u?.faction ?? marker?.faction} data-rotated={u?rotated:undefined}
              aria-pressed={selected===t.id}
              aria-label={`${t.name}, riquadro ${i+1}: ${u?`${u.faction}, ${name}${rotated?', ruotata':''}`:marker?`Influenza ${marker.faction}`:'libero'}`}
              title={`${t.name} · ${u?`${u.faction} · ${name} · ${rotated?'ruotata, rientra a fine round salvo Mantenimento':'attiva'}`:marker?`Influenza ${marker.faction} · permanente`:'riquadro libero: seleziona questo territorio'}`}
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
        {latest && TERRITORIES.flatMap(t => {
          const present = FACTIONS.filter(f => units.some(u => u.territory === t.id && u.faction === f));
          return present.map((f, index) => {
          const stack = units.filter(u => u.territory === t.id && u.faction === f);
          // In uno spazio libero della mappa: nomi, città e allineamenti restano leggibili.
          const position = unitStackPoint(t.id, index, present.length);
          const rotated = stack.every(u => u.rotated);
          const label = `${t.name}: ${f}, ${stack.length} unità`;
          return <button key={`${t.id}-${f}-units`} data-unit-stack={t.id} data-faction={f}
            aria-label={label} title={label + ' · ' + stack.map(u => (UNITS.find(d => d.id === u.type)?.name ?? u.type) + (u.rotated ? ' (ruotata)' : '')).join(', ')}
            onClick={()=>{onSelect(t.id);setOpenStack({territory:t.id,faction:f});}} aria-haspopup="dialog"
            className="board-unit-stack absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 shadow-md shadow-black/70 hover:scale-150 hover:z-10 focus-visible:scale-150 focus-visible:z-10 transition-transform focus-visible:outline-white"
            style={{left:`${position.x}%`,top:`${position.y}%`,width:`${UNIT_TOKEN.width}%`,height:`${UNIT_TOKEN.height}%`,borderColor:COLORS[f],background:COLORS[f]}}>
            <img src={unitFrontArt(stack[0].type)} alt="" className="w-full h-full object-contain" style={{transform:rotated?'rotate(90deg)':'none'}}/>
            {stack.length>1&&<span className="absolute -top-1.5 -right-1.5 min-w-[1.2em] text-center text-slate-950 font-black leading-tight rounded-full border border-slate-950"
              style={{background:COLORS[f],fontSize:'clamp(6px,0.55vw,11px)'}}>{stack.length}</span>}
          </button>;
          });
        })}
      </div>
    </div>
    {openStack && (()=>{
      const t=TERRITORIES.find(x=>x.id===openStack.territory)!, stack=units.filter(u=>u.territory===openStack.territory&&u.faction===openStack.faction);
      return <div role="dialog" aria-modal="true" aria-label={`Unità di ${openStack.faction} in ${t.name}`} className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4" onClick={()=>setOpenStack(null)}>
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-5 space-y-4" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold"><span style={{color:COLORS[openStack.faction]}}>{openStack.faction}</span> · {t.name} · {stack.length} {stack.length===1?'unità':'unità'}</h3>
            <button autoFocus className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm" onClick={()=>setOpenStack(null)}>Chiudi</button></div>
          <BoardLocator territory={t.id} name={t.name} capacity={t.capacity} faction={openStack.faction}/>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{stack.map(u=>{const d=UNITS.find(x=>x.id===u.type);return <figure key={u.id} className="rounded-lg border border-slate-700 p-2 space-y-1">
            <img src={unitFrontArt(u.type)} alt={d?.name??u.type} className="w-full h-auto rounded" style={{transform:u.rotated?'rotate(90deg)':'none'}}/>
            <figcaption className="text-sm"><strong>{d?.name??u.type}</strong><br/><span className="text-xs text-slate-400">{u.rotated?'Ruotata: rientra a fine round, salvo Mantenimento':'Attiva'} · {u.id}</span>
              {d&&<span className="block text-xs text-slate-300 mt-1">{d.effect}</span>}</figcaption></figure>;})}</div>
        </div></div>;})()}
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Colori delle fazioni">{FACTIONS.map(f=><span key={f} className="faction-legend-item" style={{'--faction-color':COLORS[f]} as CSSProperties}>{SHORT[f]} · {f} · {units.filter(u=>u.faction===f).length} unità</span>)}</div>
    <p className="my-2 text-xs text-slate-400">{latest ? 'I riquadri sono riservati all’Influenza. Le unità sono raggruppate per fazione in uno spazio libero vicino allo Stato, senza coprire nomi e simboli: il numero indica quante sono; seleziona un segnalino per ingrandirlo e vedere dove si trova.' : 'Unità e Influenza condividono i riquadri in questo salvataggio precedente.'} L’Influenza è permanente. Le unità ruotate rientrano a fine round, salvo Mantenimento: giocatori 1 OP per unità nelle Operazioni; BOT gratis, 1 unità ruotata per attivazione.</p>
    <div data-board-territories className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{TERRITORIES.map(t=><button key={t.id} onClick={()=>onSelect(t.id)} aria-pressed={selected===t.id} className={`text-xs text-left rounded-lg border px-3 py-2 min-h-11 ${selected===t.id?'border-emerald-400 bg-emerald-950':'border-slate-700 bg-slate-900'}`}>{t.name} · {units.filter(u=>u.territory===t.id).length} unità · {influence.filter(i=>i.territory===t.id).length}/{t.capacity} Influenza</button>)}</div>
  </section>;
}
/** Ritaglio del tabellone ingrandito sullo Stato, con il punto in cui si trovano i segnalini. */
function BoardLocator({territory,name,capacity,faction}:{territory:string;name:string;capacity:number;faction:Faction}) {
  const Z=3.2, slot=territorySlot(territory,0), last=territorySlot(territory,Math.max(capacity-1,0)), anchor=UNIT_ANCHORS[territory] ?? slot;
  const cx=(slot.x+anchor.x)/2, cy=(slot.y+anchor.y)/2, span=100/Z;
  const left=Math.min(Math.max(cx-span/2,0),100-span), top=Math.min(Math.max(cy-span/2,0),100-span);
  const at=(x:number,y:number)=>({left:`${(x-left)*Z}%`,top:`${(y-top)*Z}%`});
  return <figure className="grid sm:grid-cols-[minmax(0,1fr)_14rem] gap-3 items-center">
    <div data-board-locator={territory} role="img" aria-label={`Posizione sul tabellone: ${name}`}
      className="relative w-full aspect-[3/2] rounded-lg border border-slate-600 overflow-hidden"
      style={{backgroundImage:`url(${BOARD_ART})`,backgroundSize:`${Z*100}% auto`,backgroundPosition:`${left/(100-span)*100}% ${top/(100-span)*100}%`}}>
      <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-white/90 animate-pulse" style={{...at((slot.x+last.x)/2,slot.y),width:`${(last.x-slot.x+2.4)*Z}%`,height:`${3.6*Z}%`}}/>
      <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] shadow-lg shadow-black" style={{...at(anchor.x,anchor.y),width:'9%',aspectRatio:'1',borderColor:COLORS[faction],boxShadow:`0 0 0 3px #0f172a, 0 0 18px ${COLORS[faction]}`}}/>
    </div>
    <figcaption className="text-sm text-slate-300 space-y-1">
      <strong className="block text-slate-100">Dove si trova sul tabellone</strong>
      <span className="block">Stato: <strong>{name}</strong> (riquadro bianco: i suoi riquadri dell’Influenza).</span>
      <span className="block">Segnalino unità: cerchio colorato, {unitAnchorDescription(territory)} dei riquadri dell’Influenza.</span>
    </figcaption>
  </figure>;
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

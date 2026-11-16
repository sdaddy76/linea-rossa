import {useEffect,useState} from 'react';
import {BOT_CARDS, EVENTS, FACTIONS, UNITS} from './catalog';
import type {Faction} from './catalog-types';
import release from '../../public/assets/tabletop-v3/release.json';
import {BOARD_ART, EVENT_BACK, RULEBOOK_URL, UNIT_REFERENCE_URL,
  botBackArt, botFrontArt, eventFrontArt, factionBoardArt, unitBackArt, unitFrontArt} from './art';

type Category = 'Tabellone e plance' | 'Eventi' | 'BOT' | 'Unità';
export function Materials({onClose}: {onClose: () => void}) {
  const [category,setCategory] = useState<Category>('Tabellone e plance');
  const [faction,setFaction] = useState<Faction>('Iran');
  const [back,setBack] = useState(false);
  const [zoom,setZoom] = useState<{src:string;title:string}|null>(null);
  useEffect(()=>{
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(zoom)setZoom(null);else onClose();}};
    window.addEventListener('keydown',close);
    return ()=>window.removeEventListener('keydown',close);
  },[zoom,onClose]);
  const images = category === 'Tabellone e plance'
    ? [{id:'board',title:'Tabellone',src:BOARD_ART}, ...FACTIONS.map(f=>({id:f,title:`Plancia ${f}`,src:factionBoardArt(f)}))]
    : category === 'Eventi'
      ? EVENTS.map(e=>({id:e.id,title:`${e.id} · ${e.name}`,src:back?EVENT_BACK:eventFrontArt(e.id)}))
      : category === 'BOT'
        ? BOT_CARDS.filter(c=>c.faction===faction).map(c=>({id:c.id,title:`${c.id} · ${c.name}`,src:back?botBackArt(c.faction,c.track):botFrontArt(c.id)}))
        : [...UNITS.filter(u=>u.faction===faction).map(u=>({id:u.id,title:`${u.name} · ${u.cost} OP · A${u.attack} / D${u.defense}`,src:back?unitBackArt(u.faction):unitFrontArt(u.id)})),
          {id:'dummy',title:'Dummy — materiale grafico, non previsto dalle regole v3',src:back?unitBackArt(faction):unitFrontArt(`${({Iran:'IR',Coalizione:'CO',Russia:'RU',Cina:'CN',Europa:'EU'})[faction]}-U${faction==='Iran'?'08':'07'}`)}];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100" role="dialog" aria-modal="true" aria-label="Materiali ufficiali">
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div><p className="text-xs uppercase tracking-widest text-emerald-400">Linea Rossa · {release.release}</p><h1 className="text-2xl font-bold">Materiali del gioco da tavolo</h1></div>
        <button className="rounded-lg border border-slate-600 px-4 py-2" onClick={onClose}>Chiudi</button>
      </header>
      <div className="flex flex-wrap gap-3 mb-5 text-sm">
        <a href={RULEBOOK_URL} target="_blank" rel="noreferrer" className="underline text-emerald-300">Apri il regolamento PDF</a>
        <a href={RULEBOOK_URL} download="Linea_Rossa_Regolamento_v3_10.pdf" className="underline text-emerald-300">Scarica il manuale PDF</a>
        <a href={UNIT_REFERENCE_URL} target="_blank" rel="noreferrer" className="underline text-emerald-300">Scheda unità PDF</a>
      </div>
      <p className="mb-4 text-sm text-slate-400">Materiali ufficiali allineati al regolamento v3.10. Il manuale PDF è disponibile per la lettura e per il download; le opzioni strutturate del catalogo aggiornato prevalgono sui testi eventualmente precedenti nelle illustrazioni delle carte.</p>
      <nav className="flex flex-wrap gap-2 mb-4" aria-label="Tipo di materiale">
        {(['Tabellone e plance','Eventi','BOT','Unità'] as Category[]).map(c=><button key={c} onClick={()=>{setCategory(c);setBack(false);}} aria-pressed={c===category} className={`rounded-lg px-4 py-2 border ${category===c?'border-emerald-400 bg-emerald-950':'border-slate-700'}`}>{c}</button>)}
      </nav>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {(category==='BOT'||category==='Unità')&&<label>Fazione <select className="ml-2 rounded bg-slate-800 p-2" value={faction} onChange={e=>setFaction(e.target.value as Faction)}>{FACTIONS.map(f=><option key={f}>{f}</option>)}</select></label>}
        {category!=='Tabellone e plance'&&<button onClick={()=>setBack(!back)} className="rounded border border-slate-600 px-4 py-2">{back?'Mostra fronti':'Mostra retri'}</button>}
        <span className="text-sm text-slate-400">{images.length} elementi · tocca per ingrandire</span>
      </div>
      <div className={`grid gap-5 ${category==='Tabellone e plance'?'md:grid-cols-2':'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'}`}>
        {images.map(item=><button key={item.id} onClick={()=>setZoom(item)} className="text-left rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-visible:outline-emerald-300">
          <img src={item.src} alt={item.title} loading="lazy" className="w-full h-auto object-contain"/>
          <span className="block p-3 text-xs">{item.title}</span>
        </button>)}
      </div>
    </div>
    {zoom&&<div className="fixed inset-0 z-[60] overflow-auto bg-black/95 p-4" role="dialog" aria-modal="true" aria-label={zoom.title}>
      <button autoFocus onClick={()=>setZoom(null)} className="sticky top-0 rounded-lg bg-slate-800 border px-5 py-2">Torna ai materiali</button>
      <p className="my-3">{zoom.title}</p>
      <img src={zoom.src} alt={zoom.title} className="mx-auto max-w-full h-auto"/>
    </div>}
  </div>;
}

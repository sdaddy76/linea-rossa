import {useState} from 'react';

export interface InfluenceProposal {
  revision:number; actor:string; territoryId:string; territoryName:string; cost:number; budget:number;
}
export function sameInfluenceProposal(a:InfluenceProposal,b:InfluenceProposal) {
  return a.revision===b.revision && a.actor===b.actor && a.territoryId===b.territoryId && a.cost===b.cost && a.budget===b.budget;
}
export function InfluenceAction({proposal,disabled,onConfirm,initialProposal=null}:{
  proposal:InfluenceProposal; disabled:boolean; onConfirm:()=>void; initialProposal?:InfluenceProposal|null;
}) {
  const [pending,setPending]=useState<InfluenceProposal|null>(initialProposal);
  const current=!!pending && sameInfluenceProposal(pending,proposal);
  const button='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';
  return <>
    <button type="button" className={button} disabled={disabled} onClick={()=>setPending({...proposal})}>
      Piazzare Influenza in {proposal.territoryName} · {proposal.cost} OP…
    </button>
    {pending && <div role="dialog" aria-modal="true" aria-label="Conferma piazzamento Influenza"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onKeyDown={e=>{if(e.key==='Escape')setPending(null);}}>
      <div className="max-w-md rounded-xl border border-slate-500 bg-slate-900 p-5 space-y-4">
        <h3 className="text-lg font-bold">Piazzare Influenza in {pending.territoryName}?</h3>
        <p>{pending.actor} spenderà <strong>{pending.cost} OP</strong> dei {pending.budget} disponibili. Residuo: {pending.budget-pending.cost} OP.</p>
        <p className="text-sm text-slate-300">Per scegliere un altro Stato, annulla e selezionalo sulla mappa o nel menu Territorio.</p>
        {!current&&<p role="alert" className="text-amber-200">La partita o la selezione sono cambiate. Annulla e verifica nuovamente Stato e costo.</p>}
        <div className="flex flex-wrap gap-3">
          <button autoFocus type="button" className={button} onClick={()=>setPending(null)}>Annulla</button>
          <button type="button" className={button+' border-emerald-400'} disabled={disabled||!current}
            onClick={()=>{if(!disabled&&current){setPending(null);onConfirm();}}}>Conferma · {pending.territoryName} · {pending.cost} OP</button>
        </div>
      </div>
    </div>}
  </>;
}

// =============================================
// LINEA ROSSA — Modale Obiettivi Segreti (in-game)
// Mostra gli obiettivi della fazione del giocatore durante la partita
// =============================================
import { useState } from 'react';
import {
  TUTTI_GLI_OBIETTIVI,
  OBJ_FACTION_COLORS,
  OBJ_FACTION_FLAGS,
  OBJ_DIFFICOLTA_COLORS,
  OBJ_DIFFICOLTA_ICONS,
  type ObiettivoSegreto,
  type ObjFazione,
  type ObjDifficolta,
} from '@/data/obiettivi';
import type { GameState } from '@/types/game';

interface Props {
  myFaction: string;
  gameState?: Partial<GameState>;
  onClose: () => void;
}

// ─── Valutazione automatica condizione (dove possibile) ──────────────────────
function evalCondizione(obj: ObiettivoSegreto, gs?: Partial<GameState>): boolean | null {
  if (!gs || !obj.condizione_tipo || obj.condizione_tipo === 'manuale') return null;
  if (obj.condizione_tipo !== 'tracciato') return null; // tracciati valutabili automaticamente

  const fieldMap: Record<string, keyof GameState> = {
    nucleare: 'nucleare',
    sanzioni: 'sanzioni',
    defcon:   'defcon',
    opinione: 'opinione',
  };
  const key = fieldMap[obj.condizione_campo ?? ''];
  if (!key) return null;

  const val = gs[key] as number | undefined;
  if (val === undefined || val === null) return null;

  switch (obj.condizione_op) {
    case '>=': return val >= (obj.condizione_valore ?? 0);
    case '<=': return val <= (obj.condizione_valore ?? 0);
    case '==': return val === (obj.condizione_valore ?? 0);
    default:   return null;
  }
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function ObjectivesModal({ myFaction, gameState, onClose }: Props) {
  const [showAll, setShowAll] = useState(false);

  const faction = myFaction as ObjFazione;
  const miei   = TUTTI_GLI_OBIETTIVI.filter(o => o.faction === faction && o.attivo);
  const altri  = TUTTI_GLI_OBIETTIVI.filter(o => o.faction !== faction && o.attivo);

  const fColor = OBJ_FACTION_COLORS[faction] ?? '#8b5cf6';
  const fFlag  = OBJ_FACTION_FLAGS[faction]  ?? '🎯';

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-85 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col
        bg-[#0d1424] rounded-2xl shadow-2xl"
        style={{ border: `1px solid ${fColor}60` }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4
          border-b bg-[#0a0e1a]"
          style={{ borderColor: fColor + '40' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{fFlag}</span>
            <div>
              <h2 className="font-mono font-bold text-white text-base leading-none">
                Obiettivi Segreti
              </h2>
              <p className="font-mono text-xs mt-0.5" style={{ color: fColor }}>
                {faction} — {miei.length} obiettivi assegnati
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[#8899aa] hover:text-white font-mono text-lg px-2 transition-colors">
            ✕
          </button>
        </div>

        {/* ── Contenuto ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* I miei obiettivi */}
          <div>
            <p className="font-mono text-[10px] text-[#8899aa] font-bold uppercase tracking-widest mb-2">
              🎯 I tuoi obiettivi segreti
            </p>
            <div className="space-y-2">
              {miei.map(obj => (
                <ObjGameCard
                  key={obj.obj_id}
                  obj={obj}
                  isMine={true}
                  evalResult={evalCondizione(obj, gameState)}
                />
              ))}
            </div>
          </div>

          {/* Obiettivi degli altri (collassabili) */}
          <div>
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-between px-3 py-2
                bg-[#111827] border border-[#1e3a5f] rounded-lg
                font-mono text-xs text-[#8899aa] hover:text-white transition-colors">
              <span>👁 Obiettivi delle altre fazioni (intelligence)</span>
              <span>{showAll ? '▲' : '▼'}</span>
            </button>

            {showAll && (
              <div className="mt-2 space-y-1">
                {(['Iran', 'Coalizione Occidentale', 'Russia', 'Cina', 'Unione Europea'] as ObjFazione[])
                  .filter(f => f !== faction)
                  .map(f => (
                    <div key={f} className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1">
                        <span className="font-mono text-[10px] font-bold"
                          style={{ color: OBJ_FACTION_COLORS[f] }}>
                          {OBJ_FACTION_FLAGS[f]} {f}
                        </span>
                      </div>
                      {altri.filter(o => o.faction === f).map(obj => (
                        <ObjGameCard
                          key={obj.obj_id}
                          obj={obj}
                          isMine={false}
                          evalResult={null}
                        />
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Legenda punti */}
          <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-3">
            <p className="font-mono text-[#8899aa] text-[9px] font-bold mb-2 uppercase tracking-wider">
              📊 Legenda Punti Fine Partita
            </p>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]"/>
                <span className="text-[#22c55e] font-bold">⭐ Facile</span>
                <span className="text-[#8899aa]">5 pt — condizione semplice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"/>
                <span className="text-[#f59e0b] font-bold">⭐⭐ Media</span>
                <span className="text-[#8899aa]">6-7 pt — condizione moderata</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]"/>
                <span className="text-[#ef4444] font-bold">⭐⭐⭐ Difficile</span>
                <span className="text-[#8899aa]">8+ pt — condizione strategica avanzata</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1e3a5f] px-5 py-3 bg-[#0a0e1a]
          flex items-center justify-between">
          <p className="font-mono text-[#8899aa] text-[9px]">
            Gli obiettivi vengono rivelati e conteggiati alla fine della partita
          </p>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors"
            style={{
              backgroundColor: fColor + '20',
              border: `1px solid ${fColor}60`,
              color: fColor,
            }}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card compatta per la partita ─────────────────────────────────────────────
interface ObjGameCardProps {
  obj: ObiettivoSegreto;
  isMine: boolean;
  evalResult: boolean | null;
}

function ObjGameCard({ obj, isMine, evalResult }: ObjGameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fColor = OBJ_FACTION_COLORS[obj.faction] ?? '#8b5cf6';
  const dColor = OBJ_DIFFICOLTA_COLORS[obj.difficolta] ?? '#f59e0b';
  const dIcon  = OBJ_DIFFICOLTA_ICONS[obj.difficolta]  ?? '⭐';

  const statusBadge = evalResult === true
    ? { color: '#22c55e', bg: '#22c55e20', icon: '✅', label: 'COMPLETATO' }
    : evalResult === false
      ? { color: '#ef4444', bg: '#ef444420', icon: '❌', label: 'NON ANCORA' }
      : null;

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: isMine ? fColor + '50' : '#1e3a5f',
        backgroundColor: isMine ? fColor + '08' : '#111827',
      }}>
      <button
        className="w-full text-left px-3 py-2.5 flex items-start gap-2.5"
        onClick={() => setExpanded(!expanded)}>

        {/* Punteggio */}
        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#f59e0b20', border: '1px solid #f59e0b30' }}>
          <span className="font-mono font-black text-[#f59e0b] text-xs">
            {obj.punti}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-white text-[11px] font-bold leading-snug">
              {obj.nome}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {statusBadge && (
                <span className="font-mono text-[8px] font-bold px-1 py-0.5 rounded"
                  style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}>
                  {statusBadge.icon} {statusBadge.label}
                </span>
              )}
              <span className="font-mono text-[8px]" style={{ color: dColor }}>
                {dIcon}
              </span>
            </div>
          </div>
          <p className="font-mono text-[#8899aa] text-[9px] mt-0.5 leading-relaxed">
            {expanded ? obj.descrizione : obj.descrizione.slice(0, 90) + (obj.descrizione.length > 90 ? '…' : '')}
          </p>

          {expanded && obj.condizione_note && (
            <div className="mt-2 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg p-2">
              <p className="font-mono text-[#f59e0b] text-[8px] font-bold mb-0.5">
                📋 Come verificare a fine partita
              </p>
              <p className="font-mono text-[#8899aa] text-[8px] leading-relaxed">
                {obj.condizione_note}
              </p>
              {obj.condizione_tipo && obj.condizione_tipo !== 'manuale' && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  <span className="font-mono text-[7px] text-[#8b5cf6] bg-[#8b5cf620] px-1 py-0.5 rounded">
                    {obj.condizione_tipo}
                  </span>
                  {obj.condizione_campo && (
                    <span className="font-mono text-[7px] text-[#8899aa] bg-[#ffffff10] px-1 py-0.5 rounded">
                      {obj.condizione_campo} {obj.condizione_op} {obj.condizione_valore}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-[#8899aa] font-mono text-[10px] shrink-0 pt-0.5">
          {expanded ? '▲' : '▼'}
        </span>
      </button>
    </div>
  );
}

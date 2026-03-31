// =============================================
// LINEA ROSSA — Sezione Obiettivi Segreti (inline, tab Fazioni)
// Mostra le carte obiettivo della propria fazione direttamente
// nella schermata della plancia fazione, senza modale separata.
// =============================================
import { useState } from 'react';
import {
  OBJ_FACTION_COLORS,
  OBJ_DIFFICOLTA_COLORS,
  OBJ_DIFFICOLTA_ICONS,
  evalObjectiveCondition,
  type ObiettivoSegreto,
  type ObjFazione,
} from '@/data/obiettivi';
import type { GameState } from '@/types/game';

interface Props {
  myFaction: string;
  myObjectives: ObiettivoSegreto[];
  gameState?: Partial<GameState>;
  onMarkComplete?: (objectiveId: string) => void;
  onAssignNew?: () => void;
}

// ─── Helpers gsMap ─────────────────────────────────────────────────────────────
function buildGsMap(gs: Partial<GameState> | undefined): Partial<Record<string, number>> {
  const g = gs as Record<string, unknown> | undefined;
  if (!g) return {};
  return {
    nucleare:              g.nucleare              as number,
    sanzioni:              g.sanzioni              as number,
    defcon:                g.defcon                as number,
    opinione:              g.opinione              as number,
    opinione_globale:      g.opinione_globale      as number,
    supporto_pubblico:     g.supporto_pubblico     as number,
    stabilita:             g.stabilita_iran        as number,
    stabilita_iran:        g.stabilita_iran        as number,
    deterrenza:            g.deterrenza            as number,
    risorse_iran:          g.risorse_iran          as number,
    influenza_iran:        g.influenza_iran        as number,
    risorse_russia:        g.risorse_russia        as number,
    influenza_russia:      g.influenza_russia      as number,
    controllo_russia:      g.controllo_russia      as number,
    influenza_cina:        g.influenza_cina        as number,
    risorse_cina:          g.risorse_cina          as number,
    territori_cina:        g.territori_cina        as number,
    coesione_ue:           g.coesione_ue           as number,
    influenza_ue:          g.influenza_ue          as number,
    diplomazia_ue:         g.diplomazia_ue         as number,
    deterrenza_coalizione: g.deterrenza_coalizione as number,
    influenza_coalizione:  g.influenza_coalizione  as number,
    risorse_coalizione:    g.risorse_coalizione    as number,
  };
}

// ─── Card singolo obiettivo (compatta, inline) ─────────────────────────────────
interface ObjInlineCardProps {
  obj: ObiettivoSegreto;
  gsMap: Partial<Record<string, number>>;
  onMarkComplete?: (id: string) => void;
}

function ObjInlineCard({ obj, gsMap, onMarkComplete }: ObjInlineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fColor = OBJ_FACTION_COLORS[obj.faction as ObjFazione] ?? '#8b5cf6';
  const dColor = OBJ_DIFFICOLTA_COLORS[obj.difficolta]          ?? '#f59e0b';
  const dIcon  = OBJ_DIFFICOLTA_ICONS[obj.difficolta]           ?? '⭐';

  const evalResult = evalObjectiveCondition(obj, gsMap);

  const statusBadge =
    obj.completato
      ? { color: '#22c55e', bg: '#22c55e20', icon: '✅', label: 'COMPLETATO' }
      : evalResult === true
        ? { color: '#22c55e', bg: '#22c55e20', icon: '✅', label: 'SODDISFATTO' }
        : evalResult === false
          ? { color: '#f59e0b', bg: '#f59e0b18', icon: '⏳', label: 'IN CORSO' }
          : null;

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: obj.completato ? '#22c55e50' : fColor + '40',
        backgroundColor: obj.completato ? '#22c55e08' : fColor + '06',
      }}
    >
      <button
        className="w-full text-left px-3 py-2 flex items-start gap-2"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Punteggio */}
        <div
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
          style={{ backgroundColor: '#f59e0b20', border: '1px solid #f59e0b30' }}
        >
          <span className="font-mono font-black text-[#f59e0b] text-[10px]">
            {obj.punti}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-mono text-white text-[11px] font-bold leading-snug">
              {obj.nome}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {statusBadge && (
                <span
                  className="font-mono text-[8px] font-bold px-1 py-0.5 rounded"
                  style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}
                >
                  {statusBadge.icon} {statusBadge.label}
                </span>
              )}
              <span className="font-mono text-[8px]" style={{ color: dColor }}>
                {dIcon}
              </span>
            </div>
          </div>
          <p className="font-mono text-[#8899aa] text-[9px] mt-0.5 leading-relaxed">
            {expanded
              ? obj.descrizione
              : obj.descrizione.slice(0, 80) + (obj.descrizione.length > 80 ? '…' : '')}
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

      {/* Bottone "Segna completato" (solo se manuale, non ancora completato) */}
      {obj.condizione_tipo !== 'tracciato' && !obj.completato && onMarkComplete && (
        <div className="px-3 pb-2">
          <button
            onClick={() => onMarkComplete(obj.obj_id)}
            className="px-2 py-0.5 rounded text-[9px] font-mono font-bold
              bg-[#22c55e20] text-[#22c55e] border border-[#22c55e40]
              hover:bg-[#22c55e30] hover:border-[#22c55e80] transition-colors"
          >
            ✓ Segna completato
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente principale ─────────────────────────────────────────────────────
export function ObjectivesSection({ myFaction, myObjectives, gameState, onMarkComplete, onAssignNew }: Props) {
  const faction = myFaction as ObjFazione;
  const fColor  = OBJ_FACTION_COLORS[faction] ?? '#8b5cf6';
  const gsMap   = buildGsMap(gameState);

  const [collapsed, setCollapsed] = useState(false);

  // Contatori stato
  const completati  = myObjectives.filter(o => o.completato || evalObjectiveCondition(o, gsMap) === true).length;
  const inCorso     = myObjectives.length - completati;

  return (
    <div
      className="rounded-xl border mt-2 overflow-hidden"
      style={{ borderColor: fColor + '30', backgroundColor: fColor + '05' }}
    >
      {/* Header collassabile */}
      <button
        className="w-full flex items-center justify-between px-3 py-2
          hover:bg-white/5 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: fColor }}
          >
            Obiettivi Segreti
          </span>
          {myObjectives.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-[#22c55e20] text-[#22c55e]">
                ✅ {completati}
              </span>
              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-[#f59e0b18] text-[#f59e0b]">
                ⏳ {inCorso}
              </span>
            </div>
          )}
        </div>
        <span className="text-[#8899aa] font-mono text-[10px]">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {/* Contenuto */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {myObjectives.length === 0 ? (
            <div className="py-3 text-center">
              <p className="font-mono text-[#8899aa] text-[9px]">
                Nessun obiettivo assegnato.
              </p>
              {onAssignNew && (
                <button
                  onClick={onAssignNew}
                  className="mt-2 px-3 py-1 rounded-lg font-mono text-[9px] font-bold
                    bg-[#f59e0b20] border border-[#f59e0b60] text-[#f59e0b]
                    hover:bg-[#f59e0b30] transition-colors"
                >
                  🎲 Estrai obiettivi
                </button>
              )}
            </div>
          ) : (
            <>
              {myObjectives.map(obj => (
                <ObjInlineCard
                  key={obj.obj_id}
                  obj={obj}
                  gsMap={gsMap}
                  onMarkComplete={onMarkComplete}
                />
              ))}
              <p className="font-mono text-[#556677] text-[8px] text-center pt-1">
                {myObjectives.length} obiettivi segreti · conteggio punti a fine partita
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// LINEA ROSSA — Mappa Territori + Influenze + Unità
// =============================================
import { useState } from 'react';
import type { Faction } from '@/types/game';
import { TERRITORIES, TERRITORY_MAP, UNITS } from '@/lib/territoriesData';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { getController } from '@/lib/combatEngine';

const FACTION_COLOR: Record<Faction, string> = {
  Iran:       '#dc2626',
  Coalizione: '#2563eb',
  Russia:     '#7c3aed',
  Cina:       '#d97706',
  Europa:     '#059669',
};
const FACTION_BG: Record<Faction, string> = {
  Iran:       '#dc262620',
  Coalizione: '#2563eb20',
  Russia:     '#7c3aed20',
  Cina:       '#d9770620',
  Europa:     '#05966920',
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

// Dot di influenza per una fazione
function InfluenceDots({ faction, count }: { faction: Faction; count: number }) {
  const color = FACTION_COLOR[faction];
  return (
    <div className="flex gap-0.5 flex-wrap">
      {Array.from({ length: Math.max(0, Math.min(count, 5)) }).map((_, i) => (
        <span key={i}
          style={{ backgroundColor: color }}
          className="w-2 h-2 rounded-full shrink-0 opacity-90" />
      ))}
    </div>
  );
}

export default function TerritoryMap({ territories, myFaction, isMyTurn, onSelectTerritory, selectedTerritory, attackMode }: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);

  return (
    <div className="relative w-full" style={{ paddingBottom: '62%' }}>
      {/* Sfondo mappa stilizzata */}
      <div className="absolute inset-0 rounded-xl overflow-hidden border border-[#1e3a5f] bg-[#060d1a]">

        {/* Griglia decorativa */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 62" preserveAspectRatio="none">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="62" stroke="#1e3a5f" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#1e3a5f" strokeWidth="0.3" />
          ))}
          {/* Golfo Persico */}
          <ellipse cx="60" cy="60" rx="10" ry="5" fill="#0a1e3a" opacity="0.7" />
          <text x="60" y="61" textAnchor="middle" fill="#1e4a7f" fontSize="2" fontFamily="monospace">GOLFO PERSICO</text>
          {/* Mar Rosso */}
          <ellipse cx="22" cy="62" rx="4" ry="2" fill="#0a1e3a" opacity="0.7" />
          {/* Mar Mediterraneo */}
          <ellipse cx="20" cy="28" rx="8" ry="4" fill="#0a1e3a" opacity="0.7" />
          <text x="20" y="29" textAnchor="middle" fill="#1e4a7f" fontSize="1.8" fontFamily="monospace">MED.</text>
        </svg>

        {/* Nodi territorio */}
        {TERRITORIES.map(t => {
          const ts = territories[t.id];
          const influences = (ts?.influences ?? {}) as Partial<Record<Faction, number>>;
          const controller = getController(influences as Record<Faction, number>);
          const isSelected = selectedTerritory === t.id;
          const isHovered  = hovered === t.id;
          const ctrlColor  = controller ? FACTION_COLOR[controller] : '#334155';

          // Unità totali in questo territorio
          const allUnits = ts?.units ?? {};
          const unitSummary: string[] = [];
          for (const [fac, umap] of Object.entries(allUnits)) {
            for (const [utype, qty] of Object.entries(umap ?? {})) {
              if ((qty ?? 0) > 0) {
                const udef = UNITS.find(u => u.type === utype);
                unitSummary.push(`${udef?.icon ?? '⚔️'}${qty} ${fac.slice(0, 3)}`);
              }
            }
          }

          return (
            <div key={t.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              onClick={() => onSelectTerritory?.(t.id)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}>

              {/* Cerchio principale */}
              <div
                className={`relative flex flex-col items-center justify-center rounded-full border-2 transition-all duration-150
                  ${isSelected ? 'ring-2 ring-white scale-125' : ''}
                  ${attackMode && !isSelected ? 'animate-pulse' : ''}
                `}
                style={{
                  width: t.type === 'casa' ? 38 : t.type === 'strategico' ? 32 : 28,
                  height: t.type === 'casa' ? 38 : t.type === 'strategico' ? 32 : 28,
                  borderColor: ctrlColor,
                  backgroundColor: controller ? FACTION_BG[controller] : '#0a0e1a',
                  boxShadow: controller ? `0 0 8px ${ctrlColor}60` : undefined,
                }}>
                <span className="text-[8px] font-mono font-bold leading-none text-center px-0.5 text-white"
                  style={{ fontSize: t.type === 'casa' ? '7px' : '6px' }}>
                  {t.label.replace(' ', '\n')}
                </span>
                {t.pvPerRound > 1 && (
                  <span className="text-[5px] font-mono"
                    style={{ color: t.type === 'casa' ? '#f59e0b' : '#8b5cf6' }}>
                    {t.pvPerRound}PV
                  </span>
                )}
              </div>

              {/* Dots influenza attorno al cerchio */}
              {Object.entries(influences).map(([fac, count], idx) => (
                count && count > 0 ? (
                  <div key={fac}
                    className="absolute"
                    style={{
                      bottom: -4 - idx * 6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}>
                    <InfluenceDots faction={fac as Faction} count={count} />
                  </div>
                ) : null
              ))}

              {/* Badge unità */}
              {unitSummary.length > 0 && (
                <div className="absolute -top-3 -right-1 text-[8px] font-mono text-[#f59e0b]">
                  {unitSummary.length > 2 ? `+${unitSummary.length}` : unitSummary.slice(0, 2).join(' ')}
                </div>
              )}

              {/* Tooltip al hover */}
              {isHovered && (
                <div className="absolute z-50 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg p-2 text-xs font-mono text-white shadow-xl"
                  style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', minWidth: 160, whiteSpace: 'nowrap' }}>
                  <p className="font-bold text-[#00ff88] mb-1">{t.label}</p>
                  <p className="text-[#8899aa] mb-1">{t.type === 'casa' ? '🏠 Territorio Casa' : t.type === 'strategico' ? '⭐ Strategico' : '📍 Normale'} • {t.pvPerRound} PV/round</p>
                  {t.isNaval && <p className="text-[#3b82f6] mb-1">🚢 Porto navale</p>}
                  {controller ? (
                    <p style={{ color: FACTION_COLOR[controller] }}>✅ Controllato: {controller}</p>
                  ) : (
                    <p className="text-[#8899aa]">⚪ Non controllato</p>
                  )}
                  <div className="mt-1 border-t border-[#1e3a5f] pt-1">
                    {FACTIONS.map(f => {
                      const n = influences[f] ?? 0;
                      return n > 0 ? (
                        <div key={f} className="flex items-center gap-1">
                          <span style={{ color: FACTION_COLOR[f] }}>{f}:</span>
                          <InfluenceDots faction={f} count={n} />
                          <span className="text-[#8899aa]">{n}/5</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  {unitSummary.length > 0 && (
                    <div className="mt-1 border-t border-[#1e3a5f] pt-1">
                      <p className="text-[#f59e0b]">Unità:</p>
                      {Object.entries(allUnits).map(([fac, umap]) =>
                        Object.entries(umap ?? {}).map(([ut, qty]) =>
                          (qty ?? 0) > 0 ? (
                            <p key={`${fac}-${ut}`} style={{ color: FACTION_COLOR[fac as Faction] }}>
                              {UNITS.find(u => u.type === ut)?.icon} {ut} x{qty} ({fac})
                            </p>
                          ) : null
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Legenda */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
          {FACTIONS.map(f => (
            <div key={f} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FACTION_COLOR[f] }} />
              <span className="text-[8px] font-mono" style={{ color: FACTION_COLOR[f] }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Label titolo */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-[#1e4a7f] font-bold tracking-widest">
          🗺 TEATRO OPERATIVO — GOLFO PERSICO
        </div>
      </div>
    </div>
  );
}

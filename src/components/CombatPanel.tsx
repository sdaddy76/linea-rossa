// =============================================
// LINEA ROSSA — Pannello Combattimento
// Sezione 8.1: Dichiarazione, Calcolo, Risultato
// =============================================
import { useState, useMemo } from 'react';
import type { Faction, GameState } from '@/types/game';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { TERRITORIES, UNITS, UNIT_MAP, TERRITORY_MAP } from '@/lib/territoriesData';
import { resolveCombat, checkHormuz } from '@/lib/combatEngine';
import type { CombatOutcome } from '@/lib/combatEngine';
import type { TerritoryState } from '@/components/TerritoryMap';

const FACTION_COLOR: Record<Faction, string> = {
  Iran:       '#dc2626',
  Coalizione: '#2563eb',
  Russia:     '#7c3aed',
  Cina:       '#d97706',
  Europa:     '#059669',
};

const RESULT_STYLE: Record<string, { color: string; icon: string; label: string }> = {
  vittoria_decisiva: { color: '#00ff88', icon: '🏆', label: 'VITTORIA DECISIVA' },
  vittoria:          { color: '#22c55e', icon: '✅', label: 'VITTORIA' },
  stallo:            { color: '#f59e0b', icon: '⚔️', label: 'STALLO' },
  sconfitta:         { color: '#ef4444', icon: '❌', label: 'SCONFITTA' },
  sconfitta_grave:   { color: '#dc2626', icon: '💀', label: 'SCONFITTA GRAVE' },
};

interface Props {
  myFaction: Faction;
  gameState: GameState;
  territories: TerritoryState;
  myUnitsPool: Partial<Record<UnitType, number>>;  // unità disponibili non schierate
  onAttack: (params: {
    territory: TerritoryId;
    defender: Faction;
    unitsUsed: UnitType[];
    outcome: CombatOutcome;
  }) => Promise<void>;
  onDeploy: (territory: TerritoryId, unitType: UnitType, qty: number) => Promise<void>;
  onClose: () => void;
}

export default function CombatPanel({ myFaction, gameState, territories, myUnitsPool, onAttack, onDeploy, onClose }: Props) {
  const [mode, setMode] = useState<'deploy' | 'attack'>('deploy');

  // ── Deploy state ──
  const [deployTerritory, setDeployTerritory] = useState<TerritoryId | null>(null);
  const [deployUnit, setDeployUnit] = useState<UnitType | null>(null);
  const [deployQty, setDeployQty] = useState(1);
  const [deploying, setDeploying] = useState(false);

  // ── Attack state ──
  const [atkTerritory, setAtkTerritory] = useState<TerritoryId | null>(null);
  const [atkUnits, setAtkUnits]         = useState<UnitType[]>([]);
  const [atkCardOp, setAtkCardOp]       = useState(3);
  const [guerraAsim, setGuerraAsim]     = useState(false);
  const [allianceOn, setAllianceOn]     = useState(false);
  const [attacking, setAttacking]       = useState(false);
  const [lastOutcome, setLastOutcome]   = useState<CombatOutcome | null>(null);

  // Mie unità disponibili per tipo (filtro fazione)
  const myUnitDefs = UNITS.filter(u => u.factions.includes(myFaction));

  // Determina il difensore del territorio selezionato
  const defenderFaction = useMemo((): Faction | null => {
    if (!atkTerritory) return null;
    const ts = territories[atkTerritory];
    if (!ts) return null;
    const infs = ts.influences as Partial<Record<Faction, number>>;
    const sorted = (Object.entries(infs) as [Faction, number][])
      .filter(([f]) => f !== myFaction)
      .sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] > 0 ? sorted[0][0] : null;
  }, [atkTerritory, territories, myFaction]);

  // Preview combattimento
  const preview = useMemo(() => {
    if (!atkTerritory || !defenderFaction || atkUnits.length === 0) return null;
    const ts = territories[atkTerritory];
    const defUnits = (ts?.units?.[defenderFaction] ?? {}) as Partial<Record<UnitType, number>>;
    const hormuzUnits = territories['StrettoHormuz']?.units?.['Iran'];
    const hormuzNaval = hormuzUnits ? (hormuzUnits['Navale'] ?? 0) : 0;
    return resolveCombat({
      attacker: myFaction,
      defender: defenderFaction,
      territory: atkTerritory,
      cardOpPoints: atkCardOp,
      unitTypesUsed: atkUnits,
      defenderUnitsInTerritory: defUnits,
      gameState,
      hormuzActive: checkHormuz(hormuzNaval),
      allianceActive: allianceOn,
      guerraAsimmetricaActive: guerraAsim,
    });
  }, [atkTerritory, defenderFaction, atkUnits, atkCardOp, gameState, allianceOn, guerraAsim, myFaction, territories]);

  // ── Handlers ──
  const handleDeploy = async () => {
    if (!deployTerritory || !deployUnit) return;
    const tDef = TERRITORY_MAP[deployTerritory];
    const uDef = UNIT_MAP[deployUnit];
    if (uDef.navalOnly && !tDef?.isNaval) { alert('Questa unità può essere schierata solo in territori navali!'); return; }
    setDeploying(true);
    await onDeploy(deployTerritory, deployUnit, deployQty);
    setDeploying(false);
    setDeployUnit(null); setDeployQty(1);
  };

  const handleAttack = async () => {
    if (!preview || !atkTerritory || !defenderFaction) return;
    setAttacking(true);
    setLastOutcome(preview);
    await onAttack({
      territory: atkTerritory,
      defender: defenderFaction,
      unitsUsed: atkUnits,
      outcome: preview,
    });
    setAttacking(false);
    setAtkUnits([]); setAtkTerritory(null);
  };

  const toggleUnit = (ut: UnitType) => {
    setAtkUnits(prev => prev.includes(ut) ? prev.filter(u => u !== ut) : [...prev, ut]);
  };

  const rs = lastOutcome ? RESULT_STYLE[lastOutcome.result] : null;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
          ⚔️ <span>OPERAZIONI MILITARI</span>
        </h3>
        <button onClick={onClose} className="text-[#8899aa] hover:text-white font-mono text-xs">✕ chiudi</button>
      </div>

      {/* Tab selector */}
      <div className="flex rounded-lg overflow-hidden border border-[#1e3a5f]">
        {(['deploy', 'attack'] as const).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setLastOutcome(null); }}
            className={`flex-1 py-2 text-xs font-mono font-bold transition-all
              ${mode === m ? 'bg-[#1e3a5f] text-white' : 'bg-[#0a0e1a] text-[#8899aa] hover:text-white'}`}>
            {m === 'deploy' ? '🪖 SCHIERA UNITÀ' : '🎯 ATTACCA'}
          </button>
        ))}
      </div>

      {/* ── DEPLOY ── */}
      {mode === 'deploy' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-mono text-[#8899aa]">
            Schiera unità in un territorio per aumentare la Forza Difensiva.
          </p>

          {/* Selezione territorio */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">📍 Territorio</label>
            <select
              value={deployTerritory ?? ''}
              onChange={e => setDeployTerritory(e.target.value as TerritoryId || null)}
              className="w-full bg-[#0d1421] border border-[#1e3a5f] text-white font-mono text-xs rounded-lg px-2 py-1.5">
              <option value="">— seleziona —</option>
              {TERRITORIES.map(t => (
                <option key={t.id} value={t.id}>{t.label} ({t.type})</option>
              ))}
            </select>
          </div>

          {/* Selezione unità */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">🪖 Tipo Unità</label>
            <div className="flex flex-col gap-1.5">
              {myUnitDefs.map(u => {
                const available = myUnitsPool[u.type] ?? 0;
                const isNavalOnly = u.navalOnly;
                const tDef = deployTerritory ? TERRITORY_MAP[deployTerritory] : null;
                const disabled = available === 0 || (isNavalOnly && !tDef?.isNaval);
                return (
                  <button key={u.type}
                    disabled={disabled}
                    onClick={() => setDeployUnit(deployUnit === u.type ? null : u.type)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono transition-all
                      ${deployUnit === u.type ? 'border-[#00ff88] bg-[#00ff8815] text-white' : 'border-[#1e3a5f] text-[#8899aa] hover:border-[#2a3a5a]'}
                      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <span>{u.icon} {u.label}</span>
                    <span className="flex gap-2">
                      {u.attackBonus > 0 && <span className="text-[#ef4444]">ATK +{u.attackBonus}</span>}
                      {u.defenseBonus > 0 && <span className="text-[#22c55e]">DEF +{u.defenseBonus}</span>}
                      <span className="text-[#f59e0b]">Disp: {available}</span>
                      <span className="text-[#8899aa]">{u.cost}PO</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantità */}
          {deployUnit && (
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-mono text-[#8899aa]">Quantità:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeployQty(q => Math.max(1, q - 1))}
                  className="w-6 h-6 rounded bg-[#1e3a5f] text-white font-mono text-xs">−</button>
                <span className="font-mono font-bold text-white w-4 text-center">{deployQty}</span>
                <button onClick={() => setDeployQty(q => Math.min(myUnitsPool[deployUnit] ?? 1, q + 1))}
                  className="w-6 h-6 rounded bg-[#1e3a5f] text-white font-mono text-xs">+</button>
              </div>
              <span className="text-[10px] font-mono text-[#f59e0b]">
                Costo: {(UNIT_MAP[deployUnit]?.cost ?? 0) * deployQty} PO
              </span>
            </div>
          )}

          <button
            disabled={!deployTerritory || !deployUnit || deploying}
            onClick={handleDeploy}
            className="w-full py-2.5 bg-[#1e4a7f] hover:bg-[#2563eb] disabled:opacity-40
              text-white font-mono font-bold rounded-lg text-sm transition-all">
            {deploying ? '⏳ Schieramento...' : `🪖 SCHIERA ${deployUnit ?? ''}`}
          </button>
        </div>
      )}

      {/* ── ATTACK ── */}
      {mode === 'attack' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-mono text-[#8899aa]">
            Gioca una carta Militare e dichiara l'attacco su un territorio nemico.
          </p>

          {/* Territorio bersaglio */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">🎯 Territorio Bersaglio</label>
            <select
              value={atkTerritory ?? ''}
              onChange={e => { setAtkTerritory(e.target.value as TerritoryId || null); setLastOutcome(null); }}
              className="w-full bg-[#0d1421] border border-[#1e3a5f] text-white font-mono text-xs rounded-lg px-2 py-1.5">
              <option value="">— seleziona —</option>
              {TERRITORIES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {defenderFaction && (
              <p className="text-[10px] font-mono mt-0.5"
                style={{ color: FACTION_COLOR[defenderFaction] }}>
                Difensore: {defenderFaction}
              </p>
            )}
          </div>

          {/* PO carta */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">
              💳 PO Carta Militare (forza base)
            </label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onClick={() => setAtkCardOp(n)}
                  className={`flex-1 py-1 rounded font-mono text-xs font-bold transition-all
                    ${atkCardOp === n ? 'bg-[#f59e0b] text-black' : 'bg-[#1e3a5f] text-white hover:bg-[#2a4a7f]'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Unità impiegate */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">🪖 Unità Impiegate</label>
            <div className="flex flex-wrap gap-1.5">
              {myUnitDefs.map(u => {
                const selected = atkUnits.includes(u.type);
                const available = myUnitsPool[u.type] ?? 0;
                return (
                  <button key={u.type}
                    disabled={available === 0 && !selected}
                    onClick={() => toggleUnit(u.type)}
                    className={`px-2 py-1 rounded border text-[10px] font-mono transition-all
                      ${selected ? 'border-[#f59e0b] bg-[#f59e0b20] text-[#f59e0b]' : 'border-[#1e3a5f] text-[#8899aa]'}
                      ${available === 0 && !selected ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-[#2a4a7f]'}`}>
                    {u.icon} {u.type}
                    {u.attackBonus > 0 && <span className="text-[#ef4444] ml-1">+{u.attackBonus}ATK</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opzioni speciali */}
          <div className="flex flex-col gap-1.5">
            {myFaction === 'Iran' && atkTerritory === 'Iran' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={guerraAsim} onChange={e => setGuerraAsim(e.target.checked)}
                  className="accent-[#dc2626]" />
                <span className="text-[10px] font-mono text-[#dc2626]">⚡ Attiva Guerra Asimmetrica (+3 DEF, danno garantito)</span>
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allianceOn} onChange={e => setAllianceOn(e.target.checked)}
                className="accent-[#22c55e]" />
              <span className="text-[10px] font-mono text-[#22c55e]">🤝 Alleanza attiva questo round (+1 ATK)</span>
            </label>
          </div>

          {/* Preview forze */}
          {preview && (
            <div className="bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg p-3 text-xs font-mono">
              <p className="text-[#8899aa] text-[9px] mb-2">⚙️ CALCOLO FORZE</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <p className="text-[#ef4444] font-bold mb-1">⚔️ ATTACCO: {preview.attackForce}</p>
                  {preview.attackBreakdown.map((l, i) => (
                    <p key={i} className="text-[9px] text-[#8899aa]">{l}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[#3b82f6] font-bold mb-1">🛡️ DIFESA: {preview.defenseForce}</p>
                  {preview.defenseBreakdown.map((l, i) => (
                    <p key={i} className="text-[9px] text-[#8899aa]">{l}</p>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#1e3a5f] pt-2 text-center">
                <span className="text-[10px] font-bold"
                  style={{ color: preview.difference >= 0 ? '#22c55e' : '#ef4444' }}>
                  {RESULT_STYLE[preview.result]?.icon} Previsione: {RESULT_STYLE[preview.result]?.label}
                </span>
                <p className="text-[9px] text-[#8899aa] mt-0.5">{preview.description}</p>
              </div>
            </div>
          )}

          <button
            disabled={!atkTerritory || atkUnits.length === 0 || !defenderFaction || attacking}
            onClick={handleAttack}
            className="w-full py-2.5 bg-[#7f1d1d] hover:bg-[#dc2626] disabled:opacity-40
              text-white font-mono font-bold rounded-lg text-sm transition-all
              shadow-lg shadow-[#dc262630]">
            {attacking ? '⏳ Risoluzione...' : '⚔️ DICHIARA ATTACCO'}
          </button>
        </div>
      )}

      {/* ── RISULTATO ULTIMO COMBATTIMENTO ── */}
      {lastOutcome && rs && (
        <div className="border rounded-lg p-3 font-mono text-xs mt-2"
          style={{ borderColor: rs.color, backgroundColor: `${rs.color}10` }}>
          <p className="font-bold text-sm mb-2" style={{ color: rs.color }}>
            {rs.icon} {rs.label}
          </p>
          <p className="text-[#d1d5db] text-[11px] mb-1">{lastOutcome.description}</p>
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div>
              <p className="text-[#8899aa] text-[9px]">Forza ATK</p>
              <p className="font-bold text-[#ef4444]">{lastOutcome.attackForce}</p>
            </div>
            <div>
              <p className="text-[#8899aa] text-[9px]">Forza DEF</p>
              <p className="font-bold text-[#3b82f6]">{lastOutcome.defenseForce}</p>
            </div>
            <div>
              <p className="text-[#8899aa] text-[9px]">DEFCON</p>
              <p className="font-bold text-[#f59e0b]">{lastOutcome.defconChange}</p>
            </div>
          </div>
          {lastOutcome.attackerUnitsLost > 0 && (
            <p className="text-[#ef4444] mt-1 text-[10px]">
              ⚠️ Perse {lastOutcome.attackerUnitsLost} unità
            </p>
          )}
          {lastOutcome.stabilityChange < 0 && (
            <p className="text-[#dc2626] text-[10px]">
              📉 Stabilità Interna {lastOutcome.stabilityChange}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

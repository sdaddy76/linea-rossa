// =============================================
// LINEA ROSSA — Pannello Combattimento v2
// Sistema asimmetrico per fazione
// =============================================
import { useState, useMemo } from 'react';
import type { Faction, GameState } from '@/types/game';
import type { TerritoryId, UnitType } from '@/lib/territoriesData';
import { TERRITORIES, UNITS_BY_FACTION, UNIT_MAP, TERRITORY_MAP } from '@/lib/territoriesData';
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

const FACTION_LABEL: Record<Faction, string> = {
  Iran: '🇮🇷 Iran', Coalizione: '🇺🇸 Coalizione',
  Russia: '🇷🇺 Russia', Cina: '🇨🇳 Cina', Europa: '🇪🇺 Europa',
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
  myUnitsPool: Partial<Record<UnitType, number>>;
  onAttack: (params: {
    territory: TerritoryId;
    defender: Faction;
    unitsUsed: UnitType[];
    outcome: CombatOutcome;
  }) => Promise<void>;
  onDeploy: (territory: TerritoryId, unitType: UnitType, qty: number) => Promise<void>;
  onClose: () => void;
}

// ─── Componente scheda unità ─────────────────────────────────────────────────
function UnitCard({
  unitType,
  qty,
  selected,
  disabled,
  mode,
  onClick,
}: {
  unitType: UnitType;
  qty: number;
  selected: boolean;
  disabled: boolean;
  mode: 'deploy' | 'attack';
  onClick: () => void;
}) {
  const uDef = UNIT_MAP[unitType];
  if (!uDef) return null;
  const borderColor = selected
    ? mode === 'attack' ? '#f59e0b' : '#00ff88'
    : '#1e3a5f';
  const bgColor = selected
    ? mode === 'attack' ? '#f59e0b15' : '#00ff8815'
    : 'transparent';

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={uDef.specialEffect}
      className={`flex flex-col gap-1 p-2 rounded-lg border transition-all text-left
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-[#2a4a7f]'}`}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      {/* Riga header */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm">{uDef.icon}</span>
        <span className="font-mono text-[9px] text-white truncate flex-1 ml-1">{uDef.label}</span>
        <span className="font-mono text-[9px] text-[#f59e0b] ml-1">×{qty}</span>
      </div>
      {/* Stats */}
      <div className="flex gap-2 text-[9px] font-mono">
        {uDef.attackBonus > 0 && (
          <span className="text-[#ef4444] font-bold">⚔️+{uDef.attackBonus}</span>
        )}
        {uDef.defenseBonus > 0 && (
          <span className="text-[#22c55e] font-bold">🛡️+{uDef.defenseBonus}</span>
        )}
        <span className="text-[#8899aa]">{uDef.cost}PO</span>
        {uDef.navalOnly && <span className="text-[#3b82f6]">⛵NAV</span>}
        {uDef.landOnly  && <span className="text-[#d97706]">🏔️TER</span>}
      </div>
      {/* Effetto speciale */}
      {selected && uDef.specialEffect && (
        <p className="text-[8px] text-[#8899aa] italic leading-tight mt-0.5">
          ℹ️ {uDef.specialEffect}
        </p>
      )}
    </button>
  );
}

// ─── Componente principale ───────────────────────────────────────────────────
export default function CombatPanel({
  myFaction, gameState, territories, myUnitsPool,
  onAttack, onDeploy, onClose,
}: Props) {
  const [mode, setMode] = useState<'deploy' | 'attack' | 'roster'>('roster');

  // ── Deploy state ──
  const [deployTerritory, setDeployTerritory] = useState<TerritoryId | null>(null);
  const [deployUnit, setDeployUnit]           = useState<UnitType | null>(null);
  const [deployQty, setDeployQty]             = useState(1);
  const [deploying, setDeploying]             = useState(false);

  // ── Attack state ──
  const [atkTerritory, setAtkTerritory] = useState<TerritoryId | null>(null);
  const [atkUnits, setAtkUnits]         = useState<UnitType[]>([]);
  const [atkCardOp, setAtkCardOp]       = useState(3);
  const [guerraAsim, setGuerraAsim]     = useState(false);
  const [allianceOn, setAllianceOn]     = useState(false);
  const [attacking, setAttacking]       = useState(false);
  const [lastOutcome, setLastOutcome]   = useState<CombatOutcome | null>(null);

  // Unità di questa fazione
  const myUnitDefs = UNITS_BY_FACTION[myFaction] ?? [];

  // Difensore del territorio selezionato
  const defenderFaction = useMemo((): Faction | null => {
    if (!atkTerritory) return null;
    const ts = territories[atkTerritory];
    if (!ts) return null;
    const infs = ts.influences as Partial<Record<Faction, number>>;
    const sorted = (Object.entries(infs) as [Faction, number][])
      .filter(([f]) => f !== myFaction && (f as string) !== 'Neutrale')
      .sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] > 0 ? sorted[0][0] : null;
  }, [atkTerritory, territories, myFaction]);

  // Preview combattimento
  const preview = useMemo(() => {
    if (!atkTerritory || !defenderFaction || atkUnits.length === 0) return null;
    const ts = territories[atkTerritory];
    const defUnits = (ts?.units?.[defenderFaction] ?? {}) as Partial<Record<UnitType, number>>;
    // Hormuz: NavaleGolfo Iran in StrettoHormuz
    const hormuzTs  = territories['StrettoHormuz'];
    const hormuzQty = (hormuzTs?.units?.['Iran']?.['NavaleGolfo'] ?? 0) +
                      (hormuzTs?.units?.['Iran']?.['Navale'] ?? 0);
    return resolveCombat({
      attacker: myFaction,
      defender: defenderFaction,
      territory: atkTerritory,
      cardOpPoints: atkCardOp,
      unitTypesUsed: atkUnits,
      defenderUnitsInTerritory: defUnits,
      gameState,
      hormuzActive:            checkHormuz(hormuzQty),
      allianceActive:          allianceOn,
      guerraAsimmetricaActive: guerraAsim,
    });
  }, [atkTerritory, defenderFaction, atkUnits, atkCardOp, gameState, allianceOn, guerraAsim, myFaction, territories]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDeploy = async () => {
    if (!deployTerritory || !deployUnit) return;
    const tDef = TERRITORY_MAP[deployTerritory];
    const uDef = UNIT_MAP[deployUnit];
    if (!uDef) return;
    if (uDef.navalOnly && !tDef?.isNaval) {
      alert(`${uDef.label} può essere schierata solo in territori navali!`); return;
    }
    if (uDef.landOnly && !tDef?.isLand) {
      alert(`${uDef.label} può essere schierata solo in territori terrestri!`); return;
    }
    setDeploying(true);
    await onDeploy(deployTerritory, deployUnit, deployQty);
    setDeploying(false);
    setDeployUnit(null); setDeployQty(1);
  };

  const handleAttack = async () => {
    if (!preview || !atkTerritory || !defenderFaction) return;
    setAttacking(true);
    setLastOutcome(preview);
    await onAttack({ territory: atkTerritory, defender: defenderFaction, unitsUsed: atkUnits, outcome: preview });
    setAttacking(false);
    setAtkUnits([]); setAtkTerritory(null);
  };

  const toggleUnit = (ut: UnitType) =>
    setAtkUnits(prev => prev.includes(ut) ? prev.filter(u => u !== ut) : [...prev, ut]);

  const rs = lastOutcome ? RESULT_STYLE[lastOutcome.result] : null;
  const factionColor = FACTION_COLOR[myFaction];

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
          ⚔️ OPERAZIONI MILITARI
          <span className="text-[10px] px-2 py-0.5 rounded font-bold"
            style={{ color: factionColor, border: `1px solid ${factionColor}40`, background: `${factionColor}15` }}>
            {FACTION_LABEL[myFaction]}
          </span>
        </h3>
        <button onClick={onClose} className="text-[#8899aa] hover:text-white font-mono text-xs">✕</button>
      </div>

      {/* Tab selector */}
      <div className="flex rounded-lg overflow-hidden border border-[#1e3a5f]">
        {(['roster', 'deploy', 'attack'] as const).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setLastOutcome(null); }}
            className={`flex-1 py-2 text-[10px] font-mono font-bold transition-all
              ${mode === m ? 'text-white' : 'bg-[#0a0e1a] text-[#8899aa] hover:text-white'}`}
            style={mode === m ? { background: factionColor + '33', borderBottom: `2px solid ${factionColor}` } : {}}>
            {m === 'roster' ? '📋 UNITÀ' : m === 'deploy' ? '🪖 SCHIERA' : '🎯 ATTACCA'}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB ROSTER — tutte le unità con caratteristiche
      ═══════════════════════════════════════════════════════════════ */}
      {mode === 'roster' && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-mono text-[#8899aa]">
            Forze disponibili per {FACTION_LABEL[myFaction]}. Hover/tap su un'unità per vedere l'effetto speciale.
          </p>
          <div className="flex flex-col gap-1.5">
            {myUnitDefs.map(u => {
              const qty = myUnitsPool[u.type] ?? 0;
              return (
                <div key={u.type}
                  className="flex flex-col gap-1 p-2.5 rounded-lg border border-[#1e3a5f] bg-[#0a0e1a]">
                  {/* Header riga */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white flex items-center gap-1.5">
                      <span className="text-base">{u.icon}</span>
                      <span className="font-bold">{u.label}</span>
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      qty === 0 ? 'text-[#6b7280] bg-[#1e293b]' : 'text-[#f59e0b] bg-[#f59e0b20]'
                    }`}>
                      ×{qty} disp.
                    </span>
                  </div>
                  {/* Stats bar */}
                  <div className="flex gap-3 text-[9px] font-mono">
                    <span className={u.attackBonus > 0 ? 'text-[#ef4444]' : 'text-[#374151]'}>
                      ⚔️ ATK {u.attackBonus > 0 ? `+${u.attackBonus}` : '—'}
                    </span>
                    <span className={u.defenseBonus > 0 ? 'text-[#22c55e]' : 'text-[#374151]'}>
                      🛡️ DEF {u.defenseBonus > 0 ? `+${u.defenseBonus}` : '—'}
                    </span>
                    <span className="text-[#8899aa]">💰 {u.cost} PO</span>
                    {u.navalOnly && <span className="text-[#3b82f6]">⛵ Solo navale</span>}
                    {u.landOnly  && <span className="text-[#d97706]">🏔️ Solo terra</span>}
                    {u.maxPerTerritory && (
                      <span className="text-[#a855f7]">Max {u.maxPerTerritory}/terr.</span>
                    )}
                  </div>
                  {/* Effetto speciale */}
                  {u.specialEffect && (
                    <p className="text-[9px] text-[#8899aa] italic leading-tight border-t border-[#1e3a5f] pt-1 mt-0.5">
                      ✨ {u.specialEffect}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB DEPLOY
      ═══════════════════════════════════════════════════════════════ */}
      {mode === 'deploy' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-mono text-[#8899aa]">
            Schiera unità in un territorio per aumentare la forza difensiva.
          </p>

          {/* Territorio */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">📍 Territorio</label>
            <select
              value={deployTerritory ?? ''}
              onChange={e => { setDeployTerritory(e.target.value as TerritoryId || null); setDeployUnit(null); }}
              className="w-full bg-[#0d1421] border border-[#1e3a5f] text-white font-mono text-xs rounded-lg px-2 py-1.5">
              <option value="">— seleziona —</option>
              {TERRITORIES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}{t.isNaval && t.isLand ? ' (terra+navale)' : t.isNaval ? ' (navale)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Unità disponibili */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">🪖 Seleziona Unità</label>
            <div className="grid grid-cols-2 gap-1.5">
              {myUnitDefs.map(u => {
                const available = myUnitsPool[u.type] ?? 0;
                const tDef = deployTerritory ? TERRITORY_MAP[deployTerritory] : null;
                const disabled =
                  available === 0 ||
                  (u.navalOnly === true && !tDef?.isNaval) ||
                  (u.landOnly  === true && !tDef?.isLand);
                return (
                  <UnitCard
                    key={u.type}
                    unitType={u.type}
                    qty={available}
                    selected={deployUnit === u.type}
                    disabled={disabled}
                    mode="deploy"
                    onClick={() => { setDeployUnit(deployUnit === u.type ? null : u.type); setDeployQty(1); }}
                  />
                );
              })}
            </div>
          </div>

          {/* Quantità + Costo */}
          {deployUnit && (
            <div className="flex items-center justify-between bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-3 py-2">
              <label className="text-[10px] font-mono text-[#8899aa]">Quantità:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeployQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded bg-[#1e3a5f] text-white font-mono text-sm hover:bg-[#2a4a7f]">−</button>
                <span className="font-mono font-bold text-white w-5 text-center text-sm">{deployQty}</span>
                <button onClick={() => setDeployQty(q => Math.min(myUnitsPool[deployUnit] ?? 1, q + 1))}
                  className="w-7 h-7 rounded bg-[#1e3a5f] text-white font-mono text-sm hover:bg-[#2a4a7f]">+</button>
              </div>
              <span className="font-mono text-xs text-[#f59e0b] font-bold">
                {(UNIT_MAP[deployUnit]?.cost ?? 0) * deployQty} PO
              </span>
            </div>
          )}

          <button
            disabled={!deployTerritory || !deployUnit || deploying}
            onClick={handleDeploy}
            className="w-full py-2.5 rounded-lg font-mono font-bold text-sm text-white transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: deploying ? '#1e3a5f' : factionColor,
              boxShadow: deploying ? 'none' : `0 0 20px ${factionColor}40`,
            }}>
            {deploying ? '⏳ Schieramento...' : `🪖 SCHIERA ${deployUnit ? UNIT_MAP[deployUnit]?.label : ''}`}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB ATTACK
      ═══════════════════════════════════════════════════════════════ */}
      {mode === 'attack' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-mono text-[#8899aa]">
            Dichiara un attacco su un territorio nemico usando una carta Militare.
          </p>

          {/* Territorio bersaglio */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">🎯 Territorio Bersaglio</label>
            <select
              value={atkTerritory ?? ''}
              onChange={e => { setAtkTerritory(e.target.value as TerritoryId || null); setLastOutcome(null); setAtkUnits([]); }}
              className="w-full bg-[#0d1421] border border-[#1e3a5f] text-white font-mono text-xs rounded-lg px-2 py-1.5">
              <option value="">— seleziona —</option>
              {TERRITORIES.map(t => {
                const ts = territories[t.id];
                const infs = ts?.influences ?? {};
                const hasEnemy = Object.entries(infs).some(([f, v]) => f !== myFaction && (v as number) > 0);
                return (
                  <option key={t.id} value={t.id} disabled={!hasEnemy}>
                    {t.label}{!hasEnemy ? ' (nessun avversario)' : ''}
                  </option>
                );
              })}
            </select>
            {defenderFaction && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono text-[#8899aa]">Difensore:</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ color: FACTION_COLOR[defenderFaction], background: `${FACTION_COLOR[defenderFaction]}20` }}>
                  {FACTION_LABEL[defenderFaction]}
                </span>
              </div>
            )}
          </div>

          {/* PO carta */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">
              💳 PO Carta Militare (forza base attacco)
            </label>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setAtkCardOp(n)}
                  className={`flex-1 py-1.5 rounded font-mono text-xs font-bold transition-all
                    ${atkCardOp === n ? 'text-black' : 'bg-[#1e3a5f] text-white hover:bg-[#2a4a7f]'}`}
                  style={atkCardOp === n ? { background: factionColor } : {}}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Unità impiegate */}
          <div>
            <label className="text-[10px] font-mono text-[#8899aa] block mb-1">
              🪖 Unità Impiegate (seleziona per includere nel calcolo)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {myUnitDefs.map(u => {
                const available = myUnitsPool[u.type] ?? 0;
                const selected  = atkUnits.includes(u.type);
                const disabled  = available === 0 && !selected;
                return (
                  <UnitCard
                    key={u.type}
                    unitType={u.type}
                    qty={available}
                    selected={selected}
                    disabled={disabled}
                    mode="attack"
                    onClick={() => toggleUnit(u.type)}
                  />
                );
              })}
            </div>
          </div>

          {/* Opzioni speciali */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg border border-[#1e3a5f] bg-[#0a0e1a]">
            <p className="text-[9px] font-mono text-[#8899aa]">⚙️ Opzioni Speciali</p>
            {myFaction === 'Iran' && atkTerritory === 'Iran' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={guerraAsim} onChange={e => setGuerraAsim(e.target.checked)}
                  className="accent-[#dc2626]" />
                <span className="text-[10px] font-mono text-[#dc2626]">
                  ⚡ Guerra Asimmetrica (+3 DEF casa, danno garantito)
                </span>
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
            <div className="bg-[#050810] border border-[#1e3a5f] rounded-lg p-3 text-xs font-mono">
              <p className="text-[#8899aa] text-[9px] mb-2 font-bold">⚙️ CALCOLO FORZE IN TEMPO REALE</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <p className="text-[#ef4444] font-bold mb-1">⚔️ ATK: {preview.attackForce}</p>
                  {preview.attackBreakdown.map((l, i) => (
                    <p key={i} className="text-[8px] text-[#6b7280] leading-tight">{l}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[#3b82f6] font-bold mb-1">🛡️ DEF: {preview.defenseForce}</p>
                  {preview.defenseBreakdown.map((l, i) => (
                    <p key={i} className="text-[8px] text-[#6b7280] leading-tight">{l}</p>
                  ))}
                </div>
              </div>

              {/* Effetti speciali attivati */}
              {preview.extraEffects.length > 0 && (
                <div className="border-t border-[#1e3a5f] pt-2 mb-2">
                  <p className="text-[8px] text-[#a855f7] font-bold mb-1">✨ EFFETTI SPECIALI:</p>
                  {preview.extraEffects.map((e, i) => (
                    <p key={i} className="text-[8px] text-[#a855f7]">{e}</p>
                  ))}
                </div>
              )}

              <div className="border-t border-[#1e3a5f] pt-2 text-center">
                <span className="text-[11px] font-bold"
                  style={{ color: RESULT_STYLE[preview.result]?.color }}>
                  {RESULT_STYLE[preview.result]?.icon} {RESULT_STYLE[preview.result]?.label}
                </span>
                <p className="text-[9px] text-[#8899aa] mt-0.5">{preview.description}</p>
              </div>
            </div>
          )}

          <button
            disabled={!atkTerritory || atkUnits.length === 0 || !defenderFaction || attacking}
            onClick={handleAttack}
            className="w-full py-2.5 rounded-lg font-mono font-bold text-sm text-white transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: attacking ? '#1e3a5f' : '#7f1d1d',
              boxShadow: attacking ? 'none' : '0 0 20px #dc262630',
            }}>
            {attacking ? '⏳ Risoluzione combattimento...' : '⚔️ DICHIARA ATTACCO'}
          </button>
        </div>
      )}

      {/* ─── Risultato ultimo combattimento ──────────────────────────────── */}
      {lastOutcome && rs && (
        <div className="border rounded-lg p-3 font-mono text-xs mt-1"
          style={{ borderColor: rs.color, backgroundColor: `${rs.color}0f` }}>
          <p className="font-bold text-sm mb-1" style={{ color: rs.color }}>
            {rs.icon} {rs.label}
          </p>
          <p className="text-[#d1d5db] text-[10px] mb-2">{lastOutcome.description}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[#8899aa] text-[9px]">Forza ATK</p>
              <p className="font-bold text-[#ef4444] text-sm">{lastOutcome.attackForce}</p>
            </div>
            <div>
              <p className="text-[#8899aa] text-[9px]">Forza DEF</p>
              <p className="font-bold text-[#3b82f6] text-sm">{lastOutcome.defenseForce}</p>
            </div>
            <div>
              <p className="text-[#8899aa] text-[9px]">Δ DEFCON</p>
              <p className={`font-bold text-sm ${lastOutcome.defconChange < 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                {lastOutcome.defconChange >= 0 ? '+' : ''}{lastOutcome.defconChange}
              </p>
            </div>
          </div>
          {lastOutcome.attackerUnitsLost > 0 && (
            <p className="text-[#ef4444] mt-1.5 text-[10px]">
              ⚠️ Perse {lastOutcome.attackerUnitsLost} unità
            </p>
          )}
          {lastOutcome.stabilityChange < 0 && (
            <p className="text-[#dc2626] text-[10px]">
              📉 Stabilità Interna {lastOutcome.stabilityChange}
            </p>
          )}
          {lastOutcome.extraEffects.length > 0 && (
            <div className="mt-1.5 border-t border-[#1e3a5f] pt-1.5">
              {lastOutcome.extraEffects.map((e, i) => (
                <p key={i} className="text-[9px] text-[#a855f7]">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

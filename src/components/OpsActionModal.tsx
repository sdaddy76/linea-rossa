// =============================================
// LINEA ROSSA — OpsActionModal
// Modale a step per usare i Punti OP di una carta:
//
// STEP 0 — Scegli azione:
//   🏭 Acquista Unità Militari
//   📣 Influenza Territorio
//   ⚔️  Attacca Territorio
//
// STEP 1a — Acquista Unità: seleziona tipo unità (max OP)
// STEP 1b — Influenza:     seleziona territorio → +1 inf per OP speso
// STEP 1c — Attacca:       seleziona territorio → scegli unità → dadi
// STEP 2  — Risultato combattimento / conferma
// =============================================
import { useState, useMemo } from 'react';
import type { DeckCard, Faction, GameState, TerritoryRecord, MilitaryUnitRecord } from '@/types/game';
import { FACTION_COLORS, FACTION_FLAGS } from '@/lib/factionColors';
import { UNITS, UNITS_BY_FACTION } from '@/lib/territoriesData';
import { TERRITORIES } from '@/lib/territoriesData';

// ── Tipi interni ──────────────────────────────────────────────────────────────
type OpsAction = 'buy' | 'influence' | 'attack';

interface CombatResult {
  roll_atk: number;
  roll_def: number;
  atk_total: number;
  def_total: number;
  result: 'vittoria_decisiva' | 'vittoria' | 'stallo' | 'sconfitta' | 'sconfitta_grave';
  inf_change_atk: number;
  inf_change_def: number;
  defcon_change: number;
  description: string;
  attackerUnitsLost: number;
  stabilityChange: number;
  extra_effects?: Record<string, unknown>;
}

interface Props {
  card: DeckCard;
  myFaction: Faction;
  gameState: GameState;
  territories: TerritoryRecord[];
  militaryUnits: MilitaryUnitRecord[];
  unitPool?: Partial<Record<UnitType, number>>; // pool unità acquistate
  onBuyUnits:    (unitType: string, qty: number, opSpent: number) => Promise<void>;
  onInfluence:   (territory: string, opSpent: number) => Promise<void>;
  onAttack:      (params: {
    territory: string;
    unitTypes: string[];
    attackForce: number;
    defenseForce: number;
    result: CombatResult['result'];
    infChangeAtk: number;
    infChangeDef: number;
    defconChange: number;
    description: string;
    attackerUnitsLost: number;
    stabilityChange: number;
    extra_effects?: Record<string, unknown>;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function rollD6(): number { return Math.floor(Math.random() * 6) + 1; }

function resolveCombat(atkForce: number, defForce: number): CombatResult {
  const roll_atk = rollD6() + rollD6();
  const roll_def = rollD6() + rollD6();
  const atk_total = atkForce + roll_atk;
  const def_total = defForce + roll_def;
  const diff = atk_total - def_total;

  let result: CombatResult['result'];
  let inf_change_atk = 0;
  let inf_change_def = 0;
  let defcon_change = 0;
  let attackerUnitsLost = 0;
  let stabilityChange = 0;
  let description = '';

  if (diff >= 6) {
    result = 'vittoria_decisiva';
    inf_change_atk = 2; inf_change_def = -2; defcon_change = -1;
    attackerUnitsLost = 0; stabilityChange = -1;
    description = `Vittoria Decisiva! +2 influenza per l'attaccante, -2 per il difensore.`;
  } else if (diff >= 2) {
    result = 'vittoria';
    inf_change_atk = 1; inf_change_def = -1; defcon_change = 0;
    attackerUnitsLost = 0; stabilityChange = 0;
    description = `Vittoria! +1 influenza per l'attaccante.`;
  } else if (diff >= -1) {
    result = 'stallo';
    inf_change_atk = 0; inf_change_def = 0; defcon_change = 1;
    attackerUnitsLost = 1; stabilityChange = 0;
    description = `Stallo. Nessuna variazione di influenza. DEFCON +1.`;
  } else if (diff >= -4) {
    result = 'sconfitta';
    inf_change_atk = -1; inf_change_def = 1; defcon_change = 0;
    attackerUnitsLost = 1; stabilityChange = 1;
    description = `Sconfitta. -1 influenza attaccante, +1 difensore.`;
  } else {
    result = 'sconfitta_grave';
    inf_change_atk = -2; inf_change_def = 2; defcon_change = 1;
    attackerUnitsLost = 2; stabilityChange = 2;
    description = `Sconfitta Grave! -2 influenza, +2 per il difensore. DEFCON +1.`;
  }

  return { roll_atk, roll_def, atk_total, def_total, result, inf_change_atk, inf_change_def,
    defcon_change, description, attackerUnitsLost, stabilityChange };
}

const RESULT_COLOR: Record<CombatResult['result'], string> = {
  vittoria_decisiva: '#00ff88',
  vittoria: '#66ff99',
  stallo: '#ffcc44',
  sconfitta: '#ff8844',
  sconfitta_grave: '#ff4444',
};
const RESULT_LABEL: Record<CombatResult['result'], string> = {
  vittoria_decisiva: '🏆 VITTORIA DECISIVA',
  vittoria: '✅ VITTORIA',
  stallo: '🤝 STALLO',
  sconfitta: '❌ SCONFITTA',
  sconfitta_grave: '💀 SCONFITTA GRAVE',
};

// ── Componente principale ─────────────────────────────────────────────────────
export default function OpsActionModal({
  card, myFaction, gameState, territories, militaryUnits,
  onBuyUnits, onInfluence, onAttack, onCancel, loading,
  initialStep, unitPool = {},
}: Props & { initialStep?: 'choose' | 'buy' | 'influence' | 'attack' }) {
  const fColor = FACTION_COLORS[myFaction] ?? '#8899aa';
  const opPoints = card.op_points;

  // ── Step state ──
  const [step, setStep] = useState<'choose' | 'buy' | 'influence' | 'attack' | 'result'>(initialStep ?? 'choose');
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [combatTerritory, setCombatTerritory] = useState('');

  // ── Buy state ──
  const [buyUnit, setBuyUnit] = useState<string | null>(null);
  const [buyQty, setBuyQty] = useState(1);

  // ── Influence state ──
  const [infTerritory, setInfTerritory] = useState<string | null>(null);
  const [infOp, setInfOp] = useState(1);

  // ── Attack state ──
  const [atkTerritory, setAtkTerritory] = useState<string | null>(null);
  const [atkUnits, setAtkUnits] = useState<string[]>([]);

  // ── Unità disponibili per questa fazione ──
  // Per Russia usiamo una whitelist esplicita per evitare inclusioni indesiderate
  const RUSSIA_UNITS: UnitType[] = ['Convenzionale', 'SottomariniAKULA', 'GuerraIbrida'];
  const myUnits = useMemo(() => {
    if (myFaction === 'Russia') {
      return UNITS.filter(u => (RUSSIA_UNITS as string[]).includes(u.type));
    }
    return UNITS_BY_FACTION[myFaction] ?? UNITS.filter(u => u.faction === myFaction || u.faction === 'Tutti');
  }, [myFaction]);

  // ── Forza attacco calcolata ──
  const atkForce = useMemo(() => {
    return atkUnits.reduce((sum, ut) => {
      const def = UNITS.find(u => u.type === ut);
      return sum + (def?.attackBonus ?? 0);
    }, opPoints); // OP base + bonus unità
  }, [atkUnits, opPoints]);

  // ── Forza difesa territorio bersaglio ──
  const defForce = useMemo(() => {
    if (!atkTerritory) return 3;
    const terrUnits = militaryUnits.filter(u => u.territory === atkTerritory && u.faction !== myFaction);
    return terrUnits.reduce((sum, u) => {
      const def = UNITS.find(ud => ud.type === u.unit_type);
      return sum + (def?.defenseBonus ?? 0) * u.quantity;
    }, 3); // base difesa 3
  }, [atkTerritory, militaryUnits, myFaction]);

  // ── Costo acquisto selezionato ──
  const buyCost = useMemo(() => {
    if (!buyUnit) return 0;
    const def = UNITS.find(u => u.type === buyUnit);
    return (def?.cost ?? 1) * buyQty;
  }, [buyUnit, buyQty]);

  const canBuy = buyCost > 0 && buyCost <= opPoints;

  // ─────────────────────────────────────────────────────────────────
  // RENDER helpers
  // ─────────────────────────────────────────────────────────────────
  const Header = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${fColor}22` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            style={{ color: fColor }}>
            {FACTION_FLAGS[myFaction]} {myFaction} — {card.op_points} OP disponibili
          </p>
          <h2 className="font-black font-mono text-white text-lg">{title}</h2>
          {sub && <p className="text-[11px] font-mono text-[#8899aa] mt-0.5">{sub}</p>}
        </div>
        <div className="text-2xl font-black font-mono shrink-0 ml-3" style={{ color: fColor }}>
          {opPoints} <span className="text-xs font-mono text-[#556677]">OP</span>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP 0 — Scegli azione
  // ─────────────────────────────────────────────────────────────────
  if (step === 'choose') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="Usa Punti Operazione" sub={`Carta: ${card.card_name}`} />
      <div className="px-5 py-5 space-y-3">
        {[
          { id: 'buy'       as OpsAction, icon: '🏭', label: 'Acquista Unità Militari',
            desc: `Spendi OP per schierare nuove unità nel tuo pool` },
          { id: 'influence' as OpsAction, icon: '📣', label: 'Influenza Territorio',
            desc: `+1 influenza per OP speso in un territorio (max ${opPoints})` },
          { id: 'attack'    as OpsAction, icon: '⚔️',  label: 'Attacca Territorio',
            desc: `Usa ${opPoints} OP + forza unità per attaccare, risolvi con i dadi` },
        ].map(a => (
          <button key={a.id} onClick={() => setStep(a.id)}
            className="w-full p-4 rounded-xl flex items-center gap-4 text-left transition-all
              hover:scale-[1.02] active:scale-100"
            style={{ backgroundColor: `${fColor}12`, border: `2px solid ${fColor}35` }}>
            <span className="text-3xl shrink-0">{a.icon}</span>
            <div>
              <p className="font-black font-mono text-sm text-white">{a.label}</p>
              <p className="text-[10px] font-mono text-[#8899aa] mt-0.5">{a.desc}</p>
            </div>
            <span className="ml-auto text-[#556677] font-mono text-lg">›</span>
          </button>
        ))}
      </div>
      <div className="px-5 pb-5">
        <button onClick={onCancel}
          className="w-full py-2.5 border border-[#1e2a3a] rounded-xl font-mono text-xs
            text-[#556677] hover:text-[#8899aa] transition-colors">
          ✕ Annulla
        </button>
      </div>
    </Wrapper>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP 1a — Acquista Unità
  // ─────────────────────────────────────────────────────────────────
  if (step === 'buy') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="🏭 Acquista Unità" sub={`Budget: ${opPoints} OP`} />
      <div className="px-5 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
        {myUnits.map(u => {
          const maxQty = Math.floor(opPoints / u.cost);
          if (maxQty === 0) return null;
          const sel = buyUnit === u.type;
          return (
            <button key={u.type} onClick={() => { setBuyUnit(u.type); setBuyQty(1); }}
              className="w-full p-3 rounded-xl text-left transition-all"
              style={{
                backgroundColor: sel ? `${fColor}20` : `${fColor}08`,
                border: `2px solid ${sel ? fColor : fColor + '25'}`,
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{u.icon}</span>
                  <div>
                    <p className="font-bold font-mono text-sm text-white">{u.label}</p>
                    <p className="text-[10px] font-mono text-[#8899aa]">{u.specialEffect}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2 space-y-0.5">
                  <p className="font-black font-mono text-sm" style={{ color: fColor }}>{u.cost} OP</p>
                  <p className="text-[10px] font-mono text-[#556677]">per unità</p>
                  {/* Mostra quante ne hai già nel pool */}
                  {((unitPool[u.type as UnitType] ?? 0) > 0) && (
                    <p className="text-[10px] font-mono text-[#00ff88]">
                      pool: ×{unitPool[u.type as UnitType]}
                    </p>
                  )}
                </div>
              </div>
              {/* Selettore quantità */}
              {sel && (
                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${fColor}20` }}>
                  <span className="text-[11px] font-mono text-[#8899aa]">Quantità:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setBuyQty(q => Math.max(1, q - 1)); }}
                      className="w-7 h-7 rounded-lg font-mono font-bold text-white text-sm
                        flex items-center justify-center hover:opacity-80"
                      style={{ backgroundColor: `${fColor}30` }}>−</button>
                    <span className="font-black font-mono text-white text-lg w-6 text-center">{buyQty}</span>
                    <button onClick={(e) => { e.stopPropagation(); setBuyQty(q => Math.min(maxQty, q + 1)); }}
                      className="w-7 h-7 rounded-lg font-mono font-bold text-white text-sm
                        flex items-center justify-center hover:opacity-80"
                      style={{ backgroundColor: `${fColor}30` }}>+</button>
                  </div>
                  <span className="ml-auto font-black font-mono text-sm" style={{ color: fColor }}>
                    = {u.cost * buyQty} OP
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="px-5 pb-5 space-y-2">
        {buyUnit && (
          <div className="p-2 rounded-lg text-center text-[11px] font-mono"
            style={{ backgroundColor: `${fColor}15`, color: fColor }}>
            {canBuy
              ? `✅ Acquista ${buyQty}× ${UNITS.find(u => u.type === buyUnit)?.label} per ${buyCost} OP`
              : `⛔ Costo ${buyCost} OP supera i ${opPoints} OP disponibili`}
          </div>
        )}
        <button
          onClick={async () => {
            if (!buyUnit || !canBuy) return;
            await onBuyUnits(buyUnit, buyQty, buyCost);
          }}
          disabled={!canBuy || loading}
          className="w-full py-3 rounded-xl font-black font-mono text-sm transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: canBuy ? fColor : '#334455', color: '#0a0e1a' }}>
          {loading ? '⏳ Elaborazione…' : `🏭 CONFERMA ACQUISTO`}
        </button>
        <BackBtn onBack={() => setStep('choose')} />
      </div>
    </Wrapper>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP 1b — Influenza Territorio
  // ─────────────────────────────────────────────────────────────────
  if (step === 'influence') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="📣 Influenza Territorio" sub={`Spendi OP per guadagnare influenza`} />
      <div className="px-5 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
        {TERRITORIES.map(t => {
          const rec = territories.find(r => r.territory === t.id);
          const myInf = rec ? (rec[`inf_${myFaction.toLowerCase()}` as keyof TerritoryRecord] as number ?? 0) : 0;
          const sel = infTerritory === t.id;
          return (
            <button key={t.id} onClick={() => setInfTerritory(t.id)}
              className="w-full p-3 rounded-xl text-left transition-all"
              style={{
                backgroundColor: sel ? `${fColor}20` : `${fColor}08`,
                border: `2px solid ${sel ? fColor : fColor + '20'}`,
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold font-mono text-sm text-white">{t.id}</p>
                  <p className="text-[10px] font-mono text-[#556677]">{t.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-black font-mono text-sm" style={{ color: fColor }}>
                    {myInf} / 5 inf
                  </p>
                  <div className="w-16 h-1.5 bg-[#1e2a3a] rounded-full mt-1">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(myInf / 5) * 100}%`, backgroundColor: fColor }} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {infTerritory && (
        <div className="px-5 pb-2">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${fColor}12`, border: `1px solid ${fColor}30` }}>
            <p className="text-[11px] font-mono text-white mb-2">
              Quanti OP vuoi investire in <strong style={{ color: fColor }}>{infTerritory}</strong>?
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setInfOp(o => Math.max(1, o - 1))}
                className="w-8 h-8 rounded-lg font-mono font-bold text-white text-sm flex items-center justify-center"
                style={{ backgroundColor: `${fColor}25` }}>−</button>
              <span className="font-black font-mono text-2xl text-white w-8 text-center">{infOp}</span>
              <button onClick={() => setInfOp(o => Math.min(opPoints, o + 1))}
                className="w-8 h-8 rounded-lg font-mono font-bold text-white text-sm flex items-center justify-center"
                style={{ backgroundColor: `${fColor}25` }}>+</button>
              <span className="ml-2 font-mono text-[11px] text-[#8899aa]">
                OP → +{infOp} influenza
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="px-5 pb-5 space-y-2 mt-2">
        <button
          onClick={async () => {
            if (!infTerritory) return;
            await onInfluence(infTerritory, infOp);
          }}
          disabled={!infTerritory || loading}
          className="w-full py-3 rounded-xl font-black font-mono text-sm transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: infTerritory ? fColor : '#334455', color: '#0a0e1a' }}>
          {loading ? '⏳ Elaborazione…' : `📣 CONFERMA +${infOp} INFLUENZA`}
        </button>
        <BackBtn onBack={() => setStep('choose')} />
      </div>
    </Wrapper>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP 1c — Attacca Territorio
  // ─────────────────────────────────────────────────────────────────
  if (step === 'attack') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="⚔️ Attacca Territorio" sub={`Forza base: ${opPoints} OP + bonus unità`} />
      <div className="px-5 py-3">
        {/* Scegli territorio */}
        <p className="text-[10px] font-mono font-bold uppercase text-[#8899aa] mb-2">
          Seleziona territorio bersaglio
        </p>
        <div className="grid grid-cols-2 gap-2 max-h-[28vh] overflow-y-auto mb-4">
          {TERRITORIES.map(t => {
            const sel = atkTerritory === t.id;
            return (
              <button key={t.id} onClick={() => setAtkTerritory(t.id)}
                className="p-2.5 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: sel ? '#ff444420' : '#0a0e1a',
                  border: `2px solid ${sel ? '#ff4444' : '#1e2a3a'}`,
                }}>
                <p className="font-bold font-mono text-xs text-white truncate">{t.id}</p>
                <p className="text-[9px] font-mono text-[#556677]">{t.type}</p>
              </button>
            );
          })}
        </div>

        {/* Scegli unità da impiegare */}
        {atkTerritory && (
          <>
            <p className="text-[10px] font-mono font-bold uppercase text-[#8899aa] mb-1">
              Unità da impiegare (solo dal tuo pool)
            </p>
            {/* Mostra pool totale compatto */}
            <div className="flex flex-wrap gap-1 mb-2">
              {myUnits.map(u => {
                const inPool = unitPool[u.type as UnitType] ?? 0;
                const inUse  = atkUnits.filter(x => x === u.type).length;
                return (
                  <span key={u.type} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: inPool > 0 ? '#00ff8815' : '#0a0e1a', color: inPool > 0 ? '#00ff88' : '#334455', border: `1px solid ${inPool > 0 ? '#00ff8840' : '#1e2a3a'}` }}>
                    {u.icon} ×{inPool - inUse > 0 ? inPool - inUse : 0} disponibili
                  </span>
                );
              })}
            </div>
            <div className="space-y-1.5 max-h-[22vh] overflow-y-auto mb-3">
              {myUnits.map(u => {
                const inPool    = unitPool[u.type as UnitType] ?? 0;
                const usedCount = atkUnits.filter(x => x === u.type).length;
                const canAdd    = usedCount < inPool; // non puoi usare più di quelle che hai
                const active    = usedCount > 0;
                const disabled  = inPool === 0;
                return (
                  <button key={u.type}
                    disabled={disabled}
                    onClick={() => {
                      if (active) {
                        // Rimuovi una unità di questo tipo
                        setAtkUnits(prev => { const i = prev.lastIndexOf(u.type); return i >= 0 ? [...prev.slice(0,i), ...prev.slice(i+1)] : prev; });
                      } else if (canAdd) {
                        setAtkUnits(prev => [...prev, u.type]);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all"
                    style={{
                      backgroundColor: disabled ? '#06080f' : active ? '#ff444415' : '#0a0e1a',
                      border: `1px solid ${disabled ? '#0f1520' : active ? '#ff444460' : '#1e2a3a'}`,
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}>
                    <span className="text-base">{u.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold font-mono text-xs truncate" style={{ color: disabled ? '#334455' : 'white' }}>{u.label}</p>
                      <p className="text-[9px] font-mono" style={{ color: disabled ? '#223' : '#556677' }}>
                        {disabled ? 'Non nel pool — acquista prima' : `Pool: ×${inPool} · Usate: ×${usedCount}`}
                      </p>
                    </div>
                    <span className="font-black font-mono text-xs shrink-0"
                      style={{ color: active ? '#ff6644' : disabled ? '#223' : '#556677' }}>
                      +{u.attackBonus} ATK
                    </span>
                    {active && <span className="text-[#ff4444] text-sm font-bold">×{usedCount}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Riepilogo forze */}
        {atkTerritory && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 rounded-xl text-center"
              style={{ backgroundColor: `${fColor}12`, border: `1px solid ${fColor}30` }}>
              <p className="text-[9px] font-mono text-[#8899aa]">LA TUA FORZA</p>
              <p className="text-2xl font-black font-mono" style={{ color: fColor }}>{atkForce}</p>
            </div>
            <div className="p-3 rounded-xl text-center"
              style={{ backgroundColor: '#ff444412', border: '1px solid #ff444430' }}>
              <p className="text-[9px] font-mono text-[#8899aa]">DIFESA STIMATA</p>
              <p className="text-2xl font-black font-mono text-[#ff6644]">{defForce}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 space-y-2">
        <button
          onClick={() => {
            if (!atkTerritory) return;
            const result = resolveCombat(atkForce, defForce);
            setCombatResult(result);
            setCombatTerritory(atkTerritory);
            setStep('result');
          }}
          disabled={!atkTerritory || loading}
          className="w-full py-3 rounded-xl font-black font-mono text-sm transition-all
            disabled:opacity-40 disabled:cursor-not-allowed bg-[#ff3322] text-white">
          {loading ? '⏳ Elaborazione…' : `⚔️ LANCIA I DADI`}
        </button>
        <BackBtn onBack={() => setStep('choose')} />
      </div>
    </Wrapper>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP 2 — Risultato combattimento
  // ─────────────────────────────────────────────────────────────────
  if (step === 'result' && combatResult) {
    const rc = combatResult;
    const rColor = RESULT_COLOR[rc.result];
    return (
      <Wrapper onCancel={onCancel} fColor={fColor}>
        <Header title="🎲 Risultato Combattimento" sub={`Territorio: ${combatTerritory}`} />
        <div className="px-5 py-4 space-y-4">
          {/* Dadi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center"
              style={{ backgroundColor: `${fColor}12`, border: `1px solid ${fColor}30` }}>
              <p className="text-[9px] font-mono text-[#8899aa]">ATTACCANTE</p>
              <p className="font-black font-mono text-3xl" style={{ color: fColor }}>{rc.atk_total}</p>
              <p className="text-[9px] font-mono text-[#556677]">dado {rc.roll_atk} + forza {atkForce}</p>
            </div>
            <div className="p-3 rounded-xl text-center bg-[#ff444412] border border-[#ff444430]">
              <p className="text-[9px] font-mono text-[#8899aa]">DIFENSORE</p>
              <p className="font-black font-mono text-3xl text-[#ff6644]">{rc.def_total}</p>
              <p className="text-[9px] font-mono text-[#556677]">dado {rc.roll_def} + difesa {defForce}</p>
            </div>
          </div>

          {/* Risultato */}
          <div className="p-4 rounded-xl text-center"
            style={{ backgroundColor: `${rColor}15`, border: `2px solid ${rColor}50` }}>
            <p className="font-black font-mono text-xl" style={{ color: rColor }}>
              {RESULT_LABEL[rc.result]}
            </p>
            <p className="text-[11px] font-mono text-[#aabbcc] mt-1">{rc.description}</p>
          </div>

          {/* Effetti */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Inf. Attaccante', val: rc.inf_change_atk, sign: true },
              { label: 'Inf. Difensore',  val: rc.inf_change_def, sign: true },
              { label: 'DEFCON',          val: rc.defcon_change,  sign: true },
            ].map(e => (
              <div key={e.label} className="p-2 rounded-lg bg-[#0a0e1a] border border-[#1e2a3a]">
                <p className="text-[9px] font-mono text-[#556677]">{e.label}</p>
                <p className={`font-black font-mono text-base ${
                  e.val > 0 ? 'text-[#00ff88]' : e.val < 0 ? 'text-[#ff4444]' : 'text-[#8899aa]'
                }`}>
                  {e.sign && e.val > 0 ? '+' : ''}{e.val}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={async () => {
              await onAttack({
                territory: combatTerritory,
                unitTypes: atkUnits,
                attackForce: atkForce,
                defenseForce: defForce,
                result: rc.result,
                infChangeAtk: rc.inf_change_atk,
                infChangeDef: rc.inf_change_def,
                defconChange: rc.defcon_change,
                description: rc.description,
                attackerUnitsLost: rc.attackerUnitsLost,
                stabilityChange: rc.stabilityChange,
              });
            }}
            disabled={loading}
            className="w-full py-3 rounded-xl font-black font-mono text-sm disabled:opacity-40"
            style={{ backgroundColor: rColor, color: '#0a0e1a' }}>
            {loading ? '⏳ Applicazione…' : '✅ CONFERMA E APPLICA'}
          </button>
        </div>
      </Wrapper>
    );
  }

  return null;
}

// ── Sub-componenti ─────────────────────────────────────────────────────────────
function Wrapper({ children, onCancel, fColor }: {
  children: React.ReactNode; onCancel: () => void; fColor: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#0d1424', border: `2px solid ${fColor}33`, maxHeight: '92vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack}
      className="w-full py-2.5 border border-[#1e2a3a] rounded-xl font-mono text-xs
        text-[#556677] hover:text-[#8899aa] hover:border-[#334455] transition-colors">
      ← Torna alla scelta
    </button>
  );
}

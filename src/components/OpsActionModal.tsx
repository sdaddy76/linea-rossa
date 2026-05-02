// =============================================
// LINEA ROSSA — OpsActionModal v2
// Meccanica semplificata: Acquista & Piazza in un'unica azione.
//
// STEP choose  → scegli: [🪖 Acquista & Piazza] o [📣 Influenza]
// STEP deploy  → sub-step 'unit': scegli tipo + quantità (costo fisso OP)
//             → sub-step 'territory': scegli territorio dove piazzare
//                 se territorio con unità nemiche → combattimento automatico
// STEP result  → mostra risultato combattimento (se scattato)
// =============================================
import { useState, useMemo } from 'react';
import type { DeckCard, Faction, GameState, TerritoryRecord, MilitaryUnitRecord } from '@/types/game';
import { FACTION_COLORS, FACTION_FLAGS } from '@/lib/factionColors';
import { UNITS, UNITS_BY_FACTION, TERRITORIES } from '@/lib/territoriesData';

// ── Tipi interni ──────────────────────────────────────────────────────────────
type Step = 'choose' | 'deploy-unit' | 'deploy-territory' | 'result';

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
  unitPlaced: boolean; // l'unità viene piazzata solo se non sconfitta grave
}

export interface DeployParams {
  territory: string;
  unitType: string;
  qty: number;
  opSpent: number;
  // Presenti solo se c'è stato combattimento
  combat?: {
    attackForce: number;
    defenseForce: number;
    result: CombatResult['result'];
    infChangeAtk: number;
    infChangeDef: number;
    defconChange: number;
    description: string;
    attackerUnitsLost: number;
    stabilityChange: number;
    unitPlaced: boolean;
  };
}

interface Props {
  card: DeckCard;
  myFaction: Faction;
  gameState: GameState;
  territories: TerritoryRecord[];
  militaryUnits: MilitaryUnitRecord[];
  onDeploy:    (params: DeployParams) => Promise<void>;
  onInfluence: (territory: string, opSpent: number) => Promise<void>;
  onCancel:    () => void;
  loading?:    boolean;
}

// ── Combat engine ─────────────────────────────────────────────────────────────
function rollD6(): number { return Math.floor(Math.random() * 6) + 1; }

function resolveCombat(atkForce: number, defForce: number): CombatResult {
  const roll_atk = rollD6() + rollD6();
  const roll_def = rollD6() + rollD6();
  const atk_total = Math.min(atkForce + roll_atk, 12 + atkForce); // dado max 6 per dado
  const def_total = Math.min(defForce + roll_def, 12 + defForce);
  const diff = atk_total - def_total;

  let result: CombatResult['result'];
  let inf_change_atk = 0, inf_change_def = 0, defcon_change = 0;
  let attackerUnitsLost = 0, stabilityChange = 0;
  let description = '';
  let unitPlaced = true;

  if (diff >= 6) {
    result = 'vittoria_decisiva';
    inf_change_atk = 2; inf_change_def = -2; defcon_change = -1;
    description = `Vittoria Decisiva! +2 influenza attaccante, -2 difensore, DEFCON -1.`;
    unitPlaced = true;
  } else if (diff >= 2) {
    result = 'vittoria';
    inf_change_atk = 1; inf_change_def = -1;
    description = `Vittoria! +1 influenza attaccante, -1 difensore.`;
    unitPlaced = true;
  } else if (diff >= -1) {
    result = 'stallo';
    defcon_change = 1; attackerUnitsLost = 1;
    description = `Stallo. Nessuna variazione influenza. DEFCON +1. L'unità è comunque schierata.`;
    unitPlaced = true;
  } else if (diff >= -4) {
    result = 'sconfitta';
    inf_change_atk = -1; inf_change_def = 1; attackerUnitsLost = 1; stabilityChange = -1;
    description = `Sconfitta. -1 influenza attaccante, +1 difensore. L'unità è persa.`;
    unitPlaced = false;
  } else {
    result = 'sconfitta_grave';
    inf_change_atk = -2; inf_change_def = 2; defcon_change = 1;
    attackerUnitsLost = 2; stabilityChange = -2;
    description = `Sconfitta Grave! -2 influenza, +2 difensore, DEFCON +1. L'unità è distrutta.`;
    unitPlaced = false;
  }

  return {
    roll_atk, roll_def, atk_total, def_total, result,
    inf_change_atk, inf_change_def, defcon_change,
    description, attackerUnitsLost, stabilityChange, unitPlaced,
  };
}

const RESULT_COLOR: Record<CombatResult['result'], string> = {
  vittoria_decisiva: '#00ff88',
  vittoria:          '#66ff99',
  stallo:            '#ffcc44',
  sconfitta:         '#ff8844',
  sconfitta_grave:   '#ff4444',
};
const RESULT_LABEL: Record<CombatResult['result'], string> = {
  vittoria_decisiva: '🏆 VITTORIA DECISIVA',
  vittoria:          '✅ VITTORIA',
  stallo:            '🤝 STALLO',
  sconfitta:         '❌ SCONFITTA',
  sconfitta_grave:   '💀 SCONFITTA GRAVE',
};

// ── Componente principale ─────────────────────────────────────────────────────
export default function OpsActionModal({
  card, myFaction, gameState, territories, militaryUnits,
  onDeploy, onInfluence, onCancel, loading,
}: Props) {
  const fColor  = FACTION_COLORS[myFaction] ?? '#8899aa';
  const opPoints = card.op_points;

  // ── State ──
  const [step, setStep] = useState<Step>('choose');

  // Deploy state
  const [selUnit, setSelUnit]     = useState<string | null>(null);
  const [selQty,  setSelQty]      = useState(1);
  const [selTerritory, setSelTerritory] = useState<string | null>(null);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);

  // Influence state
  const [infTerritory, setInfTerritory] = useState<string | null>(null);
  const [infOp, setInfOp]               = useState(1);

  // ── Unità disponibili per questa fazione ──
  const RUSSIA_UNITS = ['Convenzionale', 'SottomariniAKULA', 'GuerraIbrida'];
  const myUnits = useMemo(() => {
    if (myFaction === 'Russia') return UNITS.filter(u => (RUSSIA_UNITS as string[]).includes(u.type));
    return UNITS_BY_FACTION[myFaction] ?? UNITS.filter(u => u.faction === myFaction || u.faction === 'Tutti');
  }, [myFaction]);

  // Unità selezionata corrente
  const unitDef = useMemo(() => UNITS.find(u => u.type === selUnit), [selUnit]);

  // Costo acquisto
  const deployCost = useMemo(() => (unitDef?.cost ?? 1) * selQty, [unitDef, selQty]);
  const maxQty     = useMemo(() => unitDef ? Math.floor(opPoints / unitDef.cost) : 0, [unitDef, opPoints]);
  const canDeploy  = deployCost > 0 && deployCost <= opPoints;

  // Forza attacco (OP residui + bonus unità)
  const atkForce = useMemo(() => {
    if (!unitDef) return opPoints;
    return (unitDef.attackBonus ?? 0) * selQty + (opPoints - deployCost);
  }, [unitDef, selQty, opPoints, deployCost]);

  // Forza difesa del territorio selezionato
  const defForce = useMemo(() => {
    if (!selTerritory) return 3;
    const enemyUnits = militaryUnits.filter(u => u.territory === selTerritory && u.faction !== myFaction);
    return enemyUnits.reduce((sum, u) => {
      const def = UNITS.find(ud => ud.type === u.unit_type);
      return sum + (def?.defenseBonus ?? 1) * u.quantity;
    }, 3);
  }, [selTerritory, militaryUnits, myFaction]);

  // Unità nemiche nel territorio selezionato
  const enemyUnitsInTerritory = useMemo(() => {
    if (!selTerritory) return [];
    return militaryUnits.filter(u => u.territory === selTerritory && u.faction !== myFaction && u.quantity > 0);
  }, [selTerritory, militaryUnits, myFaction]);

  const hasCombat = enemyUnitsInTerritory.length > 0;

  // ── Helpers UI ────────────────────────────────────────────────────────────
  const Header = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${fColor}22` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            style={{ color: fColor }}>
            {FACTION_FLAGS[myFaction]} {myFaction} — {opPoints} OP disponibili
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
  // STEP choose
  // ─────────────────────────────────────────────────────────────────
  if (step === 'choose') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="Usa Punti Operazione" sub={`Carta: ${card.card_name}`} />
      <div className="px-5 py-5 space-y-3">
        {[
          {
            id: 'deploy-unit' as Step, icon: '🪖',
            label: 'Acquista & Piazza Unità',
            desc: `Schiera un'unità direttamente su un territorio — combattimento automatico se ci sono forze nemiche`,
          },
          {
            id: 'influence' as Step, icon: '📣',
            label: 'Influenza Territorio',
            desc: `+1 influenza per OP speso in un territorio (max ${opPoints})`,
          },
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
  // STEP deploy-unit — scegli tipo e quantità
  // ─────────────────────────────────────────────────────────────────
  if (step === 'deploy-unit') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="🪖 Acquista Unità" sub={`Budget: ${opPoints} OP — costo fisso per tipo`} />
      <div className="px-5 py-4 space-y-2 max-h-[55vh] overflow-y-auto">
        {myUnits.map(u => {
          const max = Math.floor(opPoints / u.cost);
          if (max === 0) return null;
          const sel = selUnit === u.type;
          return (
            <button key={u.type}
              onClick={() => { setSelUnit(u.type); setSelQty(1); }}
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
                    <p className="text-[10px] font-mono text-[#556677] mt-0.5">
                      ATK +{u.attackBonus} &nbsp;|&nbsp; DEF +{u.defenseBonus}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-black font-mono text-sm" style={{ color: fColor }}>{u.cost} OP</p>
                  <p className="text-[10px] font-mono text-[#556677]">per unità</p>
                </div>
              </div>

              {/* Selettore quantità quando selezionata */}
              {sel && (
                <div className="flex items-center gap-3 mt-3 pt-3"
                  style={{ borderTop: `1px solid ${fColor}20` }}>
                  <span className="text-[11px] font-mono text-[#8899aa]">Quantità:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setSelQty(q => Math.max(1, q - 1)); }}
                      className="w-7 h-7 rounded-lg font-mono font-bold text-white text-sm
                        flex items-center justify-center hover:opacity-80"
                      style={{ backgroundColor: `${fColor}30` }}>−</button>
                    <span className="font-black font-mono text-white text-lg w-6 text-center">{selQty}</span>
                    <button onClick={e => { e.stopPropagation(); setSelQty(q => Math.min(max, q + 1)); }}
                      className="w-7 h-7 rounded-lg font-mono font-bold text-white text-sm
                        flex items-center justify-center hover:opacity-80"
                      style={{ backgroundColor: `${fColor}30` }}>+</button>
                  </div>
                  <span className="ml-auto font-black font-mono text-sm" style={{ color: fColor }}>
                    = {u.cost * selQty} OP
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-5 space-y-2">
        {selUnit && (
          <div className="p-2 rounded-lg text-center text-[11px] font-mono"
            style={{ backgroundColor: `${fColor}15`, color: fColor }}>
            {canDeploy
              ? `✅ ${selQty}× ${unitDef?.label} — ${deployCost} OP — scegli territorio →`
              : `⛔ Costo ${deployCost} OP supera i ${opPoints} OP disponibili`}
          </div>
        )}
        <button onClick={() => { if (canDeploy) setStep('deploy-territory'); }}
          disabled={!canDeploy || loading}
          className="w-full py-3 rounded-xl font-black font-mono text-sm transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: canDeploy ? fColor : '#334455', color: '#0a0e1a' }}>
          Scegli territorio →
        </button>
        <BackBtn onBack={() => setStep('choose')} />
      </div>
    </Wrapper>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP deploy-territory — scegli dove piazzare
  // ─────────────────────────────────────────────────────────────────
  if (step === 'deploy-territory') return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header
        title="📍 Scegli Territorio"
        sub={`${selQty}× ${unitDef?.label} (${deployCost} OP)`}
      />
      <div className="px-5 py-3">
        {/* Legenda */}
        <div className="flex gap-3 mb-3">
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#22c55e]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" /> Libero / Amico
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#ff4444]">
            <span className="w-2 h-2 rounded-full bg-[#ff4444] inline-block" /> ⚔️ Combattimento
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[48vh] overflow-y-auto">
          {TERRITORIES.map(t => {
            const enemyHere = militaryUnits.filter(
              u => u.territory === t.id && u.faction !== myFaction && u.quantity > 0
            );
            const isCombat = enemyHere.length > 0;
            const sel = selTerritory === t.id;

            // Unità amiche già presenti
            const friendlyHere = militaryUnits.filter(
              u => u.territory === t.id && u.faction === myFaction && u.quantity > 0
            );

            // Controllo territorio
            const terrRec = territories.find(r => r.territory === t.id);
            const myInf = terrRec
              ? ((terrRec as unknown as Record<string, number>)[`inf_${myFaction.toLowerCase()}`] ?? 0)
              : 0;

            const borderColor = sel ? fColor : isCombat ? '#ff444450' : '#1e2a3a';
            const bgColor     = sel
              ? (isCombat ? '#ff444420' : `${fColor}20`)
              : (isCombat ? '#ff444408' : '#0a0e1a');

            return (
              <button key={t.id} onClick={() => setSelTerritory(t.id)}
                className="p-3 rounded-xl text-left transition-all"
                style={{ backgroundColor: bgColor, border: `2px solid ${borderColor}` }}>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-bold font-mono text-xs text-white">{t.id}</p>
                    <p className="text-[9px] font-mono text-[#556677]">
                      {t.isNaval && t.isLand ? 'Terra+Navale' : t.isNaval ? 'Navale' : 'Terra'}
                    </p>
                    {myInf > 0 && (
                      <p className="text-[9px] font-mono" style={{ color: fColor }}>
                        Inf: {myInf}/5
                      </p>
                    )}
                    {friendlyHere.length > 0 && (
                      <p className="text-[9px] font-mono text-[#22c55e]">
                        🪖 {friendlyHere.reduce((s, u) => s + u.quantity, 0)} amiche
                      </p>
                    )}
                  </div>
                  {isCombat && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-[#ff6644]">⚔️</span>
                      <p className="text-[9px] font-mono text-[#ff4444]">
                        {enemyHere.length} tip.
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview forze se territorio selezionato con combattimento */}
      {selTerritory && hasCombat && (
        <div className="px-5 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl text-center"
              style={{ backgroundColor: `${fColor}12`, border: `1px solid ${fColor}30` }}>
              <p className="text-[9px] font-mono text-[#8899aa]">TUA FORZA ATK</p>
              <p className="text-xl font-black font-mono" style={{ color: fColor }}>{atkForce}</p>
            </div>
            <div className="p-2 rounded-xl text-center bg-[#ff444412] border border-[#ff444430]">
              <p className="text-[9px] font-mono text-[#8899aa]">DIFESA NEMICA</p>
              <p className="text-xl font-black font-mono text-[#ff6644]">{defForce}</p>
            </div>
          </div>
          <p className="text-[10px] font-mono text-[#ff4444] mt-2 text-center">
            ⚔️ Saranno lanciati i dadi — combattimento automatico!
          </p>
        </div>
      )}

      {selTerritory && !hasCombat && (
        <div className="px-5 py-2">
          <div className="p-2 rounded-xl text-center"
            style={{ backgroundColor: `${fColor}10`, border: `1px solid ${fColor}25` }}>
            <p className="text-[10px] font-mono text-[#22c55e]">
              ✅ Schieramento diretto — nessuna forza nemica in {selTerritory}
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 space-y-2 mt-2">
        <button
          onClick={() => {
            if (!selTerritory) return;
            if (hasCombat) {
              // Risolvi combattimento automaticamente
              const result = resolveCombat(atkForce, defForce);
              setCombatResult(result);
              setStep('result');
            } else {
              // Schieramento diretto — chiama callback
              onDeploy({
                territory: selTerritory,
                unitType: selUnit!,
                qty: selQty,
                opSpent: deployCost,
              });
            }
          }}
          disabled={!selTerritory || loading}
          className="w-full py-3 rounded-xl font-black font-mono text-sm transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selTerritory
              ? (hasCombat ? '#ff3322' : fColor)
              : '#334455',
            color: '#0a0e1a',
          }}>
          {loading ? '⏳ Elaborazione…' :
            !selTerritory ? '← Seleziona un territorio' :
            hasCombat ? `⚔️ PIAZZA & COMBATTI in ${selTerritory}` :
            `🪖 PIAZZA in ${selTerritory}`}
        </button>
        <BackBtn onBack={() => setStep('deploy-unit')} />
      </div>
    </Wrapper>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP result — risultato combattimento
  // ─────────────────────────────────────────────────────────────────
  if (step === 'result' && combatResult && selTerritory) {
    const rc = combatResult;
    const rColor = RESULT_COLOR[rc.result];
    return (
      <Wrapper onCancel={onCancel} fColor={fColor}>
        <Header title="🎲 Combattimento" sub={`${selQty}× ${unitDef?.label} → ${selTerritory}`} />
        <div className="px-5 py-4 space-y-3">

          {/* Dadi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center"
              style={{ backgroundColor: `${fColor}12`, border: `1px solid ${fColor}30` }}>
              <p className="text-[9px] font-mono text-[#8899aa]">ATTACCANTE</p>
              <p className="font-black font-mono text-3xl" style={{ color: fColor }}>{rc.atk_total}</p>
              <p className="text-[9px] font-mono text-[#556677]">
                🎲 {rc.roll_atk} + forza {atkForce}
              </p>
            </div>
            <div className="p-3 rounded-xl text-center bg-[#ff444412] border border-[#ff444430]">
              <p className="text-[9px] font-mono text-[#8899aa]">DIFENSORE</p>
              <p className="font-black font-mono text-3xl text-[#ff6644]">{rc.def_total}</p>
              <p className="text-[9px] font-mono text-[#556677]">
                🎲 {rc.roll_def} + difesa {defForce}
              </p>
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

          {/* Unità piazzata? */}
          <div className="p-2 rounded-lg text-center"
            style={{
              backgroundColor: rc.unitPlaced ? '#22c55e15' : '#ff444415',
              border: `1px solid ${rc.unitPlaced ? '#22c55e40' : '#ff444440'}`,
            }}>
            <p className="text-[11px] font-mono" style={{ color: rc.unitPlaced ? '#22c55e' : '#ff6644' }}>
              {rc.unitPlaced
                ? `🪖 ${selQty}× ${unitDef?.label} schierata in ${selTerritory}`
                : `💥 ${selQty}× ${unitDef?.label} distrutta — non schierata`}
            </p>
          </div>

          {/* Effetti */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Inf. Attaccante', val: rc.inf_change_atk },
              { label: 'Inf. Difensore',  val: rc.inf_change_def },
              { label: 'DEFCON',          val: rc.defcon_change  },
            ].map(e => (
              <div key={e.label} className="p-2 rounded-lg bg-[#0a0e1a] border border-[#1e2a3a]">
                <p className="text-[9px] font-mono text-[#556677]">{e.label}</p>
                <p className={`font-black font-mono text-base ${
                  e.val > 0 ? 'text-[#00ff88]' : e.val < 0 ? 'text-[#ff4444]' : 'text-[#8899aa]'
                }`}>
                  {e.val > 0 ? '+' : ''}{e.val}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={() => {
              onDeploy({
                territory: selTerritory,
                unitType: selUnit!,
                qty: selQty,
                opSpent: deployCost,
                combat: {
                  attackForce:       atkForce,
                  defenseForce:      defForce,
                  result:            rc.result,
                  infChangeAtk:      rc.inf_change_atk,
                  infChangeDef:      rc.inf_change_def,
                  defconChange:      rc.defcon_change,
                  description:       rc.description,
                  attackerUnitsLost: rc.attackerUnitsLost,
                  stabilityChange:   rc.stabilityChange,
                  unitPlaced:        rc.unitPlaced,
                },
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

  // ─────────────────────────────────────────────────────────────────
  // STEP influence — influenza territorio
  // ─────────────────────────────────────────────────────────────────
  return (
    <Wrapper onCancel={onCancel} fColor={fColor}>
      <Header title="📣 Influenza Territorio" sub="Spendi OP per guadagnare influenza" />
      <div className="px-5 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
        {TERRITORIES.map(t => {
          const rec = territories.find(r => r.territory === t.id);
          const myInf = rec
            ? ((rec as unknown as Record<string, number>)[`inf_${myFaction.toLowerCase()}`] ?? 0)
            : 0;
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
                    <div className="h-full rounded-full"
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
          <div className="p-3 rounded-xl"
            style={{ backgroundColor: `${fColor}12`, border: `1px solid ${fColor}30` }}>
            <p className="text-[11px] font-mono text-white mb-2">
              OP da investire in <strong style={{ color: fColor }}>{infTerritory}</strong>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setInfOp(o => Math.max(1, o - 1))}
                className="w-8 h-8 rounded-lg font-mono font-bold text-white text-sm
                  flex items-center justify-center"
                style={{ backgroundColor: `${fColor}25` }}>−</button>
              <span className="font-black font-mono text-2xl text-white w-8 text-center">{infOp}</span>
              <button onClick={() => setInfOp(o => Math.min(opPoints, o + 1))}
                className="w-8 h-8 rounded-lg font-mono font-bold text-white text-sm
                  flex items-center justify-center"
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
          onClick={async () => { if (infTerritory) await onInfluence(infTerritory, infOp); }}
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
}

// ── Sub-componenti ─────────────────────────────────────────────────────────────
function Wrapper({ children, onCancel, fColor }: {
  children: React.ReactNode; onCancel: () => void; fColor: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
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
      ← Torna indietro
    </button>
  );
}

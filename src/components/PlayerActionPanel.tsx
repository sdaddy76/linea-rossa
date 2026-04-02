// =============================================
// LINEA ROSSA — Pannello Azioni Giocatore v2
//
// Quando il giocatore seleziona una carta ha 4 modi di usarla:
//
//  1) EVENTO     → applica l'effetto narrativo della carta
//                  (modifica tracciati: nucleare, sanzioni, DEFCON, ecc.)
//
//  2) INFLUENZA  → usa i PO della carta per guadagnare influenza
//                  in un territorio; ogni PO = 1 cubo aggiuntivo
//                  (costo base 1 PO per cubo in proprio, 2 PO per cubo
//                  in territorio avversario con cubo nemico presente)
//
//  3) TRACCIATO  → usa i PO per aumentare un tracciato fazione
//                  (ogni PO = +1 sul tracciato scelto)
//
//  4) COMPRA     → usa i PO per acquistare risorse militari
//                  (apre il mercato)
// =============================================
import { useState, useMemo } from 'react';
import type { GameCard, GameState, Faction } from '@/types/game';
import type { TerritoryId } from '@/lib/territoriesData';
import { TERRITORIES, TERRITORY_MAP } from '@/lib/territoriesData';

interface Props {
  card: GameCard & { name?: string };
  myFaction: Faction;
  state: GameState;
  selectedTerritory: TerritoryId | null;
  territories: Record<string, { influences: Partial<Record<Faction, number>>; units?: unknown }>;
  onAction: (action: PlayerActionType, payload: PlayerActionPayload) => void;
  onCancel: () => void;
}

export type PlayerActionType = 'evento' | 'acquisto' | 'tracciato' | 'influenza';

export interface PlayerActionPayload {
  type: PlayerActionType;
  card: GameCard;
  // influenza
  targetTerritory?: TerritoryId;
  influenceDelta?: number;    // +1 per successo
  diceResult?: number;
  diceSuccess?: boolean;
  finalThreshold?: number;
  costPO?: number;            // PO spesi
  // tracciato
  trackKey?: string;
  trackDelta?: number;
}

// ─── Costanti influenza ───────────────────────────────────────────────────────
const BASE_COST_OWN   = 1; // PO per cubo in territorio libero o già tuo
const BASE_COST_ENEMY = 2; // PO per cubo in territorio con presenza nemica

// ─── Bonus dado influenza ─────────────────────────────────────────────────────
/**
 * Calcola il bonus dado per l'azione influenza basato sulla presenza
 * di cubi della propria fazione nel territorio target.
 *
 * +1 se la fazione ha almeno 1 cubo nel territorio
 * +1 ulteriore (tot +2) se i propri cubi sono più della metà del totale
 *
 * @param myFaction  - fazione del giocatore corrente
 * @param terrInfs   - mappa fazione → cubi nel territorio
 * @returns 0, 1 o 2
 */
function calcolaBonusInfluenza(
  myFaction: Faction,
  terrInfs: Partial<Record<Faction, number>>,
): number {
  const myCubes = (terrInfs[myFaction] ?? 0);
  if (myCubes === 0) return 0; // nessun cubo → nessun bonus

  const total = Object.values(terrInfs).reduce<number>((sum, v) => sum + (v ?? 0), 0);
  if (myCubes * 2 > total) return 2; // maggioranza stretta → +2
  return 1;                          // cubi presenti ma non maggioranza → +1
}

// ─── Palette colori fazione ───────────────────────────────────────────────────
const FC: Record<Faction, string> = {
  Iran: '#dc2626', Coalizione: '#2563eb',
  Russia: '#7c3aed', Cina: '#d97706', Europa: '#059669',
};

// ─── Tracciati incrementabili per fazione ────────────────────────────────────
const TRACK_OPTIONS: Record<Faction, { key: string; label: string; icon: string }[]> = {
  Iran: [
    { key: 'nucleare',             label: 'Nucleare',          icon: '☢️' },
    { key: 'risorse_iran',         label: 'Risorse',           icon: '💰' },
    { key: 'stabilita_iran',       label: 'Stabilità Interna', icon: '⚖️' },
    { key: 'forze_militari_iran',  label: 'Forze Militari',    icon: '⚔️' },
    { key: 'tecnologia_nucleare_iran', label: 'Tecnologia Nuc.', icon: '🔬' },
  ],
  Coalizione: [
    { key: 'risorse_coalizione',              label: 'Risorse Militari',       icon: '💰' },
    { key: 'forze_militari_coalizione',       label: 'Forze Militari',         icon: '⚔️' },
    { key: 'supporto_pubblico_coalizione',    label: 'Supporto Pubblico',      icon: '📣' },
    { key: 'influenza_diplomatica_coalizione',label: 'Influenza Diplomatica',  icon: '🤝' },
    { key: 'tecnologia_avanzata_coalizione',  label: 'Tecnologia Avanzata',    icon: '🛰️' },
  ],
  Russia: [
    { key: 'risorse_russia',              label: 'Energia/Risorse',       icon: '⚡' },
    { key: 'influenza_militare_russia',   label: 'Influenza Militare',    icon: '🪖' },
    { key: 'forze_militari_russia',       label: 'Forze Militari',        icon: '⚔️' },
    { key: 'stabilita_russia',            label: 'Stabilità Economica',   icon: '⚖️' },
  ],
  Cina: [
    { key: 'risorse_cina',              label: 'Potenza Economica',      icon: '💹' },
    { key: 'influenza_commerciale_cina',label: 'Influenza Commerciale',  icon: '🛒' },
    { key: 'forze_militari_cina',       label: 'Forze Militari',         icon: '⚔️' },
    { key: 'cyber_warfare_cina',        label: 'Cyber Warfare',          icon: '🖥️' },
  ],
  Europa: [
    { key: 'risorse_europa',              label: 'Stabilità Energetica',  icon: '🔋' },
    { key: 'influenza_diplomatica_europa',label: 'Influenza Diplomatica', icon: '🤝' },
    { key: 'aiuti_umanitari_europa',      label: 'Aiuti Umanitari',       icon: '❤️' },
    { key: 'coesione_ue_europa',          label: 'Coesione UE',           icon: '🇪🇺' },
  ],
};

// ─── Componente ──────────────────────────────────────────────────────────────
export default function PlayerActionPanel({
  card, myFaction, state, selectedTerritory, territories, onAction, onCancel,
}: Props) {
  const [view, setView] = useState<PlayerActionType | null>(null);

  // ── Stato influenza ──────────────────────────────────────────────────────
  const [inflTerritory, setInflTerritory] = useState<TerritoryId | null>(selectedTerritory);
  const [inflCubes, setInflCubes]         = useState(1);
  const [diceResult, setDiceResult]       = useState<number | null>(null);
  const [diceRolled, setDiceRolled]       = useState(false);
  const [diceSuccess, setDiceSuccess]     = useState(false);

  // ── Stato tracciato ──────────────────────────────────────────────────────
  const [trackKey, setTrackKey] = useState<string | null>(null);

  const fColor  = FC[myFaction] ?? '#888';
  const opTotal = card.op_points ?? 1;
  const cardLabel = card.name ?? card.card_name ?? '—';

  // ── Dati territorio scelto per influenza ─────────────────────────────────
  const inflTerr   = inflTerritory ? TERRITORIES.find(t => t.id === inflTerritory) : null;
  const terrData   = inflTerritory ? territories[inflTerritory] : null;
  const terrInfs   = (terrData?.influences ?? {}) as Record<Faction, number>;
  const myInf      = terrInfs[myFaction] ?? 0;
  const enemyInf   = Object.entries(terrInfs)
    .filter(([f]) => f !== myFaction)
    .reduce((s, [, v]) => s + (v as number), 0);
  const costPerCube = enemyInf > myInf ? BASE_COST_ENEMY : BASE_COST_OWN;
  const maxCubes   = Math.floor(opTotal / costPerCube);
  const costTot    = inflCubes * costPerCube;
  const canAfford  = costTot <= opTotal;

  // Bonus dado per cubi propri nel territorio (nuova regola)
  const territoryBonus = useMemo(
    () => calcolaBonusInfluenza(myFaction, terrInfs),
    [myFaction, terrInfs],
  );

  // Modifica: soglia dado = 6 di base, ridotta da stabilità, bonus PO e bonus territorio
  const { threshold, modDesc } = useMemo(() => {
    let thr = 6;
    const mods: string[] = [];
    // Stabilità propria alta aiuta
    const myStab = (state as Record<string, number>)[`stabilita_${myFaction.toLowerCase()}`] ?? 5;
    if (myStab >= 7) { thr -= 1; mods.push(`⚖️ Stabilità ${myFaction} ≥ 7: -1 soglia`); }
    // Opinione favorevole
    if (state.opinione > 2) { thr -= 1; mods.push(`📣 Opinione +${state.opinione}: -1 soglia`); }
    // DEFCON basso complica la diplomazia
    if (state.defcon <= 4) { thr += 1; mods.push(`⚠️ DEFCON ${state.defcon}: +1 soglia`); }
    // Più PO = più pressione = soglia più bassa
    if (opTotal >= 4) { thr -= 1; mods.push(`💪 Carta ${opTotal}PO (potente): -1 soglia`); }
    // Presenza nemica alta = territorio resistente
    if (enemyInf >= 3) { thr += 1; mods.push(`🛡️ Presenza nemica ≥3: +1 soglia`); }
    // Bonus cubi propri nel territorio (nuova regola)
    if (territoryBonus === 1) {
      thr -= 1;
      mods.push(`🟦 Cubi ${myFaction} presenti: -1 soglia`);
    } else if (territoryBonus === 2) {
      thr -= 2;
      mods.push(`👑 Maggioranza cubi ${myFaction}: -2 soglia`);
    }
    return { threshold: Math.max(2, Math.min(6, thr)), modDesc: mods };
  }, [state, myFaction, opTotal, enemyInf, territoryBonus]);

  // ── Track scelto ─────────────────────────────────────────────────────────
  const trackOpts  = TRACK_OPTIONS[myFaction] ?? [];
  const selTrack   = trackOpts.find(t => t.key === trackKey);
  const trackVal   = trackKey ? ((state as Record<string, number>)[trackKey] ?? 0) : 0;
  const trackDelta = opTotal; // 1 PO = +1 tracciato

  // ── Handlers ─────────────────────────────────────────────────────────────
  const doInfluenza = () => {
    if (!inflTerritory || !canAfford) return;
    // Solo lancia il dado e mostra il risultato — NON chiama ancora onAction
    const roll = Math.floor(Math.random() * 6) + 1;
    const success = roll >= threshold;
    setDiceResult(roll);
    setDiceRolled(true);
    setDiceSuccess(success);
  };

  const confirmInfluenza = () => {
    if (!inflTerritory || diceResult === null) return;
    // Ora applica l'azione (chiama playCard, addInfluence, ecc.) e chiude il pannello
    onAction('influenza', {
      type: 'influenza',
      card,
      targetTerritory: inflTerritory,
      influenceDelta: diceSuccess ? inflCubes : 0,
      diceResult,
      diceSuccess,
      finalThreshold: threshold,
      costPO: costTot,
    });
  };

  const doTracciato = () => {
    if (!trackKey || !selTrack) return;
    onAction('tracciato', {
      type: 'tracciato',
      card,
      trackKey,
      trackDelta,
    });
  };

  const doEvento = () => onAction('evento', { type: 'evento', card });
  const doAcquisto = () => onAction('acquisto', { type: 'acquisto', card });

  const resetView = () => {
    setView(null);
    setDiceRolled(false);
    setDiceResult(null);
    setInflCubes(1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#0d1b2a] border border-[#1e3a5f] rounded-xl p-4 space-y-3">

      {/* Header carta */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] text-[#8899aa] font-mono uppercase tracking-wide">Carta selezionata</p>
          <p className="text-white font-bold text-sm mt-0.5">{cardLabel}</p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: fColor }}>
            ⚡ {opTotal} PO — {card.card_type ?? 'Carta'}
          </p>
        </div>
        <button onClick={onCancel} className="text-[#8899aa] hover:text-white text-lg leading-none mt-1">✕</button>
      </div>

      <p className="text-[10px] text-[#8899aa] font-mono border-t border-[#1e3a5f] pt-2">
        Come vuoi usare questa carta?
      </p>

      {/* ════════════════════════════════════════════════════════════════
          VISTA: scelta azione
      ════════════════════════════════════════════════════════════════ */}
      {!view && (
        <div className="grid grid-cols-2 gap-2">

          {/* 1. EVENTO */}
          <button onClick={() => { setView('evento'); doEvento(); }}
            className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f]
              hover:border-[#00ff88] hover:bg-[#00ff8808] transition-all text-left group">
            <span className="text-xl">🎭</span>
            <span className="text-xs font-bold text-white group-hover:text-[#00ff88] font-mono">Esegui Evento</span>
            <span className="text-[10px] text-[#8899aa]">Applica gli effetti della carta sui tracciati</span>
          </button>

          {/* 2. INFLUENZA */}
          <button onClick={() => setView('influenza')}
            className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f]
              hover:border-[#ec4899] hover:bg-[#ec489908] transition-all text-left group">
            <span className="text-xl">🌐</span>
            <span className="text-xs font-bold text-white group-hover:text-[#ec4899] font-mono">Guadagna Influenza</span>
            <span className="text-[10px] text-[#8899aa]">
              Piazza cubi influenza in un territorio<br />
              <span className="text-[#ec4899]">1 PO = 1 cubo (2 PO se territorio nemico)</span>
            </span>
          </button>

          {/* 3. TRACCIATO */}
          <button onClick={() => setView('tracciato')}
            className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f]
              hover:border-[#3b82f6] hover:bg-[#3b82f608] transition-all text-left group">
            <span className="text-xl">📈</span>
            <span className="text-xs font-bold text-white group-hover:text-[#3b82f6] font-mono">Incrementa Tracciato</span>
            <span className="text-[10px] text-[#8899aa]">
              +{opTotal} su un tracciato fazione
            </span>
          </button>

          {/* 4. ACQUISTO (apre mercato) */}
          <button onClick={() => { setView('acquisto'); doAcquisto(); }}
            className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[#1e3a5f]
              hover:border-[#f59e0b] hover:bg-[#f59e0b08] transition-all text-left group">
            <span className="text-xl">⚔️</span>
            <span className="text-xs font-bold text-white group-hover:text-[#f59e0b] font-mono">Compra Risorse Mil.</span>
            <span className="text-[10px] text-[#8899aa]">Apre il Mercato Militare</span>
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VISTA: INFLUENZA
      ════════════════════════════════════════════════════════════════ */}
      {view === 'influenza' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={resetView} className="text-[#8899aa] hover:text-white text-sm">←</button>
            <p className="text-[#ec4899] font-bold text-xs font-mono uppercase">🌐 Guadagna Influenza</p>
          </div>

          {/* Selezione territorio */}
          {!diceRolled && (
            <>
              <div>
                <label className="text-[10px] text-[#8899aa] font-mono block mb-1">📍 Territorio bersaglio</label>
                <select
                  value={inflTerritory ?? ''}
                  onChange={e => { setInflTerritory(e.target.value as TerritoryId || null); setInflCubes(1); }}
                  className="w-full bg-[#0a0e1a] border border-[#1e3a5f] text-white font-mono text-xs rounded-lg px-2 py-1.5">
                  <option value="">— seleziona —</option>
                  {TERRITORIES.map(t => {
                    const td = territories[t.id];
                    const infs = td?.influences ?? {};
                    const myI = (infs as Record<string, number>)[myFaction] ?? 0;
                    const enI = Object.entries(infs as Record<string, number>)
                      .filter(([f]) => f !== myFaction).reduce((s, [, v]) => s + v, 0);
                    const status = enI > myI ? '⚔️ nemico' : myI > 0 ? '✅ tuo' : '○ libero';
                    return (
                      <option key={t.id} value={t.id}>
                        {t.label} — {status}
                      </option>
                    );
                  })}
                </select>
              </div>

              {inflTerritory && (
                <>
                  {/* Stato influenze attuali */}
                  <div className="bg-[#050810] rounded-lg p-2.5 border border-[#1e3a5f]">
                    <p className="text-[9px] text-[#8899aa] font-mono mb-1.5">INFLUENZE ATTUALI — {inflTerr?.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(terrInfs).filter(([, v]) => (v as number) > 0).map(([f, v]) => (
                        <div key={f} className="flex items-center gap-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono"
                            style={{ color: FC[f as Faction] ?? '#aaa', background: `${FC[f as Faction] ?? '#888'}20` }}>
                            {f}: {v}
                          </span>
                        </div>
                      ))}
                      {Object.values(terrInfs).every(v => !v || (v as number) === 0) && (
                        <span className="text-[9px] text-[#4b5563] font-mono">Territorio neutro</span>
                      )}
                    </div>
                  </div>

                  {/* Costo */}
                  <div className="bg-[#050810] rounded-lg p-2.5 border border-[#1e3a5f] space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#8899aa]">Costo per cubo</span>
                      <span className="font-bold" style={{ color: costPerCube === 2 ? '#ef4444' : '#22c55e' }}>
                        {costPerCube} PO {costPerCube === 2 ? '(territorio nemico)' : '(territorio libero/tuo)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#8899aa]">PO disponibili</span>
                      <span className="text-white font-bold">{opTotal}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#8899aa]">Max cubi acquistabili</span>
                      <span className="text-[#f59e0b] font-bold">{maxCubes}</span>
                    </div>
                  </div>

                  {/* Selettore cubi */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#8899aa]">Cubi da piazzare:</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setInflCubes(c => Math.max(1, c - 1))}
                        className="w-7 h-7 rounded bg-[#1e3a5f] text-white font-mono text-sm hover:bg-[#2a4a7f]">−</button>
                      <span className="font-mono font-bold text-white w-5 text-center">{inflCubes}</span>
                      <button onClick={() => setInflCubes(c => Math.min(maxCubes, c + 1))}
                        className="w-7 h-7 rounded bg-[#1e3a5f] text-white font-mono text-sm hover:bg-[#2a4a7f]">+</button>
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: canAfford ? '#22c55e' : '#ef4444' }}>
                      = {costTot} PO {canAfford ? '✓' : '✗ insufficienti'}
                    </span>
                  </div>

                  {/* Modificatori dado */}
                  <div className="bg-[#050810] rounded-lg p-2.5 border border-[#1e3a5f]">
                    <p className="text-[9px] text-[#8899aa] font-mono mb-1">TIRO DADO — soglia successo: d6 ≥ {threshold}</p>
                    {modDesc.map((m, i) => <p key={i} className="text-[9px] text-[#6b7280] font-mono">{m}</p>)}
                    {modDesc.length === 0 && <p className="text-[9px] text-[#4b5563] font-mono">Nessun modificatore</p>}
                    {territoryBonus > 0 && (
                      <div className="mt-1.5 px-2 py-1 rounded bg-[#d97706]/10 border border-[#d97706]/30">
                        <p className="text-[9px] text-[#fbbf24] font-mono font-bold">
                          🎲 Bonus territorio: +{territoryBonus}{' '}
                          {territoryBonus === 2 ? '(maggioranza cubi)' : '(cubi presenti)'}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-1 mt-1.5">
                      {[1,2,3,4,5,6].map(n => (
                        <div key={n} className={`flex-1 h-5 rounded text-center text-[9px] font-mono font-bold flex items-center justify-center
                          ${n >= threshold ? 'bg-[#22c55e30] text-[#22c55e] border border-[#22c55e40]' : 'bg-[#1e293b] text-[#4b5563]'}`}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottone lancia dado */}
                  <button
                    disabled={!canAfford || maxCubes === 0}
                    onClick={doInfluenza}
                    className="w-full py-2.5 rounded-lg font-mono font-bold text-sm text-white transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canAfford ? '#9d174d' : '#1e3a5f', boxShadow: canAfford ? '0 0 16px #ec489930' : 'none' }}>
                    🎲 Lancia dado — {inflCubes} cubo{inflCubes > 1 ? 'i' : ''} ({costTot} PO)
                  </button>
                </>
              )}
            </>
          )}

          {/* Risultato dado */}
          {diceRolled && diceResult !== null && (
            <div className={`rounded-xl p-4 text-center border-2 space-y-2
              ${diceResult >= threshold ? 'border-[#22c55e] bg-[#22c55e0a]' : 'border-[#ef4444] bg-[#ef44440a]'}`}>
              <p className="text-[10px] text-[#8899aa] font-mono">{inflTerr?.label}</p>
              <div className="text-5xl font-bold font-mono text-white">{diceResult}</div>
              <p className="text-[10px] text-[#8899aa] font-mono">soglia: d6 ≥ {threshold}</p>
              {territoryBonus > 0 && (
                <div className="text-xs text-yellow-400 font-mono">
                  🎲 Bonus territorio: +{territoryBonus}{' '}
                  {territoryBonus === 2 ? '(maggioranza cubi)' : '(cubi presenti)'}
                </div>
              )}
              {diceResult >= threshold ? (
                <div className="space-y-1">
                  <p className="text-[#22c55e] font-bold font-mono">✅ SUCCESSO</p>
                  <p className="text-[10px] text-[#22c55e] font-mono">
                    +{inflCubes} cubo{inflCubes > 1 ? 'i' : ''} influenza {myFaction} su {inflTerr?.label}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[#ef4444] font-bold font-mono">❌ FALLITO</p>
                  <p className="text-[10px] text-[#ef4444] font-mono">
                    Nessun cubo aggiunto. La carta è stata comunque spesa.
                  </p>
                </div>
              )}
              {/* Bottone conferma: esegue l'azione e chiude il pannello */}
              <button
                onClick={confirmInfluenza}
                className="mt-2 w-full py-2.5 rounded-lg font-mono font-bold text-sm transition-all"
                style={{
                  background: diceSuccess ? '#22c55e' : '#ef4444',
                  color: '#0a0e1a',
                }}>
                {diceSuccess ? '✅ Conferma e vai avanti' : '❌ Confermato — prossima mossa'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VISTA: TRACCIATO
      ════════════════════════════════════════════════════════════════ */}
      {view === 'tracciato' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={resetView} className="text-[#8899aa] hover:text-white text-sm">←</button>
            <p className="text-[#3b82f6] font-bold text-xs font-mono uppercase">📈 Incrementa Tracciato</p>
          </div>
          <p className="text-[10px] text-[#8899aa] font-mono">
            Spendi tutti i {opTotal} PO per aumentare di +{trackDelta} il tracciato scelto.
          </p>

          <div className="flex flex-col gap-1.5">
            {trackOpts.map(opt => {
              const cur = (state as Record<string, number>)[opt.key] ?? 0;
              const isSelected = trackKey === opt.key;
              return (
                <button key={opt.key}
                  onClick={() => setTrackKey(isSelected ? null : opt.key)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all font-mono text-xs
                    ${isSelected ? 'border-[#3b82f6] bg-[#3b82f610] text-white' : 'border-[#1e3a5f] text-[#8899aa] hover:border-[#2a4a7f]'}`}>
                  <span>{opt.icon} {opt.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8899aa]">ora: {cur}</span>
                    {isSelected && <span className="text-[#22c55e] font-bold">→ {cur + trackDelta}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            disabled={!trackKey}
            onClick={doTracciato}
            className="w-full py-2.5 rounded-lg font-mono font-bold text-sm text-white transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: trackKey ? '#1d4ed8' : '#1e3a5f', boxShadow: trackKey ? '0 0 16px #3b82f630' : 'none' }}>
            📈 Applica +{trackDelta} a {selTrack?.label ?? '—'}
          </button>
        </div>
      )}
    </div>
  );
}

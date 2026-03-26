// =============================================
// LINEA ROSSA — Motore di Combattimento (Sezione 8.1)
// =============================================

import type { Faction, GameState } from '@/types/game';
import type { UnitType, TerritoryId } from '@/lib/territoriesData';
import { UNIT_MAP, TERRITORY_MAP } from '@/lib/territoriesData';

export type CombatResult =
  | 'vittoria_decisiva'   // Attacco > Difesa di 3+
  | 'vittoria'            // Attacco > Difesa di 1-2
  | 'stallo'              // Pareggio
  | 'sconfitta'           // Difesa > Attacco di 1-2
  | 'sconfitta_grave';    // Difesa > Attacco di 3+

export interface CombatInput {
  attacker: Faction;
  defender: Faction;
  territory: TerritoryId;
  cardOpPoints: number;               // PO carta giocata = forza base
  unitTypesUsed: UnitType[];          // unità schierate dall'attaccante
  defenderUnitsInTerritory: Partial<Record<UnitType, number>>;
  gameState: GameState;
  hormuzActive?: boolean;             // Iran ha 2+ navali nello stretto
  allianceActive?: boolean;           // alleanza attiva +1 attacco
  guerraAsimmetricaActive?: boolean;  // Iran attiva Guerra Asimmetrica
}

export interface CombatOutcome {
  attackForce: number;
  defenseForce: number;
  difference: number;
  result: CombatResult;
  infChangeAttacker: number;   // +1, +2 o 0
  infChangeDefender: number;   // -1, -2 o 0
  defconChange: number;        // -1 quasi sempre
  attackerUnitsLost: number;   // 0, 1 o 2
  stabilityChange: number;     // 0 o -1 per sconfitta_grave
  description: string;
  attackBreakdown: string[];
  defenseBreakdown: string[];
}

// ── PASSO 2: Forza d'Attacco ──────────────────────────────────────────────────
function calcAttackForce(input: CombatInput): { force: number; breakdown: string[] } {
  const bd: string[] = [];
  let force = input.cardOpPoints;
  bd.push(`Base (PO carta): ${force}`);

  // DEFCON basso
  if (input.gameState.defcon <= 3) {
    force += 1;
    bd.push(`DEFCON ≤ 3: +1 → ${force}`);
  }

  // Unità IRGC (Iran)
  if (input.unitTypesUsed.includes('IRGC')) {
    force += 2;
    bd.push(`Unità IRGC: +2 → ${force}`);
  }

  // Superiorità Aerea (Coalizione) — richiede Risorse Militari ≥ 10
  const coalition_res = input.gameState.risorse_coalizione ?? 0;
  if (
    input.attacker === 'Coalizione' &&
    input.unitTypesUsed.includes('AereoStrategico') &&
    coalition_res >= 10
  ) {
    force += 2;
    bd.push(`Superiorità Aerea (RM ≥ 10): +2 → ${force}`);
  }

  // Sottomarino russo in acque navali
  if (input.attacker === 'Russia' && input.unitTypesUsed.includes('SottoMar')) {
    const tDef = TERRITORY_MAP[input.territory];
    if (tDef?.isNaval) {
      force += 1;
      bd.push(`Sottomarino AKULA (territorio navale): +1 → ${force}`);
    }
  }

  // Alleanza attiva
  if (input.allianceActive) {
    force += 1;
    bd.push(`Alleanza attiva: +1 → ${force}`);
  }

  // Hormuz — Coalizione paga +2 PO ma non riduce forza (già pagato in input)
  // oppure nega Superiorità Aerea nel Golfo Persico
  if (input.hormuzActive && input.attacker === 'Coalizione') {
    const gulf = ['StrettoHormuz','Kuwait','Bahrain','Qatar','EmiratiArabi','Oman'];
    if (gulf.includes(input.territory)) {
      force -= 2;
      bd.push(`Controllo Stretto di Hormuz (Golfo): -2 → ${force}`);
    }
  }

  return { force: Math.max(1, force), breakdown: bd };
}

// ── PASSO 3: Forza Difensiva ──────────────────────────────────────────────────
function calcDefenseForce(input: CombatInput): { force: number; breakdown: string[] } {
  const bd: string[] = [];
  const tDef = TERRITORY_MAP[input.territory];

  // Base = tracciato militare del difensore
  const militaryKey = `forze_militari_${input.defender.toLowerCase()}` as keyof GameState;
  let force = (input.gameState[militaryKey] as number) ?? 5;
  bd.push(`Tracciato Militare ${input.defender}: ${force}`);

  // Territorio casa +2
  if (tDef?.homeFaction === input.defender) {
    force += 2;
    bd.push(`Territorio casa: +2 → ${force}`);
  }

  // Stabilità interna alta ≥ 7
  const stabKey = `stabilita_${input.defender.toLowerCase()}` as keyof GameState;
  const stab = (input.gameState[stabKey] as number) ?? 5;
  if (stab >= 7) {
    force += 1;
    bd.push(`Stabilità Interna ≥ 7 (${stab}): +1 → ${force}`);
  }

  // Unità difensive schierate nel territorio
  for (const [utype, qty] of Object.entries(input.defenderUnitsInTerritory)) {
    if ((qty ?? 0) > 0) {
      const udef = UNIT_MAP[utype as UnitType];
      const bonus = udef?.defenseBonus ?? 0;
      if (bonus > 0) {
        force += bonus * (qty as number);
        bd.push(`${udef.icon} ${udef.label} x${qty}: +${bonus * (qty as number)} → ${force}`);
      }
    }
  }

  // DEFCON 3: tutte le unità navali ottengono +1 difesa
  if (input.gameState.defcon === 3 && tDef?.isNaval) {
    const navali = input.defenderUnitsInTerritory['Navale'] ?? 0;
    if (navali > 0) {
      force += navali;
      bd.push(`DEFCON 3 (navali +1 cad., x${navali}): +${navali} → ${force}`);
    }
  }

  // Guerra Asimmetrica Iran (difesa in territorio Iran)
  if (input.guerraAsimmetricaActive && input.defender === 'Iran' && input.territory === 'Iran') {
    force += 3;
    bd.push(`⚡ Guerra Asimmetrica: +3 → ${force}`);
  }

  return { force: Math.max(1, force), breakdown: bd };
}

// ── PASSO 4: Confronto e Risultato ───────────────────────────────────────────
export function resolveCombat(input: CombatInput): CombatOutcome {
  const { force: atk, breakdown: atkBd } = calcAttackForce(input);
  const { force: def, breakdown: defBd } = calcDefenseForce(input);
  const diff = atk - def;

  let result: CombatResult;
  let infAtk = 0, infDef = 0, defconCh = -1, unitsLost = 0, stabCh = 0;
  let desc = '';

  if (diff >= 3) {
    result = 'vittoria_decisiva';
    infAtk = 1; infDef = -2;
    desc = `VITTORIA DECISIVA (+${diff}) — rimosse 2 influenze ${input.defender}, piazzata 1 influenza ${input.attacker}.`;
  } else if (diff >= 1) {
    result = 'vittoria';
    infDef = -1;
    desc = `VITTORIA (+${diff}) — rimossa 1 influenza ${input.defender}.`;
  } else if (diff === 0) {
    result = 'stallo';
    desc = `STALLO — nessun cambiamento di influenza.`;
  } else if (diff >= -2) {
    result = 'sconfitta';
    unitsLost = 1;
    desc = `SCONFITTA (${diff}) — l'attaccante perde 1 unità.`;
  } else {
    result = 'sconfitta_grave';
    unitsLost = 2; stabCh = -1;
    desc = `SCONFITTA GRAVE (${diff}) — l'attaccante perde 2 unità e −1 Stabilità Interna.`;
  }

  // Guerra Asimmetrica: +danno all'attaccante anche in vittoria
  if (
    input.guerraAsimmetricaActive &&
    input.defender === 'Iran' &&
    input.territory === 'Iran' &&
    result !== 'vittoria_decisiva'
  ) {
    unitsLost = Math.max(unitsLost, 1);
    desc += ` ⚡ Guerra Asimmetrica: attaccante subisce 1 danno.`;
  }

  return {
    attackForce: atk,
    defenseForce: def,
    difference: diff,
    result,
    infChangeAttacker: infAtk,
    infChangeDefender: infDef,
    defconChange: defconCh,
    attackerUnitsLost: unitsLost,
    stabilityChange: stabCh,
    description: desc,
    attackBreakdown: atkBd,
    defenseBreakdown: defBd,
  };
}

// ── Controllo Hormuz ──────────────────────────────────────────────────────────
export function checkHormuz(
  navalUnitsInHormuz: number
): boolean {
  return navalUnitsInHormuz >= 2;
}

// ── Controllo territorio ──────────────────────────────────────────────────────
export function getController(
  influences: Record<Faction, number>
): Faction | null {
  const entries = Object.entries(influences) as [Faction, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return sorted[0]?.[1] >= 2 ? sorted[0][0] : null;
  const [first, second] = sorted;
  return first[1] - second[1] >= 2 ? first[0] : null;
}

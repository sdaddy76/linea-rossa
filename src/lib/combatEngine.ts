// =============================================
// LINEA ROSSA — Motore di Combattimento v2
// Sistema asimmetrico per fazione
// =============================================

import type { Faction, GameState } from '@/types/game';
import type { UnitType, TerritoryId } from '@/lib/territoriesData';
import { UNIT_MAP, TERRITORY_MAP } from '@/lib/territoriesData';

export type CombatResult =
  | 'vittoria_decisiva'   // Attacco > Difesa di 3+
  | 'vittoria'            // Attacco > Difesa di 1-2
  | 'stallo'              // Pareggio ±0
  | 'sconfitta'           // Difesa > Attacco di 1-2
  | 'sconfitta_grave';    // Difesa > Attacco di 3+

export interface CombatInput {
  attacker: Faction;
  defender: Faction;
  territory: TerritoryId;
  cardOpPoints: number;               // PO carta giocata
  unitTypesUsed: UnitType[];          // unità schierate dall'attaccante
  defenderUnitsInTerritory: Partial<Record<UnitType, number>>;
  gameState: GameState;
  // Flag speciali
  hormuzActive?: boolean;             // Iran ha ≥2 NavaleGolfo in Hormuz
  allianceActive?: boolean;           // alleanza attiva +1 attacco
  guerraAsimmetricaActive?: boolean;  // Iran attiva Guerra Asimmetrica (carta)
}

export interface CombatOutcome {
  attackForce: number;
  defenseForce: number;
  difference: number;
  result: CombatResult;
  infChangeAttacker: number;
  infChangeDefender: number;
  defconChange: number;
  attackerUnitsLost: number;
  stabilityChange: number;
  extraEffects: string[];           // effetti speciali attivati
  description: string;
  attackBreakdown: string[];
  defenseBreakdown: string[];
}

// ─── Effetti speciali attivi ─────────────────────────────────────────────────
interface SpecialFlags {
  scudoActive: boolean;       // Coalizione ha ScudoMissilistico → blocca MissileiBalistici
  forzeSpecialiUsed: boolean; // Coalizione ForzeSpeciali → +1 inf in vittoria
  guerraIbridaUsed: boolean;  // Russia GuerraIbrida → -1 stabilità difensore
  proxyUsed: boolean;         // Iran Proxy → -1 stabilità difensore
  cyberUsed: boolean;         // Iran CyberIran o CyberCina → -1 difesa bersaglio
  peacekeepingPresent: boolean; // Europa Peacekeeping → +1 Opinione, solo difesa
  droniIranUsed: boolean;     // Iran DroniIran → -1 stabilità difensore, no perdita unità in sconfitta
  missiliCrociEraUsed: boolean; // Coalizione MissiliCrociera → -1 Nucleare Iran se Natanz/Fordow/Teheran, no perdita unità
}

function detectSpecialFlags(
  unitTypesUsed: UnitType[],
  defenderUnits: Partial<Record<UnitType, number>>,
): SpecialFlags {
  const defArr = (Object.entries(defenderUnits) as [UnitType, number][])
    .filter(([, q]) => q > 0).map(([t]) => t);

  return {
    scudoActive:           defArr.includes('ScudoMissilistico'),
    forzeSpecialiUsed:     unitTypesUsed.includes('ForzeSpeciali'),
    guerraIbridaUsed:      unitTypesUsed.includes('GuerraIbrida'),
    proxyUsed:             unitTypesUsed.includes('Proxy'),
    cyberUsed:             unitTypesUsed.includes('CyberIran') || unitTypesUsed.includes('CyberCina'),
    peacekeepingPresent:   defArr.includes('Peacekeeping') || unitTypesUsed.includes('Peacekeeping'),
    droniIranUsed:         unitTypesUsed.includes('DroniIran'),
    missiliCrociEraUsed:   unitTypesUsed.includes('MissiliCrociera'),
  };
}

// ─── Forza d'Attacco ─────────────────────────────────────────────────────────
function calcAttackForce(
  input: CombatInput,
  flags: SpecialFlags,
): { force: number; breakdown: string[] } {
  const bd: string[] = [];
  const tDef = TERRITORY_MAP[input.territory];
  let force = input.cardOpPoints;
  bd.push(`Base carta (PO): ${force}`);

  // ── Bonus unità attaccanti ──────────────────────────────────────────────────
  for (const utype of input.unitTypesUsed) {
    const udef = UNIT_MAP[utype];
    if (!udef) continue;
    let bonus = udef.attackBonus;

    // Regola navale/terrestre
    if (udef.navalOnly && !tDef?.isNaval) {
      bd.push(`${udef.icon} ${udef.label}: navale non applicabile`);
      continue;
    }
    if (udef.landOnly && !tDef?.isLand) {
      bd.push(`${udef.icon} ${udef.label}: terrestre non applicabile`);
      continue;
    }

    // Peacekeeping Europa: non può attaccare
    if (utype === 'Peacekeeping') {
      bd.push(`🕊️ Peacekeeping: unità solo difensiva, non contribuisce all'attacco`);
      continue;
    }

    // MissileiBalistici Iran: bloccati da Scudo Missilistico
    if (utype === 'MissileiBalistici' && flags.scudoActive) {
      bd.push(`🚀 MissileiBalistici: BLOCCATI da Scudo Missilistico`);
      continue;
    }

    // Cyber: -1 difesa (applicato dopo, qui contiamo come +1 forza effettiva)
    if ((utype === 'CyberIran' || utype === 'CyberCina') && bonus > 0) {
      force += bonus;
      bd.push(`${udef.icon} ${udef.label}: Cyber attacco +${bonus} → ${force}`);
      continue;
    }

    if (bonus > 0) {
      force += bonus;
      bd.push(`${udef.icon} ${udef.label}: +${bonus} → ${force}`);
    } else {
      bd.push(`${udef.icon} ${udef.label}: nessun bonus attacco`);
    }
  }

  // ── Bonus situazionali ──────────────────────────────────────────────────────
  if (input.gameState.defcon <= 6) {
    force += 1;
    bd.push(`DEFCON ≤ 3 (escalation): +1 → ${force}`);
  }
  if (input.allianceActive) {
    force += 1;
    bd.push(`Alleanza attiva: +1 → ${force}`);
  }

  // Iran: Hormuz penalizza Coalizione nel Golfo
  if (input.hormuzActive && input.attacker === 'Coalizione') {
    const gulf = ['StrettoHormuz','Kuwait','Bahrain','Qatar','EmiratiArabi','Oman'];
    if (gulf.includes(input.territory)) {
      force -= 2;
      bd.push(`⚠️ Blocco Stretto Hormuz (Golfo): -2 → ${force}`);
    }
  }

  // Iran: Guerra Asimmetrica (carta attivata) difende casa propria
  if (input.guerraAsimmetricaActive && input.attacker === 'Iran' && input.territory !== 'Iran') {
    // non dà bonus attacco ma viene usata in difesa
  }

  return { force: Math.max(1, force), breakdown: bd };
}

// ─── Forza Difensiva ─────────────────────────────────────────────────────────
function calcDefenseForce(
  input: CombatInput,
  flags: SpecialFlags,
): { force: number; breakdown: string[] } {
  const bd: string[] = [];
  const tDef = TERRITORY_MAP[input.territory];

  // Base = tracciato militare del difensore
  const militaryKey = `forze_militari_${input.defender.toLowerCase()}` as keyof GameState;
  let force = ((input.gameState[militaryKey] as number) ?? 5);
  bd.push(`Tracciato Militare ${input.defender}: ${force}`);

  // Territorio casa +2
  if (tDef?.homeFaction === input.defender) {
    force += 2;
    bd.push(`Territorio casa: +2 → ${force}`);
  }

  // Stabilità alta ≥ 7
  const stabKey = `stabilita_${input.defender.toLowerCase()}` as keyof GameState;
  const stab = (input.gameState[stabKey] as number) ?? 5;
  if (stab >= 7) {
    force += 1;
    bd.push(`Stabilità interna ≥7 (${stab}): +1 → ${force}`);
  }

  // Cyber: riduce difesa -1 (attaccante ha CyberIran o CyberCina)
  if (flags.cyberUsed) {
    force = Math.max(1, force - 1);
    bd.push(`💻 Attacco Cyber: -1 difesa → ${force}`);
  }

  // ── Bonus unità difensive ──────────────────────────────────────────────────
  for (const [utype, qty] of (Object.entries(input.defenderUnitsInTerritory) as [UnitType, number][])) {
    if ((qty ?? 0) <= 0) continue;
    const udef = UNIT_MAP[utype];
    if (!udef) continue;

    // Validità navale/terrestre
    if (udef.navalOnly && !tDef?.isNaval) continue;
    if (udef.landOnly && !tDef?.isLand) continue;

    // MissileiBalistici: nessun bonus difensivo
    if (utype === 'MissileiBalistici') continue;
    const bonus = udef.defenseBonus;
    if (bonus > 0) {
      force += bonus * qty;
      bd.push(`${udef.icon} ${udef.label} ×${qty}: +${bonus * qty} → ${force}`);
    }
  }

  // DEFCON 3: unità navali difensive +1 ciascuna
  if (input.gameState.defcon <= 6 && tDef?.isNaval) {
    const navTypes: UnitType[] = ['NavaleGolfo','PortaereiBattleGroup','SottomariniAKULA','NavalePLA'];
    let bonus = 0;
    for (const nt of navTypes) {
      bonus += input.defenderUnitsInTerritory[nt] ?? 0;
    }
    if (bonus > 0) {
      force += bonus;
      bd.push(`DEFCON ≤3 (navali +1 cad., ×${bonus}): +${bonus} → ${force}`);
    }
  }

  // Iran: Guerra Asimmetrica nel territorio Iran
  if (input.guerraAsimmetricaActive && input.defender === 'Iran' && input.territory === 'Iran') {
    force += 3;
    bd.push(`⚡ Guerra Asimmetrica (Iran in casa): +3 → ${force}`);
  }

  // IRGC in Iran: difesa bonus casa
  if (input.defender === 'Iran') {
    const irgcQty = input.defenderUnitsInTerritory['IRGC'] ?? 0;
    if (irgcQty > 0 && input.territory === 'Iran') {
      // già calcolato come defenseBonus ma doppio in casa
      force += irgcQty;
      bd.push(`🦅 IRGC in casa (bonus doppio): +${irgcQty} → ${force}`);
    }
  }

  return { force: Math.max(1, force), breakdown: bd };
}

// ─── Effetti post-combattimento ───────────────────────────────────────────────
function buildExtraEffects(
  result: CombatResult,
  input: CombatInput,
  flags: SpecialFlags,
): string[] {
  const effects: string[] = [];
  const won = result === 'vittoria' || result === 'vittoria_decisiva';

  // ForzeSpeciali: +1 influenza aggiuntiva in vittoria
  if (flags.forzeSpecialiUsed && won) {
    effects.push('🚨 Forze Speciali: +1 influenza aggiuntiva per precisione');
  }

  // GuerraIbrida Russia: -1 stabilità difensore in vittoria
  if (flags.guerraIbridaUsed && won) {
    effects.push(`🕵️ Guerra Ibrida: -1 Stabilità Interna a ${input.defender}`);
  }

  // Proxy Iran: -1 stabilità difensore in vittoria
  if (flags.proxyUsed && won) {
    effects.push(`🎭 Milizie Proxy: -1 Stabilità Interna a ${input.defender}`);
  }

  // Peacekeeping Europa: genera +1 Opinione Globale se presente
  if (flags.peacekeepingPresent) {
    effects.push(`🕊️ Caschi Blu ONU/EU: +1 Opinione Globale`);
  }

  // DroniIran: -1 stabilità difensore in vittoria
  if (flags.droniIranUsed && won) {
    effects.push(`🛸 Droni Shahed: −1 Stabilità Interna a ${input.defender} (attacco kamikaze)`);
  }

  // MissiliCrociera: -1 Nucleare Iran se bersaglio è Natanz/Fordow/Teheran in vittoria
  const nucleareTargets: TerritoryId[] = ['Natanz', 'Fordow', 'Teheran'];
  if (flags.missiliCrociEraUsed && won && nucleareTargets.includes(input.territory)) {
    effects.push(`🎯 Missili da Crociera: −1 Nucleare Iran (bersaglio ${input.territory} colpito con precisione chirurgica)`);
  }

  return effects;
}

// ─── Risoluzione principale ───────────────────────────────────────────────────
export function resolveCombat(input: CombatInput): CombatOutcome {
  const flags = detectSpecialFlags(input.unitTypesUsed, input.defenderUnitsInTerritory);

  const { force: atk, breakdown: atkBd } = calcAttackForce(input, flags);
  const { force: def, breakdown: defBd } = calcDefenseForce(input, flags);
  const diff = atk - def;

  let result: CombatResult;
  let infAtk = 0, infDef = 0, defconCh = -1, unitsLost = 0, stabCh = 0;
  let desc = '';

  if (diff >= 3) {
    result = 'vittoria_decisiva';
    infAtk = 1; infDef = -2;
    desc = `VITTORIA DECISIVA (+${diff}): +1 influenza ${input.attacker}, -2 influenza ${input.defender}.`;
  } else if (diff >= 1) {
    result = 'vittoria';
    infDef = -1;
    desc = `VITTORIA (+${diff}): -1 influenza ${input.defender}.`;
  } else if (diff === 0) {
    result = 'stallo';
    desc = `STALLO: nessun cambio influenza.`;
  } else if (diff >= -2) {
    result = 'sconfitta';
    unitsLost = 1;
    desc = `SCONFITTA (${diff}): ${input.attacker} perde 1 unità.`;
  } else {
    result = 'sconfitta_grave';
    unitsLost = 2; stabCh = -1;
    desc = `SCONFITTA GRAVE (${diff}): ${input.attacker} perde 2 unità e -1 Stabilità.`;
  }

  // Forze Speciali: +1 influenza aggiuntiva
  const won = result === 'vittoria' || result === 'vittoria_decisiva';
  if (flags.forzeSpecialiUsed && won) {
    infAtk += 1;
  }

  // Guerra Asimmetrica: danno aggiuntivo all'attaccante anche in vittoria
  if (
    input.guerraAsimmetricaActive &&
    input.defender === 'Iran' &&
    input.territory === 'Iran' &&
    result !== 'vittoria_decisiva'
  ) {
    unitsLost = Math.max(unitsLost, 1);
    desc += ` ⚡ Guerra Asimmetrica: attaccante perde almeno 1 unità.`;
  }

  // DroniIran: nessuna perdita unità in caso di sconfitta
  if (flags.droniIranUsed && (result === 'sconfitta' || result === 'sconfitta_grave')) {
    unitsLost = 0;
    desc += ` 🛸 Droni Shahed: nessuna perdita unità (kamikaze surrogati da Convenzionali).`;
  }

  // MissiliCrociera: nessuna perdita unità in caso di sconfitta
  if (flags.missiliCrociEraUsed && (result === 'sconfitta' || result === 'sconfitta_grave')) {
    unitsLost = 0;
    desc += ` 🎯 Missili da Crociera: nessuna perdita unità in caso di sconfitta.`;
  }

  const extraEffects = buildExtraEffects(result, input, flags);

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
    extraEffects,
    description: desc,
    attackBreakdown: atkBd,
    defenseBreakdown: defBd,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function checkHormuz(navalUnitsInHormuz: number): boolean {
  return navalUnitsInHormuz >= 2;
}

export function getController(influences: Record<Faction, number>): Faction | null {
  const entries = Object.entries(influences) as [Faction, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return sorted[0]?.[1] >= 2 ? sorted[0][0] : null;
  const [first, second] = sorted;
  return first[1] - second[1] >= 2 ? first[0] : null;
}

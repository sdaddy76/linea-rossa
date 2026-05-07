// =============================================
// LINEA ROSSA — Mercato Risorse Militari
//
// Regola: il costo base di 1 unità di risorsa militare
// dipende da 3 fattori combinati:
//
// 1. DEFCON (5-1):  più basso = crisi in corso = costo alto
//    5 → ×0.7  |  4 → ×1.0  |  3 → ×1.3  |  2 → ×1.7  |  1 → ×2.5
//
// 2. Sanzioni (1-10): più alte = economia compressa = costo alto per Iran
//                                                   = costo basso per Coalizione
//    Iran:        1-3 → ×0.8  |  4-6 → ×1.0  |  7-8 → ×1.4  |  9-10 → ×2.0
//    Coalizione:  1-3 → ×1.2  |  4-6 → ×1.0  |  7-8 → ×0.9  |  9-10 → ×0.8
//
// 3. Tracciato Militare fazione (1-10):
//    Valore alto = capacità industriale → sconto
//    1-2 → ×1.5  |  3-5 → ×1.2  |  6-8 → ×1.0  |  9-10 → ×0.8
//
// Costo finale = round(BASE × moltiplicatoreDefcon × moltiplicatoreSanzioni × moltiplicatoreMilitare)
// BASE = 3 carte OP
// =============================================

import type { Faction } from '@/types/game';

export const COSTO_BASE_OP = 3;           // Costo in Punti Operazione
export const RISORSE_PER_ACQUISTO = 1;    // Unità di risorsa guadagnate

// ─── Tipi ─────────────────────────────────
export interface CostoAcquisto {
  costoOp: number;            // Carte OP da spendere
  risorse: number;            // Unità risorse militari ricevute
  breakdown: BreakdownCosto;  // Dettaglio calcolo
  canAfford: boolean;         // Ha abbastanza OP
}

export interface BreakdownCosto {
  base: number;
  molDefcon: number;
  molSanzioni: number;
  molMilitare: number;
  defconLabel: string;
  sanzioniLabel: string;
  militareLabel: string;
}

export interface MarketState {
  defcon: number;
  sanzioni: number;
  forzeMilitari: number;   // tracciato militare fazione (1-10)
  carteOpDisponibili: number;
  faction: Faction;
}

// ─── Moltiplicatori DEFCON (scala 1-10) ─────────────────
function moltiplicatoreDefcon(defcon: number): { mult: number; label: string } {
  if (defcon >= 9) return { mult: 0.7,  label: 'Pace (+30% sconto)' };
  if (defcon >= 7) return { mult: 1.0,  label: 'Normale' };
  if (defcon >= 5) return { mult: 1.3,  label: 'Tensione (+30% costo)' };
  if (defcon >= 3) return { mult: 1.7,  label: 'Allerta (+70% costo)' };
  /* defcon 1-2 */  return { mult: 2.5,  label: 'Guerra (×2.5 costo)' };
}

// ─── Moltiplicatori Sanzioni per fazione ──
function moltiplicatoreSanzioni(sanzioni: number, faction: Faction): { mult: number; label: string } {
  if (faction === 'Iran') {
    if (sanzioni <= 3)  return { mult: 0.8,  label: 'Sanzioni lievi (-20%)' };
    if (sanzioni <= 6)  return { mult: 1.0,  label: 'Sanzioni moderate' };
    if (sanzioni <= 8)  return { mult: 1.4,  label: 'Sanzioni gravi (+40%)' };
    /* 9-10 */          return { mult: 2.0,  label: 'Sanzioni max (×2.0)' };
  }
  // Coalizione: sanzioni alte su Iran = meno pressione su Coalizione = costo minore
  if (faction === 'Coalizione') {
    if (sanzioni <= 3)  return { mult: 1.2,  label: 'Iran libero (+20%)' };
    if (sanzioni <= 6)  return { mult: 1.0,  label: 'Sanzioni moderate' };
    if (sanzioni <= 8)  return { mult: 0.9,  label: 'Iran sotto pressione (-10%)' };
    /* 9-10 */          return { mult: 0.8,  label: 'Iran collasso (-20%)' };
  }
  // Russia, Cina, Europa: neutri rispetto alle sanzioni
  return { mult: 1.0, label: 'Neutrale' };
}

// ─── Moltiplicatori Tracciato Militare ─────
function moltiplicatoreMilitare(forzeMilitari: number): { mult: number; label: string } {
  if (forzeMilitari <= 2)  return { mult: 1.5,  label: 'Forze deboli (+50%)' };
  if (forzeMilitari <= 5)  return { mult: 1.2,  label: 'Forze ridotte (+20%)' };
  if (forzeMilitari <= 8)  return { mult: 1.0,  label: 'Forze standard' };
  /* 9-10 */               return { mult: 0.8,  label: 'Forze elite (-20%)' };
}

// ─── Calcolo principale ────────────────────
export function calcolaCosto(state: MarketState): CostoAcquisto {
  const { defcon, sanzioni, forzeMilitari, faction, carteOpDisponibili } = state;

  const mDef = moltiplicatoreDefcon(defcon);
  const mSan = moltiplicatoreSanzioni(sanzioni, faction);
  const mMil = moltiplicatoreMilitare(forzeMilitari);

  const costoRaw = COSTO_BASE_OP * mDef.mult * mSan.mult * mMil.mult;
  const costoOp  = Math.max(1, Math.round(costoRaw));

  return {
    costoOp,
    risorse: RISORSE_PER_ACQUISTO,
    canAfford: carteOpDisponibili >= costoOp,
    breakdown: {
      base: COSTO_BASE_OP,
      molDefcon: mDef.mult,
      molSanzioni: mSan.mult,
      molMilitare: mMil.mult,
      defconLabel: mDef.label,
      sanzioniLabel: mSan.label,
      militareLabel: mMil.label,
    },
  };
}

// ─── Quante risorse posso comprare con X OP ─
export function calcolaRisorseAcquistabili(
  state: MarketState,
  opSpendibili: number,
): number {
  const costo = calcolaCosto(state);
  return costo.costoOp > 0 ? Math.floor(opSpendibili / costo.costoOp) : 0;
}

// ─── Testo colore per il costo ─────────────
export function coloreCosto(costoOp: number): string {
  if (costoOp <= 2)  return '#22c55e';  // verde
  if (costoOp === 3) return '#f59e0b';  // giallo (base)
  if (costoOp <= 5)  return '#f97316';  // arancio
  return '#ef4444';                      // rosso
}

// ─── Label tracciato militare per fazione ──
export function labelTracciato(faction: Faction): string {
  const labels: Record<string, string> = {
    Iran:       'Forze IRGC / Militari',
    Coalizione: 'Risorse Militari',
    Russia:     'Influenza Militare',
    Cina:       'Potenza Economica',
    Europa:     'Stabilità Energetica',
  };
  return labels[faction] ?? 'Tracciato Militare';
}

// ─── Ottieni valore tracciato militare dal GameState ─
export function getForzeMilitari(
  faction: Faction,
  gameState: {
    forze_militari_iran: number;
    forze_militari_coalizione: number;
    risorse_russia: number;
    risorse_cina: number;
    risorse_europa: number;
  }
): number {
  switch (faction) {
    case 'Iran':       return gameState.forze_militari_iran;
    case 'Coalizione': return gameState.forze_militari_coalizione;
    case 'Russia':     return gameState.risorse_russia;
    case 'Cina':       return gameState.risorse_cina;
    case 'Europa':     return gameState.risorse_europa;
    default:           return 5;
  }
}

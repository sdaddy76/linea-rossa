// =============================================
// LINEA ROSSA — Motore Bot
// Il bot sceglie la carta migliore dal proprio mazzo
// in base ai parametri correnti del gioco.
// Se sono presenti carte BOT nel DB (tabella bot_cards),
// le usa per selezionare la mossa con logica condizionale.
// =============================================

import type { GameCard } from '@/types/game';
import type { GameState, TerritoryRecord } from '@/types/game';
import type { Faction, BotDifficulty } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { TERRITORY_BONUS_MAP } from '@/lib/territoriesData';
import type { TerritoryBonusDelta } from '@/lib/territoriesData';
import { TUTTI_GLI_OBIETTIVI } from '@/data/obiettivi';
import type { ObiettivoSegreto } from '@/data/obiettivi';

// ─── Tipo carta BOT (v2 — specchia tabella Supabase bot_cards) ───────────
export interface BotCard {
  id: string;
  faction: string;
  deck_priority: number;     // 1=prima scelta, 2=seconda, 3=fallback
  deck_name: string;
  deck_condition: string;    // condizione per selezionare il mazzo
  card_condition: string;    // condizione valutata dopo aver pescato la carta
  priority_1: string;        // azione se card_condition VERA
  priority_2: string | null; // azione se card_condition FALSA
}

// ─── Risultato della decisione BOT ──────────────────────────────────────
export interface BotCardDecision {
  card: BotCard;
  actionChosen: 'priority_1' | 'priority_2';
  actionText: string;
  deckUsed: number;      // quale priorità mazzo è stata usata (1/2/3)
  cardConditionMet: boolean;
}

// ─── Mappa fazione interna → nome DB ────────────────────────────────────
const FACTION_TO_DB_NAME: Record<Faction, string> = {
  Iran:       'Iran',
  Coalizione: 'Coalizione Occidentale (USA)',
  Russia:     'Russia-Cina',
  Cina:       'Russia-Cina',
  Europa:     'Unione Europea',
};

// ─── Carica tutte le carte BOT di una fazione, ordinate per priorità ────
export async function loadBotCardsForFaction(faction: Faction): Promise<BotCard[]> {
  const dbFaction = FACTION_TO_DB_NAME[faction] ?? faction;
  const { data, error } = await (supabase as any)
    .from('bot_cards')
    .select('*')
    .eq('faction', dbFaction)
    .order('deck_priority', { ascending: true })
    .order('id',            { ascending: true });
  if (error || !data) return [];
  return data as BotCard[];
}

// ─── Carica le 40 carte neutrali (fallback globale, faction='Neutrale') ──
export async function loadNeutralBotCards(): Promise<BotCard[]> {
  const { data, error } = await (supabase as any)
    .from('bot_cards')
    .select('*')
    .eq('faction', 'Neutrale')
    .order('id', { ascending: true });
  if (error || !data) return [];
  return data as BotCard[];
}

// ─── Valuta una condizione testuale rispetto allo stato corrente ─────────
// Operatori supportati: ≤ ≥ < > = | congiunzione "e"
export function evaluateCondition(condition: string, state: GameState, faction: Faction): boolean {
  if (!condition || condition.trim() === '') return true;

  const c = condition.toLowerCase().trim();

  // Risolve il tracciato per nome
  const getVal = (key: string): number | null => {
    const risorseKey = `risorse_${faction.toLowerCase()}` as keyof GameState;
    const stabKey    = `stabilita_${faction.toLowerCase()}` as keyof GameState;
    const k = key.trim().toLowerCase();
    if (k.includes('nucleare iran') || k.includes('minaccia nucl')) return state.nucleare;
    if (k.includes('nucleare'))                              return state.nucleare;
    if (k.includes('sanzioni'))                              return state.sanzioni;
    if (k.includes('defcon'))                                return state.defcon;
    if (k.includes('opinione'))                              return state.opinione;
    if (k.includes('risorse') && k.includes('coalizione'))   return state.risorse_coalizione;
    if (k.includes('risorse') && k.includes('iran'))         return state.risorse_iran;
    if (k.includes('risorse') && k.includes('russia'))       return state.risorse_russia;
    if (k.includes('risorse') && k.includes('cina'))         return state.risorse_cina;
    if (k.includes('risorse') && k.includes('europa'))       return state.risorse_europa;
    if (k.includes('risorse') && k.includes('eu'))           return state.risorse_europa;
    if (k.includes('risorse') && k.includes('isr'))          return state.risorse_iran; // proxy Israele
    if (k.includes('risorse') && k.includes('rc'))           return state.risorse_russia;
    if (k.includes('risorse'))                               return state[risorseKey] as number;
    if (k.includes('stabilità') && k.includes('iran'))       return state.stabilita_iran;
    if (k.includes('stabilità') && k.includes('coalizione')) return state.stabilita_coalizione;
    if (k.includes('stabilità') && k.includes('eu'))         return state.stabilita_europa;
    if (k.includes('stabilità') && k.includes('russia'))     return state.stabilita_russia;
    if (k.includes('stabilità') && k.includes('cina'))       return state.stabilita_cina;
    if (k.includes('stabilità') && k.includes('isr'))        return state.stabilita_iran; // proxy
    if (k.includes('stabilità'))                             return state[stabKey] as number;
    if (k.includes('influenza') || k.includes('supporto') ||
        k.includes('coesione')  || k.includes('deterrenza') ||
        k.includes('intelligence'))                          return state[stabKey] as number;
    if (k.includes('cyber'))                                 return state.risorse_cina;
    // Nuovi tracciati v2
    if (k.includes('influenza mil') || k.includes('influenza militare')) return state.risorse_russia;
    if (k.includes('energia') || k.includes('energia/risorse'))          return state.risorse_russia;
    if (k.includes('stabilità eco') || k.includes('stabilita eco'))      return state.stabilita_russia;
    if (k.includes('potenza eco') || k.includes('potenza economica'))    return state.risorse_cina;
    if (k.includes('influenza com') || k.includes('influenza commerciale')) return state.stabilita_cina;
    if (k.includes('supporto pub') || k.includes('supporto pubblico'))   return state.stabilita_coalizione;
    if (k.includes('risorse mil') || k.includes('risorse militari'))     return state.risorse_coalizione;
    if (k.includes('influenza dip') || k.includes('influenza diplomatica')) {
      if (faction === 'Europa')      return state.stabilita_europa;
      if (faction === 'Coalizione')  return state.stabilita_coalizione;
      return state[stabKey] as number;
    }
    if (k.includes('coesione'))                              return state.stabilita_europa;
    if (k.includes('stabilità energ') || k.includes('stabilita energ')) return state.risorse_europa;
    if (k.includes('potenza'))                               return state.risorse_cina;
    return null;
  };

  // Separa per congiunzione "e"
  const clauses = c.split(/\s+e\s+/);
  for (const clause of clauses) {
    const t = clause.trim();
    const opMatch = t.match(/^(.+?)\s*(≤|>=|≥|<=|>|<|=)\s*(-?\d+)\s*$/);
    if (opMatch) {
      const val = getVal(opMatch[1]);
      if (val === null) continue;
      const thr = parseInt(opMatch[3]);
      const op  = opMatch[2];
      if ((op === '≤' || op === '<=') && val > thr)  return false;
      if ((op === '≥' || op === '>=') && val < thr)  return false;
      if (op === '<'  && val >= thr) return false;
      if (op === '>'  && val <= thr) return false;
      if (op === '='  && val !== thr) return false;
    }
    // clausole narrative → ignorate (sempre vere)
  }
  return true;
}

// ─── LOGICA PRINCIPALE BOT ───────────────────────────────────────────────
// 1. Scorre i mazzi fazione in ordine di priorità (1→2→3)
// 2. Per ciascun mazzo controlla deck_condition → se vera, pesca una carta random
// 3. Sulla carta pescata valuta card_condition → se vera usa priority_1, altrimenti priority_2
// 4. Se NESSUN mazzo fazione è attivo → FALLBACK al Mazzo Neutrale (40 carte globali)
//    Le carte neutrali usano solo DEFCON, Opinione, Sanzioni, Nucleare come condizioni.
export async function botSelectFromBotCards(
  state: GameState,
  faction: Faction,
  difficulty: BotDifficulty = 'normal'
): Promise<BotCardDecision | null> {
  const allCards = await loadBotCardsForFaction(faction);

  // ── Funzione helper: pesca una carta da un pool ────────────────────────
  const pickCard = (pool: BotCard[]): BotCard => {
    if (difficulty === 'easy') {
      return pool[Math.floor(Math.random() * pool.length)];
    } else if (difficulty === 'normal') {
      const half = Math.ceil(pool.length / 2);
      const src  = Math.random() < 0.7 ? pool.slice(0, half) : pool.slice(half);
      return src[Math.floor(Math.random() * src.length)];
    } else {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  };

  // ── Funzione helper: costruisce il risultato finale ────────────────────
  const buildDecision = (chosen: BotCard, deckUsed: number): BotCardDecision => {
    const cardConditionMet = evaluateCondition(chosen.card_condition, state, faction);
    const actionChosen: 'priority_1' | 'priority_2' = cardConditionMet ? 'priority_1' : 'priority_2';
    const actionText = cardConditionMet
      ? chosen.priority_1
      : (chosen.priority_2 ?? chosen.priority_1);
    return { card: chosen, actionChosen, actionText, deckUsed, cardConditionMet };
  };

  // ── Scansione mazzi fazione (1→2→3) ───────────────────────────────────
  if (allCards.length > 0) {
    const deckPriorities = [...new Set(allCards.map((c) => c.deck_priority))].sort((a, b) => a - b);

    for (const priority of deckPriorities) {
      const deckCards = allCards.filter((c) => c.deck_priority === priority);
      if (deckCards.length === 0) continue;

      const deckCondition = deckCards[0].deck_condition;
      if (!evaluateCondition(deckCondition, state, faction)) continue;

      // Mazzo fazione attivo → pesca e decidi
      return buildDecision(pickCard(deckCards), priority);
    }
  }

  // ── FALLBACK: nessun mazzo fazione attivo → Mazzo Neutrale ────────────
  const neutralCards = await loadNeutralBotCards();
  if (neutralCards.length === 0) return null;

  // Filtra le carte neutrali la cui condizione è soddisfatta dallo stato corrente
  const eligibleNeutral = neutralCards.filter(
    (c) => evaluateCondition(c.card_condition, state, faction)
  );

  // Se ci sono carte eligibili usa quelle, altrimenti usa qualsiasi
  const neutralPool = eligibleNeutral.length > 0 ? eligibleNeutral : neutralCards;
  const chosen = neutralPool[Math.floor(Math.random() * neutralPool.length)];

  return buildDecision(chosen, 0); // deckUsed = 0 → mazzo neutrale
}

export interface BotDecision {
  card: GameCard;
  score: number;
  reason: string;
}

// -----------------------------------------------
// Punteggio di una carta per una fazione bot
// in base allo stato corrente dei tracciati
// -----------------------------------------------
function scoreCard(card: GameCard, state: GameState, faction: Faction): number {
  let score = card.op_points * 10; // base: carte con più OP valgono di più

  const {
    nucleare, sanzioni, defcon, opinione,
    risorse_iran, risorse_coalizione, risorse_russia, risorse_cina, risorse_europa,
    stabilita_iran, stabilita_coalizione, stabilita_russia, stabilita_cina, stabilita_europa,
  } = state;

  const risorseMap: Record<Faction, number> = {
    Iran: risorse_iran, Coalizione: risorse_coalizione,
    Russia: risorse_russia, Cina: risorse_cina, Europa: risorse_europa,
  };
  const stabilitaMap: Record<Faction, number> = {
    Iran: stabilita_iran, Coalizione: stabilita_coalizione,
    Russia: stabilita_russia, Cina: stabilita_cina, Europa: stabilita_europa,
  };

  const mieRisorse = risorseMap[faction];
  const miaStabilita = stabilitaMap[faction];

  // Calcola effetti della carta
  const dNucleare = card.effects.nucleare?.(nucleare) ?? 0;
  const dSanzioni = card.effects.sanzioni?.(sanzioni) ?? 0;
  const dOpinione = card.effects.opinione?.(opinione) ?? 0;
  const dDefcon   = card.effects.defcon?.(defcon) ?? 0;
  const dRisorse  = card.effects.risorse?.(mieRisorse) ?? 0;
  const dStabilita = card.effects.stabilita?.(miaStabilita) ?? 0;

  // --- LOGICA PER IRAN ---
  if (faction === 'Iran') {
    // Iran vuole alzare il nucleare → vittoria a 15
    score += dNucleare * 20;
    // Iran vuole abbassare le sanzioni
    score += dSanzioni * 15;
    // Iran vuole abbassare il defcon (pressione militare)
    if (dDefcon < 0) score += Math.abs(dDefcon) * 8;
    // Iran vuole abbassare l'opinione globale (più simpatia)
    if (dOpinione < 0) score += Math.abs(dOpinione) * 5;
    // Risorse critiche → priorizza carta che le aumenta
    if (mieRisorse <= 2 && dRisorse > 0) score += dRisorse * 25;
    // Stabilità bassa → priorizza
    if (miaStabilita <= 3 && dStabilita > 0) score += dStabilita * 20;
    // Nucleare vicino al breakout → accelera
    if (nucleare >= 10) score += dNucleare * 15;
    // Sanzioni alte → priorità urgente abbassarle
    if (sanzioni >= 8) score += dSanzioni * 20;
  }

  // --- LOGICA PER COALIZIONE ---
  if (faction === 'Coalizione') {
    // Coalizione vuole alzare le sanzioni → vittoria a 10
    score += dSanzioni * 20;
    // Coalizione vuole abbassare il nucleare
    if (dNucleare < 0) score += Math.abs(dNucleare) * 20;
    // Coalizione vuole alzare l'opinione globale
    if (dOpinione > 0) score += dOpinione * 10;
    // Risorse critiche
    if (mieRisorse <= 2 && dRisorse > 0) score += dRisorse * 20;
    // Nucleare critico → priorità massima abbassarlo
    if (nucleare >= 10 && dNucleare < 0) score += 50;
    if (nucleare >= 13 && dNucleare < 0) score += 100;
    // Sanzioni vicino alla vittoria → spingi
    if (sanzioni >= 7) score += dSanzioni * 25;
    // Defcon basso → evita escalation
    if (defcon <= 4 && dDefcon > 0) score += dDefcon * 30;
  }

  // --- LOGICA PER RUSSIA ---
  if (faction === 'Russia') {
    // Russia supporta Iran: abbassa sanzioni, aumenta risorse Iran
    score += dSanzioni * 15; // dSanzioni < 0 favorisce Iran
    if (dNucleare > 0) score += dNucleare * 8; // supporto nucleare leggero
    // Russia vuole mantenere il defcon basso (pressione)
    if (dDefcon < 0) score += Math.abs(dDefcon) * 8;
    // Risorse proprie
    if (mieRisorse <= 2 && dRisorse > 0) score += dRisorse * 20;
    if (dRisorse > 0) score += dRisorse * 10;
    // Se sanzioni Iran alte → priorità bloccarle
    if (sanzioni >= 7) score += (dSanzioni < 0 ? Math.abs(dSanzioni) * 20 : 0);
  }

  // --- LOGICA PER CINA ---
  if (faction === 'Cina') {
    // Cina come Russia: abbassa sanzioni, supporto economico
    score += dSanzioni * 15;
    if (dNucleare > 0) score += dNucleare * 5;
    if (dRisorse > 0) score += dRisorse * 12;
    if (mieRisorse <= 2 && dRisorse > 0) score += dRisorse * 22;
    // Cina preferisce diplomazia
    if (card.card_type === 'Diplomatico') score += 10;
    if (card.card_type === 'Economico') score += 8;
    // Defcon basso → Cina spinge mediazione
    if (defcon <= 4 && dDefcon > 0) score += 30;
  }

  // --- LOGICA PER EUROPA ---
  if (faction === 'Europa') {
    // Europa è mediatore: vuole defcon alto (pace), opinione bilanciata
    if (dDefcon > 0) score += dDefcon * 20;
    score += dOpinione * 8;
    // Europa vuole stabilità
    if (dStabilita > 0) score += dStabilita * 10;
    // Europa priorizza diplomazia e economia
    if (card.card_type === 'Diplomatico') score += 15;
    if (card.card_type === 'Economico') score += 10;
    // DEFCON critico → Europa gioca sempre diplomatico
    if (defcon <= 4) {
      if (card.card_type === 'Diplomatico') score += 50;
      if (dDefcon > 0) score += 40;
    }
    // Cerca di abbassare sanzioni per apertura
    if (dSanzioni < 0) score += Math.abs(dSanzioni) * 8;
  }

  // Penalizza se la carta peggiora la propria posizione critica
  if (mieRisorse <= 1 && dRisorse < 0) score -= 50;
  if (miaStabilita <= 1 && dStabilita < 0) score -= 40;

  // DEFCON 1 = tutti perdono → evita assolutamente
  if (defcon === 1 && dDefcon < 0) score -= 200;
  if (defcon === 2 && dDefcon < 0) score -= 150;
  if (defcon === 3 && dDefcon < 0) score -= 80;

  return score;
}

// -----------------------------------------------
// Razionale testuale per la scelta del bot
// -----------------------------------------------
function buildReason(card: GameCard, state: GameState, faction: Faction): string {
  const reasons: string[] = [];

  const dNucleare = card.effects.nucleare?.(state.nucleare) ?? 0;
  const dSanzioni = card.effects.sanzioni?.(state.sanzioni) ?? 0;
  const dDefcon   = card.effects.defcon?.(state.defcon) ?? 0;
  const dOpinione = card.effects.opinione?.(state.opinione) ?? 0;
  const dRisorse  = card.effects.risorse?.(5) ?? 0;

  if (dNucleare > 0) reasons.push(`+${dNucleare} nucleare (ora ${state.nucleare})`);
  if (dNucleare < 0) reasons.push(`${dNucleare} nucleare (ora ${state.nucleare})`);
  if (dSanzioni > 0) reasons.push(`+${dSanzioni} sanzioni`);
  if (dSanzioni < 0) reasons.push(`${dSanzioni} sanzioni (alleggerimento)`);
  if (dDefcon > 0) reasons.push(`+${dDefcon} DEFCON (de-escalation)`);
  if (dDefcon < 0) reasons.push(`${dDefcon} DEFCON (pressione)`);
  if (dOpinione !== 0) reasons.push(`${dOpinione > 0 ? '+' : ''}${dOpinione} opinione globale`);
  if (dRisorse > 0) reasons.push(`+${dRisorse} risorse`);

  const context: string[] = [];
  if (state.nucleare >= 12) context.push('nucleare critico');
  if (state.sanzioni >= 8) context.push('sanzioni elevate');
  if (state.defcon <= 4) context.push('DEFCON emergenza');

  const contextStr = context.length > 0 ? ` [${context.join(', ')}]` : '';
  return reasons.length > 0
    ? `Bot ${faction}${contextStr}: ${reasons.join(', ')}`
    : `Bot ${faction}: scelta strategica ottimale`;
}

// -----------------------------------------------
// Funzione principale del bot
// Seleziona la carta migliore dalla mano disponibile
// -----------------------------------------------
export function botSelectCard(
  availableCards: GameCard[],
  state: GameState,
  faction: Faction,
  difficulty: BotDifficulty = 'normal'
): BotDecision | null {
  if (!availableCards || availableCards.length === 0) return null;

  // Calcola punteggio per ogni carta
  const scored = availableCards.map(card => ({
    card,
    score: scoreCard(card, state, faction),
    reason: buildReason(card, state, faction),
  }));

  // Ordina per punteggio decrescente
  scored.sort((a, b) => b.score - a.score);

  // Difficoltà: introduce casualità
  let chosen: typeof scored[0];
  if (difficulty === 'easy') {
    // Easy: sceglie casualmente tra le prime 5
    const pool = scored.slice(0, Math.min(5, scored.length));
    chosen = pool[Math.floor(Math.random() * pool.length)];
  } else if (difficulty === 'normal') {
    // Normal: 70% miglior carta, 30% seconda scelta
    const r = Math.random();
    if (r < 0.70 || scored.length === 1) chosen = scored[0];
    else chosen = scored[1] ?? scored[0];
  } else {
    // Hard: sempre la carta migliore
    chosen = scored[0];
  }

  return chosen;
}

// -----------------------------------------------
// Applica gli effetti di una carta allo stato corrente
// Restituisce i delta e il nuovo stato
// -----------------------------------------------
export function applyCardEffects(
  card: GameCard,
  state: GameState,
  faction: Faction
): {
  newState: Partial<GameState>;
  deltas: {
    nucleare: number; sanzioni: number; opinione: number;
    defcon: number; risorse: number; stabilita: number;
    risorse_iran: number; risorse_coalizione: number; risorse_russia: number;
    risorse_cina: number; risorse_europa: number;
    stabilita_iran: number; stabilita_coalizione: number; stabilita_russia: number;
    stabilita_cina: number; stabilita_europa: number;
  };
} {
  const risorseKey   = `risorse_${faction.toLowerCase()}`   as keyof GameState;
  const stabilitaKey = `stabilita_${faction.toLowerCase()}` as keyof GameState;

  const curNucleare  = state.nucleare;
  const curSanzioni  = state.sanzioni;
  const curOpinione  = state.opinione;
  const curDefcon    = state.defcon;
  const curRisorse   = state[risorseKey]   as number;
  const curStabilita = state[stabilitaKey] as number;

  const dNucleare  = card.effects.nucleare?.(curNucleare)  ?? 0;
  const dSanzioni  = card.effects.sanzioni?.(curSanzioni)  ?? 0;
  const dOpinione  = card.effects.opinione?.(curOpinione)  ?? 0;
  const dDefcon    = card.effects.defcon?.(curDefcon)      ?? 0;
  const dRisorse   = card.effects.risorse?.(curRisorse)    ?? 0;
  const dStabilita = card.effects.stabilita?.(curStabilita) ?? 0;

  // Effetti su fazioni specifiche
  const dRisorseIran         = card.effects.risorse_iran?.(state.risorse_iran)                 ?? 0;
  const dRisorseCoalizione   = card.effects.risorse_coalizione?.(state.risorse_coalizione)     ?? 0;
  const dRisorseRussia       = card.effects.risorse_russia?.(state.risorse_russia)             ?? 0;
  const dRisorseCina         = card.effects.risorse_cina?.(state.risorse_cina)                 ?? 0;
  const dRisorseEuropa       = card.effects.risorse_europa?.(state.risorse_europa)             ?? 0;
  const dStabilitaIran       = card.effects.stabilita_iran?.(state.stabilita_iran)             ?? 0;
  const dStabilitaCoalizione = card.effects.stabilita_coalizione?.(state.stabilita_coalizione) ?? 0;
  const dStabilitaRussia     = card.effects.stabilita_russia?.(state.stabilita_russia)         ?? 0;
  const dStabilitaCina       = card.effects.stabilita_cina?.(state.stabilita_cina)             ?? 0;
  const dStabilitaEuropa     = card.effects.stabilita_europa?.(state.stabilita_europa)         ?? 0;

  // Accumulatori per fazione (effetto proprio + effetto esplicito sulla fazione)
  const fazioni: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
  const risorseDeltas: Record<string, number> = {
    iran: dRisorseIran, coalizione: dRisorseCoalizione,
    russia: dRisorseRussia, cina: dRisorseCina, europa: dRisorseEuropa,
  };
  const stabilitaDeltas: Record<string, number> = {
    iran: dStabilitaIran, coalizione: dStabilitaCoalizione,
    russia: dStabilitaRussia, cina: dStabilitaCina, europa: dStabilitaEuropa,
  };
  // Aggiungi l'effetto generico "risorse/stabilita" alla fazione che gioca
  const factionKey = faction.toLowerCase();
  risorseDeltas[factionKey]   = (risorseDeltas[factionKey]   ?? 0) + dRisorse;
  stabilitaDeltas[factionKey] = (stabilitaDeltas[factionKey] ?? 0) + dStabilita;

  const newStateFazioni: Partial<GameState> = {};
  for (const f of fazioni) {
    const fk = f.toLowerCase();
    const rKey = `risorse_${fk}`   as keyof GameState;
    const sKey = `stabilita_${fk}` as keyof GameState;
    const curR = state[rKey] as number;
    const curS = state[sKey] as number;
    const dr = risorseDeltas[fk]   ?? 0;
    const ds = stabilitaDeltas[fk] ?? 0;
    if (dr !== 0) (newStateFazioni as Record<string, number>)[rKey] = Math.max(1, Math.min(10, curR + dr));
    if (ds !== 0) (newStateFazioni as Record<string, number>)[sKey] = Math.max(1, Math.min(10, curS + ds));
  }

  const newState: Partial<GameState> = {
    nucleare: Math.max(1, Math.min(15, curNucleare + dNucleare)),
    sanzioni: Math.max(1, Math.min(20, curSanzioni + dSanzioni)),
    opinione: Math.max(-10, Math.min(10, curOpinione + dOpinione)),
    defcon:   Math.max(1, Math.min(10, curDefcon + dDefcon)),
    ...newStateFazioni,
  };

  return {
    newState,
    deltas: {
      nucleare: dNucleare, sanzioni: dSanzioni,
      opinione: dOpinione, defcon: dDefcon,
      risorse: dRisorse, stabilita: dStabilita,
      risorse_iran:         risorseDeltas['iran'],
      risorse_coalizione:   risorseDeltas['coalizione'],
      risorse_russia:       risorseDeltas['russia'],
      risorse_cina:         risorseDeltas['cina'],
      risorse_europa:       risorseDeltas['europa'],
      stabilita_iran:       stabilitaDeltas['iran'],
      stabilita_coalizione: stabilitaDeltas['coalizione'],
      stabilita_russia:     stabilitaDeltas['russia'],
      stabilita_cina:       stabilitaDeltas['cina'],
      stabilita_europa:     stabilitaDeltas['europa'],
    },
  };
}

// -----------------------------------------------
// Controlla condizioni di fine partita
// -----------------------------------------------
// ─── Formula punteggi per fazione ────────────────────────────────────────────
export function calcScores(state: GameState): Record<string, number> {
  return {
    Iran:       Math.round((state.nucleare ?? 0) * 2 + (state.risorse_iran ?? 0) - (state.sanzioni ?? 0)),
    Coalizione: Math.round((state.sanzioni ?? 0) * 2 + (state.risorse_coalizione ?? 0) - (state.nucleare ?? 0)),
    Russia:     Math.round((state.risorse_russia ?? 0) + (state.influenza_militare_russia ?? 0) + (state.stabilita_russia ?? 0)),
    Cina:       Math.round((state.risorse_cina ?? 0) + (state.influenza_commerciale_cina ?? 0) + (state.stabilita_rotte_cina ?? 0)),
    Europa:     Math.round((state.defcon ?? 0) * 3 + (state.coesione_ue_europa ?? 0) + (state.aiuti_umanitari_europa ?? 0)),
  };
}

export function checkWinCondition(state: GameState, turn: number, maxTurns: number) {
  // Iran vince: nucleare raggiunge 15 (breakout)
  if (state.nucleare >= 15) {
    return { isOver: true, winner: 'Iran' as Faction, condition: 'breakout',
      message: '☢️ Iran ha raggiunto la capacità nucleare! Breakout completato.' };
  }
  // Coalizione vince: sanzioni al massimo (20) → Iran collassa
  if (state.sanzioni >= 20) {
    return { isOver: true, winner: 'Coalizione' as Faction, condition: 'collasso',
      message: '🏴 Le sanzioni hanno paralizzato il regime iraniano!' };
  }
  // Tutti perdono: DEFCON scende a 1
  if (state.defcon <= 1) { // DEFCON 1 = guerra nucleare
    return { isOver: true, winner: undefined, condition: 'defcon',
      message: '💥 DEFCON 1 — Guerra Termonucleare. Tutti hanno perso.' };
  }
  // Fine turni: vince chi ha posizione migliore
  if (turn >= maxTurns) {
    const scores = calcScores(state);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topName, topScore] = sorted[0];
    const [secondName, secondScore] = sorted[1];
    const winner = topScore > secondScore ? topName : null;
    const winnerLabel = winner ?? 'Pareggio';
    const scoreLines = sorted.map(([f, s]) => `  ${f}: ${s} pt`).join('\n');
    return { isOver: true, winner: (winner ?? undefined) as Faction | undefined, condition: 'turni',
      message: `⏱️ Turni esauriti. ${winnerLabel} vince ai punti.\n${scoreLines}` };
  }
  return { isOver: false };
}

// Ordine turni fazioni
export const TURN_ORDER: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

export function nextFaction(current: Faction): Faction {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % TURN_ORDER.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// MECCANICA 1: Bonus Cumulativi Territoriali a Fine Turno
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soglia di influenza minima per attivare il bonus in un territorio.
 * La fazione deve avere influenza ≥ questa soglia nel territorio per ricevere il bonus.
 */
export const TERRITORY_CONTROL_THRESHOLD = 3;

/**
 * Limiti esatti dai CHECK constraints del DB Supabase (game_state).
 * ATTENZIONE: il DB reale è stato aggiornato con migration manuali:
 *   - defcon:   1-10  (commit 75f2dc4: scala DEFCON estesa 5→10)
 *   - sanzioni: 1-20  (commit c9c7288: sanzioni 1-20)
 *   - risorse_coalizione: 1-15 (add_faction_tracks.sql)
 *   - risorse_cina:       1-12 (add_faction_tracks.sql)
 * Tutti gli altri campi: 1-10 salvo eccezioni indicate.
 */
const STATE_LIMITS: Record<string, [number, number]> = {
  // ── globali ──────────────────────────────────────────────────────
  nucleare:                         [1, 15],
  sanzioni:                         [1, 20],   // DB aggiornato: BETWEEN 1 AND 20
  opinione:                         [-10, 10],
  defcon:                           [1, 10],   // DB aggiornato: BETWEEN 1 AND 10
  // ── risorse per fazione ─────────────────────────────────────────
  risorse_iran:                     [1, 10],
  risorse_coalizione:               [1, 15],   // add_faction_tracks.sql
  risorse_russia:                   [1, 10],
  risorse_cina:                     [1, 12],   // add_faction_tracks.sql
  risorse_europa:                   [1, 10],
  // ── stabilità per fazione ───────────────────────────────────────
  stabilita_iran:                   [1, 10],
  stabilita_coalizione:             [1, 10],
  stabilita_russia:                 [1, 10],
  stabilita_cina:                   [1, 10],
  stabilita_europa:                 [1, 10],
  // ── forze militari (add_military_tracks + add_missing_columns) ──
  forze_militari_iran:              [1, 10],
  forze_militari_coalizione:        [1, 10],
  forze_militari_russia:            [1, 10],
  forze_militari_cina:              [1, 10],
  forze_militari_europa:            [1, 10],
  // ── tracciati fazione estesi (add_faction_tracks.sql) ───────────
  influenza_diplomatica_coalizione: [1, 10],
  tecnologia_avanzata_coalizione:   [1, 10],
  supporto_pubblico_coalizione:     [1, 10],
  influenza_militare_russia:        [1, 10],
  stabilita_economica_russia:       [1, 10],
  veto_onu_russia:                  [0,  3],   // BETWEEN 0 AND 3
  influenza_commerciale_cina:       [1, 10],
  cyber_warfare_cina:               [1, 10],
  stabilita_rotte_cina:             [1, 10],
  influenza_diplomatica_europa:     [1, 10],
  aiuti_umanitari_europa:           [1, 10],
  coesione_ue_europa:               [1, 10],
};

function clamp(key: string, value: number): number {
  const limits = STATE_LIMITS[key];
  if (!limits) return value;
  return Math.max(limits[0], Math.min(limits[1], value));
}

/**
 * Risultato dell'applicazione dei bonus territoriali.
 */
export interface TerritoryBonusResult {
  /** Nuovi valori di GameState dopo aver applicato i bonus */
  newState: Partial<GameState>;
  /** Log descrittivo dei bonus applicati (per UI e moves_log) */
  bonusLog: Array<{
    faction: Faction;
    territory: string;
    territoryLabel: string;
    bonusLabel: string;
    deltas: TerritoryBonusDelta;
  }>;
}

/**
 * applyTerritoryBonuses
 *
 * Calcola e applica i bonus passivi di fine turno per tutti i territori.
 * Per ogni territorio nella TERRITORY_BONUS_MAP, controlla tutte le fazioni:
 * se la fazione ha influenza ≥ TERRITORY_CONTROL_THRESHOLD in quel territorio,
 * applica il bonus corrispondente allo stato di gioco.
 *
 * @param state       - Stato corrente del gioco (GameState)
 * @param territories - Array di TerritoryRecord (influenze per territorio)
 * @returns TerritoryBonusResult con nuovo stato e log dei bonus
 */
export function applyTerritoryBonuses(
  state: GameState,
  territories: TerritoryRecord[],
): TerritoryBonusResult {
  const factions: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
  const infKeys: Record<Faction, keyof TerritoryRecord> = {
    Iran:       'inf_iran',
    Coalizione: 'inf_coalizione',
    Russia:     'inf_russia',
    Cina:       'inf_cina',
    Europa:     'inf_europa',
  };

  // Accumula tutti i delta da applicare allo stato
  const accumulatedDeltas: Record<string, number> = {};
  const bonusLog: TerritoryBonusResult['bonusLog'] = [];

  for (const [territoryId, bonusEntry] of Object.entries(TERRITORY_BONUS_MAP)) {
    if (!bonusEntry) continue;

    // Trova il record influenza per questo territorio
    const terrRecord = territories.find(t => t.territory === territoryId);
    if (!terrRecord) continue;

    for (const faction of factions) {
      const infKey = infKeys[faction];
      const influence = (terrRecord[infKey] as number) ?? 0;

      // Controlla soglia di controllo
      if (influence < TERRITORY_CONTROL_THRESHOLD) continue;

      const bonusDelta = bonusEntry.bonusByFaction[faction];
      if (!bonusDelta) continue;

      // Accumula i delta
      let hasDelta = false;
      for (const [key, delta] of Object.entries(bonusDelta)) {
        if (delta === 0 || delta === undefined) continue;
        accumulatedDeltas[key] = (accumulatedDeltas[key] ?? 0) + delta;
        hasDelta = true;
      }

      if (hasDelta) {
        bonusLog.push({
          faction,
          territory: territoryId,
          territoryLabel: bonusEntry.label,
          bonusLabel: `${faction} +bonus in ${territoryId} (inf:${influence})`,
          deltas: bonusDelta,
        });
      }
    }
  }

  // Costruisce newState applicando i delta con clamping
  const newState: Partial<GameState> = {};
  for (const [key, delta] of Object.entries(accumulatedDeltas)) {
    if (delta === 0) continue;
    const currentVal = (state as unknown as Record<string, number>)[key] ?? 0;
    (newState as Record<string, number>)[key] = clamp(key, currentVal + delta);
  }

  return { newState, bonusLog };
}

// ─────────────────────────────────────────────────────────────────────────────
// MECCANICA 2: Verifica Obiettivi Dinamici Territoriali a Fine Turno
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Condizione estesa per obiettivi di tipo 'territorio'.
 * Supporta la struttura condizione_note come JSON inline oppure come stringa descrittiva.
 *
 * La condizione_note degli obiettivi con condizione_tipo='territorio' può contenere
 * un JSON nel formato:
 *   { "territories": ["Iraq","Yemen","..."], "minCount": 2, "minInfluence": 4 }
 * oppure restare come stringa descrittiva (verifica manuale).
 */
export interface TerritoryObjectiveCondition {
  /** Lista di territori da controllare */
  territories?: string[];
  /** Numero minimo di territori della lista con influenza ≥ minInfluence */
  minCount?: number;
  /** Soglia influenza richiesta (default: 3) */
  minInfluence?: number;
  /** Se true, richiede di controllare TUTTI i territories della lista */
  all?: boolean;
}

/**
 * Risultato della verifica obiettivi territoriali.
 */
export interface TerritoryObjectiveCheckResult {
  /** Obiettivi appena completati in questo turno */
  newlyCompleted: Array<{
    obj_id: string;
    faction: Faction;
    nome: string;
    punti: number;
    message: string;
  }>;
}

/**
 * checkTerritoryObjectives
 *
 * Verifica automaticamente tutti gli obiettivi con condizione_tipo='territorio'
 * per tutte le fazioni attive. Restituisce i nuovi obiettivi completati
 * (che non erano già completati prima).
 *
 * @param territories         - Array di TerritoryRecord correnti
 * @param alreadyCompletedIds - Set degli obj_id già completati (da non ricontare)
 * @param activeFactions      - Fazioni attive nella partita
 * @returns TerritoryObjectiveCheckResult con nuovi obiettivi completati
 */
export function checkTerritoryObjectives(
  territories: TerritoryRecord[],
  alreadyCompletedIds: Set<string>,
  activeFactions: Faction[],
): TerritoryObjectiveCheckResult {
  const factions: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
  const infKeys: Record<Faction, keyof TerritoryRecord> = {
    Iran:       'inf_iran',
    Coalizione: 'inf_coalizione',
    Russia:     'inf_russia',
    Cina:       'inf_cina',
    Europa:     'inf_europa',
  };

  const newlyCompleted: TerritoryObjectiveCheckResult['newlyCompleted'] = [];

  // Filtra solo gli obiettivi di tipo 'territorio' attivi
  const territoryObjectives = TUTTI_GLI_OBIETTIVI.filter(
    (o: ObiettivoSegreto) =>
      o.condizione_tipo === 'territorio' &&
      o.attivo &&
      !alreadyCompletedIds.has(o.obj_id),
  );

  for (const obj of territoryObjectives) {
    // Controlla se la fazione è attiva
    const faction = obj.faction as Faction;
    if (!activeFactions.includes(faction) && !factions.includes(faction)) continue;

    const infKey = infKeys[faction];
    if (!infKey) continue;

    // Tenta di parsare condizione_note come JSON strutturato
    let condition: TerritoryObjectiveCondition | null = null;
    if (obj.condizione_note) {
      try {
        // Cerca un JSON-like nella nota
        const jsonMatch = obj.condizione_note.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          condition = JSON.parse(jsonMatch[0]) as TerritoryObjectiveCondition;
        }
      } catch {
        condition = null; // parsing fallito → skip (verifica manuale)
      }
    }

    // Se non c'è condizione strutturata, prova con i campi standard
    if (!condition) {
      // Usa condizione_campo / condizione_op / condizione_valore se disponibili
      // ma solo per obiettivi che hanno una lista implicita nota nel nome
      // Altrimenti skip (verifica manuale)
      condition = buildConditionFromFields(obj);
      if (!condition) continue;
    }

    // Valuta la condizione
    const isCompleted = evaluateTerritoryCondition(condition, faction, infKey, territories);

    if (isCompleted) {
      newlyCompleted.push({
        obj_id: obj.obj_id,
        faction,
        nome: obj.nome,
        punti: obj.punti,
        message: `🎯 ${faction}: obiettivo "${obj.nome}" completato! +${obj.punti} punti`,
      });
    }
  }

  return { newlyCompleted };
}

/**
 * Costruisce una condizione strutturata dagli obiettivi con condizione_tipo='territorio'
 * che hanno campi standard (condizione_campo, condizione_op, condizione_valore).
 * Per obiettivi noti (per nome/id), inietta la lista territori appropriata.
 */
function buildConditionFromFields(obj: ObiettivoSegreto): TerritoryObjectiveCondition | null {
  // Mappa obiettivi noti con le loro condizioni territoriali
  const KNOWN_TERRITORY_CONDITIONS: Record<string, TerritoryObjectiveCondition> = {
    // Iran
    'OBJ_IRAN_05': { territories: ['Iraq', 'Yemen', 'Bahrain', 'Kuwait', 'EmiratiArabi'], minCount: 3, minInfluence: 4 },
    'OBJ_IRAN_06': { territories: ['Libano', 'Siria', 'Iraq', 'Yemen'], minCount: 3, minInfluence: 3 },
    'OBJ_IRAN_10': { territories: ['StrettoHormuz'], minCount: 1, minInfluence: 4 },
    'OBJ_IRAN_11': { territories: ['Natanz', 'Fordow', 'Teheran'], minCount: 2, minInfluence: 5 },
    'OBJ_IRAN_14': { territories: ['Iran', 'Iraq', 'Siria'], all: true, minInfluence: 3 },
    // Coalizione
    'OBJ_COAL_05': { territories: ['Israele', 'Giordania', 'Arabia Saudita', 'Emirati'], minCount: 3, minInfluence: 3 },
    'OBJ_COAL_09': { territories: ['StrettoHormuz'], minCount: 1, minInfluence: 3 },
    'OBJ_COAL_10': { territories: ['Bahrain', 'Kuwait', 'Qatar'], all: true, minInfluence: 3 },
    'OBJ_COAL_13': { territories: ['Turchia', 'Giordania'], minCount: 2, minInfluence: 3 },
    // Russia
    'OBJ_RUSS_05': { territories: ['Siria', 'Iraq'], all: true, minInfluence: 3 },
    'OBJ_RUSS_09': { territories: ['Turchia', 'Siria', 'Iran'], minCount: 2, minInfluence: 3 },
    'OBJ_RUSS_13': { territories: ['StrettoHormuz', 'Yemen'], minCount: 1, minInfluence: 3 },
    // Cina
    'OBJ_CINA_05': { territories: ['Iraq', 'Iran', 'ArabiaSaudita', 'EmiratiArabi'], minCount: 2, minInfluence: 3 },
    'OBJ_CINA_06': { territories: ['StrettoHormuz', 'Oman', 'ArabiaSaudita'], minCount: 2, minInfluence: 3 },
    'OBJ_CINA_13': { territories: ['Egitto', 'Iraq', 'Iran'], minCount: 2, minInfluence: 3 },
    // Europa
    'OBJ_EURO_05': { territories: ['Libano', 'Giordania', 'Egitto'], minCount: 2, minInfluence: 3 },
    'OBJ_EURO_09': { territories: ['Libano', 'Siria', 'Iraq'], minCount: 2, minInfluence: 3 },
    'OBJ_EURO_13': { territories: ['Turchia', 'Israele'], all: true, minInfluence: 3 },
  };

  return KNOWN_TERRITORY_CONDITIONS[obj.obj_id] ?? null;
}

/**
 * Valuta una condizione territoriale strutturata per una fazione.
 */
function evaluateTerritoryCondition(
  condition: TerritoryObjectiveCondition,
  faction: Faction,
  infKey: keyof TerritoryRecord,
  territories: TerritoryRecord[],
): boolean {
  const minInf = condition.minInfluence ?? TERRITORY_CONTROL_THRESHOLD;

  if (condition.all && condition.territories) {
    // Tutti i territori devono avere influenza ≥ minInf
    return condition.territories.every(tid => {
      const rec = territories.find(t => t.territory === tid);
      if (!rec) return false;
      return ((rec[infKey] as number) ?? 0) >= minInf;
    });
  }

  if (condition.territories && condition.minCount !== undefined) {
    // Almeno minCount territori devono avere influenza ≥ minInf
    const count = condition.territories.filter(tid => {
      const rec = territories.find(t => t.territory === tid);
      if (!rec) return false;
      return ((rec[infKey] as number) ?? 0) >= minInf;
    }).length;
    return count >= condition.minCount;
  }

  // Condizione semplice: almeno 1 territorio con influenza ≥ minInf
  if (condition.territories) {
    return condition.territories.some(tid => {
      const rec = territories.find(t => t.territory === tid);
      if (!rec) return false;
      return ((rec[infKey] as number) ?? 0) >= minInf;
    });
  }

  return false;
}

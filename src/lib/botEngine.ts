// =============================================
// LINEA ROSSA — Motore Bot
// Il bot sceglie la carta migliore dal proprio mazzo
// in base ai parametri correnti del gioco.
// Se sono presenti carte BOT nel DB (tabella bot_cards),
// le usa per selezionare la mossa con logica condizionale.
// =============================================

import type { GameCard } from '@/types/game';
import type { GameState } from '@/types/game';
import type { Faction, BotDifficulty } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

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
  };
} {
  const risorseKey = `risorse_${faction.toLowerCase()}` as keyof GameState;
  const stabilitaKey = `stabilita_${faction.toLowerCase()}` as keyof GameState;

  const curNucleare = state.nucleare;
  const curSanzioni = state.sanzioni;
  const curOpinione = state.opinione;
  const curDefcon   = state.defcon;
  const curRisorse  = state[risorseKey] as number;
  const curStabilita = state[stabilitaKey] as number;

  const dNucleare  = card.effects.nucleare?.(curNucleare)  ?? 0;
  const dSanzioni  = card.effects.sanzioni?.(curSanzioni)  ?? 0;
  const dOpinione  = card.effects.opinione?.(curOpinione)  ?? 0;
  const dDefcon    = card.effects.defcon?.(curDefcon)      ?? 0;
  const dRisorse   = card.effects.risorse?.(curRisorse)    ?? 0;
  const dStabilita = card.effects.stabilita?.(curStabilita) ?? 0;

  const newState: Partial<GameState> = {
    nucleare:  Math.max(1, Math.min(15, curNucleare + dNucleare)),
    sanzioni:  Math.max(1, Math.min(10, curSanzioni + dSanzioni)),
    opinione:  Math.max(-10, Math.min(10, curOpinione + dOpinione)),
    defcon:    Math.max(1, Math.min(5, curDefcon + dDefcon)),
    [risorseKey]:  Math.max(1, Math.min(10, curRisorse + dRisorse)),
    [stabilitaKey]: Math.max(1, Math.min(10, curStabilita + dStabilita)),
  };

  return {
    newState,
    deltas: {
      nucleare: dNucleare, sanzioni: dSanzioni,
      opinione: dOpinione, defcon: dDefcon,
      risorse: dRisorse, stabilita: dStabilita,
    },
  };
}

// -----------------------------------------------
// Controlla condizioni di fine partita
// -----------------------------------------------
export function checkWinCondition(state: GameState, turn: number, maxTurns: number) {
  // Iran vince: nucleare raggiunge 15 (breakout)
  if (state.nucleare >= 15) {
    return { isOver: true, winner: 'Iran' as Faction, condition: 'breakout',
      message: '☢️ Iran ha raggiunto la capacità nucleare! Breakout completato.' };
  }
  // Coalizione vince: sanzioni raggiungono 10 (collasso regime)
  if (state.sanzioni >= 10) {
    return { isOver: true, winner: 'Coalizione' as Faction, condition: 'collasso',
      message: '🏴 Il regime iraniano è collassato sotto le sanzioni!' };
  }
  // Tutti perdono: DEFCON scende a 1
  if (state.defcon <= 1) { // DEFCON 1 = guerra nucleare
    return { isOver: true, winner: undefined, condition: 'defcon',
      message: '💥 DEFCON 1 — Guerra Termonucleare. Tutti hanno perso.' };
  }
  // Fine turni: vince chi ha posizione migliore
  if (turn >= maxTurns) {
    const iranScore = state.nucleare * 2 - state.sanzioni;
    const coalScore = state.sanzioni * 2 - state.nucleare;
    const winner = iranScore > coalScore ? 'Iran' : 'Coalizione';
    return { isOver: true, winner: winner as Faction, condition: 'turni',
      message: `⏱️ Turni esauriti. ${winner} vince per posizione migliore.` };
  }
  return { isOver: false };
}

// Ordine turni fazioni
export const TURN_ORDER: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

export function nextFaction(current: Faction): Faction {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % TURN_ORDER.length];
}

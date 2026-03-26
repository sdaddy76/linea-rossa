// =============================================
// LINEA ROSSA — Conversione DB → GameCard
//
// Converte una riga di cards_library (DB / CardLibraryRow)
// in una GameCard con effetti SeqDelta → funzioni (v)=>number
// =============================================

import type { GameCard } from '@/types/game';
import { seqToEffect, normalizeSeq, type SeqDelta } from '@/lib/sequenceDelta';

// Struttura della riga DB (tutte le colonne delta come string | number)
export interface LibraryDbRow {
  card_id: string;
  card_name: string;
  faction: string;
  card_type: string;
  deck_type: string;
  op_points: number;
  description?: string;
  // Tracciati globali (possono essere "1;2;3..." o numero)
  delta_nucleare?: SeqDelta;
  delta_sanzioni?: SeqDelta;
  delta_opinione?: SeqDelta;
  delta_defcon?: SeqDelta;
  delta_risorse?: SeqDelta;
  delta_stabilita?: SeqDelta;
  // Plance (per ora non usati direttamente negli effects ma conservati)
  iran_risorse_eco?: SeqDelta;
  iran_forze_mil?: SeqDelta;
  iran_stab_int?: SeqDelta;
  iran_tech_nucleare?: SeqDelta;
  iran_asse_resist?: SeqDelta;
  coal_risorse_mil?: SeqDelta;
  coal_infl_dipl?: SeqDelta;
  coal_tech_avanz?: SeqDelta;
  coal_supp_pubblico?: SeqDelta;
  coal_alleanze?: SeqDelta;
  ue_infl_dipl?: SeqDelta;
  ue_aiuti_uman?: SeqDelta;
  ue_stab_energ?: SeqDelta;
  ue_coesione_int?: SeqDelta;
  ue_pol_multilat?: SeqDelta;
  cina_pot_eco?: SeqDelta;
  cina_infl_comm?: SeqDelta;
  cina_cyber?: SeqDelta;
  cina_stab_rotte?: SeqDelta;
  cina_progetti_bri?: SeqDelta;
  russia_infl_mil?: SeqDelta;
  russia_energia?: SeqDelta;
  russia_veto_onu?: SeqDelta;
  russia_stab_eco?: SeqDelta;
  russia_op_spec?: SeqDelta;
  linked_card_id?: string | null;
  linked_effect?: string | null;
}

/**
 * Converte una riga della libreria DB in una GameCard con effetti.
 *
 * Le colonne delta vengono trasformate in funzioni `(v: number) => number`
 * via seqToEffect(), che gestisce sia numeri fissi che sequenze semicolon.
 *
 * Esempio:
 *   delta_nucleare = "1;1;1;1;1;2;2;2;2;2;3;3;3;3;3"
 *   → effects.nucleare = (v) => resolveSeq("1;1;...", v, minNucleare=1)
 *   → a nucleare=3 → +1,  a nucleare=8 → +2,  a nucleare=13 → +3
 */
export function libraryRowToGameCard(row: LibraryDbRow): GameCard {
  const seq = (raw: SeqDelta | undefined, key: string) =>
    seqToEffect(normalizeSeq(raw ?? 0), key);

  // Costruisce gli effects: include solo le funzioni che producono effetti non-zero
  const nucleareEff = seq(row.delta_nucleare,  'nucleare');
  const sanzioniEff = seq(row.delta_sanzioni,  'sanzioni');
  const opinioneEff = seq(row.delta_opinione,  'opinione');
  const defconEff   = seq(row.delta_defcon,    'defcon');
  const risorseEff  = seq(row.delta_risorse,   'risorse');
  const stabilitaEff = seq(row.delta_stabilita,'stabilita');

  return {
    card_id:     row.card_id,
    card_name:   row.card_name,
    faction:     row.faction as GameCard['faction'],
    card_type:   row.card_type as GameCard['card_type'],
    op_points:   row.op_points,
    deck_type:   (row.deck_type ?? 'base') as GameCard['deck_type'],
    description: row.description ?? '',
    effects: {
      nucleare:  nucleareEff,
      sanzioni:  sanzioniEff,
      opinione:  opinioneEff,
      defcon:    defconEff,
      risorse:   risorseEff,
      stabilita: stabilitaEff,
    },
  };
}

/**
 * Serializza un CardLibraryRow per il salvataggio su Supabase.
 * Converte SeqDelta in stringa (i numeri semplici diventano stringa numerica).
 * Supabase accetta TEXT per le colonne delta.
 */
export function serializeRowForDb(row: Record<string, unknown>): Record<string, unknown> {
  const DELTA_FIELDS = [
    'delta_nucleare','delta_sanzioni','delta_opinione','delta_defcon',
    'delta_risorse','delta_stabilita',
    'iran_risorse_eco','iran_forze_mil','iran_stab_int','iran_tech_nucleare','iran_asse_resist',
    'coal_risorse_mil','coal_infl_dipl','coal_tech_avanz','coal_supp_pubblico','coal_alleanze',
    'ue_infl_dipl','ue_aiuti_uman','ue_stab_energ','ue_coesione_int','ue_pol_multilat',
    'cina_pot_eco','cina_infl_comm','cina_cyber','cina_stab_rotte','cina_progetti_bri',
    'russia_infl_mil','russia_energia','russia_veto_onu','russia_stab_eco','russia_op_spec',
  ];

  const out: Record<string, unknown> = { ...row };
  for (const field of DELTA_FIELDS) {
    if (out[field] !== undefined) {
      out[field] = String(out[field] ?? '0');
    }
  }
  return out;
}

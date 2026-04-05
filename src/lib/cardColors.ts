// =============================================
// LINEA ROSSA — cardColors.ts
// Utilità: determina se un modificatore tracciato
// è BUONO (verde) o CATTIVO (rosso) per la fazione
// proprietaria della carta.
// =============================================

/**
 * Restituisce true se il delta su un tracciato è BUONO per la fazione proprietaria della carta.
 * false = cattivo per la fazione (sfondo rosso).
 */
export function isGoodForFaction(
  track: string,
  delta: number,
  faction: string
): boolean {
  if (delta === 0) return true;
  // Risolvi chiave generica → specifica per fazione
  const GENERIC_TO_FACTION: Record<string, Record<string, string>> = {
    Iran:       { risorse: 'risorse_iran',       stabilita: 'stabilita_iran'       },
    Coalizione: { risorse: 'risorse_coalizione',  stabilita: 'stabilita_coalizione' },
    Russia:     { risorse: 'risorse_russia',      stabilita: 'stabilita_russia'     },
    Cina:       { risorse: 'risorse_cina',        stabilita: 'stabilita_cina'       },
    Europa:     { risorse: 'risorse_europa',      stabilita: 'stabilita_europa'     },
  };
  track = GENERIC_TO_FACTION[faction]?.[track] ?? track;

  // Tracciati globali con direzione preferita per fazione
  // true  = vuole che il tracciato salga  (delta>0 → buono)
  // false = vuole che il tracciato scenda (delta<0 → buono)
  const globalGood: Record<string, Record<string, boolean>> = {
    Iran:       { nucleare: true,  sanzioni: false, defcon: false, opinione: false },
    Coalizione: { nucleare: false, sanzioni: true,  defcon: true,  opinione: true  },
    Russia:     { nucleare: true,  sanzioni: false, defcon: false, opinione: false },
    Cina:       { nucleare: true,  sanzioni: false, defcon: false, opinione: false },
    Europa:     { nucleare: false, sanzioni: true,  defcon: true,  opinione: true  },
    Neutrale:   { nucleare: false, sanzioni: false, defcon: true,  opinione: false },
  };

  // Tracciati PROPRI della fazione (delta > 0 → buono per se stessi)
  const ownPositive: Record<string, string[]> = {
    Iran: [
      'risorse_iran', 'forze_militari_iran', 'stabilita_iran',
      'risorse', 'stabilita',
    ],
    Coalizione: [
      'risorse_coalizione', 'influenza_diplomatica_coalizione',
      'tecnologia_avanzata_coalizione', 'supporto_pubblico_coalizione', 'stabilita_coalizione',
      'risorse', 'stabilita',
    ],
    Russia: [
      'risorse_russia', 'influenza_militare_russia', 'veto_onu_russia',
      'stabilita_russia',
      'risorse', 'stabilita',
    ],
    Cina: [
      'risorse_cina', 'influenza_commerciale_cina', 'cyber_warfare_cina',
      'stabilita_rotte_cina', 'stabilita_cina',
      'risorse', 'stabilita',
    ],
    Europa: [
      'risorse_europa', 'influenza_diplomatica_europa', 'aiuti_umanitari_europa',
      'coesione_ue_europa', 'stabilita_europa',
      'risorse', 'stabilita',
    ],
  };

  // Tracciati AVVERSARI: danneggiarli (delta<0) è buono per la fazione proprietaria
  const adversaryTracks: Record<string, string[]> = {
    Iran: [
      'risorse_coalizione', 'influenza_diplomatica_coalizione', 'tecnologia_avanzata_coalizione',
      'supporto_pubblico_coalizione', 'stabilita_coalizione',
      'risorse_russia', 'influenza_militare_russia', 'veto_onu_russia',
      'stabilita_russia',
      'risorse_cina', 'influenza_commerciale_cina', 'cyber_warfare_cina',
      'stabilita_rotte_cina', 'stabilita_cina',
      'risorse_europa', 'influenza_diplomatica_europa', 'aiuti_umanitari_europa',
      'coesione_ue_europa', 'stabilita_europa',
    ],
    Coalizione: [
      'risorse_iran', 'forze_militari_iran', 'stabilita_iran',
    ],
    Russia: [
      'risorse_coalizione', 'tecnologia_avanzata_coalizione', 'supporto_pubblico_coalizione',
    ],
    Cina: [
      'risorse_coalizione', 'tecnologia_avanzata_coalizione', 'supporto_pubblico_coalizione',
    ],
    Europa: [
      'risorse_iran', 'forze_militari_iran', 'stabilita_iran',
    ],
  };

  // 1. Tracciati globali (nucleare, sanzioni, defcon, opinione)
  if (['nucleare', 'sanzioni', 'defcon', 'opinione'].includes(track)) {
    const dir = globalGood[faction]?.[track];
    if (dir === undefined) return delta > 0; // default: positivo = buono
    return dir ? delta > 0 : delta < 0;
  }

  // 2. Tracciato proprio della fazione (delta>0 → buono)
  const ownTracks = ownPositive[faction] ?? [];
  if (ownTracks.includes(track)) {
    return delta > 0;
  }

  // 3. Tracciato avversario (delta<0 → buono per la fazione)
  const advTracks = adversaryTracks[faction] ?? [];
  if (advTracks.includes(track)) {
    return delta < 0;
  }

  // Default: positivo = buono
  return delta > 0;
}

// ─── Raggruppamento tracciati in 3 righe ─────────────────────────────────────
// Riga 1: Globali (impatto su tutte le fazioni)
// Riga 2: Propria fazione (tracciati interni della carta)
// Riga 3: Altre fazioni (effetti su avversari/alleati)

export const GLOBAL_TRACKS = new Set([
  'nucleare', 'sanzioni', 'opinione', 'defcon',
]);

export const OWN_TRACKS: Record<string, Set<string>> = {
  Iran:       new Set(['risorse_iran', 'forze_militari_iran', 'stabilita_iran', 'risorse', 'stabilita']),
  Coalizione: new Set(['risorse_coalizione', 'influenza_diplomatica_coalizione', 'tecnologia_avanzata_coalizione', 'supporto_pubblico_coalizione', 'stabilita_coalizione', 'risorse', 'stabilita']),
  Russia:     new Set(['risorse_russia', 'influenza_militare_russia', 'veto_onu_russia', 'stabilita_russia', 'risorse', 'stabilita']),
  Cina:       new Set(['risorse_cina', 'influenza_commerciale_cina', 'cyber_warfare_cina', 'stabilita_rotte_cina', 'stabilita_cina', 'risorse', 'stabilita']),
  Europa:     new Set(['risorse_europa', 'influenza_diplomatica_europa', 'aiuti_umanitari_europa', 'coesione_ue_europa', 'stabilita_europa', 'risorse', 'stabilita']),
  Neutrale:   new Set(['risorse', 'stabilita']),
};

export type DeltaItem = {
  key: string; originalKey: string;
  icon: string; label: string; posGood: boolean; delta: number;
};

/** Divide un array di delta in 3 gruppi: globali / propria fazione / altre fazioni */
export function groupDeltas(
  deltas: DeltaItem[],
  faction: string,
): { global: DeltaItem[]; own: DeltaItem[]; others: DeltaItem[] } {
  const ownSet = OWN_TRACKS[faction] ?? OWN_TRACKS['Neutrale'];
  const global:  DeltaItem[] = [];
  const own:     DeltaItem[] = [];
  const others:  DeltaItem[] = [];

  for (const d of deltas) {
    if (GLOBAL_TRACKS.has(d.key)) global.push(d);
    else if (ownSet.has(d.key))   own.push(d);
    else                           others.push(d);
  }
  return { global, own, others };
}

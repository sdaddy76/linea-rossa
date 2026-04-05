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
      'risorse_iran', 'forze_militari_iran', 'tecnologia_nucleare_iran', 'stabilita_iran',
      'risorse', 'stabilita',
    ],
    Coalizione: [
      'risorse_coalizione', 'influenza_diplomatica_coalizione',
      'tecnologia_avanzata_coalizione', 'supporto_pubblico_coalizione', 'stabilita_coalizione',
      'risorse', 'stabilita',
    ],
    Russia: [
      'risorse_russia', 'influenza_militare_russia', 'veto_onu_russia',
      'stabilita_economica_russia', 'stabilita_russia',
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
      'stabilita_economica_russia', 'stabilita_russia',
      'risorse_cina', 'influenza_commerciale_cina', 'cyber_warfare_cina',
      'stabilita_rotte_cina', 'stabilita_cina',
      'risorse_europa', 'influenza_diplomatica_europa', 'aiuti_umanitari_europa',
      'coesione_ue_europa', 'stabilita_europa',
    ],
    Coalizione: [
      'risorse_iran', 'forze_militari_iran', 'tecnologia_nucleare_iran', 'stabilita_iran',
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

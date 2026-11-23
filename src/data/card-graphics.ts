// Asset grafici definitivi forniti per le carte di Linea Rossa.
//
// I percorsi restano sotto /public per poter essere serviti direttamente da
// Vite e dal deploy statico. Le funzioni restituiscono null quando il fronte
// originale non è presente tra i mazzi caricati: in quel caso la UI mostra un
// fronte digitale dichiarato come tale, senza presentarlo come scansione.

const IRAN_CARD_IDS = new Set(
  Array.from({ length: 27 }, (_, index) => `NI${String(index + 3).padStart(2, '0')}`),
);

const COALIZIONE_CARD_IDS = new Set([
  ...Array.from({ length: 24 }, (_, index) => `C${String(index + 1).padStart(3, '0')}`),
  ...Array.from({ length: 27 }, (_, index) => `NC${String(index + 1).padStart(2, '0')}`),
]);

const CINA_CARD_IDS = new Set([
  'C073C', 'C075C', 'C076C', 'C078C', 'C082C', 'C083C', 'C083C2', 'C084C',
  'C086C', 'C087C', 'C088C', 'C090C', 'C091C', 'C092C', 'C093C', 'C094C',
  'C095C', 'C096C',
  ...Array.from({ length: 40 }, (_, index) => `NN${String(index + 1).padStart(2, '0')}`),
]);

export const IRAN_CARD_BACK = '/card-art/real/iran/retro.jpg';
export const IRAN_OBJECTIVE_BACK = '/assets/tabletop-v3/objectives/retro_Obiettivi_Iran.jpg?v=2026-11-23';

const OBJECTIVE_FACTION_CODES: Record<string, string> = {
  IRAN: 'IR', COAL: 'CO', RUSS: 'RU', CINA: 'CN', EU: 'EU',
};
const OBJECTIVE_FACTIONS: Record<string, string> = {
  Iran: 'Iran', Iraniano: 'Iran', Coalizione: 'Coalizione',
  Russia: 'Russia', Cina: 'Cina', Europa: 'Europa',
};

export function getFactionCardFront(cardId: string, faction: string): string | null {
  if (faction === 'Iran' && IRAN_CARD_IDS.has(cardId)) {
    return `/card-art/real/iran/${cardId}_fronte.jpg`;
  }
  if (faction === 'Coalizione' && COALIZIONE_CARD_IDS.has(cardId)) {
    return `/card-art/real/coalizione/${cardId}_fronte.jpg`;
  }
  if (faction === 'Cina' && CINA_CARD_IDS.has(cardId)) {
    return `/card-art/real/cina/${cardId}_fronte.jpg`;
  }
  return null;
}

export function getFactionCardBack(faction: string): string | null {
  return faction === 'Iran' ? IRAN_CARD_BACK : null;
}

export function getObjectiveCardFront(objectiveId: string): string | null {
  // Accept existing saved aliases without changing or redealing saved objectives.
  const legacy = objectiveId.match(/^OBJ_(IRAN|COAL|RUSS|CINA|EU)_(\d{2})$/);
  const id = legacy ? `OBJ-${OBJECTIVE_FACTION_CODES[legacy[1]]}-${legacy[2]}` : objectiveId;
  if (!/^OBJ-(IR|CO|RU|CN|EU)-(0[1-9]|1[0-5])$/.test(id)) return null;
  return `/assets/tabletop-v3/objectives/${id}.jpg?v=2026-11-23`;
}

export function getObjectiveCardBack(faction: string): string | null {
  const name = OBJECTIVE_FACTIONS[faction];
  return name ? `/assets/tabletop-v3/objectives/retro_Obiettivi_${name}.jpg?v=2026-11-23` : null;
}

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

const IRAN_OBJECTIVE_IDS = new Set(
  Array.from({ length: 15 }, (_, index) => `OBJ_IRAN_${String(index + 1).padStart(2, '0')}`),
);

export const IRAN_CARD_BACK = '/card-art/real/iran/retro.jpg';
export const IRAN_OBJECTIVE_BACK = '/card-art/real/objectives-iran/retro.jpg';

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
  if (!IRAN_OBJECTIVE_IDS.has(objectiveId)) return null;
  return `/card-art/real/objectives-iran/${objectiveId}.jpg`;
}

export function getObjectiveCardBack(faction: string): string | null {
  return faction === 'Iran' || faction === 'Iraniano' ? IRAN_OBJECTIVE_BACK : null;
}

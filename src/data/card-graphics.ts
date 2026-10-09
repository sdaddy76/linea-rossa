// Asset grafici definitivi forniti per le carte di Linea Rossa.
//
// I percorsi restano sotto /public per poter essere serviti direttamente da
// Vite e dal deploy statico. Le funzioni restituiscono null quando per una
// carta non è ancora disponibile un fronte personalizzato: in quel caso la UI
// mantiene la grafica generica già esistente.

const IRAN_CARD_IDS = new Set(
  Array.from({ length: 27 }, (_, index) => `NI${String(index + 3).padStart(2, '0')}`),
);

const IRAN_OBJECTIVE_IDS = new Set(
  Array.from({ length: 15 }, (_, index) => `OBJ_IRAN_${String(index + 1).padStart(2, '0')}`),
);

export const IRAN_CARD_BACK = '/card-art/real/iran/retro.jpg';
export const IRAN_OBJECTIVE_BACK = '/card-art/real/objectives-iran/retro.jpg';

export function getFactionCardFront(cardId: string, faction: string): string | null {
  if (faction !== 'Iran' || !IRAN_CARD_IDS.has(cardId)) return null;
  return `/card-art/real/iran/${cardId}_fronte.jpg`;
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

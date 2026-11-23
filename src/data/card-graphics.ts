import catalog from '../game-v3/catalog-data.json';

// One exact-ID resolver for the complete supplied base deck: 347 originals,
// including specials and neutrals. Never alias similar Russia/China IDs.
const CARD_ORIGINS = new Map(catalog.factionCards.map(card => [card.id, card.origin]));
const BASE_FACTIONS = new Set(CARD_ORIGINS.values());
export const FACTION_CARD_BACK = '/assets/tabletop-v3/faction-cards/retro_Mazzo_Base.jpg?v=2026-11-23-base';
export const IRAN_OBJECTIVE_BACK = '/assets/tabletop-v3/objectives/retro_Obiettivi_Iran.jpg?v=2026-11-23';

const OBJECTIVE_FACTION_CODES: Record<string, string> = {
  IRAN: 'IR', COAL: 'CO', RUSS: 'RU', CINA: 'CN', EU: 'EU',
};
const OBJECTIVE_FACTIONS: Record<string, string> = {
  Iran: 'Iran', Iraniano: 'Iran', Coalizione: 'Coalizione',
  Russia: 'Russia', Cina: 'Cina', Europa: 'Europa',
};

export function getFactionCardFront(cardId: string, faction: string): string | null {
  if (!CARD_ORIGINS.has(cardId) || CARD_ORIGINS.get(cardId) !== faction) return null;
  return `/assets/tabletop-v3/faction-cards/${cardId}.jpg?v=2026-11-23-base`;
}

export function getFactionCardBack(faction: string): string | null {
  return BASE_FACTIONS.has(faction) ? FACTION_CARD_BACK : null;
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

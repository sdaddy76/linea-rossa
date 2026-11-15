import type {Faction, Track} from './catalog-types';

export const BOARD_ART = '/assets/tabletop-v3/board.jpg';
export const EVENT_BACK = '/assets/tabletop-v3/events/retro_Eventi.jpg';
export const factionBoardArt = (faction: Faction) => `/assets/tabletop-v3/boards/${faction}.jpg`;
export const unitFrontArt = (id: string) => `/assets/tabletop-v3/units/${id}.jpg`;
export const unitBackArt = (faction: Faction) => `/assets/tabletop-v3/units/retro_Unita_${faction}.jpg`;
export const eventFrontArt = (id: string) => `/assets/tabletop-v3/events/${id}.jpg`;
export const botFrontArt = (id: string) => `/assets/tabletop-v3/bots/${id}.jpg`;
export const botBackArt = (faction: Faction, track: Track) => `/assets/tabletop-v3/bots/retro_BOT_${faction}_${track}.jpg`;

export const RULEBOOK_URL = '/assets/tabletop-v3/regolamento.pdf';
export const UNIT_REFERENCE_URL = '/assets/tabletop-v3/scheda-unita.pdf';
export const PLAYER_BOARDS_URL = '/assets/tabletop-v3/plance-fazione.pdf';

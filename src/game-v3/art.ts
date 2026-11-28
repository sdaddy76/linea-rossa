import type {Faction, Track} from './catalog-types';

export const BOARD_ART = '/assets/tabletop-v3/board.jpg?v=2026-11-17';
export const EVENT_BACK = '/assets/tabletop-v3/events/retro_Eventi.jpg';
export const factionBoardArt = (faction: Faction) => `/assets/tabletop-v3/boards/${faction}.jpg?v=2026-11-28d`;
export const unitFrontArt = (id: string) => `/assets/tabletop-v3/units/${id}.jpg?v=2026-11-28`;
export const unitBackArt = (faction: Faction) => `/assets/tabletop-v3/units/retro_Unita_${faction}.jpg?v=2026-11-23`;
export const eventFrontArt = (id: string) => `/assets/tabletop-v3/events/${id}.jpg?v=2026-11-23`;
export const botFrontArt = (id: string) => `/assets/tabletop-v3/bots/${id}.jpg?v=2026-11-22`;
export const botBackArt = (faction: Faction, track: Track) => `/assets/tabletop-v3/bots/retro_BOT_${faction}_${track}.jpg`;

export const RULEBOOK_URL = '/assets/tabletop-v3/regolamento.pdf?v=2026-11-28c';
export const RULEBOOK_FILENAME = 'Linea_Rossa_Regolamento_v3_11.pdf';
export const PLAYER_AID_URL = '/assets/tabletop-v3/aiuto-giocatore.pdf';
export const PLAYER_AID_WHITE_URL = '/assets/tabletop-v3/aiuto-giocatore-bianco.pdf';
export const UNIT_REFERENCE_URL = '/assets/tabletop-v3/scheda-unita.pdf?v=2026-11-28c';
export const PLAYER_BOARDS_URL = '/assets/tabletop-v3/plance-fazione.pdf?v=2026-11-28d';

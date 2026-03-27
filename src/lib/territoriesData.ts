// =============================================
// LINEA ROSSA — Dati Territori (Sezione 8.2)
// =============================================

import type { Faction } from '@/types/game';

export type TerritoryId =
  | 'Iran' | 'Iraq' | 'Siria' | 'Libano' | 'Israele' | 'Giordania'
  | 'Egitto' | 'ArabiaSaudita' | 'Yemen' | 'Oman' | 'EmiratiArabi'
  | 'Kuwait' | 'Bahrain' | 'Qatar' | 'Turchia' | 'StrettoHormuz';

export type TerritoryType = 'casa' | 'strategico' | 'normale';

export interface TerritoryDef {
  id: TerritoryId;
  label: string;
  type: TerritoryType;
  pvPerRound: number;         // PV guadagnati se controllato
  homeFaction?: Faction;      // fazione "casa" (+2 FD se difende qui)
  isNaval?: boolean;          // ammette unità navali
  // Posizione approssimativa nella mappa SVG (% larghezza/altezza)
  x: number;
  y: number;
}

export const TERRITORIES: TerritoryDef[] = [
  { id: 'Iran',          label: 'Iran',              type: 'casa',       pvPerRound: 3, homeFaction: 'Iran',       x: 71, y: 32, isNaval: true },
  { id: 'Iraq',          label: 'Iraq',              type: 'normale',    pvPerRound: 1,                             x: 44, y: 31 },
  { id: 'Siria',         label: 'Siria',             type: 'normale',    pvPerRound: 1,                             x: 37, y: 22 },
  { id: 'Libano',        label: 'Libano',            type: 'normale',    pvPerRound: 1,                             x: 29, y: 29 },
  { id: 'Israele',       label: 'Israele',           type: 'normale',    pvPerRound: 1,                             x: 27, y: 37 },
  { id: 'Giordania',     label: 'Giordania',         type: 'normale',    pvPerRound: 1,                             x: 32, y: 39 },
  { id: 'Egitto',        label: 'Egitto',            type: 'normale',    pvPerRound: 1,                             x: 13, y: 55 },
  { id: 'ArabiaSaudita', label: 'Arabia Saudita',    type: 'casa',       pvPerRound: 3, homeFaction: 'Coalizione', x: 44, y: 61, isNaval: true },
  { id: 'Yemen',         label: 'Yemen',             type: 'normale',    pvPerRound: 1,                             x: 45, y: 77, isNaval: true },
  { id: 'Oman',          label: 'Oman',              type: 'normale',    pvPerRound: 1,                             x: 80, y: 72, isNaval: true },
  { id: 'EmiratiArabi',  label: 'Emirati Arabi',     type: 'normale',    pvPerRound: 1,                             x: 67, y: 57, isNaval: true },
  { id: 'Kuwait',        label: 'Kuwait',            type: 'normale',    pvPerRound: 1,                             x: 52, y: 51 },
  { id: 'Bahrain',       label: 'Bahrain',           type: 'normale',    pvPerRound: 1,                             x: 61, y: 54, isNaval: true },
  { id: 'Qatar',         label: 'Qatar',             type: 'normale',    pvPerRound: 1,                             x: 64, y: 57, isNaval: true },
  { id: 'Turchia',       label: 'Turchia',           type: 'normale',    pvPerRound: 1,                             x: 27, y: 8 },
  { id: 'StrettoHormuz', label: 'Stretto di Hormuz', type: 'strategico', pvPerRound: 2,                             x: 73, y: 59, isNaval: true },
];

export const TERRITORY_MAP: Record<TerritoryId, TerritoryDef> =
  Object.fromEntries(TERRITORIES.map(t => [t.id, t])) as Record<TerritoryId, TerritoryDef>;

// ── Unità militari per fazione ─────────────────────────────────────────────
export type UnitType =
  | 'Convenzionale' | 'IRGC' | 'Proxy' | 'Navale'
  | 'AereoStrategico' | 'SottoMar';

export interface UnitDef {
  type: UnitType;
  label: string;
  attackBonus: number;
  defenseBonus: number;
  navalOnly?: boolean;    // solo in territori navali
  factions: Faction[];
  icon: string;
  cost: number;           // PO per schierare 1 unità
}

export const UNITS: UnitDef[] = [
  {
    type: 'Convenzionale', label: 'Forze Convenzionali', icon: '⚔️',
    attackBonus: 0, defenseBonus: 0, cost: 1,
    factions: ['Iran','Coalizione','Russia','Cina','Europa'],
  },
  {
    type: 'IRGC', label: 'Guardie Rivoluzione (IRGC)', icon: '🦅',
    attackBonus: 2, defenseBonus: 1, cost: 2,
    factions: ['Iran'],
  },
  {
    type: 'Proxy', label: 'Milizie Proxy', icon: '🎭',
    attackBonus: 0, defenseBonus: 1, cost: 1,
    factions: ['Iran'],
  },
  {
    type: 'Navale', label: 'Unità Navali', icon: '🚢',
    attackBonus: 0, defenseBonus: 0, cost: 2,
    navalOnly: true,
    factions: ['Iran','Coalizione','Russia','Cina'],
  },
  {
    type: 'AereoStrategico', label: 'Superiorità Aerea', icon: '✈️',
    attackBonus: 2, defenseBonus: 0, cost: 2,
    factions: ['Coalizione'],
  },
  {
    type: 'SottoMar', label: 'Sottomarino AKULA', icon: '🤿',
    attackBonus: 1, defenseBonus: 2, cost: 3,
    navalOnly: true,
    factions: ['Russia'],
  },
];

export const UNIT_MAP: Record<UnitType, UnitDef> =
  Object.fromEntries(UNITS.map(u => [u.type, u])) as Record<UnitType, UnitDef>;

// Unità iniziali per fazione
export const INITIAL_UNITS: Record<Faction, Partial<Record<UnitType, number>>> = {
  Iran:       { Convenzionale: 4, IRGC: 2, Proxy: 3, Navale: 2 },
  Coalizione: { Convenzionale: 4, Navale: 3, AereoStrategico: 2 },
  Russia:     { Convenzionale: 3, Navale: 2, SottoMar: 1 },
  Cina:       { Convenzionale: 3, Navale: 2 },
  Europa:     { Convenzionale: 2 },
};

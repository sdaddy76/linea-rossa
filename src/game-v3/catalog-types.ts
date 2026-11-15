/** Data contracts for the tabletop rules, November 2026 edition. */
export const FACTIONS = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'] as const;
export type Faction = typeof FACTIONS[number];
export const TRACKS = ['Economia', 'Militare', 'Diplomazia', 'Consenso'] as const;
export type Track = typeof TRACKS[number];
export type GlobalTrack = 'Nucleare' | 'Sanzioni' | 'Crisi Bellica' | 'Opinione';
export interface TrackChange { faction: Faction; track: Track; delta: number }
export interface GlobalChange { track: GlobalTrack; delta: number }
export interface CardOption {
  boost: TrackChange;
  correlation: TrackChange;
  globals: GlobalChange[];
}
export interface FactionCard {
  id: string; name: string; origin: Faction | 'Neutrale'; cost: number;
  options: CardOption[];
  special: boolean; unlocksSpecial: boolean;
}
export interface EventCard {
  id: string; name: string; globals: GlobalChange[]; changes: TrackChange[];
  order: Faction[]; advancers: Faction[]; blocksRound: boolean;
}
export interface BotCard {
  id: string; name: string; faction: Faction; track: Track;
  condition: string; priority1: string; priority2: string;
}
export interface Objective {
  id: string; faction: Faction; number: number; name: string;
  condition: string; points: number;
}
export interface UnitDef {
  id: string; name: string; faction: Faction; cost: number;
  attack: number; defense: number; naval: boolean;
  maxPerTerritory?: number; effect: string;
}
export interface TerritoryDef {
  id: string; name: string; capacity: number;
  /** Per-faction deployment surcharge: friendly=0, neutral=1, hostile=2. */
  alignment: Record<Faction, 0 | 1 | 2>;
}

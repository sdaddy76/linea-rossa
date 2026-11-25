import type { Faction } from '@/types/game';

/** Normalize historical display names at input boundaries, not in saved data. */
export function normalizeFaction(value: unknown): Faction | null {
  switch (value) {
    case 'Iran': return 'Iran';
    case 'Coalizione':
    case 'Coalizione Occidentale': return 'Coalizione';
    case 'Russia': return 'Russia';
    case 'Cina': return 'Cina';
    case 'Europa':
    case 'Unione Europea': return 'Europa';
    default: return null;
  }
}

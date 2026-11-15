import { FACTIONS, TRACKS, type Faction, type Objective } from './catalog-types';
import { OBJECTIVES, UNITS, TERRITORIES } from './catalog';
import type { EngineState } from './engine';

const clean = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export function controlsTerritory(state: EngineState, faction: Faction, territory: string): boolean {
  const counts = FACTIONS.map(f => state.units.filter(u => u.faction === f && u.territory === territory).length);
  return counts[FACTIONS.indexOf(faction)] > 0 && counts.every((n, i) => i === FACTIONS.indexOf(faction) || n < counts[FACTIONS.indexOf(faction)]);
}
/** Evaluates the 75 printed objectives by faction and printed number, not fragile prose parsing. */
export function objectiveComplete(state: EngineState, objective: Objective | string): boolean {
  const o = typeof objective === 'string' ? OBJECTIVES.find(x => x.id === objective) : objective;
  if (!o) return false;
  const f = o.faction, t = state.players[f].tracks, g = state.globals;
  const units = state.units.filter(u => u.faction === f);
  const named = (name: string) => units.filter(u => clean(UNITS.find(d => d.id === u.type)?.name ?? '') === clean(name));
  const at = (name: string) => units.filter(u => clean(TERRITORIES.find(d => d.id === u.territory)?.name ?? u.territory).includes(clean(name)));
  const presence = (names: string[]) => names.filter(n => at(n).length > 0).length;
  const distinct = (name: string) => new Set(named(name).map(u => u.territory)).size;
  const control = (names: string[]) => names.filter(n => {
    const territory = TERRITORIES.find(d => clean(d.name) === clean(n));
    return territory && controlsTerritory(state, f, territory.id);
  }).length;
  const track = (who: Faction, key: keyof typeof t) => state.players[who].tracks[key];
  const n = g.Nucleare, s = g.Sanzioni, c = g['Crisi Bellica'], p = g.Opinione;
  const rules: Record<Faction, boolean[]> = {
    Iran: [
      n >= 10, n >= 12 && s <= 5, s <= 3,
      presence(['Iraq', 'Yemen', 'Bahrein', 'Kuwait', 'Emirati']) >= 3,
      control(['Libano', 'Siria', 'Iraq', 'Yemen']) >= 3,
      track('Coalizione', 'Consenso') <= 3,
      named('Flotta veloce del Golfo').some(u => at('Hormuz').includes(u)),
      c <= 3 && n >= 8, t.Consenso >= 7, named('Missili balistici').length >= 2,
      presence(['Iran', 'Iraq', 'Siria']) === 3, distinct('Proxy regionali') >= 3,
      distinct('IRGC Cyber Unit') >= 2, t.Militare >= 8 && at('Hormuz').length > 0,
      t.Economia >= 7 && t.Consenso >= 6,
    ],
    Coalizione: [
      n <= 5, s >= 8, c >= 6, t.Economia >= 8, t.Diplomazia >= 8, t.Consenso >= 7,
      track('Iran', 'Consenso') <= 3, p >= 4, n <= 4 && s >= 7, track('Russia', 'Diplomazia') <= 3,
      named('Scudo Missilistico').length >= 2,
      presence(['Kuwait', 'Bahrein', 'Qatar', 'Emirati', 'Oman', 'Arabia Saudita']) >= 3,
      n <= 4 && at('Iran').length > 0, t.Militare >= 8,
      named('Carrier Strike Group').some(u => at('Hormuz').includes(u)),
    ],
    Russia: [
      t.Militare >= 8, t.Diplomazia >= 7 && s <= 5, t.Economia >= 8 && track('Europa', 'Economia') <= 4,
      track('Coalizione', 'Consenso') <= 3, t.Economia >= 7 && t.Consenso >= 6, distinct('Cyber Russia') >= 2,
      t.Diplomazia >= 6 && track('Iran', 'Diplomazia') >= 6, c <= 4 && t.Militare >= 6,
      named('Flotta nel Mediterraneo').length >= 2, track('Coalizione', 'Diplomazia') <= 3,
      presence(['Siria', 'Libano', 'Turchia']) >= 2, control(['Siria']) > 0, p <= 0,
      track('Iran', 'Consenso') >= 6 && at('Siria').length > 0,
      t.Militare >= 7 && named('Flotta nel Mediterraneo').length > 0,
    ],
    Cina: [
      t.Economia >= 9, t.Consenso >= 7 && named('Flotta commerciale').length > 0, t.Diplomazia >= 8,
      t.Militare >= 7 && named('Cyber Unit').length > 0, t.Diplomazia >= 7 && TRACKS.every(k => t[k] >= 4),
      presence(['Arabia Saudita', 'Emirati', 'Oman', 'Qatar', 'Bahrein', 'Kuwait']) >= 2,
      named('Flotta commerciale').length >= 2, track('Europa', 'Consenso') <= 3, c >= 5,
      c >= 7 && p >= -2 && p <= 2, track('Iran', 'Economia') >= 7, t.Diplomazia >= 8 && t.Economia >= 8,
      FACTIONS.filter(who => track(who, 'Consenso') >= 5).length >= 3, distinct('Cyber Unit') >= 2,
      presence(['Oman', 'Emirati', 'Qatar', 'Bahrein']) >= 2,
    ],
    Europa: [
      t.Diplomazia >= 8, named('Aiuti umanitari').length >= 2 && t.Consenso >= 6, t.Consenso >= 8,
      s >= 4 && s <= 7, c >= 7, p >= 3 && t.Diplomazia >= 7, t.Economia >= 8,
      named('Caschi blu').length >= 3 && distinct('Caschi blu') >= 2, c >= 7 && s >= 3 && s <= 6 && p >= 0,
      track('Russia', 'Diplomazia') <= 3, track('Iran', 'Consenso') >= 7,
      presence(['Libano', 'Siria', 'Giordania']) >= 2, at('Turchia').length >= 2,
      p >= 2 && t.Consenso >= 7, t.Consenso >= 6 && track('Coalizione', 'Consenso') >= 6,
    ],
  };
  return rules[f][o.number - 1] ?? false;
}
export function objectiveStatus(state: EngineState, faction: Faction) {
  return state.players[faction].objectives.map(id => {
    const objective = OBJECTIVES.find(o => o.id === id)!;
    return { ...objective, complete: objectiveComplete(state, objective) };
  });
}

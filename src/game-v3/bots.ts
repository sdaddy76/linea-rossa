import { FACTIONS, type Faction, type Track, type GlobalTrack, type TrackChange } from './catalog-types';
import { CORRELATIONS, UNITS, TERRITORIES } from './catalog';
import type { EngineState } from './engine';

export type BotAction =
  | { kind: 'develop'; track: Track }
  | { kind: 'global'; track: GlobalTrack; delta: number | 'zero' }
  | { kind: 'track'; change: TrackChange }
  | { kind: 'deploy'; unit: string; territory?: string }
  | { kind: 'attack'; territory?: string };
const priorities: Record<Faction, Track[]> = {
  Iran: ['Militare', 'Economia', 'Consenso', 'Diplomazia'],
  Coalizione: ['Diplomazia', 'Militare', 'Economia', 'Consenso'],
  Russia: ['Economia', 'Militare', 'Diplomazia', 'Consenso'],
  Cina: ['Economia', 'Diplomazia', 'Consenso', 'Militare'],
  Europa: ['Diplomazia', 'Consenso', 'Economia', 'Militare'],
};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
/** Do not mistake the territory “Iran” for the subject of “Coalizione ha unità in Iran”. */
function firstFactionMention(text: string): Faction | undefined {
  return [...FACTIONS].filter(f => text.includes(norm(f))).sort((a, b) => text.indexOf(norm(a)) - text.indexOf(norm(b)))[0];
}
export function weakestTrack(s: EngineState, faction: Faction): Track {
  return [...priorities[faction]].sort((a, b) => s.players[faction].tracks[a] - s.players[faction].tracks[b])[0];
}
/** Resolve a BOT's printed alternatives without delegating its decision to a human.
 * Prefer a winning Nuclear step; otherwise repair the weakest offered track
 * (printed faction priority breaks ties). Nuclear remains useful at full Consenso.
 */
export function chooseBotControlBonus(s: EngineState, faction: Faction, choices: (Track | 'Nucleare')[]): Track | 'Nucleare' {
  if (choices.includes('Nucleare') && s.globals.Nucleare >= 14) return 'Nucleare';
  const tracks = priorities[faction].filter(t => choices.includes(t)).sort((a,b) => s.players[faction].tracks[a]-s.players[faction].tracks[b]);
  if (choices.includes('Nucleare') && (!tracks.length || s.players[faction].tracks[tracks[0]] >= 8)) return 'Nucleare';
  const chosen = tracks[0] ?? choices[0];
  if (!chosen) throw new Error('Nessun bonus BOT disponibile');
  return chosen;
}
export function chooseBotCorrelation(s: EngineState, faction: Faction, track: Track): number {
  const changes = CORRELATIONS[faction][track];
  return changes.map((change, i) => ({ change, i })).sort((a, b) => {
    if (a.change.delta < 0 && b.change.delta >= 0) return -1;
    if (b.change.delta < 0 && a.change.delta >= 0) return 1;
    const delta = s.players[a.change.faction].points - s.players[b.change.faction].points;
    return a.change.delta < 0 ? -delta : delta;
  })[0].i;
}
function territory(text: string) {
  const value = norm(text);
  return [...TERRITORIES].sort((a, b) => b.name.length - a.name.length).find(t => value.includes(norm(t.name)) ||
    (norm(t.name).includes('hormuz') && /hormuz|stretto/.test(value)) ||
    (norm(t.name).includes('emirati') && value.includes('emirati')));
}
function hasUnit(s: EngineState, faction: Faction, territoryId?: string, unitName?: string) {
  return s.units.some(u => u.faction === faction && (!territoryId || u.territory === territoryId) &&
    (!unitName || norm(UNITS.find(d => d.id === u.type)?.name ?? '') === norm(unitName)));
}
function blockade(s: EngineState) {
  const hormuz = TERRITORIES.find(t => /hormuz/i.test(t.name));
  const local = s.units.filter(u => u.territory === hormuz?.id);
  return local.filter(u => /flotta veloce/i.test(UNITS.find(d => d.id === u.type)?.name ?? '')).length >= 2 &&
    !local.some(u => /carrier strike/i.test(UNITS.find(d => d.id === u.type)?.name ?? ''));
}
/** The condition grammar covers the printed Appendix B, including presence/absence and compound conditions. */
export function botCondition(s: EngineState, actor: Faction, condition: string): boolean {
  const text = norm(condition).replace(/,\s*(?=crisi bellica)/g, ' e ');
  if (text === 'blocco di hormuz attivo') return blockade(s);
  if (text.startsWith('blocco di hormuz attivo o nessun')) {
    const h = territory('Hormuz'); return blockade(s) || !hasUnit(s, 'Coalizione', h?.id, 'Carrier Strike Group');
  }
  if (text.includes('russia o cina hanno una cyber unit')) return s.units.some(u =>
    (u.faction === 'Russia' || u.faction === 'Cina') && /cyber/i.test(UNITS.find(d => d.id === u.type)?.name ?? ''));
  if (text.includes('in libano ci sono unita di iran o')) {
    const t = territory('Libano'); return !!t && (hasUnit(s, 'Iran', t.id) || hasUnit(s, 'Coalizione', t.id));
  }
  if (text.startsWith('meno di 2 flotte veloci')) {
    return s.units.filter(u => /flotta veloce/i.test(UNITS.find(d => d.id === u.type)?.name ?? '') &&
      /hormuz/i.test(TERRITORIES.find(t => t.id === u.territory)?.name ?? '')).length < 2;
  }
  if (/iran e coalizione hanno unita nello stesso territorio/.test(text) && !text.includes(' e iran')) {
    return TERRITORIES.some(t => hasUnit(s, 'Iran', t.id) && hasUnit(s, 'Coalizione', t.id));
  }
  if (text.includes(' e iran e coalizione')) {
    const [numeric] = text.split(' e iran e coalizione');
    return botCondition(s, actor, numeric) && botCondition(s, actor, 'Iran e Coalizione hanno unità nello stesso territorio');
  }
  if (/oppure\s*[≥≤<>]/.test(text)) {
    const match = text.match(/^(opinione)\s*([≥≤<>]=?)\s*(-?\d+)\s*oppure\s*([≥≤<>]=?)\s*(-?\d+)$/);
    if (match) return botCondition(s, actor, `Opinione ${match[2]} ${match[3]}`) || botCondition(s, actor, `Opinione ${match[4]} ${match[5]}`);
  }
  // Only numeric/global compounds use “e”; unit-list prose is handled below intact.
  if (text.includes(' e ') && /[≥≤<>]/.test(text)) return text.split(' e ').every(part => botCondition(s, actor, part));
  const numeric = text.match(/^(?:(iran|coalizione|russia|cina|europa)\s+)?(economia|militare|diplomazia|consenso|nucleare|sanzioni|crisi bellica|opinione)\s*([≥≤<>]=?|=)\s*(-?\d+)$/);
  if (numeric) {
    const f = FACTIONS.find(f => norm(f) === numeric[1]) ?? actor;
    const names = { economia: 'Economia', militare: 'Militare', diplomazia: 'Diplomazia', consenso: 'Consenso', nucleare: 'Nucleare', sanzioni: 'Sanzioni', 'crisi bellica': 'Crisi Bellica', opinione: 'Opinione' } as const;
    const key = names[numeric[2] as keyof typeof names], value = key in s.globals ? s.globals[key as GlobalTrack] : s.players[f].tracks[key as Track], threshold = Number(numeric[4]);
    return numeric[3] === '≥' || numeric[3] === '>=' ? value >= threshold :
      numeric[3] === '≤' || numeric[3] === '<=' ? value <= threshold :
      numeric[3] === '>' ? value > threshold : numeric[3] === '<' ? value < threshold : value === threshold;
  }
  // A condition can mention several candidate territories (“Siria, Libano, Iraq o Yemen”).
  const places = TERRITORIES.filter(t => {
    const n = norm(t.name);
    return text.includes(n) || (n.includes('emirati') && text.includes('emirati')) || (n.includes('hormuz') && text.includes('stretto'));
  });
  const who = firstFactionMention(text) ?? actor;
  const negative = /nessun|non ha/.test(text);
  const defs = UNITS.filter(d => text.includes(norm(d.name)) ||
    (/missili balistici/.test(text) && /missili balistici/i.test(d.name)) ||
    (/carrier strike group/.test(text) && /carrier strike group/i.test(d.name)));
  if (defs.length) {
    const present = s.units.some(u => defs.some(d => d.id === u.type) && (!places.length || places.some(t => t.id === u.territory)));
    return negative ? !present : present;
  }
  if (/unita|un unita/.test(text)) {
    const present = places.some(t => hasUnit(s, who, t.id));
    return negative ? !present : present;
  }
  throw new Error(`Condizione BOT non riconosciuta: ${condition}`);
}
function conditionalTerritory(s: EngineState, condition: string): string | undefined {
  const text = norm(condition);
  if (text.includes('stesso territorio')) return TERRITORIES.find(t => hasUnit(s, 'Iran', t.id) && hasUnit(s, 'Coalizione', t.id))?.id;
  if (text.includes('cyber')) return s.units.find(u => (u.faction === 'Russia' || u.faction === 'Cina') && /cyber/i.test(UNITS.find(d => d.id === u.type)?.name ?? ''))?.territory;
  if (text.includes('aviazione tattica')) return s.units.find(u => /aviazione tattica/i.test(UNITS.find(d => d.id === u.type)?.name ?? ''))?.territory;
  const who = firstFactionMention(text);
  const places = TERRITORIES.filter(t => text.includes(norm(t.name)));
  return places.find(t => !who || hasUnit(s, who, t.id))?.id;
}
/** Converts printed P1/P2 text to explicit deterministic actions, without executing or spending OP. */
export function botPlan(s: EngineState, actor: Faction, priority: string, condition = ''): BotAction[] {
  const out: BotAction[] = [];
  for (const raw of priority.split('·')) {
    const part = norm(raw);
    const development = part.match(/^sviluppo (economia|militare|diplomazia|consenso)(?:\s*[×x]\s*(\d+))?$/);
    if (development) {
      const track = ({ economia: 'Economia', militare: 'Militare', diplomazia: 'Diplomazia', consenso: 'Consenso' } as const)[development[1] as 'economia'];
      for (let i = 0; i < Number(development[2] ?? 1); i++) out.push({ kind: 'develop', track });
      continue;
    }
    if (part.startsWith('schiera ')) {
      const def = [...UNITS].filter(d => d.faction === actor).sort((a, b) => b.name.length - a.name.length).find(d => part.startsWith(`schiera ${norm(d.name)}`));
      if (!def) throw new Error(`Unità BOT non riconosciuta: ${raw}`);
      let target = territory(part)?.id;
      if (part.includes('quel territorio') || part.includes('stesso territorio')) target = conditionalTerritory(s, condition);
      if (part.includes('con unita della coalizione')) target = s.units.find(u => u.faction === 'Coalizione')?.territory;
      if (part.includes('con piu unita')) target = [...TERRITORIES].sort((a, b) =>
        s.units.filter(u => u.territory === b.id && (u.faction === 'Iran' || u.faction === 'Coalizione')).length -
        s.units.filter(u => u.territory === a.id && (u.faction === 'Iran' || u.faction === 'Coalizione')).length)[0]?.id;
      out.push({ kind: 'deploy', unit: def.name, territory: target }); continue;
    }
    if (part.startsWith('attacco')) {
      out.push({ kind: 'attack', territory: part.includes('quel territorio') ? conditionalTerritory(s, condition) : territory(part)?.id }); continue;
    }
    if (/opinione di 1 verso lo 0/.test(part)) { out.push({ kind: 'global', track: 'Opinione', delta: 'zero' }); continue; }
    const direct = part.match(/^(?:(iran|coalizione|russia|cina|europa)\s+)?(economia|militare|diplomazia|consenso|nucleare|sanzioni|crisi bellica|opinione)\s*([+-]\d+)$/);
    if (direct) {
      const f = FACTIONS.find(f => norm(f) === direct[1]) ?? actor;
      const names = { economia: 'Economia', militare: 'Militare', diplomazia: 'Diplomazia', consenso: 'Consenso', nucleare: 'Nucleare', sanzioni: 'Sanzioni', 'crisi bellica': 'Crisi Bellica', opinione: 'Opinione' } as const;
      const key = names[direct[2] as keyof typeof names], delta = Number(direct[3]);
      if (['Nucleare', 'Sanzioni', 'Crisi Bellica', 'Opinione'].includes(key)) out.push({ kind: 'global', track: key as GlobalTrack, delta });
      else out.push({ kind: 'track', change: { faction: f, track: key as Track, delta } });
      continue;
    }
    throw new Error(`Priorità BOT non riconosciuta: ${raw}`);
  }
  return out;
}

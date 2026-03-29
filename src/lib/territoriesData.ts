// =============================================
// LINEA ROSSA — Definizioni Territori e Unità
// =============================================
import type { Faction } from '@/types/game';

// ─── Tipi ────────────────────────────────────────────────────────────────────
export type TerritoryId =
  | 'Turchia' | 'Siria' | 'Libano' | 'Israele' | 'Giordania' | 'Egitto'
  | 'Iraq' | 'Iran' | 'Kuwait' | 'Bahrain' | 'Qatar'
  | 'ArabiaSaudita' | 'EmiratiArabi' | 'Oman' | 'StrettoHormuz' | 'Yemen';

// ─── Unità per fazione — SISTEMA ASIMMETRICO ─────────────────────────────────
//
// IRAN:       guerra asimmetrica, proxy, missili, cyber + navale nel Golfo
// COALIZIONE: alta tecnologia, aviazione, precisione, potenza di fuoco
// RUSSIA:     quantità, sottomarini, guerra ibrida, presenza navale
// CINA:       capacità economiche convertite in forza, droni, cyber
// EUROPA:     difesa e deterrenza, nessun attacco diretto, peacekeeping
//
export type UnitType =
  // ── IRAN ────────────────────────────────────────────────────────────────
  | 'IRGC'              // Guardie della Rivoluzione: elite offensiva
  | 'Proxy'             // Milizie Proxy: economiche, difesa strisciante
  | 'MissileiBalistici' // Missili balistici: forte attacco, nessun difesa
  | 'NavaleGolfo'       // Flotta Golfo Persico: solo navale
  | 'CyberIran'         // Cyber operazioni: riduce difesa avversario
  // ── COALIZIONE ──────────────────────────────────────────────────────────
  | 'ForzeSpeciali'     // Operazioni speciali: alta precisione
  | 'AviazioneTattica'  // Caccia-bombardieri: dominio aereo
  | 'PortaereiBattleGroup' // Carrier strike group: navale potenziato
  | 'DroniPrecisione'   // UAV da attacco: basso costo, +attacco
  | 'ScudoMissilistico' // Iron Dome/Patriot: solo difesa
  // ── RUSSIA ──────────────────────────────────────────────────────────────
  | 'ArmataCorazzata'   // Carro armato pesante: forza massiccia
  | 'SottomariniAKULA'  // Sottomarini: sorpresa navale
  | 'GuerraIbrida'      // Destabilizzazione: riduce stabilità difensore
  | 'SystemsS400'       // S-400: contraerea, blocca Aviazione
  | 'WagnerGroup'       // Wagner: proxy mercenario, sacrificabile
  // ── CINA ────────────────────────────────────────────────────────────────
  | 'EsercitoRegolare'  // PLA: forze convenzionali bilanciate
  | 'DroniCina'         // Droni da sorveglianza/attacco
  | 'NavalePLA'         // Marina PLA: presenza navale
  | 'GuerraEconomica'   // Sanzioni/investimenti: attacco economico
  | 'CyberCina'         // Cyber PLA: sabotaggio infrastrutture
  // ── EUROPA ──────────────────────────────────────────────────────────────
  | 'Peacekeeping'      // Forze ONU/EU: solo difesa, genera opinion
  | 'ForzaRapidaEU'     // Battlegroup EU: difesa mobile
  | 'SanzioniBCE'       // Sanzioni finanziarie: attacco economico
  | 'MissioneAddestr'   // Training mission: bonus stabilità alleato
  // ── CONDIVISA ───────────────────────────────────────────────────────────
  | 'Convenzionale';    // Fanteria standard: tutte le fazioni

export interface UnitDef {
  type: UnitType;
  label: string;
  icon: string;
  faction: Faction | 'Tutti';
  attackBonus: number;    // bonus in attacco
  defenseBonus: number;   // bonus in difesa
  navalOnly?: boolean;    // solo territori navali
  landOnly?: boolean;     // solo territori terrestri
  specialEffect?: string; // descrizione effetto speciale
  cost: number;           // costo in Punti Operazione per schierare 1
  maxPerTerritory?: number; // limite slot per territorio
}

export const UNITS: UnitDef[] = [

  // ════════════════════════════════════════════════════════════════
  // CONDIVISA
  // ════════════════════════════════════════════════════════════════
  {
    type: 'Convenzionale',
    label: 'Fanteria Convenzionale',
    icon: '⚔️',
    faction: 'Tutti',
    attackBonus: 0, defenseBonus: 1,
    cost: 1,
    specialEffect: 'Nessun effetto speciale. Difesa +1 per unità.',
  },

  // ════════════════════════════════════════════════════════════════
  // IRAN
  // ════════════════════════════════════════════════════════════════
  {
    type: 'IRGC',
    label: 'Guardie della Rivoluzione (IRGC)',
    icon: '🦅',
    faction: 'Iran',
    attackBonus: 3, defenseBonus: 2,
    cost: 3,
    specialEffect: 'Elite. Attacco +3, Difesa +2. In territorio Iran: difesa +5 totale.',
  },
  {
    type: 'Proxy',
    label: 'Milizie Proxy (Hezbollah/Houthi)',
    icon: '🎭',
    faction: 'Iran',
    attackBonus: 1, defenseBonus: 2,
    cost: 1,
    specialEffect: 'Economiche. Al territorio attaccato: -1 Stabilità difensore se vittoria.',
  },
  {
    type: 'MissileiBalistici',
    label: 'Missili Balistici (Shahab)',
    icon: '🚀',
    faction: 'Iran',
    attackBonus: 4, defenseBonus: 0,
    cost: 3,
    landOnly: false,
    specialEffect: 'Solo attacco. Attacco +4. Ignorano S-400 (non bloccati da ScudoMissilistico).',
    maxPerTerritory: 2,
  },
  {
    type: 'NavaleGolfo',
    label: 'Flotta Veloce del Golfo',
    icon: '⛵',
    faction: 'Iran',
    attackBonus: 2, defenseBonus: 2,
    navalOnly: true,
    cost: 2,
    specialEffect: 'Solo navale. Se ≥2 in Stretto Hormuz: attivano blocco Hormuz (+2 costo Coalizione).',
  },
  {
    type: 'CyberIran',
    label: 'IRGC Cyber Unit',
    icon: '💻',
    faction: 'Iran',
    attackBonus: 1, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Cyber. Prima del combattimento: -1 alla difesa del territorio bersaglio.',
  },

  // ════════════════════════════════════════════════════════════════
  // COALIZIONE
  // ════════════════════════════════════════════════════════════════
  {
    type: 'ForzeSpeciali',
    label: 'Forze Speciali (JSOC/SAS)',
    icon: '🎯',
    faction: 'Coalizione',
    attackBonus: 3, defenseBonus: 1,
    cost: 3,
    specialEffect: 'Precisione. Attacco +3. In vittoria: +1 influenza aggiuntiva.',
  },
  {
    type: 'AviazioneTattica',
    label: 'Aviazione Tattica (F-35/Typhoon)',
    icon: '✈️',
    faction: 'Coalizione',
    attackBonus: 3, defenseBonus: 0,
    cost: 3,
    specialEffect: 'Dominio aereo. Attacco +3. Bloccata da S-400 russo (annullato il bonus).',
  },
  {
    type: 'PortaereiBattleGroup',
    label: 'Carrier Strike Group',
    icon: '🛳️',
    faction: 'Coalizione',
    attackBonus: 2, defenseBonus: 3,
    navalOnly: true,
    cost: 4,
    specialEffect: 'Solo navale. Potente difesa. Se in Stretto Hormuz: neutralizza blocco Iran.',
    maxPerTerritory: 1,
  },
  {
    type: 'DroniPrecisione',
    label: 'Droni da Attacco (Reaper/Predator)',
    icon: '🤖',
    faction: 'Coalizione',
    attackBonus: 2, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Economici. Attacco +2. Nessun costo unità in caso di sconfitta.',
  },
  {
    type: 'ScudoMissilistico',
    label: 'Scudo Missile (Patriot/THAAD)',
    icon: '🛡️',
    faction: 'Coalizione',
    attackBonus: 0, defenseBonus: 4,
    cost: 3,
    specialEffect: 'Solo difesa. Difesa +4. Blocca MissileiBalistici Iran (riduce bonus a 0).',
  },

  // ════════════════════════════════════════════════════════════════
  // RUSSIA
  // ════════════════════════════════════════════════════════════════
  {
    type: 'ArmataCorazzata',
    label: 'Armata Corazzata (T-90/T-14)',
    icon: '🪖',
    faction: 'Russia',
    attackBonus: 3, defenseBonus: 3,
    landOnly: true,
    cost: 3,
    specialEffect: 'Forza massiccia. Solo terrestre. Attacco +3, Difesa +3.',
  },
  {
    type: 'SottomariniAKULA',
    label: 'Sottomarini Classe AKULA',
    icon: '🤿',
    faction: 'Russia',
    attackBonus: 3, defenseBonus: 2,
    navalOnly: true,
    cost: 3,
    specialEffect: 'Sorpresa navale. In attacco: ignora 1 livello difesa navale avversario.',
  },
  {
    type: 'GuerraIbrida',
    label: 'Operazioni Guerra Ibrida (GRU)',
    icon: '🕵️',
    faction: 'Russia',
    attackBonus: 1, defenseBonus: 1,
    cost: 2,
    specialEffect: 'Destabilizzazione. In vittoria: -1 Stabilità Interna al difensore.',
  },
  {
    type: 'SystemsS400',
    label: 'Sistema S-400 Triumf',
    icon: '📡',
    faction: 'Russia',
    attackBonus: 0, defenseBonus: 5,
    cost: 3,
    specialEffect: 'Contraerea. Difesa +5. Annulla il bonus di AviazioneTattica della Coalizione.',
    maxPerTerritory: 1,
  },
  {
    type: 'WagnerGroup',
    label: 'Gruppo Wagner (mercenari)',
    icon: '💀',
    faction: 'Russia',
    attackBonus: 2, defenseBonus: 1,
    cost: 1,
    specialEffect: 'Proxy sacrificabile. Se persi in combattimento: nessun costo politico per Russia.',
  },

  // ════════════════════════════════════════════════════════════════
  // CINA
  // ════════════════════════════════════════════════════════════════
  {
    type: 'EsercitoRegolare',
    label: 'Esercito Popolare (PLA)',
    icon: '⭐',
    faction: 'Cina',
    attackBonus: 1, defenseBonus: 2,
    cost: 2,
    specialEffect: 'Bilanciato. Cina non paga penalità di Stabilità in sconfitta.',
  },
  {
    type: 'DroniCina',
    label: 'Droni Wing Loong (CASC)',
    icon: '🛸',
    faction: 'Cina',
    attackBonus: 2, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Attacco economico. +2 attacco. In vittoria: riduce Risorse economiche difensore.',
  },
  {
    type: 'NavalePLA',
    label: 'Marina PLA (Type 055)',
    icon: '🚢',
    faction: 'Cina',
    attackBonus: 2, defenseBonus: 2,
    navalOnly: true,
    cost: 3,
    specialEffect: 'Presenza navale. In territorio navale: +1 influenza commerciale Cina.',
  },
  {
    type: 'GuerraEconomica',
    label: 'Leva Economica (BRI/Sanzioni)',
    icon: '💰',
    faction: 'Cina',
    attackBonus: 0, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Non combatte. Attiva: -2 sanzioni al bersaglio, +1 influenza Cina nel territorio.',
  },
  {
    type: 'CyberCina',
    label: 'Cyber Army PLA Unit 61398',
    icon: '🖥️',
    faction: 'Cina',
    attackBonus: 2, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Sabotaggio. -1 Difesa bersaglio. Se vittoria: -1 Cyber difensore.',
  },

  // ════════════════════════════════════════════════════════════════
  // EUROPA
  // ════════════════════════════════════════════════════════════════
  {
    type: 'Peacekeeping',
    label: 'Missione Peacekeeping ONU/EU',
    icon: '🕊️',
    faction: 'Europa',
    attackBonus: 0, defenseBonus: 2,
    cost: 1,
    specialEffect: 'Difensivo. Non può attaccare. In difesa: +2. Genera +1 Opinione Globale se presente.',
    maxPerTerritory: 3,
  },
  {
    type: 'ForzaRapidaEU',
    label: 'Battlegroup EU (PESCO)',
    icon: '🇪🇺',
    faction: 'Europa',
    attackBonus: 1, defenseBonus: 3,
    cost: 3,
    specialEffect: 'Difesa mobile. Attacco limitato +1. Difesa +3. Riduce escalation: DEFCON non scende se vince.',
  },
  {
    type: 'SanzioniBCE',
    label: 'Sanzioni Finanziarie (BCE/FMI)',
    icon: '🏦',
    faction: 'Europa',
    attackBonus: 2, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Attacco economico. +2 ai fini del calcolo. Se vittoria: +1 Sanzioni al difensore.',
  },
  {
    type: 'MissioneAddestr',
    label: 'Missione di Addestramento EU',
    icon: '📋',
    faction: 'Europa',
    attackBonus: 0, defenseBonus: 1,
    cost: 1,
    specialEffect: 'Supporto. +1 Difesa. In territorio: +1 Stabilità alleato. Non perde unità in sconfitta.',
  },
];

export const UNIT_MAP: Record<UnitType, UnitDef> =
  Object.fromEntries(UNITS.map(u => [u.type, u])) as Record<UnitType, UnitDef>;

// Unità iniziali per fazione (bilanciate per asimmetria)
export const INITIAL_UNITS: Record<Faction, Partial<Record<UnitType, number>>> = {
  Iran:       { Convenzionale: 3, IRGC: 2, Proxy: 4, MissileiBalistici: 1, NavaleGolfo: 2, CyberIran: 1 },
  Coalizione: { Convenzionale: 2, ForzeSpeciali: 2, AviazioneTattica: 2, DroniPrecisione: 3, ScudoMissilistico: 1 },
  Russia:     { Convenzionale: 3, ArmataCorazzata: 2, SottomariniAKULA: 2, GuerraIbrida: 2, WagnerGroup: 3, SystemsS400: 1 },
  Cina:       { Convenzionale: 3, EsercitoRegolare: 2, DroniCina: 2, NavalePLA: 2, GuerraEconomica: 1, CyberCina: 1 },
  Europa:     { Convenzionale: 2, Peacekeeping: 3, ForzaRapidaEU: 1, SanzioniBCE: 1, MissioneAddestr: 2 },
};

// Unità per fazione (lookup rapido)
export const UNITS_BY_FACTION: Record<Faction, UnitDef[]> = {
  Iran:       UNITS.filter(u => u.faction === 'Iran'       || u.faction === 'Tutti'),
  Coalizione: UNITS.filter(u => u.faction === 'Coalizione' || u.faction === 'Tutti'),
  Russia:     UNITS.filter(u => u.faction === 'Russia'     || u.faction === 'Tutti'),
  Cina:       UNITS.filter(u => u.faction === 'Cina'       || u.faction === 'Tutti'),
  Europa:     UNITS.filter(u => u.faction === 'Europa'     || u.faction === 'Tutti'),
};

// ─── Territori ───────────────────────────────────────────────────────────────
export interface TerritoryDef {
  id: TerritoryId;
  label: string;
  isNaval: boolean;
  isLand: boolean;
  homeFaction?: Faction;
}

export const TERRITORIES: TerritoryDef[] = [
  { id: 'Turchia',        label: 'TURCHIA',        isNaval: false, isLand: true  },
  { id: 'Siria',          label: 'SIRIA',           isNaval: false, isLand: true  },
  { id: 'Libano',         label: 'LIBANO',          isNaval: false, isLand: true  },
  { id: 'Israele',        label: 'ISRAELE',         isNaval: false, isLand: true,  homeFaction: 'Coalizione' },
  { id: 'Giordania',      label: 'GIORDANIA',       isNaval: false, isLand: true  },
  { id: 'Egitto',         label: 'EGITTO',          isNaval: false, isLand: true  },
  { id: 'Iraq',           label: 'IRAQ',            isNaval: false, isLand: true  },
  { id: 'Iran',           label: 'IRAN',            isNaval: false, isLand: true,  homeFaction: 'Iran' },
  { id: 'Kuwait',         label: 'KUWAIT',          isNaval: true,  isLand: true  },
  { id: 'Bahrain',        label: 'BAHRAIN',         isNaval: true,  isLand: true  },
  { id: 'Qatar',          label: 'QATAR',           isNaval: true,  isLand: true  },
  { id: 'ArabiaSaudita',  label: 'ARABIA S.',       isNaval: true,  isLand: true  },
  { id: 'EmiratiArabi',   label: 'UAE',             isNaval: true,  isLand: true  },
  { id: 'Oman',           label: 'OMAN',            isNaval: true,  isLand: true  },
  { id: 'StrettoHormuz',  label: 'HORMUZ',          isNaval: true,  isLand: false  },
  { id: 'Yemen',          label: 'YEMEN',           isNaval: true,  isLand: true  },
];

export const TERRITORY_MAP: Record<TerritoryId, TerritoryDef> =
  Object.fromEntries(TERRITORIES.map(t => [t.id, t])) as Record<TerritoryId, TerritoryDef>;

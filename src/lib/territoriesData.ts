// =============================================
// LINEA ROSSA — Definizioni Territori e Unità
// =============================================
import type { Faction } from '@/types/game';

// ─── Tipi ────────────────────────────────────────────────────────────────────
export type TerritoryId =
  | 'Turchia' | 'Siria' | 'Libano' | 'Israele' | 'Giordania' | 'Egitto'
  | 'Iraq' | 'Iran' | 'Natanz' | 'Fordow' | 'Teheran' | 'Kuwait' | 'Bahrain' | 'Qatar'
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
  | 'SottomariniAKULA'  // Sottomarini: sorpresa navale
  | 'GuerraIbrida'      // Destabilizzazione: riduce stabilità difensore
  // ── EUROPA ──────────────────────────────────────────────────────────────
  | 'Peacekeeping'      // Caschi Blu ONU/EU: solo difesa
  // ── CINA ────────────────────────────────────────────────────────────────
  | 'NavalePLA'         // Marina PLA: presenza navale
  | 'CyberCina'         // Cyber PLA: sabotaggio infrastrutture
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
    icon: '🚨',
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


  // ════════════════════════════════════════════════════════════════
  // EUROPA
  // ════════════════════════════════════════════════════════════════
  {
    type: 'Peacekeeping',
    label: 'Caschi Blu ONU/EU',
    icon: '🕊️',
    faction: 'Europa',
    attackBonus: 0, defenseBonus: 2,
    cost: 1,
    specialEffect: 'Solo difesa. Non può attaccare. Difesa +2. Genera +1 Opinione Globale se presente.',
    maxPerTerritory: 3,
  },

  // ════════════════════════════════════════════════════════════════
  // CINA
  // ════════════════════════════════════════════════════════════════
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
    type: 'CyberCina',
    label: 'Cyber Army PLA Unit 61398',
    icon: '🖥️',
    faction: 'Cina',
    attackBonus: 2, defenseBonus: 0,
    cost: 2,
    specialEffect: 'Sabotaggio. -1 Difesa bersaglio. Se vittoria: -1 Cyber difensore.',
  },

];

export const UNIT_MAP: Record<UnitType, UnitDef> =
  Object.fromEntries(UNITS.map(u => [u.type, u])) as Record<UnitType, UnitDef>;

// Unità iniziali per fazione (bilanciate per asimmetria)
export const INITIAL_UNITS: Record<Faction, Partial<Record<UnitType, number>>> = {
  Iran:       { Convenzionale: 3, IRGC: 2, Proxy: 4, MissileiBalistici: 1, NavaleGolfo: 2, CyberIran: 1 },
  Coalizione: { Convenzionale: 2, ForzeSpeciali: 2, AviazioneTattica: 2, DroniPrecisione: 3, ScudoMissilistico: 1 },
  Russia:     { Convenzionale: 2, SottomariniAKULA: 1, GuerraIbrida: 2 },
  Cina:       { Convenzionale: 2, NavalePLA: 2, CyberCina: 1 },
  Europa:     { Convenzionale: 2, Peacekeeping: 3 },
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
  /** Fazioni che possono attaccare questo territorio */
  canBeAttackedBy?: Faction[];
  /** Tag per effetti speciali di combattimento */
  iranTarget?: boolean;
}

export const TERRITORIES: TerritoryDef[] = [
  { id: 'Turchia',        label: 'TURCHIA',        isNaval: false, isLand: true  },
  { id: 'Siria',          label: 'SIRIA',           isNaval: false, isLand: true  },
  { id: 'Libano',         label: 'LIBANO',          isNaval: false, isLand: true  },
  { id: 'Israele',        label: 'ISRAELE',         isNaval: false, isLand: true,  homeFaction: 'Coalizione' },
  { id: 'Giordania',      label: 'GIORDANIA',       isNaval: false, isLand: true  },
  { id: 'Egitto',         label: 'EGITTO',          isNaval: false, isLand: true  },
  { id: 'Iraq',           label: 'IRAQ',            isNaval: false, isLand: true  },
  { id: 'Iran',           label: 'IRAN',            isNaval: false, isLand: true,  homeFaction: 'Iran', canBeAttackedBy: ['Coalizione', 'Russia', 'Europa', 'Cina'], iranTarget: true },
  { id: 'Natanz',         label: 'NATANZ',          isNaval: false, isLand: true,  homeFaction: 'Iran', canBeAttackedBy: ['Coalizione', 'Russia', 'Europa', 'Cina'], iranTarget: true },
  { id: 'Fordow',         label: 'FORDOW',          isNaval: false, isLand: true,  homeFaction: 'Iran', canBeAttackedBy: ['Coalizione', 'Russia', 'Europa', 'Cina'], iranTarget: true },
  { id: 'Teheran',        label: 'TEHERAN',         isNaval: false, isLand: true,  homeFaction: 'Iran', canBeAttackedBy: ['Coalizione', 'Russia', 'Europa', 'Cina'], iranTarget: true },
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

// ─── Bonus Territoriali Passivi ───────────────────────────────────────────────
//
// Per ogni territorio, definisce quale bonus passivo ottiene ogni fazione
// quando controlla quel territorio con influenza ≥ 3 (soglia di controllo).
//
// Bonus applicati una volta per turno, dopo che la fazione attiva ha giocato.
// Il bonus si applica solo alla fazione che ha influenza ≥ 3 nel territorio.
//
// Struttura: { [territoryId]: { [faction]: Partial<GameStateDelta> } }
// GameStateDelta usa le stesse chiavi di GameState (risorse_*, stabilita_*, nucleare, ecc.)
//
export type TerritoryBonusDelta = Partial<Record<
  | 'risorse_iran' | 'risorse_coalizione' | 'risorse_russia' | 'risorse_cina' | 'risorse_europa'
  | 'stabilita_iran' | 'stabilita_coalizione' | 'stabilita_russia' | 'stabilita_cina' | 'stabilita_europa'
  | 'nucleare' | 'sanzioni' | 'defcon' | 'opinione'
  | 'forze_militari_iran' | 'forze_militari_coalizione' | 'forze_militari_russia'
  | 'forze_militari_cina' | 'forze_militari_europa'
  | 'influenza_diplomatica_coalizione' | 'influenza_diplomatica_europa'
  | 'influenza_militare_russia' | 'influenza_commerciale_cina'
  | 'cyber_warfare_cina' | 'coesione_ue_europa' | 'aiuti_umanitari_europa'
  | 'veto_onu_russia',
  number
>>;

export interface TerritoryBonusEntry {
  /** Descrizione breve del bonus (per log/UI) */
  label: string;
  /** Bonus per fazione: chiave = Faction, valore = delta GameState */
  bonusByFaction: Partial<Record<Faction, TerritoryBonusDelta>>;
  /**
   * Effetti trasversali: se la fazione `triggerFaction` controlla il territorio
   * (influenza ≥ soglia), applica `delta` alla fazione `targetFaction`.
   * Usato per penalità geopolitiche (es. blocco Hormuz → -risorse Coalition/Europa).
   */
  crossFactionEffects?: Array<{
    triggerFaction: Faction;
    targetFaction: Faction;
    delta: TerritoryBonusDelta;
    label: string;
  }>;
}

/**
 * TERRITORY_BONUS_MAP
 * Bonus passivi a fine turno per territorio controllato (influenza ≥ 3).
 * Ogni fazione che soddisfa la soglia in un territorio riceve il bonus corrispondente.
 */
export const TERRITORY_BONUS_MAP: Partial<Record<TerritoryId, TerritoryBonusEntry>> = {

  // ── IRAQ: crocevia strategico ──────────────────────────────────────────────
  Iraq: {
    label: 'Crocevia Strategico',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, nucleare: 1 },            // ponte verso proxy
      Coalizione: { risorse_coalizione: 1, stabilita_coalizione: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
      Europa:     { aiuti_umanitari_europa: 1 },
    },
  },

  // ── SIRIA: presenza militare ───────────────────────────────────────────────
  Siria: {
    label: 'Presenza Militare',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, stabilita_iran: 1 },       // IRGC e proxy
      Russia:     { influenza_militare_russia: 1, risorse_russia: 1 }, // basi aeree
      Coalizione: { sanzioni: 1 },                              // pressione diplomatica
      Europa:     { aiuti_umanitari_europa: 1, opinione: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
    },
  },

  // ── LIBANO: proxy Iran (Hezbollah) ─────────────────────────────────────────
  Libano: {
    label: 'Rete Proxy Hezbollah',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, nucleare: 1 },             // canale Hezbollah
      Coalizione: { influenza_diplomatica_coalizione: 1 },
      Europa:     { aiuti_umanitari_europa: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
    },
  },

  // ── ISRAELE: hub tecnologico Coalition ────────────────────────────────────
  Israele: {
    label: 'Hub Tecnologico',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1, stabilita_coalizione: 1 }, // Iron Dome, intelligence
      Iran:       { nucleare: 1 },                              // minaccia percepita
      Europa:     { influenza_diplomatica_europa: 1 },
      Russia:     { veto_onu_russia: 0 },                       // nessun bonus Russia
      Cina:       { influenza_commerciale_cina: 1 },
    },
  },

  // ── STRETTO DI HORMUZ: nodo energetico globale ───────────────────────────
  StrettoHormuz: {
    label: 'Controllo Stretto di Hormuz',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, nucleare: 1 },              // leva sul blocco
      Coalizione: { risorse_coalizione: 1, sanzioni: 1 },        // libertà di navigazione
      Russia:     { risorse_russia: 1 },
      Cina:       { risorse_cina: 1, stabilita_rotte_cina: 1 },  // rotte BRI
      Europa:     { risorse_europa: 1 },
    },
    // NOTA: il blocco Hormuz da unità militari è gestito separatamente
    // da applyHormuzBlockade() in botEngine.ts — trigger = Iran ha unità in Hormuz
  },

  // ── ARABIA SAUDITA: greggio e finanza ────────────────────────────────────
  ArabiaSaudita: {
    label: 'Petrodollari',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1 },
      Iran:       { risorse_iran: 1 },                          // contro-pressione
      Russia:     { risorse_russia: 1 },
      Cina:       { risorse_cina: 1, influenza_commerciale_cina: 1 },
      Europa:     { risorse_europa: 1 },
    },
  },

  // ── EMIRATI ARABI: finanza e aviazione ───────────────────────────────────
  EmiratiArabi: {
    label: 'Hub Finanziario',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1, influenza_diplomatica_coalizione: 1 },
      Iran:       { risorse_iran: 1 },
      Cina:       { risorse_cina: 1, influenza_commerciale_cina: 1 },
      Russia:     { risorse_russia: 1 },
      Europa:     { risorse_europa: 1, coesione_ue_europa: 1 },
    },
  },

  // ── IRAN (nucleo): cuore del regime ──────────────────────────────────────
  Iran: {
    label: 'Cuore del Regime',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, stabilita_iran: 1, nucleare: 1 },
      Coalizione: { sanzioni: 1 },                              // pressione massima
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
      Europa:     { opinione: 1 },
    },
  },

  // ── NATANZ / FORDOW / TEHERAN: impianti nucleari ─────────────────────────
  Natanz: {
    label: 'Impianto Nucleare Natanz',
    bonusByFaction: {
      Iran:       { nucleare: 1 },
      Coalizione: { nucleare: -1, sanzioni: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { cyber_warfare_cina: 1 },
      Europa:     { opinione: 1 },
    },
  },
  Fordow: {
    label: 'Bunker Nucleare Fordow',
    bonusByFaction: {
      Iran:       { nucleare: 1, stabilita_iran: 1 },
      Coalizione: { nucleare: -1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { cyber_warfare_cina: 1 },
      Europa:     { opinione: 1 },
    },
  },
  Teheran: {
    label: 'Capitale Politica',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, stabilita_iran: 1 },
      Coalizione: { sanzioni: 1, influenza_diplomatica_coalizione: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
      Europa:     { aiuti_umanitari_europa: 1 },
    },
  },

  // ── TURCHIA: membro NATO e crocevia ──────────────────────────────────────
  Turchia: {
    label: 'Crocevia NATO-Russia',
    bonusByFaction: {
      Coalizione: { influenza_diplomatica_coalizione: 1, risorse_coalizione: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Europa:     { coesione_ue_europa: 1 },
      Iran:       { risorse_iran: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
    },
  },

  // ── EGITTO: Canale di Suez ────────────────────────────────────────────────
  Egitto: {
    label: 'Canale di Suez',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1, influenza_diplomatica_coalizione: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { risorse_cina: 1, influenza_commerciale_cina: 1 },
      Europa:     { risorse_europa: 1 },
      Iran:       { risorse_iran: 1 },
    },
  },

  // ── GIORDANIA: stabilizzatore regionale ──────────────────────────────────
  Giordania: {
    label: 'Stabilizzatore Regionale',
    bonusByFaction: {
      Coalizione: { stabilita_coalizione: 1, influenza_diplomatica_coalizione: 1 },
      Europa:     { aiuti_umanitari_europa: 1, coesione_ue_europa: 1 },
      Iran:       { risorse_iran: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
    },
  },

  // ── KUWAIT: base militare avanzata ───────────────────────────────────────
  Kuwait: {
    label: 'Base Militare Avanzata',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1, forze_militari_coalizione: 1 },
      Iran:       { risorse_iran: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
      Europa:     { risorse_europa: 1 },
    },
  },

  // ── BAHRAIN: sede della 5a Flotta USA ────────────────────────────────────
  Bahrain: {
    label: 'Quinta Flotta',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1, forze_militari_coalizione: 1 },
      Iran:       { risorse_iran: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
      Europa:     { influenza_diplomatica_europa: 1 },
    },
  },

  // ── QATAR: LNG e base aerea ───────────────────────────────────────────────
  Qatar: {
    label: 'Hub GNL e Al Udeid',
    bonusByFaction: {
      Coalizione: { risorse_coalizione: 1, stabilita_coalizione: 1 },
      Iran:       { stabilita_iran: 1 },
      Russia:     { risorse_russia: 1 },
      Cina:       { risorse_cina: 1, influenza_commerciale_cina: 1 },
      Europa:     { risorse_europa: 1 },
    },
  },

  // ── OMAN: diplomatico tra Iran e Occidente ────────────────────────────────
  Oman: {
    label: 'Canale Diplomatico',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, stabilita_iran: 1 },
      Coalizione: { influenza_diplomatica_coalizione: 1 },
      Europa:     { opinione: 1, aiuti_umanitari_europa: 1 },
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
    },
  },

  // ── YEMEN: proxy Iran (Houthi) ────────────────────────────────────────────
  Yemen: {
    label: 'Guerra per Procura Houthi',
    bonusByFaction: {
      Iran:       { risorse_iran: 1, nucleare: 1 },
      Coalizione: { sanzioni: 1, defcon: 0 },
      Arabia:     {},                                           // non è una fazione giocabile
      Russia:     { influenza_militare_russia: 1 },
      Cina:       { influenza_commerciale_cina: 1 },
      Europa:     { aiuti_umanitari_europa: 1, opinione: 1 },
    },
  },
};

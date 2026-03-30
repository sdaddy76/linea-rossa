// =============================================
// LINEA ROSSA — Obiettivi Segreti
// Fonte: Obiettivi_Segreti_Linea_Rossa.xlsx
// =============================================

export type ObjFazione =
  | 'Iran'
  | 'Coalizione Occidentale'
  | 'Russia'
  | 'Cina'
  | 'Unione Europea'
  | 'Neutrale';

export type ObjDifficolta = 'facile' | 'media' | 'difficile';
export type ObjCondizioneTipo = 'tracciato' | 'territorio' | 'carta' | 'manuale';

export interface ObiettivoSegreto {
  obj_id:            string;
  faction:           ObjFazione;
  nome:              string;
  descrizione:       string;
  punti:             number;
  difficolta:        ObjDifficolta;
  condizione_tipo?:  ObjCondizioneTipo;
  condizione_campo?: string;
  condizione_op?:    '>=' | '<=' | '==';
  condizione_valore?: number;
  condizione_note?:  string;
  attivo:            boolean;
}

// ─── Colori e icone per fazione ───────────────────────────────────────────────
export const OBJ_FACTION_COLORS: Record<ObjFazione, string> = {
  'Iran':                 '#22c55e',
  'Coalizione Occidentale': '#3b82f6',
  'Russia':               '#ef4444',
  'Cina':                 '#f59e0b',
  'Unione Europea':       '#8b5cf6',
  'Neutrale':             '#8899aa',
};

export const OBJ_FACTION_FLAGS: Record<ObjFazione, string> = {
  'Iran':                 '🇮🇷',
  'Coalizione Occidentale': '🇺🇸',
  'Russia':               '🇷🇺',
  'Cina':                 '🇨🇳',
  'Unione Europea':       '🇪🇺',
  'Neutrale':             '🌐',
};

export const OBJ_DIFFICOLTA_COLORS: Record<ObjDifficolta, string> = {
  facile:    '#22c55e',
  media:     '#f59e0b',
  difficile: '#ef4444',
};

export const OBJ_DIFFICOLTA_ICONS: Record<ObjDifficolta, string> = {
  facile:    '⭐',
  media:     '⭐⭐',
  difficile: '⭐⭐⭐',
};

// ─── 15 Obiettivi Segreti ─────────────────────────────────────────────────────
export const TUTTI_GLI_OBIETTIVI: ObiettivoSegreto[] = [

  // ── IRAN ──────────────────────────────────────────────────────────────────
  {
    obj_id: 'OBJ_IRAN_01',
    faction: 'Iran',
    nome: 'Soglia Nucleare',
    descrizione: 'Raggiungi il penultimo spazio del Tracciato Nucleare senza che la Coalizione effettui un attacco militare diretto contro i tuoi siti nucleari.',
    punti: 8,
    difficolta: 'difficile',
    condizione_tipo: 'tracciato',
    condizione_campo: 'nucleare',
    condizione_op: '>=',
    condizione_valore: 14,
    condizione_note: 'Verificare che non siano avvenuti attacchi militari ai siti nucleari iraniani durante la partita.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_IRAN_02',
    faction: 'Iran',
    nome: 'Asse della Resistenza',
    descrizione: 'Controlla almeno 3 nazioni tra Libano, Siria, Iraq e Yemen contemporaneamente alla fine della partita.',
    punti: 6,
    difficolta: 'media',
    condizione_tipo: 'territorio',
    condizione_campo: 'controllo',
    condizione_op: '>=',
    condizione_valore: 3,
    condizione_note: 'Contare quante tra Libano, Siria, Iraq, Yemen risultano controllate da Iran alla fine.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_IRAN_03',
    faction: 'Iran',
    nome: 'Blocco dello Stretto',
    descrizione: 'Mantieni almeno 2 unità navali nello Stretto di Hormuz per 3 turni consecutivi senza subire perdite.',
    punti: 5,
    difficolta: 'media',
    condizione_tipo: 'territorio',
    condizione_campo: 'Stretto di Hormuz',
    condizione_op: '>=',
    condizione_valore: 2,
    condizione_note: 'Verificare presenza di 2+ unità navali nello Stretto di Hormuz per 3 turni consecutivi.',
    attivo: true,
  },

  // ── COALIZIONE OCCIDENTALE ────────────────────────────────────────────────
  {
    obj_id: 'OBJ_COAL_01',
    faction: 'Coalizione Occidentale',
    nome: 'Smantellamento Nucleare',
    descrizione: 'Riporta il Tracciato Nucleare iraniano al livello iniziale attraverso azioni diplomatiche o militari.',
    punti: 8,
    difficolta: 'difficile',
    condizione_tipo: 'tracciato',
    condizione_campo: 'nucleare',
    condizione_op: '<=',
    condizione_valore: 1,
    condizione_note: 'Il tracciato nucleare deve essere tornato al valore di inizio partita (1).',
    attivo: true,
  },
  {
    obj_id: 'OBJ_COAL_02',
    faction: 'Coalizione Occidentale',
    nome: 'Cambio di Regime',
    descrizione: 'Porta il Tracciato Sanzioni/Stabilità Economica dell\'Iran al livello critico, causando proteste interne diffuse.',
    punti: 7,
    difficolta: 'difficile',
    condizione_tipo: 'tracciato',
    condizione_campo: 'sanzioni',
    condizione_op: '>=',
    condizione_valore: 9,
    condizione_note: 'Il tracciato sanzioni deve raggiungere il livello critico (9-10). Verificare stabilità Iran bassa.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_COAL_03',
    faction: 'Coalizione Occidentale',
    nome: 'Sicurezza Energetica',
    descrizione: 'Mantieni il controllo o l\'influenza dominante su almeno 2 nazioni produttrici di petrolio (Arabia Saudita, Iraq, Kuwait) fino alla fine della partita.',
    punti: 5,
    difficolta: 'media',
    condizione_tipo: 'territorio',
    condizione_campo: 'controllo',
    condizione_op: '>=',
    condizione_valore: 2,
    condizione_note: 'Arabia Saudita, Iraq, Kuwait: almeno 2 devono essere sotto influenza Coalizione alla fine.',
    attivo: true,
  },

  // ── RUSSIA ────────────────────────────────────────────────────────────────
  {
    obj_id: 'OBJ_RUS_01',
    faction: 'Russia',
    nome: 'Mediatore Indispensabile',
    descrizione: 'Usa l\'abilità Veto almeno 3 volte durante la partita e mantieni influenza in almeno 2 nazioni controllate da fazioni diverse.',
    punti: 6,
    difficolta: 'media',
    condizione_tipo: 'carta',
    condizione_campo: 'veto',
    condizione_op: '>=',
    condizione_valore: 3,
    condizione_note: 'Contare le carte Veto giocate (min 3) e verificare influenza in 2+ nazioni di fazioni diverse.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_RUS_02',
    faction: 'Russia',
    nome: 'Contratti Militari',
    descrizione: 'Vendi sistemi d\'arma (gioca carte specifiche) ad almeno 3 nazioni diverse durante la partita.',
    punti: 5,
    difficolta: 'facile',
    condizione_tipo: 'carta',
    condizione_campo: 'contratto_militare',
    condizione_op: '>=',
    condizione_valore: 3,
    condizione_note: 'Contare le carte di vendita sistemi d\'arma giocate verso nazioni diverse (min 3 nazioni).',
    attivo: true,
  },
  {
    obj_id: 'OBJ_RUS_03',
    faction: 'Russia',
    nome: 'Base Mediterranea',
    descrizione: 'Controlla la Siria e mantieni almeno 1 unità navale nel Mediterraneo Orientale alla fine della partita.',
    punti: 7,
    difficolta: 'media',
    condizione_tipo: 'territorio',
    condizione_campo: 'Siria',
    condizione_op: '==',
    condizione_valore: 1,
    condizione_note: 'Siria controllata da Russia + almeno 1 unità navale in Mediterraneo Orientale alla fine.',
    attivo: true,
  },

  // ── CINA ──────────────────────────────────────────────────────────────────
  {
    obj_id: 'OBJ_CINA_01',
    faction: 'Cina',
    nome: 'Via della Seta Energetica',
    descrizione: 'Piazza influenza BRI in almeno 4 nazioni diverse, creando una catena di connessione commerciale.',
    punti: 7,
    difficolta: 'difficile',
    condizione_tipo: 'territorio',
    condizione_campo: 'influenza_bri',
    condizione_op: '>=',
    condizione_valore: 4,
    condizione_note: 'Contare le nazioni con influenza BRI cinese al termine della partita (minimo 4).',
    attivo: true,
  },
  {
    obj_id: 'OBJ_CINA_02',
    faction: 'Cina',
    nome: 'Stabilità Commerciale',
    descrizione: 'Termina la partita senza che il Tracciato Tensione Globale (DEFCON) superi mai il livello critico (scenda sotto 4).',
    punti: 6,
    difficolta: 'media',
    condizione_tipo: 'tracciato',
    condizione_campo: 'defcon',
    condizione_op: '>=',
    condizione_valore: 4,
    condizione_note: 'Il DEFCON non deve mai scendere sotto 4 durante tutta la partita. Verificare nel log turni.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_CINA_03',
    faction: 'Cina',
    nome: 'Partner Silenzioso',
    descrizione: 'Mantieni relazioni commerciali (influenza) sia con l\'Iran che con almeno una nazione della Coalizione alla fine della partita.',
    punti: 5,
    difficolta: 'facile',
    condizione_tipo: 'territorio',
    condizione_campo: 'influenza_mista',
    condizione_op: '>=',
    condizione_valore: 2,
    condizione_note: 'Cina deve avere influenza sia su Iran che su almeno una nazione Coalizione alla fine.',
    attivo: true,
  },

  // ── UNIONE EUROPEA ────────────────────────────────────────────────────────
  {
    obj_id: 'OBJ_EU_01',
    faction: 'Unione Europea',
    nome: 'Diplomazia Multilaterale',
    descrizione: 'Fai approvare almeno 2 Risoluzioni ONU durante la partita senza che vengano bloccate dal veto russo o cinese.',
    punti: 6,
    difficolta: 'media',
    condizione_tipo: 'carta',
    condizione_campo: 'risoluzione_onu',
    condizione_op: '>=',
    condizione_valore: 2,
    condizione_note: 'Contare le risoluzioni ONU approvate (non bloccate da veto Russia/Cina): minimo 2.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_EU_02',
    faction: 'Unione Europea',
    nome: 'Crisi Umanitaria Evitata',
    descrizione: 'Nessuna nazione adiacente all\'Europa (Turchia, Libano, Siria) deve avere stabilità inferiore a 2 alla fine della partita.',
    punti: 7,
    difficolta: 'difficile',
    condizione_tipo: 'territorio',
    condizione_campo: 'stabilita_adiacente',
    condizione_op: '>=',
    condizione_valore: 2,
    condizione_note: 'Turchia, Libano, Siria: tutti e 3 devono avere stabilità >= 2 alla fine. Verificare nel game_state.',
    attivo: true,
  },
  {
    obj_id: 'OBJ_EU_03',
    faction: 'Unione Europea',
    nome: 'Accordo Nucleare Rinnovato',
    descrizione: 'Negozia un nuovo accordo JCPOA: il Tracciato Nucleare deve essere nella metà inferiore e il Tracciato Sanzioni non deve essere al massimo.',
    punti: 8,
    difficolta: 'difficile',
    condizione_tipo: 'tracciato',
    condizione_campo: 'nucleare',
    condizione_op: '<=',
    condizione_valore: 7,
    condizione_note: 'Nucleare <= 7 E Sanzioni < 10 alla fine della partita. Entrambe le condizioni devono essere soddisfatte.',
    attivo: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tutti gli obiettivi di una fazione */
export const getObiettiviPerFazione = (faction: ObjFazione): ObiettivoSegreto[] =>
  TUTTI_GLI_OBIETTIVI.filter(o => o.faction === faction && o.attivo);

/** Obiettivo per ID */
export const getObiettivoById = (id: string): ObiettivoSegreto | undefined =>
  TUTTI_GLI_OBIETTIVI.find(o => o.obj_id === id);

/** Fazioni con i rispettivi conteggi obiettivi */
export const OBJ_PER_FAZIONE_COUNT: Record<ObjFazione, number> = {
  'Iran':                 3,
  'Coalizione Occidentale': 3,
  'Russia':               3,
  'Cina':                 3,
  'Unione Europea':       3,
  'Neutrale':             0,
};

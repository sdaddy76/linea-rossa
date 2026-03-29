// =============================================
// LINEA ROSSA — Tipi TypeScript del gioco
// =============================================

export type Faction = 'Iran' | 'Coalizione' | 'Russia' | 'Cina' | 'Europa';
export type CardType = 'Militare' | 'Diplomatico' | 'Economico' | 'Segreto' | 'Media' | 'Evento' | 'Politico';
export type DeckType = 'base' | 'speciale';
export type GameStatus = 'lobby' | 'active' | 'finished';
export type CardStatus = 'available' | 'in_hand' | 'played' | 'discarded';
export type BotDifficulty = 'easy' | 'normal' | 'hard';
export type WinCondition = 'breakout' | 'collasso' | 'defcon' | 'turni' | 'diplomazia';

// Carta del gioco
export interface GameCard {
  card_id: string;         // es. "C025", "E001"
  card_name: string;
  faction: Faction | 'Neutrale';
  card_type: CardType;
  op_points: number;
  deck_type: DeckType;
  description?: string;
  // Effetti sui tracciati
  effects: CardEffects;
}

// Effetti di una carta sui tracciati (funzione del valore corrente)
export interface CardEffects {
  nucleare?: (val: number) => number;
  sanzioni?: (val: number) => number;
  opinione?: (val: number) => number;
  defcon?: (val: number) => number;
  risorse?: (val: number) => number;
  stabilita?: (val: number) => number;
}

// Stato tracciati globali
export interface GameState {
  id: string;
  game_id: string;
  // ─── Tracciati GLOBALI ──────────────────────────────────
  nucleare: number;           // Nucleare Iraniano [1-15]
  sanzioni: number;           // Sanzioni / Stabilità Economica [1-10]
  opinione: number;           // Opinione Globale [-10,+10]
  defcon: number;             // DEFCON [5→1]
  // ─── Tracciati IRAN ─────────────────────────────────────
  risorse_iran: number;               // Risorse Economiche [1-10] → PO
  forze_militari_iran: number;        // Forze Militari [1-10]
  tecnologia_nucleare_iran: number;   // Tecnologia Nucleare (fazione) [1-10]
  stabilita_iran: number;             // Indicatore Stabilità Interna [1-10]
  // ─── Tracciati COALIZIONE ────────────────────────────────
  risorse_coalizione: number;                 // Risorse Militari [1-15] → PO
  influenza_diplomatica_coalizione: number;   // Influenza Diplomatica [1-10]
  tecnologia_avanzata_coalizione: number;     // Tecnologia Avanzata [1-10]
  supporto_pubblico_coalizione: number;       // Indicatore Supporto Pubblico [1-10]
  // ─── Tracciati RUSSIA ────────────────────────────────────
  risorse_russia: number;             // Energia/Risorse [1-10] → PO
  influenza_militare_russia: number;  // Influenza Militare [1-10]
  veto_onu_russia: number;            // Veto ONU [0-3]
  stabilita_economica_russia: number; // Indicatore Stabilità Economica [1-10]
  // ─── Tracciati CINA ──────────────────────────────────────
  risorse_cina: number;               // Potenza Economica [1-12] → PO
  influenza_commerciale_cina: number; // Influenza Commerciale [1-10]
  cyber_warfare_cina: number;         // Cyber Warfare [1-10]
  stabilita_rotte_cina: number;       // Indicatore Stabilità Rotte Commerciali [1-10]
  // ─── Tracciati EUROPA ────────────────────────────────────
  risorse_europa: number;             // Stabilità Energetica [1-10] → PO
  influenza_diplomatica_europa: number; // Influenza Diplomatica [1-10]
  aiuti_umanitari_europa: number;     // Aiuti Umanitari [1-10]
  coesione_ue_europa: number;         // Indicatore Coesione Interna UE [1-10]
  // ─── Tracciati militari (legacy, mantenuti per compatibilità) ──
  stabilita_coalizione: number;
  stabilita_russia: number;
  stabilita_cina: number;
  stabilita_europa: number;
  forze_militari_coalizione: number;
  forze_militari_russia: number;
  forze_militari_cina: number;
  forze_militari_europa: number;
  // Pool unità disponibili (jsonb → oggetto)
  units_iran:       Record<string, number>;
  units_coalizione: Record<string, number>;
  units_russia:     Record<string, number>;
  units_cina:       Record<string, number>;
  units_europa:     Record<string, number>;
  // Capacità speciali
  special_uses: {
    veto_russia: number;       // usi rimanenti (max 3)
    hormuz_iran: boolean;      // Stretto di Hormuz attivo
    superiorita_aerea: boolean;
  };
  active_alliances: string[]; // es. ['Iran-Russia']
  active_faction: Faction;
  // ─── Sistema eventi ─────────────────────────────────────────────
  last_event_turn: number | null;   // turno in cui è stato pescato l'ultimo evento
  last_event_id:   string | null;   // codice evento pescato (es. 'E07')
  updated_at: string;
}

// Stato influenze e unità per territorio
export interface TerritoryRecord {
  id: string;
  game_id: string;
  territory: string;
  inf_iran: number;
  inf_coalizione: number;
  inf_russia: number;
  inf_cina: number;
  inf_europa: number;
  updated_at: string;
}

// Unità militare schierata
export interface MilitaryUnitRecord {
  id: string;
  game_id: string;
  faction: Faction;
  territory: string;
  unit_type: string;
  quantity: number;
  updated_at: string;
}

// Voce del log di combattimento
export interface CombatLogRecord {
  id: string;
  game_id: string;
  turn_number: number;
  attacker: Faction;
  defender: Faction;
  territory: string;
  unit_types_used: string[];
  attack_force: number;
  defense_force: number;
  result: string;
  inf_change_atk: number;
  inf_change_def: number;
  defcon_change: number;
  description?: string;
  created_at: string;
}

// Profilo utente
export interface Profile {
  id: string;
  username: string;
  avatar_color: string;
  games_played: number;
  games_won: number;
  created_at: string;
}

// Partita
export interface Game {
  id: string;
  code: string;
  name: string;
  status: GameStatus;
  current_turn: number;
  max_turns: number;
  winner_faction?: Faction;
  winner_condition?: WinCondition;
  created_by: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

// Giocatore in partita (umano o bot)
export interface GamePlayer {
  id: string;
  game_id: string;
  faction: Faction;
  player_id?: string;       // null se bot
  is_bot: boolean;
  bot_difficulty: BotDifficulty;
  turn_order: number;
  is_ready: boolean;
  profile?: Profile;        // join
}

// Carta nel mazzo di una partita
export interface DeckCard {
  id: string;
  game_id: string;
  faction: Faction | 'Neutrale';
  card_id: string;
  card_name: string;
  card_type: CardType;
  op_points: number;
  deck_type: DeckType;
  status: CardStatus;
  held_by_faction?: Faction;
  played_at_turn?: number;
  position: number;
}

// Mossa registrata nel log
export interface MoveLog {
  id: string;
  game_id: string;
  turn_number: number;
  faction: Faction;
  player_id?: string;
  is_bot_move: boolean;
  card_id: string;
  card_name: string;
  card_type: CardType;
  delta_nucleare: number;
  delta_sanzioni: number;
  delta_opinione: number;
  delta_defcon: number;
  delta_risorse: number;
  delta_stabilita: number;
  stato_nucleare: number;
  stato_sanzioni: number;
  stato_opinione: number;
  stato_defcon: number;
  description?: string;
  bot_reason?: string;
  created_at: string;
}

// Condizioni di fine partita
export interface WinCheck {
  isOver: boolean;
  winner?: Faction;
  condition?: WinCondition;
  message?: string;
}

// Contesto completo di una partita attiva
export interface ActiveGame {
  game: Game;
  players: GamePlayer[];
  state: GameState;
  myFaction?: Faction;
  isMyTurn: boolean;
  recentMoves: MoveLog[];
}

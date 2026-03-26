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
  nucleare: number;
  sanzioni: number;
  opinione: number;
  defcon: number;
  risorse_iran: number;
  risorse_coalizione: number;
  risorse_russia: number;
  risorse_cina: number;
  risorse_europa: number;
  stabilita_iran: number;
  stabilita_coalizione: number;
  stabilita_russia: number;
  stabilita_cina: number;
  stabilita_europa: number;
  // Tracciati militari (usati dal mercato risorse)
  forze_militari_iran: number;        // 1-10: capacità militare Iran (IRGC)
  forze_militari_coalizione: number;  // 1-10: capacità militare Coalizione
  active_faction: Faction;
  updated_at: string;
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

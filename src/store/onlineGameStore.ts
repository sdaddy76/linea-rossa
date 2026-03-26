// =============================================
// LINEA ROSSA — Game Store con Supabase Real-Time
// =============================================
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type {
  Game, GamePlayer, GameState, MoveLog,
  Profile, Faction, DeckCard,
} from '@/types/game';
import {
  botSelectCard, applyCardEffects, checkWinCondition, nextFaction,
} from '@/lib/botEngine';
import { getFullDeck, shuffleDeck } from '@/data/mazzi';

interface OnlineGameStore {
  // Auth
  profile: Profile | null;
  session: { user: { id: string } } | null;

  // Partita corrente
  game: Game | null;
  players: GamePlayer[];
  gameState: GameState | null;
  myFaction: Faction | null;
  moves: MoveLog[];
  deckCards: DeckCard[];

  // UI
  loading: boolean;
  error: string | null;
  isBotThinking: boolean;
  gameOverInfo: { winner?: Faction; condition: string; message: string } | null;
  notification: string | null;

  // Actions
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
  loadGame: (gameId: string) => Promise<void>;
  startGame: () => Promise<void>;
  playCard: (cardId: string) => Promise<void>;
  runBotTurn: () => Promise<void>;
  subscribeToGame: (gameId: string) => () => void;
  clearError: () => void;
  setNotification: (msg: string | null) => void;
}

export const useOnlineGameStore = create<OnlineGameStore>((set, get) => ({
  profile: null,
  session: null,
  game: null,
  players: [],
  gameState: null,
  myFaction: null,
  moves: [],
  deckCards: [],
  loading: false,
  error: null,
  isBotThinking: false,
  gameOverInfo: null,
  notification: null,

  // -----------------------------------------------
  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ session });
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) set({ profile: profile as Profile });
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) set({ profile: profile as Profile });
      } else {
        set({ profile: null, game: null, gameState: null, players: [] });
      }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ profile: null, session: null, game: null, gameState: null });
  },

  // -----------------------------------------------
  loadGame: async (gameId: string) => {
    set({ loading: true, error: null });
    try {
      const [gameRes, playersRes, stateRes, movesRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('game_players').select('*, profile:profiles(*)').eq('game_id', gameId),
        supabase.from('game_state').select('*').eq('game_id', gameId).single(),
        supabase.from('moves_log').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(20),
      ]);

      const { profile } = get();
      const players = (playersRes.data ?? []) as GamePlayer[];
      const myPlayer = players.find(p => p.player_id === profile?.id);

      set({
        game: gameRes.data as Game,
        players,
        gameState: stateRes.data as GameState,
        myFaction: myPlayer?.faction ?? null,
        moves: (movesRes.data ?? []) as MoveLog[],
        loading: false,
      });
    } catch (err) {
      set({ error: 'Errore nel caricamento della partita', loading: false });
    }
  },

  // -----------------------------------------------
  startGame: async () => {
    const { game, players } = get();
    if (!game) return;
    set({ loading: true });

    // 1. Aggiorna stato partita ad "active"
    await supabase.from('games').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', game.id);

    // 2. Inizializza mazzi: crea cards_deck per ogni fazione
    const deckRows: {
      game_id: string; faction: string; card_id: string;
      card_name: string; card_type: string; op_points: number;
      deck_type: string; status: string; position: number;
    }[] = [];

    const factions = players.map(p => p.faction) as Faction[];
    for (const faction of factions) {
      const deck = getFullDeck(faction);
      deck.forEach((card, idx) => {
        deckRows.push({
          game_id: game.id,
          faction,
          card_id: card.card_id,
          card_name: card.card_name,
          card_type: card.card_type,
          op_points: card.op_points,
          deck_type: card.deck_type,
          status: 'available',
          position: idx + 1,
        });
      });
    }
    await supabase.from('cards_deck').insert(deckRows);

    // 3. Ricarica
    await get().loadGame(game.id);
    set({ loading: false });

    // 4. Se il primo turno è di un bot, eseguilo
    const state = get().gameState;
    const firstPlayer = players.find(p => p.faction === state?.active_faction);
    if (firstPlayer?.is_bot) {
      setTimeout(() => get().runBotTurn(), 1500);
    }
  },

  // -----------------------------------------------
  playCard: async (cardId: string) => {
    const { game, gameState, myFaction, players, moves } = get();
    if (!game || !gameState || !myFaction) return;
    if (gameState.active_faction !== myFaction) {
      set({ error: 'Non è il tuo turno!' }); return;
    }

    set({ loading: true, error: null });

    try {
      // Trova la carta nel mazzo
      const { data: deckCard } = await supabase
        .from('cards_deck')
        .select('*')
        .eq('game_id', game.id)
        .eq('card_id', cardId)
        .eq('status', 'available')
        .single();

      if (!deckCard) throw new Error('Carta non disponibile');

      // Importa carta dalla libreria mazzi per effetti
      const { MAZZI_PER_FAZIONE, MAZZI_SPECIALI } = await import('@/data/mazzi');
      const allCards = [
        ...(MAZZI_PER_FAZIONE[myFaction] ?? []),
        ...(MAZZI_SPECIALI[myFaction] ?? []),
      ];
      const cardDef = allCards.find(c => c.card_id === cardId);
      if (!cardDef) throw new Error('Definizione carta non trovata');

      // Applica effetti
      const { newState, deltas } = applyCardEffects(cardDef, gameState, myFaction);

      // Controlla vittoria
      const merged = { ...gameState, ...newState } as GameState;
      const winCheck = checkWinCondition(merged, game.current_turn, game.max_turns);

      const nextFact = winCheck.isOver ? gameState.active_faction : nextFaction(myFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      // Transazione: aggiorna stato + segna carta giocata + log mossa
      const { profile } = get();
      await Promise.all([
        supabase.from('game_state').update({
          ...newState,
          active_faction: nextFact,
        }).eq('game_id', game.id),

        supabase.from('cards_deck').update({
          status: 'played',
          played_at_turn: game.current_turn,
        }).eq('id', deckCard.id),

        supabase.from('moves_log').insert({
          game_id: game.id,
          turn_number: game.current_turn,
          faction: myFaction,
          player_id: profile?.id,
          is_bot_move: false,
          card_id: cardId,
          card_name: deckCard.card_name,
          card_type: deckCard.card_type,
          delta_nucleare: deltas.nucleare,
          delta_sanzioni: deltas.sanzioni,
          delta_opinione: deltas.opinione,
          delta_defcon: deltas.defcon,
          delta_risorse: deltas.risorse,
          delta_stabilita: deltas.stabilita,
          stato_nucleare: merged.nucleare,
          stato_sanzioni: merged.sanzioni,
          stato_opinione: merged.opinione,
          stato_defcon: merged.defcon,
          description: cardDef.description,
        }),

        winCheck.isOver
          ? supabase.from('games').update({
              status: 'finished',
              winner_faction: winCheck.winner,
              winner_condition: winCheck.condition,
              finished_at: new Date().toISOString(),
            }).eq('id', game.id)
          : supabase.from('games').update({ current_turn: nextTurn }).eq('id', game.id),
      ]);

      // Aggiorna stato locale
      set(s => ({
        gameState: { ...s.gameState!, ...newState, active_faction: nextFact },
        game: { ...s.game!, current_turn: nextTurn, status: winCheck.isOver ? 'finished' : 'active' },
        moves: [{ ...moves[0], card_name: deckCard.card_name } as MoveLog, ...s.moves].slice(0, 30),
        loading: false,
        gameOverInfo: winCheck.isOver ? {
          winner: winCheck.winner,
          condition: winCheck.condition ?? '',
          message: winCheck.message ?? '',
        } : null,
      }));

      // Se il prossimo è un bot, eseguilo
      if (!winCheck.isOver) {
        const nextPlayer = players.find(p => p.faction === nextFact);
        if (nextPlayer?.is_bot) {
          setTimeout(() => get().runBotTurn(), 2000);
        }
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore', loading: false });
    }
  },

  // -----------------------------------------------
  runBotTurn: async () => {
    const { game, gameState, players } = get();
    if (!game || !gameState || game.status !== 'active') return;

    const botFaction = gameState.active_faction as Faction;
    const botPlayer = players.find(p => p.faction === botFaction);
    if (!botPlayer?.is_bot) return;

    set({ isBotThinking: true });

    try {
      // Recupera carte disponibili per il bot
      const { data: available } = await supabase
        .from('cards_deck')
        .select('*')
        .eq('game_id', game.id)
        .eq('faction', botFaction)
        .eq('status', 'available')
        .limit(10);

      if (!available || available.length === 0) {
        // Mazzo esaurito: turno saltato, passa al prossimo
        const nextFact = nextFaction(botFaction);
        await supabase.from('game_state').update({ active_faction: nextFact }).eq('game_id', game.id);
        set(s => ({
          gameState: { ...s.gameState!, active_faction: nextFact },
          isBotThinking: false,
          notification: `🤖 ${botFaction}: mazzo esaurito, turno passato`,
        }));
        const nextPlayer = players.find(p => p.faction === nextFact);
        if (nextPlayer?.is_bot) setTimeout(() => get().runBotTurn(), 1500);
        return;
      }

      // Importa dati carte dalla libreria
      const { MAZZI_PER_FAZIONE, MAZZI_SPECIALI } = await import('@/data/mazzi');
      const allCards = [
        ...(MAZZI_PER_FAZIONE[botFaction] ?? []),
        ...(MAZZI_SPECIALI[botFaction] ?? []),
      ];

      // Mappa: card_id → definizione completa
      const availableWithDef = available
        .map(dc => allCards.find(c => c.card_id === dc.card_id))
        .filter(Boolean) as typeof allCards;

      if (availableWithDef.length === 0) {
        set({ isBotThinking: false }); return;
      }

      // Bot sceglie la carta migliore
      const decision = botSelectCard(availableWithDef, gameState, botFaction, botPlayer.bot_difficulty as 'easy'|'normal'|'hard');
      if (!decision) { set({ isBotThinking: false }); return; }

      // Breve pausa per simulare "pensiero" del bot
      await new Promise(r => setTimeout(r, 1200));

      // Applica la carta scelta
      const { newState, deltas } = applyCardEffects(decision.card, gameState, botFaction);
      const merged = { ...gameState, ...newState } as GameState;
      const winCheck = checkWinCondition(merged, game.current_turn, game.max_turns);
      const nextFact = winCheck.isOver ? gameState.active_faction : nextFaction(botFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      await Promise.all([
        supabase.from('game_state').update({ ...newState, active_faction: nextFact }).eq('game_id', game.id),
        supabase.from('cards_deck').update({ status: 'played', played_at_turn: game.current_turn })
          .eq('game_id', game.id).eq('card_id', decision.card.card_id),
        supabase.from('moves_log').insert({
          game_id: game.id,
          turn_number: game.current_turn,
          faction: botFaction,
          player_id: null,
          is_bot_move: true,
          card_id: decision.card.card_id,
          card_name: decision.card.card_name,
          card_type: decision.card.card_type,
          delta_nucleare: deltas.nucleare,
          delta_sanzioni: deltas.sanzioni,
          delta_opinione: deltas.opinione,
          delta_defcon: deltas.defcon,
          delta_risorse: deltas.risorse,
          delta_stabilita: deltas.stabilita,
          stato_nucleare: merged.nucleare,
          stato_sanzioni: merged.sanzioni,
          stato_opinione: merged.opinione,
          stato_defcon: merged.defcon,
          description: decision.card.description,
          bot_reason: decision.reason,
        }),
        winCheck.isOver
          ? supabase.from('games').update({ status: 'finished', winner_faction: winCheck.winner, winner_condition: winCheck.condition, finished_at: new Date().toISOString() }).eq('id', game.id)
          : supabase.from('games').update({ current_turn: nextTurn }).eq('id', game.id),
      ]);

      set(s => ({
        gameState: { ...s.gameState!, ...newState, active_faction: nextFact },
        game: { ...s.game!, current_turn: nextTurn, status: winCheck.isOver ? 'finished' : 'active' },
        isBotThinking: false,
        notification: `🤖 ${botFaction} ha giocato: ${decision.card.card_name}`,
        gameOverInfo: winCheck.isOver ? {
          winner: winCheck.winner,
          condition: winCheck.condition ?? '',
          message: winCheck.message ?? '',
        } : null,
      }));

      // Catena bot: se il prossimo è ancora un bot, esegui
      if (!winCheck.isOver) {
        const nextPlayer = players.find(p => p.faction === nextFact);
        if (nextPlayer?.is_bot) {
          setTimeout(() => get().runBotTurn(), 2000);
        }
      }
    } catch (err) {
      set({ isBotThinking: false, error: 'Errore nel turno bot' });
    }
  },

  // -----------------------------------------------
  subscribeToGame: (gameId: string) => {
    // Real-time: game_state changes
    const stateSub = supabase
      .channel(`game-state-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'game_state',
        filter: `game_id=eq.${gameId}`,
      }, payload => {
        set({ gameState: payload.new as GameState });
      })
      .subscribe();

    // Real-time: nuove mosse nel log
    const movesSub = supabase
      .channel(`moves-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'moves_log',
        filter: `game_id=eq.${gameId}`,
      }, payload => {
        const newMove = payload.new as MoveLog;
        set(s => ({ moves: [newMove, ...s.moves].slice(0, 30) }));
      })
      .subscribe();

    // Real-time: cambiamenti partita (status, turno)
    const gameSub = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games',
        filter: `id=eq.${gameId}`,
      }, payload => {
        set({ game: payload.new as Game });
      })
      .subscribe();

    return () => {
      stateSub.unsubscribe();
      movesSub.unsubscribe();
      gameSub.unsubscribe();
    };
  },

  clearError: () => set({ error: null }),
  setNotification: (msg) => set({ notification: msg }),
}));

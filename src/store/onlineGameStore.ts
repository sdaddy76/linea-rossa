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
  /**
   * Acquisto risorse militari tramite carte OP.
   * @param quantita  unità da acquistare
   * @param costoOpTotale  carte OP totali da spendere (calcolate dal client con calcolaCosto)
   */
  buyMilitaryResources: (quantita: number, costoOpTotale: number) => Promise<void>;

  // ── Operazioni militari ──
  /** Carica territori e unità per la partita corrente */
  loadTerritories: () => Promise<void>;
  /** Schiera unità in un territorio (costa PO) */
  deployUnit: (territory: string, unitType: string, qty: number) => Promise<void>;
  /** Attacca un territorio: applica l'esito del combattimento */
  attackTerritory: (params: {
    territory: string;
    defender: import('@/types/game').Faction;
    unitsUsed: string[];
    attackForce: number;
    defenseForce: number;
    result: string;
    infChangeAtk: number;
    infChangeDef: number;
    defconChange: number;
    attackerUnitsLost: number;
    stabilityChange: number;
    description: string;
  }) => Promise<void>;

  territories: import('@/types/game').TerritoryRecord[];
  militaryUnits: import('@/types/game').MilitaryUnitRecord[];
  combatLog: import('@/types/game').CombatLogRecord[];
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
  territories: [],
  militaryUnits: [],
  combatLog: [],

  // -----------------------------------------------
  initAuth: async () => {
    // Recupera sessione esistente — ignora AbortError (bug noto Supabase JS v2 su SPA)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ session });
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) set({ profile: profile as Profile });
      }
    } catch (e: unknown) {
      // AbortError o errori di rete non bloccano il flusso
      if (e instanceof Error && e.name !== 'AbortError') {
        console.warn('[initAuth] errore getSession:', e.message);
      }
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) set({ profile: profile as Profile });
        } catch {
          // ignora errori di profilo transitori
        }
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
      const [gameRes, playersRes, stateRes, movesRes, deckRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('game_players').select('*, profile:profiles(*)').eq('game_id', gameId),
        supabase.from('game_state').select('*').eq('game_id', gameId).single(),
        supabase.from('moves_log').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(20),
        // Carica SOLO le carte disponibili della partita (tutte le fazioni)
        supabase.from('cards_deck').select('*').eq('game_id', gameId).eq('status', 'available').order('position'),
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
        deckCards: (deckRes.data ?? []) as DeckCard[],
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

    // 3. Ricarica tutto (stato + mazzo appena creato)
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

      // Aggiorna stato locale:
      // - rimuove la carta giocata da deckCards
      // - aggiorna gameState e game
      set(s => ({
        gameState: { ...s.gameState!, ...newState, active_faction: nextFact },
        game: { ...s.game!, current_turn: nextTurn, status: winCheck.isOver ? 'finished' : 'active' },
        // Rimuove la carta appena giocata dall'array locale
        deckCards: s.deckCards.filter(dc => dc.card_id !== cardId || dc.faction !== myFaction),
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
        // Rimuove carta bot giocata dall'array locale
        deckCards: s.deckCards.filter(dc => dc.card_id !== decision.card.card_id || dc.faction !== botFaction),
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

    // Real-time: carte giocate (rimuove da deckCards quando status → 'played')
    const deckSub = supabase
      .channel(`deck-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'cards_deck',
        filter: `game_id=eq.${gameId}`,
      }, payload => {
        const updatedCard = payload.new as DeckCard;
        if (updatedCard.status === 'played') {
          // Rimuove la carta giocata dalla lista locale
          set(s => ({
            deckCards: s.deckCards.filter(
              dc => !(dc.card_id === updatedCard.card_id && dc.faction === updatedCard.faction)
            ),
          }));
        }
      })
      .subscribe();

    return () => {
      stateSub.unsubscribe();
      movesSub.unsubscribe();
      gameSub.unsubscribe();
      deckSub.unsubscribe();
    };
  },

  clearError: () => set({ error: null }),
  setNotification: (msg) => set({ notification: msg }),

  // -----------------------------------------------
  buyMilitaryResources: async (quantita: number, costoOpTotale: number) => {
    const { game, gameState, myFaction, players, profile } = get();
    if (!game || !gameState || !myFaction) return;
    if (gameState.active_faction !== myFaction) {
      set({ error: 'Non è il tuo turno!' }); return;
    }
    set({ loading: true, error: null });

    try {
      // Calcola la nuova quantità di risorse per la fazione
      const risorseKey = `risorse_${myFaction.toLowerCase()}` as
        'risorse_iran' | 'risorse_coalizione' | 'risorse_russia' | 'risorse_cina' | 'risorse_europa';
      const risorseAttuali: number = gameState[risorseKey] ?? 0;
      const nuoveRisorse = Math.min(10, risorseAttuali + quantita);

      // Aggiorna game_state: risorse +quantita
      const stateUpdate: Partial<GameState> = { [risorseKey]: nuoveRisorse };

      // Passa il turno al prossimo giocatore
      const nextFact = nextFaction(myFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      await Promise.all([
        supabase.from('game_state').update({
          ...stateUpdate,
          active_faction: nextFact,
        }).eq('game_id', game.id),

        // Log mossa: segna come market_purchase
        supabase.from('moves_log').insert({
          game_id: game.id,
          turn_number: game.current_turn,
          faction: myFaction,
          player_id: profile?.id ?? null,
          is_bot_move: false,
          card_id: 'MARKET',
          card_name: `Acquisto risorse (×${quantita})`,
          card_type: 'Militare',
          delta_nucleare: 0,
          delta_sanzioni: 0,
          delta_opinione: 0,
          delta_defcon: 0,
          delta_risorse: quantita,
          delta_stabilita: 0,
          stato_nucleare: gameState.nucleare,
          stato_sanzioni: gameState.sanzioni,
          stato_opinione: gameState.opinione,
          stato_defcon: gameState.defcon,
          description: `Acquisto mercato: ${quantita} unità risorse militari — ${costoOpTotale} OP spesi`,
          is_market_purchase: true,
          market_op_spent: costoOpTotale,
          market_resources: quantita,
        }),

        supabase.from('games').update({ current_turn: nextTurn }).eq('id', game.id),
      ]);

      // Aggiorna stato locale
      set(s => ({
        gameState: { ...s.gameState!, ...stateUpdate, active_faction: nextFact } as GameState,
        game: { ...s.game!, current_turn: nextTurn },
        loading: false,
        notification: `⚔️ ${myFaction}: acquistate ${quantita} risorse militari (${costoOpTotale} OP spesi)`,
      }));

      // Se il prossimo è un bot, eseguilo
      const nextPlayer = players.find(p => p.faction === nextFact);
      if (nextPlayer?.is_bot) {
        setTimeout(() => get().runBotTurn(), 2000);
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore acquisto', loading: false });
    }
  },

  // ── Carica territori e unità ────────────────────────────────────────────────
  loadTerritories: async () => {
    const { game } = get();
    if (!game) return;
    const [{ data: terr }, { data: units }, { data: clog }] = await Promise.all([
      supabase.from('territories').select('*').eq('game_id', game.id),
      supabase.from('military_units').select('*').eq('game_id', game.id),
      supabase.from('combat_log').select('*').eq('game_id', game.id).order('created_at', { ascending: false }).limit(20),
    ]);
    set({
      territories:  terr  ?? [],
      militaryUnits: units ?? [],
      combatLog:    clog  ?? [],
    });
  },

  // ── Schiera unità in un territorio ─────────────────────────────────────────
  deployUnit: async (territory, unitType, qty) => {
    const { game, gameState, myFaction } = get();
    if (!game || !gameState || !myFaction) return;
    set({ loading: true });
    try {
      const unitsKey = `units_${myFaction.toLowerCase()}` as keyof typeof gameState;
      const pool = (gameState[unitsKey] as Record<string, number>) ?? {};
      const available = pool[unitType] ?? 0;
      if (available < qty) throw new Error(`Unità insufficienti: hai ${available} ${unitType}`);

      // Aggiorna pool (riduci disponibili)
      const newPool = { ...pool, [unitType]: available - qty };

      // Upsert unità nel territorio
      await Promise.all([
        supabase.from('military_units').upsert({
          game_id: game.id,
          faction: myFaction,
          territory,
          unit_type: unitType,
          quantity: qty,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'game_id,faction,territory,unit_type', ignoreDuplicates: false }),

        supabase.from('game_state').update({
          [unitsKey]: newPool,
        }).eq('game_id', game.id),
      ]);

      // Aggiorna stato locale
      const updatedGameState = { ...gameState, [unitsKey]: newPool } as typeof gameState;
      const prevUnits = get().militaryUnits;
      const existing = prevUnits.find(u => u.game_id === game.id && u.faction === myFaction && u.territory === territory && u.unit_type === unitType);
      const newUnits = existing
        ? prevUnits.map(u => u === existing ? { ...u, quantity: u.quantity + qty } : u)
        : [...prevUnits, { id: crypto.randomUUID(), game_id: game.id, faction: myFaction, territory, unit_type: unitType, quantity: qty, updated_at: new Date().toISOString() }];

      set({ gameState: updatedGameState, militaryUnits: newUnits, loading: false,
        notification: `🪖 ${myFaction}: ${qty}× ${unitType} schierato/i in ${territory}` });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore schieramento', loading: false });
    }
  },

  // ── Attacca territorio ───────────────────────────────────────────────────────
  attackTerritory: async (params) => {
    const { game, gameState, myFaction, players } = get();
    if (!game || !gameState || !myFaction) return;
    set({ loading: true });
    try {
      const {
        territory, defender, unitsUsed,
        attackForce, defenseForce, result,
        infChangeAtk, infChangeDef, defconChange,
        attackerUnitsLost, stabilityChange, description,
      } = params;

      // 1. Aggiorna influenze nel territorio
      const terrRecords = get().territories;
      const terrRec = terrRecords.find(t => t.game_id === game.id && t.territory === territory);
      const infKey   = `inf_${myFaction.toLowerCase()}`;
      const defKey   = `inf_${defender.toLowerCase()}`;
      const curAtk = terrRec ? ((terrRec as unknown) as Record<string, number>)[infKey] ?? 0 : 0;
      const curDef = terrRec ? ((terrRec as unknown) as Record<string, number>)[defKey] ?? 0 : 0;
      const newAtk  = Math.min(5, Math.max(0, curAtk + infChangeAtk));
      const newDef  = Math.min(5, Math.max(0, curDef + infChangeDef));

      await supabase.from('territories').upsert({
        game_id: game.id,
        territory,
        ...(terrRec ?? {}),
        [infKey]: newAtk,
        [defKey]: newDef,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'game_id,territory' });

      // 2. Aggiorna DEFCON e stabilità interna
      const newDefcon   = Math.max(1, gameState.defcon + defconChange);
      const stabKey     = `stabilita_${myFaction.toLowerCase()}` as keyof typeof gameState;
      const newStab     = Math.max(1, ((gameState[stabKey] as number) ?? 5) + stabilityChange);

      // 3. Pool unità: sottrai unità perse
      const unitsKey = `units_${myFaction.toLowerCase()}` as keyof typeof gameState;
      const pool = { ...((gameState[unitsKey] as Record<string, number>) ?? {}) };
      for (let i = 0; i < attackerUnitsLost && unitsUsed.length > 0; i++) {
        const ut = unitsUsed[i % unitsUsed.length];
        pool[ut] = Math.max(0, (pool[ut] ?? 0) - 1);
      }

      await supabase.from('game_state').update({
        defcon: newDefcon,
        [stabKey]: newStab,
        [unitsKey]: pool,
      }).eq('game_id', game.id);

      // 4. Scrivi combat_log
      const logEntry = {
        game_id: game.id,
        turn_number: game.current_turn,
        attacker: myFaction,
        defender,
        territory,
        unit_types_used: unitsUsed,
        attack_force: attackForce,
        defense_force: defenseForce,
        result,
        inf_change_atk: infChangeAtk,
        inf_change_def: infChangeDef,
        defcon_change: defconChange,
        description,
      };
      await supabase.from('combat_log').insert(logEntry);

      // 5. Aggiorna stato locale
      const updatedGs = {
        ...gameState,
        defcon: newDefcon,
        [stabKey]: newStab,
        [unitsKey]: pool,
      } as typeof gameState;

      const updTerr = terrRecords.map(t =>
        t.game_id === game.id && t.territory === territory
          ? { ...t, [infKey]: newAtk, [defKey]: newDef }
          : t
      );
      if (!terrRec) {
        updTerr.push({
          id: crypto.randomUUID(), game_id: game.id, territory,
          inf_iran: 0, inf_coalizione: 0, inf_russia: 0, inf_cina: 0, inf_europa: 0,
          [infKey]: newAtk, [defKey]: newDef,
          updated_at: new Date().toISOString(),
        } as import('@/types/game').TerritoryRecord);
      }

      set({
        gameState: updatedGs,
        territories: updTerr,
        combatLog: [{ ...logEntry, id: crypto.randomUUID(), created_at: new Date().toISOString() } as import('@/types/game').CombatLogRecord, ...get().combatLog].slice(0, 20),
        loading: false,
        notification: `⚔️ ${result.toUpperCase().replace('_', ' ')}: ${myFaction} attacca ${territory} — ${description}`,
      });

      // Controlla DEFCON 1
      if (newDefcon <= 1) {
        set({ gameOverInfo: { winner: null, condition: 'defcon', message: '☢️ GUERRA TERMONUCLEARE — tutti perdono!' } });
      }

      // Passa turno al bot se necessario
      const nextFact = nextFaction(myFaction);
      const nextPlayer = players.find(p => p.faction === nextFact);
      if (nextPlayer?.is_bot) {
        setTimeout(() => get().runBotTurn(), 2000);
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore combattimento', loading: false });
    }
  },
}));

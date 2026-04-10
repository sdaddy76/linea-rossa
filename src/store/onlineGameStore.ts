// =============================================
// LINEA ROSSA — Game Store con Supabase Real-Time
// =============================================

// ── Helper: wrappa una Promise con timeout ────────────────────────────────────
async function withTimeout<T>(promise: Promise<T>, ms = 8000, label = ''): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout ${label} dopo ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type {
  Game, GamePlayer, GameState, MoveLog,
  Profile, Faction, DeckCard,
} from '@/types/game';
import {
  botSelectCard, applyCardEffects, checkWinCondition, nextFaction,
  applyTerritoryBonuses, checkTerritoryObjectives, applyHormuzBlockade,
} from '@/lib/botEngine';
import { getFullDeck, getUnifiedDeck, shuffleDeck, UNIFIED_HAND_SIZE, UNIFIED_DRAW_PER_TURN, CLASSIC_HAND_SIZE, CLASSIC_DRAW_PER_TURN, MAZZI_PER_FAZIONE, MAZZI_SPECIALI, MAZZO_NEUTRALE } from '@/data/mazzi';
import { TERRITORIES } from '@/lib/territoriesData';
import { assignObjectives, TUTTI_GLI_OBIETTIVI, type ObjFazione, type ObiettivoSegreto } from '@/data/obiettivi';
import type { TerritoryRecord } from '@/types/game';

// ─── Helper: applica meccaniche di fine turno (bonus + obiettivi territoriali) ─
//
// Questa funzione viene chiamata dopo ogni mossa (playCard, playCardUnified,
// runBotTurn) prima di aggiornare Supabase con active_faction=nextFact.
// Restituisce lo stato aggiornato con bonus territoriali già applicati,
// insieme a log e obiettivi completati.
//
async function applyEndOfTurnMechanics(
  gameId: string,
  gameState: import('@/types/game').GameState,
  territories: TerritoryRecord[],
  players: import('@/types/game').GamePlayer[],
  militaryUnits: import('@/types/game').MilitaryUnitRecord[],
  currentStateUpdate: Partial<import('@/types/game').GameState>,
  completedObjIds: Set<string>,
): Promise<{
  enrichedStateUpdate: Partial<import('@/types/game').GameState>;
  bonusNotifications: string[];
  newObjectives: Array<{ obj_id: string; faction: import('@/types/game').Faction; nome: string; punti: number; message: string }>;
}> {
  // 1. Calcola lo stato "merged" dopo la carta appena giocata
  const mergedState = { ...gameState, ...currentStateUpdate } as import('@/types/game').GameState;

  // 2. Applica bonus territoriali passivi
  const { newState: bonusState, bonusLog } = applyTerritoryBonuses(mergedState, territories);

  // 2b. Blocco Stretto di Hormuz (basato su unità militari Iran in Hormuz)
  const hormuzMerged = { ...mergedState, ...bonusState } as import('@/types/game').GameState;
  const { newState: hormuzState, isActive: hormuzActive, log: hormuzLog } =
    applyHormuzBlockade(hormuzMerged, militaryUnits);

  // 3. Genera notifiche human-readable per i bonus
  const bonusNotifications: string[] = [];
  for (const entry of bonusLog) {
    const deltaStr = Object.entries(entry.deltas)
      .filter(([, v]) => v !== 0 && v !== undefined)
      .map(([k, v]) => `${k.replace(/_/g, ' ')} ${(v as number) > 0 ? '+' : ''}${v}`)
      .join(', ');
    if (deltaStr) {
      bonusNotifications.push(`🗺️ ${entry.faction} (${entry.territory}): ${entry.territoryLabel} → ${deltaStr}`);
    }
  }
  // Aggiungi notifiche blocco Hormuz
  if (hormuzActive) {
    bonusNotifications.push(...hormuzLog);
  }

  // 4. Verifica obiettivi territoriali
  const activeFactions = players.map(p => p.faction as import('@/types/game').Faction);
  const { newlyCompleted } = checkTerritoryObjectives(territories, completedObjIds, activeFactions);

  // 5. Salva gli obiettivi completati in Supabase (non bloccante)
  for (const obj of newlyCompleted) {
    supabase.from('game_objectives').update({
      completato: true,
      punteggio:  obj.punti,
    })
      .eq('game_id', gameId)
      .eq('faction', obj.faction)
      .eq('obj_id', obj.obj_id)
      .then(({ error }) => {
        if (error) console.warn('[endOfTurn] game_objectives update warn:', error.message);
      });
  }

  // 6. Combina stato carta + bonus territoriali nell'update finale
  // Filtra TUTTO tramite SAFE_GAME_STATE_KEYS — incluso hormuzState.
  // special_uses (da applyHormuzBlockade quando blocco decade) viene gestito
  // separatamente in modo non bloccante per evitare 400 Bad Request.
  const SAFE_GAME_STATE_KEYS = new Set([
    // globali
    'nucleare', 'sanzioni', 'opinione', 'defcon',
    // risorse per fazione
    'risorse_iran', 'risorse_coalizione', 'risorse_russia', 'risorse_cina', 'risorse_europa',
    // stabilità per fazione
    'stabilita_iran', 'stabilita_coalizione', 'stabilita_russia', 'stabilita_cina', 'stabilita_europa',
    // forze militari per fazione
    'forze_militari_iran', 'forze_militari_coalizione', 'forze_militari_russia',
    'forze_militari_cina', 'forze_militari_europa',
    // tracciati russia (add_faction_tracks.sql)
    'veto_onu_russia',
    'influenza_militare_russia', 'stabilita_economica_russia',
    // tracciati coalizione (add_faction_tracks.sql)
    'influenza_diplomatica_coalizione', 'supporto_pubblico_coalizione', 'tecnologia_avanzata_coalizione',
    // tracciati cina (add_faction_tracks.sql)
    'influenza_commerciale_cina', 'stabilita_rotte_cina', 'cyber_warfare_cina',
    // tracciati europa (add_faction_tracks.sql)
    'influenza_diplomatica_europa', 'aiuti_umanitari_europa', 'coesione_ue_europa',
    // tracciati iran (add_faction_tracks.sql)
    'tecnologia_nucleare_iran',
  ]);

  const filteredBonusState = Object.fromEntries(
    Object.entries(bonusState).filter(([k]) => SAFE_GAME_STATE_KEYS.has(k))
  ) as Partial<import('@/types/game').GameState>;

  // Filtra hormuzState: estrae solo i campi numerici safe (risorse_coalizione,
  // risorse_europa, opinione). Il campo special_uses (reset hormuz_iran) viene
  // aggiornato separatamente in modo non bloccante.
  const filteredHormuzState = Object.fromEntries(
    Object.entries(hormuzState).filter(([k]) => SAFE_GAME_STATE_KEYS.has(k))
  ) as Partial<import('@/types/game').GameState>;

  // Se il blocco è appena decaduto (hormuz_iran=false in hormuzState.special_uses),
  // aggiorna special_uses in background senza bloccare il flusso principale.
  const hormuzSpecialUses = (hormuzState as Record<string, unknown>).special_uses;
  if (hormuzSpecialUses && typeof hormuzSpecialUses === 'object') {
    supabase.from('game_state')
      .update({ special_uses: hormuzSpecialUses })
      .eq('game_id', gameId)
      .then(({ error }) => {
        if (error) console.warn('[endOfTurn] special_uses reset warn:', error.message);
      });
  }

  const filteredCardState = Object.fromEntries(
    Object.entries(currentStateUpdate).filter(([k]) => SAFE_GAME_STATE_KEYS.has(k))
  ) as Partial<import('@/types/game').GameState>;
  const enrichedStateUpdate = { ...filteredCardState, ...filteredBonusState, ...filteredHormuzState };

  return { enrichedStateUpdate, bonusNotifications, newObjectives: newlyCompleted };
}

interface OnlineGameStore {
  // Auth
  profile: Profile | null;
  session: { user: { id: string; email?: string } } | null;

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
  vetoPending: { sanzioniDelta: number; cardName: string } | null;

  // Actions
  initAuth: () => Promise<void>;
  pauseAuthListener: () => void;   // sospende onAuthStateChange (prima di updateUser)
  resumeAuthListener: () => void;  // riattiva onAuthStateChange (dopo updateUser)
  logout: () => Promise<void>;
  /** Resetta tutto lo stato di gioco (usa quando si torna alla lobby) */
  resetGame: () => void;
  loadGame: (gameId: string, forceFaction?: string | null) => Promise<void>;
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

  // ── Mazzo unificato ──
  /** Inizializza il mazzo unificato (tutte le fazioni) e distribuisce le mani */
  initUnifiedDeck: () => Promise<void>;
  /** Gioca una carta in modalità unificata: event=gioca come evento, ops=gioca come OP */
  playCardUnified: (cardDbId: string, mode: 'event' | 'ops') => Promise<void>;
  /** Pesca UNIFIED_DRAW_PER_TURN carte per la fazione indicata dal mazzo residuo */
  drawCards: (faction: Faction) => Promise<void>;
  /** Carte in mano alla mia fazione (filtered from deckCards by held_by_faction) */
  myHand: () => DeckCard[];

  // ── Operazioni militari ──
  /** Carica territori e unità per la partita corrente */
  loadTerritories: () => Promise<void>;
  /** Aggiunge influenza in un territorio (esito dado positivo) */
  addInfluence: (territory: string, delta: number) => Promise<void>;
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

  /**
   * Gioca una carta in modalità OP eseguendo UNA delle 3 azioni:
   *  - 'buy'       → acquista unità (unitType + qty)
   *  - 'influence' → aggiungi influenza in un territorio (delta = opSpent)
   *  - 'attack'    → attacco con esito già calcolato
   * Dopo l'azione chiama playCardUnified(cardId, 'ops') per marcare la carta come giocata.
   */
  playCardOps: (
    cardId: string,
    action: 'buy' | 'influence' | 'attack',
    params: {
      unitType?: string; qty?: number; opSpent?: number;
      territory?: string;
      unitTypes?: string[]; attackForce?: number; defenseForce?: number;
      result?: string; infChangeAtk?: number; infChangeDef?: number;
      defconChange?: number; description?: string;
      attackerUnitsLost?: number; stabilityChange?: number;
    }
  ) => Promise<void>;

  territories: import('@/types/game').TerritoryRecord[];
  militaryUnits: import('@/types/game').MilitaryUnitRecord[];
  combatLog: import('@/types/game').CombatLogRecord[];

  // ── Obiettivi Segreti ──────────────────────────────────────────────────────
  /** Gli obiettivi segreti della mia fazione per questa partita (3 estratti a caso) */
  myObjectives: ObiettivoSegreto[];
  /**
   * Estrae e salva gli obiettivi segreti per la fazione indicata.
   * - In modalità online: salva in Supabase tramite la funzione RPC assign_objectives_to_faction
   * - In modalità locale/fallback: usa il pool locale in obiettivi.ts
   * @param faction  la fazione del giocatore
   * @param numDraw  quanti obiettivi estrarre (default 3)
   */
  assignObjectivesToFaction: (faction: string, numDraw?: number) => Promise<ObiettivoSegreto[]>;
  /**
   * Carica gli obiettivi già assegnati per questa partita dalla tabella game_objectives.
   * Chiamare in loadGame() per ripristinare dopo un refresh.
   */
  loadMyObjectives: (faction: string) => Promise<void>;
  /**
   * Marca un obiettivo come completato e aggiorna il punteggio in Supabase.
   */
  markObjectiveComplete: (objId: string, completed: boolean) => Promise<void>;
  useVeto: (use: boolean) => Promise<void>;
}

// Subscription onAuthStateChange — variabile modulo per pause/resume senza re-render
let _authUnsubscribe: (() => void) | null = null;

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
  vetoPending: null,
  territories: [],
  militaryUnits: [],
  combatLog: [],
  myObjectives: [],

  // ── VETO ONU Russia: manuale ─────────────────────────────────────────
  useVeto: async (use: boolean) => {
    const { gameState, game, vetoPending } = get();
    if (!vetoPending || !gameState || !game) return;
    try {
      let newState = { ...gameState };
      if (use) {
        // Consuma 1 veto e NON aumenta le sanzioni
        newState = {
          ...gameState,
          veto_onu_russia: Math.max(0, (gameState.veto_onu_russia ?? 1) - 1),
        };
        await supabase.from('game_state').update({ veto_onu_russia: newState.veto_onu_russia }).eq('game_id', game.id);
        set(s => ({
          gameState: { ...s.gameState!, veto_onu_russia: newState.veto_onu_russia },
          vetoPending: null,
          notification: `🏛️ Russia ha usato il VETO ONU — sanzioni bloccate (${newState.veto_onu_russia} rimasti)`,
        }));
      } else {
        // Non usa il veto: le sanzioni aumentano normalmente
        const newSanzioni = Math.max(1, Math.min(10, (gameState.sanzioni ?? 5) + vetoPending.sanzioniDelta));
        newState = { ...gameState, sanzioni: newSanzioni };
        await supabase.from('game_state').update({ sanzioni: newSanzioni }).eq('game_id', game.id);
        set(s => ({
          gameState: { ...s.gameState!, sanzioni: newSanzioni },
          vetoPending: null,
          notification: `Russia non usa il veto — sanzioni aumentate di +${vetoPending.sanzioniDelta}`,
        }));
      }
    } catch (err) {
      set({ vetoPending: null, error: 'Errore veto Russia' });
    }
  },

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // PASSWORD_RECOVERY: Supabase v2 emette questo evento quando arriva un link di reset.
      // Non aggiornare la sessione nello store — App.tsx gestisce la navigazione.
      if (_event === 'PASSWORD_RECOVERY') return;

      // Pulisci l'URL se ancora sporco (access_token nell'hash)
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

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
    // Salva la funzione di unsubscribe per pause/resume
    _authUnsubscribe = () => subscription.unsubscribe();
  },

  pauseAuthListener: () => {
    if (_authUnsubscribe) {
      _authUnsubscribe();
      _authUnsubscribe = null;
      console.log('[auth] listener sospeso per updateUser');
    }
  },

  resumeAuthListener: () => {
    // Riattiva registrando un nuovo listener (equivalente a initAuth senza getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') return;
      set({ session });
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) set({ profile: profile as Profile });
        } catch { /* ignora */ }
      } else {
        set({ profile: null, game: null, gameState: null, players: [] });
      }
    });
    _authUnsubscribe = () => subscription.unsubscribe();
    console.log('[auth] listener riattivato');
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ profile: null, session: null, game: null, gameState: null });
  },

  // Resetta tutto lo stato di gioco — chiamato quando si torna alla lobby
  resetGame: () => {
    set({
      game: null,
      gameState: null,
      players: [],
      myFaction: null,
      moves: [],
      deckCards: [],
      territories: [],
      militaryUnits: [],
      combatLog: [],
      gameOverInfo: null,
      error: null,
      loading: false,
      isBotThinking: false,
      notification: null,
    });
  },

  // -----------------------------------------------
  loadGame: async (gameId: string, forceFaction?: string | null) => {
    // Resetta lo stato della partita precedente prima di caricare la nuova
    set({
      game: null, gameState: null, players: [], myFaction: null,
      moves: [], deckCards: [], territories: [], militaryUnits: [],
      combatLog: [], gameOverInfo: null, isBotThinking: false,
      notification: null, error: null, loading: true,
    });
    try {
      const [gameRes, playersRes, stateRes, movesRes, deckRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('game_players').select('*, profile:profiles(*)').eq('game_id', gameId),
        supabase.from('game_state').select('*').eq('game_id', gameId).single(),
        supabase.from('moves_log').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50),
        // Carica le carte del giocatore: quelle in mano (in_hand) + quelle ancora
        // disponibili nel mazzo (available). Le carte 'played' non servono all'UI.
        supabase.from('cards_deck').select('*').eq('game_id', gameId)
          .in('status', ['available', 'in_hand']).order('position'),
      ]);

      const { profile } = get();
      const players = (playersRes.data ?? []) as GamePlayer[];
      const myPlayer = players.find(p => p.player_id === profile?.id);
      // forceFaction: usato quando il redirect avviene prima che i bot siano nel DB
      // evita che myFaction sia null per timing issue
      const resolvedFaction = (myPlayer?.faction ?? forceFaction ?? null) as import('./onlineGameStore').Faction | null;

      set({
        game: gameRes.data as Game,
        players,
        gameState: stateRes.data as GameState,
        myFaction: resolvedFaction,
        moves: (movesRes.data ?? []) as MoveLog[],
        deckCards: (deckRes.data ?? []) as DeckCard[],
        loading: false,
      });

      // Carica/assegna obiettivi segreti se ho una fazione
      if (resolvedFaction) {
        setTimeout(() => get().loadMyObjectives(resolvedFaction), 500);
      }

      // Se la partita è attiva e il turno corrente è di un bot → avvia il bot
      const loadedState = stateRes.data as GameState;
      const loadedGame  = gameRes.data as Game;
      if (loadedGame?.status === 'active' && loadedState?.active_faction) {
        const activeFactionBot = (playersRes.data ?? []).find(
          (p: { faction: string; is_bot: boolean }) =>
            p.faction === loadedState.active_faction && p.is_bot
        );
        if (activeFactionBot) {
          setTimeout(() => get().runBotTurn(), 1800);
        }
      }
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
    //    Le prime CLASSIC_HAND_SIZE carte di ogni fazione vanno subito in mano (in_hand),
    //    il resto rimane disponibile nel mazzo (available).
    const deckRows: {
      game_id: string; faction: string; card_id: string;
      card_name: string; card_type: string; op_points: number;
      deck_type: string; status: string; position: number;
      held_by_faction: string | null;
    }[] = [];

    const factions = players.map(p => p.faction) as Faction[];
    for (const faction of factions) {
      const deck = getFullDeck(faction);   // già mescolato
      deck.forEach((card, idx) => {
        const inHand = idx < CLASSIC_HAND_SIZE;
        deckRows.push({
          game_id:         game.id,
          faction,
          card_id:         card.card_id,
          card_name:       card.card_name,
          card_type:       card.card_type,
          op_points:       card.op_points,
          deck_type:       card.deck_type,
          status:          inHand ? 'in_hand' : 'available',
          held_by_faction: inHand ? faction   : null,
          position:        idx + 1,
        });
      });
    }
    await supabase.from('cards_deck').insert(deckRows);

    // 3. Inizializza territori con influenze a zero
    const terrRows = TERRITORIES.map(t => ({
      game_id: game.id,
      territory: t.id,
      inf_iran:       0,
      inf_coalizione: 0,
      inf_russia:     0,
      inf_cina:       0,
      inf_europa:     0,
    }));
    await supabase.from('territories').upsert(terrRows, { onConflict: 'game_id,territory' });

    // 4. Assegna obiettivi segreti a ogni fazione (3 casuali ciascuna)
    const FACTION_TO_OBJ_MAP: Record<string, ObjFazione> = {
      'Iran':      'Iran',
      'Coalizione':'Coalizione Occidentale',
      'Russia':    'Russia',
      'Cina':      'Cina',
      'Europa':    'Unione Europea',
    };
    for (const faction of factions) {
      try {
        const objFaz: ObjFazione = FACTION_TO_OBJ_MAP[faction] ?? (faction as ObjFazione);
        const localObs = assignObjectives(objFaz, 3);
        if (localObs.length > 0) {
          // DELETE prima di INSERT: rimuove righe orfane di partite precedenti
          // con lo stesso game_id+faction che causano il 409 conflict
          await supabase.from('game_objectives')
            .delete()
            .eq('game_id', game.id)
            .eq('faction', faction as string);
          const { error: objErr } = await supabase.from('game_objectives').upsert(
            localObs.map(o => ({
              game_id:    game.id,
              faction:    faction as string,
              obj_id:     o.obj_id,
              completato: false,
              punteggio:  0,
            })),
            { onConflict: 'game_id,faction,obj_id', ignoreDuplicates: true }
          );
          if (objErr) {
            console.warn(`[startGame] game_objectives insert warn (${faction}):`, objErr.message);
          }
        }
      } catch (e) {
        console.warn(`[startGame] obiettivi ${faction} fallback locale:`, e);
      }
    }

    // 5. Ricarica tutto (stato + mazzo + territori appena creati)
    await get().loadGame(game.id);
    set({ loading: false });

    // 5. Se il primo turno è di un bot, eseguilo
    const state = get().gameState;
    const firstPlayer = players.find(p => p.faction === state?.active_faction);
    if (firstPlayer?.is_bot) {
      setTimeout(() => get().runBotTurn(), 1500);
    }
  },

  // -----------------------------------------------
  playCard: async (cardId: string) => {
    const { game, gameState, myFaction, players } = get();
    if (!game || !gameState || !myFaction) return;
    if (gameState.active_faction !== myFaction) {
      set({ error: 'Non è il tuo turno!' }); return;
    }

    set({ loading: true, error: null });

    try {
      // ── 1. Trova la carta nel mazzo DB ──────────────────────────────
      // Query permissiva: cerca per card_id + faction, qualsiasi status != 'played'
      // Evita filtri su held_by_faction/status che causano falsi negativi per timing issues
      const { data: deckCards_found, error: deckErr } = await supabase
        .from('cards_deck')
        .select('*')
        .eq('game_id', game.id)
        .eq('card_id', cardId)
        .eq('faction', myFaction)
        .neq('status', 'played')
        .order('position')
        .limit(1);

      const resolvedCard = (deckCards_found ?? [])[0] ?? null;
      if (!resolvedCard) throw new Error(`Carta ${cardId} non trovata nel mazzo: ${deckErr?.message ?? 'nessun record'}`);

      // (errore già gestito sopra con fallback)

      // ── 2. Recupera definizione carta (effetti) ──────────────────────
      const allMyCards = [
        ...(MAZZI_PER_FAZIONE[myFaction] ?? []),
        ...(MAZZI_SPECIALI[myFaction] ?? []),
      ];
      // Se la definizione non esiste usa effetti vuoti (carta senza effetti meccanici)
      const cardDef = allMyCards.find(c => c.card_id === cardId) ?? getUnifiedDeck().find(c => c.card_id === cardId) ?? {
        card_id: cardId,
        card_name: resolvedCard.card_name,
        effects: {},
        description: resolvedCard.card_name,
      };

      // ── 3. Applica effetti e calcola prossimo stato ──────────────────
      const { newState: rawNewState, deltas } = applyCardEffects(cardDef as Parameters<typeof applyCardEffects>[0], gameState, myFaction);

      // ── Carta NI03 "Chiusura Stretto di Hormuz": attiva il blocco ───
      let newState = rawNewState;
      if (cardDef.card_id === 'NI03' && myFaction === 'Iran') {
        newState = { ...rawNewState, special_uses: { ...gameState.special_uses, hormuz_iran: true } };
      }
      const russiaIsActive = players.some(p => p.faction === 'Russia');
      const vetoDisponibili = gameState.veto_onu_russia ?? 0;
      if (
        (rawNewState.sanzioni ?? gameState.sanzioni) > gameState.sanzioni &&
        russiaIsActive &&
        vetoDisponibili > 0 &&
        myFaction !== 'Russia'
      ) {
        const sanzioniDelta = (rawNewState.sanzioni ?? gameState.sanzioni) - gameState.sanzioni;
        if (players.find(p => p.faction === 'Russia')?.is_bot) {
          // Bot Russia: usa veto automaticamente solo se sanzioni alte
          if ((gameState.sanzioni ?? 0) >= 7) {  // soglia 7 su max 10
            newState = { ...rawNewState, sanzioni: gameState.sanzioni, veto_onu_russia: vetoDisponibili - 1 };
          }
          // altrimenti newState rimane rawNewState (sanzioni aumentano)
        } else {
          // Giocatore Russia reale: mostra popup — salva vetoPending e BLOCCA
          set({ vetoPending: { sanzioniDelta, cardName: resolvedCard.card_name }, loading: false });
          return; // il turno proseguirà quando Russia risponde via useVeto()
        }
      }
      // ─────────────────────────────────────────────────────────────────

      // Clamp difensivo: evita NaN/out-of-range per violazioni check constraint
      const safeNewState = Object.fromEntries(
        Object.entries(newState).map(([k, v]) => {
          if (typeof v === 'number' && isNaN(v)) return [k, gameState[k as keyof typeof gameState] ?? 5];
          if (k === 'risorse_coalizione' && typeof v === 'number') return [k, Math.max(1, Math.min(15, v))];
          if (k === 'risorse_cina'        && typeof v === 'number') return [k, Math.max(1, Math.min(12, v))];
          if (k.startsWith('risorse_')   && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          if (k.startsWith('stabilita_') && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          if (k.startsWith('forze_militari_') && typeof v === 'number') return [k, Math.max(0, Math.min(20, v))];
          if (k === 'defcon' && typeof v === 'number') return [k, Math.max(1, Math.min(5, v))];
          if (k === 'sanzioni' && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          if (k === 'nucleare' && typeof v === 'number') return [k, Math.max(1, Math.min(15, v))];
          // tracciati fazione estesi: tutti BETWEEN 1 AND 10
          const extendedTracks = new Set(['tecnologia_nucleare_iran','influenza_diplomatica_coalizione',
            'tecnologia_avanzata_coalizione','supporto_pubblico_coalizione','influenza_militare_russia',
            'stabilita_economica_russia','influenza_commerciale_cina','cyber_warfare_cina',
            'influenza_diplomatica_europa','aiuti_umanitari_europa','coesione_ue_europa','stabilita_rotte_cina']);
          if (extendedTracks.has(k) && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          return [k, v];
        })
      );
      const merged = { ...gameState, ...safeNewState } as GameState;
      const winCheck = checkWinCondition(merged, game.current_turn, game.max_turns);

      const nextFact = winCheck.isOver ? gameState.active_faction : nextFaction(myFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      // ── 3b. Meccaniche fine turno: bonus territoriali + obiettivi ────
      const { territories: terrRecs, players: playersArr, myObjectives, militaryUnits: playUnits } = get();
      const completedObjIds = new Set((myObjectives ?? []).filter(o => o.completato).map(o => o.obj_id));
      const { enrichedStateUpdate: enrichedNewState, bonusNotifications, newObjectives } =
        await applyEndOfTurnMechanics(game.id, gameState, terrRecs, playersArr, playUnits, newState, completedObjIds);
      // ─────────────────────────────────────────────────────────────────

      // ── 4. Query CRITICHE (devono riuscire per passare il turno) ─────
      const [stateRes, deckRes] = await withTimeout(Promise.all([
        supabase.from('game_state').update({
          ...enrichedNewState,
          active_faction: nextFact,
        }).eq('game_id', game.id),

        supabase.from('cards_deck').update({
          status: 'played',
          played_at_turn: game.current_turn,
          held_by_faction: null,
        }).eq('id', resolvedCard.id),
      ]), 8000, 'playCard stateRes+deckRes');

      if (stateRes.error) throw new Error(`Errore aggiornamento stato: ${stateRes.error.message} [${stateRes.error.code}]`);
      if (deckRes.error)  throw new Error(`Errore aggiornamento carta: ${deckRes.error.message} [${deckRes.error.code}] — verifica RLS policy cards_deck`);

      // Aggiorna turno/partita
      if (winCheck.isOver) {
        await supabase.from('games').update({
          status: 'finished',
          winner_faction: winCheck.winner,
          winner_condition: winCheck.condition,
          finished_at: new Date().toISOString(),
        }).eq('id', game.id);
      } else {
        await supabase.from('games').update({ current_turn: nextTurn }).eq('id', game.id);
      }

      // ── 5. Aggiorna stato locale subito (turno passa immediatamente) ─
      set(s => {
        // Aggiorna obiettivi locali con i nuovi completati
        const updatedObjectives = (s.myObjectives ?? []).map(o => {
          const completed = newObjectives.find(n => n.obj_id === o.obj_id);
          return completed ? { ...o, completato: true, data_completamento: new Date().toISOString() } : o;
        });
        const bonusSuffix = bonusNotifications.length > 0
          ? ` | Bonus territoriali: ${bonusNotifications.length}`
          : '';
        const objSuffix = newObjectives.length > 0
          ? ` | 🎯 ${newObjectives.length} obiettivo/i completato/i!`
          : '';
        return {
          gameState: { ...s.gameState!, ...enrichedNewState, active_faction: nextFact },
          game: { ...s.game!, current_turn: nextTurn, status: winCheck.isOver ? 'finished' : 'active' },
          deckCards: s.deckCards.filter(dc => dc.id !== resolvedCard.id),
          myObjectives: updatedObjectives,
          loading: false,
          notification: `✅ ${myFaction}: "${resolvedCard.card_name}" giocata — turno di ${nextFact}${bonusSuffix}${objSuffix}`,
          gameOverInfo: winCheck.isOver ? {
            winner: winCheck.winner,
            condition: winCheck.condition ?? '',
            message: winCheck.message ?? '',
          } : null,
        };
      });

      // ── 5b. Sblocco carta speciale (se modalità speciali separate) ───
      // Se la carta ha unlocks_special e viene giocata come evento dalla propria fazione,
      // pesca la prima carta dal mazzo speciali_locked e la mette in mano.
      if ((cardDef as { unlocks_special?: boolean }).unlocks_special) {
        try {
          const { data: lockedCard } = await supabase
            .from('cards_deck')
            .select('*')
            .eq('game_id', game.id)
            .eq('deck_type', 'speciale_locked')
            .eq('status', 'special_locked')
            .eq('faction', myFaction)
            .order('position', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (lockedCard) {
            await supabase.from('cards_deck').update({
              status: 'in_hand',
              held_by_faction: myFaction,
            }).eq('id', lockedCard.id);

            set(s => ({
              deckCards: [...s.deckCards, { ...lockedCard, status: 'in_hand', held_by_faction: myFaction }],
              notification: `✦ ${myFaction}: carta speciale sbloccata — "${lockedCard.card_name}"!`,
            }));
          }
        } catch (e) {
          console.warn('[playCard] sblocco speciale non riuscito (silenzioso):', e);
        }
      }

      // ── 6. Log mossa (non bloccante — non influenza il flusso) ───────
      const { profile } = get();
      supabase.from('moves_log').insert({
        game_id: game.id,
        turn_number: game.current_turn,
        faction: myFaction,
        player_id: profile?.id,
        is_bot_move: false,
        card_id: cardId,
        card_name: resolvedCard.card_name,
        card_type: resolvedCard.card_type,
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
      }).then(({ error }) => {
        if (error) console.warn('moves_log non salvato (non bloccante):', error.message);
      });

      // ── 7. Pesca 1 carta per rimpiazzare quella giocata ──────────────
      if (!winCheck.isOver) {
        await get().drawCards(myFaction);
      }

      // ── 8. Se il prossimo è un bot, eseguilo ────────────────────────
      if (!winCheck.isOver) {
        const nextPlayer = players.find(p => p.faction === nextFact);
        if (nextPlayer?.is_bot) {
          setTimeout(() => get().runBotTurn(), 2000);
        }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      console.error('playCard error:', msg);
      set({ error: msg, loading: false });
    } finally {
      set({ loading: false }); // garantisce sempre il reset
    }
  },

  // -----------------------------------------------
  runBotTurn: async () => {
    const { game, gameState, players, isBotThinking } = get();
    if (!game || !gameState || game.status !== 'active') return;
    if (isBotThinking) return; // guard: evita doppia esecuzione concorrente

    const botFaction = gameState.active_faction as Faction;
    const botPlayer = players.find(p => p.faction === botFaction);
    if (!botPlayer?.is_bot) return;

    set({ isBotThinking: true });

    // Safety: reset automatico dopo 30s se qualcosa va storto
    const safetyTimer = setTimeout(() => {
      const s = get();
      if (s.isBotThinking) {
        console.warn('[runBotTurn] safety timeout — reset isBotThinking');
        set({ isBotThinking: false, error: 'Timeout bot: turno saltato automaticamente' });
      }
    }, 30000);

    try {
      // Recupera carte in mano al bot (classico: faction+in_hand, unified: held_by_faction+in_hand)
      const available = await withTimeout(
        supabase.from('cards_deck').select('*')
          .eq('game_id', game.id).eq('held_by_faction', botFaction)
          .eq('status', 'in_hand').limit(10)
          .then(r => r.data),
        8000, 'bot-fetch-hand'
      ).catch(() => null);

      if (!available || available.length === 0) {
        // Mano vuota: turno saltato, passa al prossimo
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

      // Costruisci lista carte da definizioni statiche (no dynamic import — evita violation)
      const allCards = [
        ...(MAZZI_PER_FAZIONE[botFaction] ?? []),
        ...(MAZZI_SPECIALI[botFaction] ?? []),
      ];
      const unifiedCards = getUnifiedDeck();

      // Mappa: card_id → definizione completa (cerca prima nel mazzo fazione, poi in quello unificato)
      const availableWithDef = available
        .map(dc => allCards.find(c => c.card_id === dc.card_id) ?? unifiedCards.find(c => c.card_id === dc.card_id))
        .filter(Boolean) as typeof allCards;

      if (availableWithDef.length === 0) {
        set({ isBotThinking: false }); return;
      }

      // Bot sceglie la carta migliore
      const decision = botSelectCard(availableWithDef, gameState, botFaction, botPlayer.bot_difficulty as 'easy'|'normal'|'hard');
      if (!decision) { set({ isBotThinking: false }); return; }

      // Breve pausa per simulare "pensiero" del bot (400ms — ridotto per evitare violation)
      await new Promise(r => setTimeout(r, 400));

      // Applica la carta scelta
      const { newState: botRawState, deltas } = applyCardEffects(decision.card, gameState, botFaction);

      // ── Bot NI03: attiva blocco Hormuz se bot Iran gioca la carta ───
      let botNewState = botRawState;
      if (decision.card.card_id === 'NI03' && botFaction === 'Iran') {
        botNewState = { ...botRawState, special_uses: { ...gameState.special_uses, hormuz_iran: true } };
      }
      const botVetoDisp = gameState.veto_onu_russia ?? 0;
      const botRussiaActive = players.some(p => p.faction === 'Russia');
      if (
        (botRawState.sanzioni ?? gameState.sanzioni) > gameState.sanzioni &&
        botRussiaActive &&
        botVetoDisp > 0 &&
        botFaction !== 'Russia'
      ) {
        // Russia è un bot: usa veto automaticamente solo se sanzioni alte
        if ((gameState.sanzioni ?? 0) >= 7) {  // soglia 7 su max 10
          botNewState = { ...botRawState, sanzioni: gameState.sanzioni, veto_onu_russia: botVetoDisp - 1 };
        }
      }
      // ─────────────────────────────────────────────────────────────────

      const newState = botNewState;
      // Clamp difensivo: evita NaN/out-of-range per violazioni check constraint
      const safeNewState = Object.fromEntries(
        Object.entries(newState).map(([k, v]) => {
          if (typeof v === 'number' && isNaN(v)) return [k, gameState[k as keyof typeof gameState] ?? 5];
          if (k === 'risorse_coalizione' && typeof v === 'number') return [k, Math.max(1, Math.min(15, v))];
          if (k === 'risorse_cina'        && typeof v === 'number') return [k, Math.max(1, Math.min(12, v))];
          if (k.startsWith('risorse_')   && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          if (k.startsWith('stabilita_') && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          if (k.startsWith('forze_militari_') && typeof v === 'number') return [k, Math.max(0, Math.min(20, v))];
          if (k === 'defcon' && typeof v === 'number') return [k, Math.max(1, Math.min(5, v))];
          if (k === 'sanzioni' && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          if (k === 'nucleare' && typeof v === 'number') return [k, Math.max(1, Math.min(15, v))];
          // tracciati fazione estesi: tutti BETWEEN 1 AND 10
          const extendedTracks = new Set(['tecnologia_nucleare_iran','influenza_diplomatica_coalizione',
            'tecnologia_avanzata_coalizione','supporto_pubblico_coalizione','influenza_militare_russia',
            'stabilita_economica_russia','influenza_commerciale_cina','cyber_warfare_cina',
            'influenza_diplomatica_europa','aiuti_umanitari_europa','coesione_ue_europa','stabilita_rotte_cina']);
          if (extendedTracks.has(k) && typeof v === 'number') return [k, Math.max(1, Math.min(10, v))];
          return [k, v];
        })
      );
      const merged = { ...gameState, ...safeNewState } as GameState;
      const winCheck = checkWinCondition(merged, game.current_turn, game.max_turns);
      const nextFact = winCheck.isOver ? gameState.active_faction : nextFaction(botFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      // ── Meccaniche fine turno bot: bonus territoriali + obiettivi ───
      const { territories: botTerrRecs, myObjectives: botMyObj, militaryUnits: botUnits } = get();
      const botCompletedIds = new Set((botMyObj ?? []).filter(o => o.completato).map(o => o.obj_id));
      const { enrichedStateUpdate: botEnrichedState, bonusNotifications: botBonusNotes, newObjectives: botNewObj } =
        await applyEndOfTurnMechanics(game.id, gameState, botTerrRecs, players, botUnits, newState, botCompletedIds);
      // ────────────────────────────────────────────────────────────────

      await withTimeout(Promise.all([
        supabase.from('game_state').update({ ...botEnrichedState, active_faction: nextFact }).eq('game_id', game.id),
        supabase.from('cards_deck').update({ status: 'played', played_at_turn: game.current_turn, held_by_faction: null })
          .eq('game_id', game.id).eq('held_by_faction', botFaction).eq('card_id', decision.card.card_id).eq('status', 'in_hand'),
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
      ]), 12000, 'bot-turn-write');

      set(s => {
        const updBotObj = (s.myObjectives ?? []).map(o => {
          const done = botNewObj.find(n => n.obj_id === o.obj_id);
          return done ? { ...o, completato: true, data_completamento: new Date().toISOString() } : o;
        });
        const botBonusSuffix = botBonusNotes.length > 0 ? ` [+${botBonusNotes.length} bonus territoriali]` : '';
        const botObjSuffix = botNewObj.length > 0 ? ` 🎯 ${botNewObj.length} obj` : '';
        return {
          gameState: { ...s.gameState!, ...botEnrichedState, active_faction: nextFact },
          game: { ...s.game!, current_turn: nextTurn, status: winCheck.isOver ? 'finished' : 'active' },
          deckCards: s.deckCards.filter(dc => dc.card_id !== decision.card.card_id || dc.faction !== botFaction),
          myObjectives: updBotObj,
          isBotThinking: false,
          notification: `🤖 ${botFaction} ha giocato: ${decision.card.card_name}${botBonusSuffix}${botObjSuffix}`,
          gameOverInfo: winCheck.isOver ? {
            winner: winCheck.winner,
            condition: winCheck.condition ?? '',
            message: winCheck.message ?? '',
          } : null,
        };
      });

      // Bot pesca una nuova carta dopo aver giocato
      if (!winCheck.isOver) {
        try { await get().drawCards(botFaction); } catch { /* silenzioso */ }
      }

      // Catena bot: se il prossimo è ancora un bot, esegui
      if (!winCheck.isOver) {
        const nextPlayer = players.find(p => p.faction === nextFact);
        if (nextPlayer?.is_bot) {
          setTimeout(() => get().runBotTurn(), 2000);
        }
      }
    } catch (err) {
      console.error('[runBotTurn] error:', err);
      set({ isBotThinking: false, error: 'Errore nel turno bot' });
    } finally {
      clearTimeout(safetyTimer);
    }
  },

  // -----------------------------------------------
  subscribeToGame: (gameId: string) => {
    // Debounce handle per evitare doppia esecuzione bot da realtime
    let botDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleBotTurn = (delayMs = 1500) => {
      if (botDebounceTimer) clearTimeout(botDebounceTimer);
      botDebounceTimer = setTimeout(() => {
        botDebounceTimer = null;
        const { isBotThinking } = get();
        if (!isBotThinking) get().runBotTurn();
      }, delayMs);
    };

    // Real-time: game_state changes
    const stateSub = supabase
      .channel(`game-state-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'game_state',
        filter: `game_id=eq.${gameId}`,
      }, payload => {
        // Merge con lo stato esistente: payload.new può contenere solo i campi aggiornati
        set(s => ({ gameState: { ...s.gameState, ...payload.new } as GameState }));
        // Se il turno è passato a un bot, avvialo (debounced — evita doppia chiamata)
        const newActiveFaction = payload.new?.active_faction;
        if (newActiveFaction) {
          const { players: currentPlayers } = get();
          const nextIsBot = currentPlayers.find(p => p.faction === newActiveFaction && p.is_bot);
          if (nextIsBot) scheduleBotTurn(1500);
        }
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
        set(s => ({ moves: [newMove, ...s.moves].slice(0, 50) }));
      })
      .subscribe();

    // Real-time: cambiamenti partita (status, turno)
    const gameSub = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games',
        filter: `id=eq.${gameId}`,
      }, payload => {
        set(s => ({ game: { ...s.game, ...payload.new } as Game }));
      })
      .subscribe();

    // Helper: ricarica TUTTO il mazzo dal DB — throttled per evitare N query su INSERT batch
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    const reloadDeckCards = () => {
      if (reloadTimer) return; // già in attesa — ignora trigger duplicati
      reloadTimer = setTimeout(async () => {
        reloadTimer = null;
        const { data } = await supabase
          .from('cards_deck').select('*').eq('game_id', gameId)
          .in('status', ['available', 'in_hand', 'special_locked']).order('position');
        if (data) set({ deckCards: data as DeckCard[] });
      }, 600); // attende 600ms prima di eseguire — accumula burst di INSERT
    };

    // Real-time: carte INSERT (primo popolamento mazzo) + UPDATE (played/in_hand)
    const deckSub = supabase
      .channel(`deck-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'cards_deck',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        // Nuovo batch inserito (es. avvio partita) → ricarica tutto
        reloadDeckCards();
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'cards_deck',
        filter: `game_id=eq.${gameId}`,
      }, payload => {
        const updatedCard = payload.new as DeckCard;
        if (updatedCard.status === 'played') {
          // Rimuove la carta giocata dalla lista locale (filtra per id univoco)
          set(s => ({
            deckCards: s.deckCards.filter(dc => dc.id !== updatedCard.id),
          }));
        } else if (updatedCard.status === 'in_hand') {
          // Una carta è stata pescata: aggiorna o aggiunge alla lista locale
          set(s => {
            const exists = s.deckCards.some(dc => dc.id === updatedCard.id);
            if (exists) {
              return { deckCards: s.deckCards.map(dc => dc.id === updatedCard.id ? updatedCard : dc) };
            } else {
              return { deckCards: [...s.deckCards, updatedCard] };
            }
          });
        } else {
          // Qualsiasi altro update (es. held_by_faction cambia) → aggiorna in lista
          set(s => ({
            deckCards: s.deckCards.map(dc => dc.id === updatedCard.id ? updatedCard : dc),
          }));
        }
      })
      .subscribe();

    return () => {
      // Cancella timer pendenti per evitare memory leak
      if (botDebounceTimer) clearTimeout(botDebounceTimer);
      if (reloadTimer) clearTimeout(reloadTimer);
      stateSub.unsubscribe();
      movesSub.unsubscribe();
      gameSub.unsubscribe();
      deckSub.unsubscribe();
    };
  },

  clearError: () => set({ error: null }),
  setNotification: (msg) => set({ notification: msg }),

  // -----------------------------------------------
  // ═══════════════════════════════════════════════════════════════════
  // MAZZO UNIFICATO — implementazioni
  // ═══════════════════════════════════════════════════════════════════

  myHand: () => {
    const { deckCards, myFaction } = get();
    if (!myFaction) return [];
    return deckCards.filter(dc => dc.held_by_faction === myFaction && dc.status === 'in_hand');
  },

  initUnifiedDeck: async () => {
    const { game, players } = get();
    if (!game) return;
    set({ loading: true });

    // 1. Costruisce il mazzo unificato mescolato
    const unified = getUnifiedDeck();
    let position = 1;
    const factions = players.map(p => p.faction) as Faction[];

    // 2. Distribuisce UNIFIED_HAND_SIZE carte a ciascuna fazione
    //    Le prime N * |factions| carte vanno in mano, il resto è il mazzo
    const handAssignments: Record<Faction, string[]> = {} as Record<Faction, string[]>;
    factions.forEach(f => { handAssignments[f] = []; });

    const deckRows: object[] = [];

    // Prima assegna le carte alle mani (round-robin per equità)
    let cardIdx = 0;
    for (let i = 0; i < UNIFIED_HAND_SIZE; i++) {
      for (const f of factions) {
        if (cardIdx >= unified.length) break;
        const card = unified[cardIdx++];
        deckRows.push({
          game_id:       game.id,
          faction:       card.faction,           // owner originale
          owner_faction: card.owner_faction,
          card_id:       card.card_id,
          card_name:     card.card_name,
          card_type:     card.card_type,
          op_points:     card.op_points,
          deck_type:     card.deck_type,
          status:        'in_hand',
          held_by_faction: f,
          position:      position++,
        });
      }
    }

    // Il resto va nel mazzo (available, nessuna fazione)
    for (; cardIdx < unified.length; cardIdx++) {
      const card = unified[cardIdx];
      deckRows.push({
        game_id:       game.id,
        faction:       card.faction,
        owner_faction: card.owner_faction,
        card_id:       card.card_id,
        card_name:     card.card_name,
        card_type:     card.card_type,
        op_points:     card.op_points,
        deck_type:     card.deck_type,
        status:        'available',
        held_by_faction: null,
        position:      position++,
      });
    }

    await supabase.from('cards_deck').insert(deckRows);

    // 3. Segna game_mode = 'unified' sulla partita
    await supabase.from('games').update({ game_mode: 'unified' }).eq('id', game.id);

    set(s => ({
      game: { ...s.game!, game_mode: 'unified' },
      loading: false,
    }));
  },

  drawCards: async (faction: Faction) => {
    const { game, deckCards } = get();
    if (!game) return;

    const isUnified = game.game_mode === 'unified';
    const maxHand = isUnified ? UNIFIED_HAND_SIZE : CLASSIC_HAND_SIZE;

    // Conta le carte realmente in mano dal DB (fonte di verità assoluta)
    // Lo store locale può essere desincronizzato → usare il DB evita il bug "4 carte invece di 5"
    const { count: cardsInHandDB } = await supabase
      .from('cards_deck')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .eq('status', 'in_hand')
      .eq('held_by_faction', faction);
    const cardsInHand = cardsInHandDB ?? 0;
    // Top-up: pesca sempre fino a raggiungere maxHand (non solo 1 per turno)
    const canDraw = Math.max(0, maxHand - cardsInHand);
    if (canDraw === 0) return; // mano già piena

    // In modalità classica: pesca solo dal mazzo della propria fazione (faction === dc.faction)
    // In modalità unificata: pesca dal mazzo comune (qualsiasi fazione)
    const available = deckCards
      .filter(dc =>
        dc.status === 'available' &&
        !dc.held_by_faction &&
        (isUnified || dc.faction === faction)   // ← classico: solo carte proprie
      )
      .sort((a, b) => a.position - b.position)
      .slice(0, canDraw);

    if (available.length === 0) {
      // ── Mazzo esaurito: rimescola le carte played ──────────────────────
      const playedCards = deckCards.filter(dc =>
        dc.status === 'played' &&
        !dc.held_by_faction &&
        (isUnified || dc.faction === faction)
      );
      if (playedCards.length === 0) return; // nessuna carta disponibile neanche tra le played

      // 1. Rimetti tutte le carte played → available nel DB e nello stato
      const playedIds = playedCards.map(dc => dc.id);
      await withTimeout(
        supabase.from('cards_deck').update({ status: 'available' }).in('id', playedIds),
        5000, 'drawCards reshuffle'
      );
      set(s => ({
        deckCards: s.deckCards.map(dc =>
          playedIds.includes(dc.id) ? { ...dc, status: 'available' as const } : dc
        ),
      }));

      // 2. Pesca canDraw carte dal mazzo appena rimescolato
      const reshuffled = [...playedCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, canDraw);
      const reshuffledIds = reshuffled.map(dc => dc.id);
      await withTimeout(
        supabase.from('cards_deck').update({ status: 'in_hand', held_by_faction: faction }).in('id', reshuffledIds),
        5000, 'drawCards reshuffledIds'
      );
      set(s => ({
        deckCards: s.deckCards.map(dc =>
          reshuffledIds.includes(dc.id)
            ? { ...dc, status: 'in_hand' as const, held_by_faction: faction }
            : dc
        ),
      }));
      return; // pesca completata dopo rimescolo
    }

    const ids = available.map(dc => dc.id);
    await withTimeout(
      supabase.from('cards_deck').update({ status: 'in_hand', held_by_faction: faction }).in('id', ids),
      5000, 'drawCards ids'
    );

    set(s => ({
      deckCards: s.deckCards.map(dc =>
        ids.includes(dc.id)
          ? { ...dc, status: 'in_hand' as const, held_by_faction: faction }
          : dc
      ),
    }));
  },

  playCardUnified: async (cardDbId: string, mode: 'event' | 'ops') => {
    const { game, gameState, myFaction, players } = get();
    console.log('[playCardUnified] chiamata — cardDbId:', cardDbId, 'mode:', mode, 'game:', game?.id, 'gameState:', !!gameState, 'myFaction:', myFaction, 'active_faction:', gameState?.active_faction);
    if (!game || !gameState || !myFaction) {
      console.warn('[playCardUnified] EARLY RETURN — guard fallita: game:', !!game, 'gameState:', !!gameState, 'myFaction:', myFaction);
      return;
    }
    if (gameState.active_faction !== myFaction) {
      console.warn('[playCardUnified] EARLY RETURN — non è il tuo turno. active_faction:', gameState.active_faction, 'myFaction:', myFaction);
      set({ error: 'Non è il tuo turno!' }); return;
    }

    set({ loading: true, error: null });
    try {
      // 1. Trova la carta nel DB tramite card_id stabile (es. 'C025') — mai UUID
      // Cerca tra le carte non ancora giocate assegnate a questa fazione
      const { data: found, error: deckErr } = await supabase
        .from('cards_deck')
        .select('*')
        .eq('game_id', game.id)
        .eq('card_id', cardDbId)
        .neq('status', 'played')
        .order('position')
        .limit(1);

      const resolvedDeckCard = (found ?? [])[0] ?? null;

      if (deckErr) throw new Error(`Carta non trovata: ${deckErr?.message}`);
      if (!resolvedDeckCard) throw new Error(`Carta ${cardDbId} non trovata nel mazzo`);

      const ownerFaction = (resolvedDeckCard.owner_faction ?? resolvedDeckCard.faction) as Faction;
      const isMyCard = ownerFaction === myFaction;

      // 2. Recupera definizione carta con effetti (import statico — già disponibile in scope)
      const ownerDeck =
        ownerFaction === ('Neutrale' as Faction)
          ? [...MAZZO_NEUTRALE]
          : [
              ...(MAZZI_PER_FAZIONE[ownerFaction] ?? []),
              ...(MAZZI_SPECIALI[ownerFaction] ?? []),
            ];
      const cardDef = ownerDeck.find(c => c.card_id === resolvedDeckCard.card_id) ?? {
        card_id: resolvedDeckCard.card_id,
        card_name: resolvedDeckCard.card_name,
        effects: {},
      };

      // 3. Calcola effetti in base alla modalità di gioco
      //    - mode='event' + carta propria o neutrale → applica effetti meccanici
      //    - mode='ops'                              → solo OP, nessun effetto tracciato
      //    - mode='event' + carta altrui (non neutrale) → nessun effetto (regola fazione)
      let newState = { ...gameState };
      let deltas = {};

      // Carta "propria" = appartiene alla mia fazione OPPURE è neutrale
      // (le carte neutrali giocate come evento applicano sempre i loro effetti)
      const isOwnOrNeutral = isMyCard || ownerFaction === ('Neutrale' as Faction);

      if (mode === 'event' && isOwnOrNeutral) {
        // Gioca come evento: applica gli effetti meccanici al game_state
        const result = applyCardEffects(
          cardDef as Parameters<typeof applyCardEffects>[0],
          gameState,
          myFaction,
        );
        newState = { ...gameState, ...result.newState };
        deltas = result.deltas;

        // ── NI03 (playCardUnified): attiva blocco Hormuz ─────────────
        if (cardDef.card_id === 'NI03' && myFaction === 'Iran') {
          newState = { ...newState, special_uses: { ...gameState.special_uses, hormuz_iran: true } };
        }
        const unifiedVetoDisp = gameState.veto_onu_russia ?? 0;
        const unifiedRussiaActive = players.some(p => p.faction === 'Russia');
        if (
          (newState.sanzioni ?? gameState.sanzioni) > gameState.sanzioni &&
          unifiedRussiaActive &&
          unifiedVetoDisp > 0 &&
          myFaction !== 'Russia'
        ) {
          const unifiedSanzioniDelta = (newState.sanzioni ?? gameState.sanzioni) - gameState.sanzioni;
          const russiaPlayer = players.find(p => p.faction === 'Russia');
          if (russiaPlayer?.is_bot) {
            if ((gameState.sanzioni ?? 0) >= 7) {  // soglia 7 su max 10
              newState = { ...newState, sanzioni: gameState.sanzioni, veto_onu_russia: unifiedVetoDisp - 1 };
              (deltas as Record<string, number>).sanzioni = 0;
            }
          } else {
            // Giocatore Russia reale: mostra popup
            set({ vetoPending: { sanzioniDelta: unifiedSanzioniDelta, cardName: cardDef.card_name }, loading: false });
            return;
          }
        }
        // ─────────────────────────────────────────────────────────────
        console.log('[playCardUnified] effetti applicati:', deltas, '| isMyCard:', isMyCard, '| ownerFaction:', ownerFaction);
      } else if (mode === 'event' && !isOwnOrNeutral) {
        // Carta altrui (non neutrale) giocata come evento: nessun modificatore tracciati
        // La UI (UnifiedCardPlayModal) mostra l'EventoModal della carta per informazione
        console.log('[playCardUnified] carta fazione diversa giocata come evento — nessun modificatore tracciati');
      }
      // mode='ops' → nessun effetto tracciato, solo OP spesi

      // 4. Passa il turno
      const winCheck = checkWinCondition(newState as GameState, game.current_turn, game.max_turns);
      const nextFact = winCheck.isOver ? gameState.active_faction : nextFaction(myFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      // 4b. Meccaniche fine turno: bonus territoriali + obiettivi ───────
      const cardStateForBonus = mode === 'event' ? (newState as Partial<GameState>) : {};
      const { territories: uniTerrRecs, players: uniPlayers, myObjectives: uniMyObj, militaryUnits: uniUnits } = get();
      const uniCompletedIds = new Set((uniMyObj ?? []).filter(o => o.completato).map(o => o.obj_id));
      const { enrichedStateUpdate: uniEnrichedState, bonusNotifications: uniBonusNotes, newObjectives: uniNewObj } =
        await applyEndOfTurnMechanics(game.id, gameState, uniTerrRecs, uniPlayers, uniUnits, cardStateForBonus, uniCompletedIds);
      // ─────────────────────────────────────────────────────────────────

      // 5. Aggiorna DB in parallelo
      const stateUpdate = {
        ...uniEnrichedState,
        active_faction: nextFact,
      };

      // Aggiorna carta — play_mode è opzionale (colonna potrebbe non esistere)
      const cardUpdate: Record<string, unknown> = {
        status: 'played',
        played_at_turn: game.current_turn,
        held_by_faction: null,
      };

      const [stateRes, deckRes] = await withTimeout(Promise.all([
        supabase.from('game_state').update(stateUpdate).eq('game_id', game.id),
        supabase.from('cards_deck').update(cardUpdate).eq('id', resolvedDeckCard.id),
      ]), 8000, 'playCardUnified stateRes+deckRes');

      if (stateRes.error) throw new Error(`Stato: ${stateRes.error.message}`);
      if (deckRes.error)  throw new Error(`Carta: ${deckRes.error.message}`);

      // Salva play_mode separatamente — non bloccante se colonna mancante
      supabase.from('cards_deck').update({ play_mode: mode }).eq('id', resolvedDeckCard.id).then(({ error }) => {
        if (error && error.code !== 'PGRST204' && error.code !== '42703') {
          console.warn('[playCardUnified] play_mode update warn:', error);
        }
      });

      // 6. Avanza il turno nella tabella games
      if (winCheck.isOver) {
        await supabase.from('games').update({
          status: 'finished',
          winner_faction: winCheck.winner,
          winner_condition: winCheck.condition,
          finished_at: new Date().toISOString(),
        }).eq('id', game.id);
      } else {
        await supabase.from('games').update({ current_turn: nextTurn }).eq('id', game.id);
      }

      // 7. Fa pescare 1 carta alla fazione che ha appena giocato
      await get().drawCards(myFaction);

      // 8. Stato locale
      set(s => {
        const updUniObj = (s.myObjectives ?? []).map(o => {
          const done = uniNewObj.find(n => n.obj_id === o.obj_id);
          return done ? { ...o, completato: true, data_completamento: new Date().toISOString() } : o;
        });
        const uniBonusSuffix = uniBonusNotes.length > 0 ? ` | Bonus territori: ${uniBonusNotes.length}` : '';
        const uniObjSuffix   = uniNewObj.length > 0 ? ` 🎯 ${uniNewObj.length} obj!` : '';
        return {
          gameState: { ...s.gameState!, ...stateUpdate },
          game: { ...s.game!, current_turn: nextTurn, status: winCheck.isOver ? 'finished' : 'active' },
          deckCards: s.deckCards.filter(dc => dc.id !== resolvedDeckCard.id),
          myObjectives: updUniObj,
          loading: false,
          notification: mode === 'event'
            ? `🎴 ${myFaction}: "${resolvedDeckCard.card_name}" giocata come EVENTO${uniBonusSuffix}${uniObjSuffix}`
            : `⚙️ ${myFaction}: "${resolvedDeckCard.card_name}" usata come ${resolvedDeckCard.op_points} OP${uniBonusSuffix}${uniObjSuffix}`,
          gameOverInfo: winCheck.isOver ? {
            winner: winCheck.winner,
            condition: winCheck.condition ?? '',
            message: winCheck.message ?? '',
          } : null,
        };
      });

      // 9. Log mossa
      const { profile } = get();
      supabase.from('moves_log').insert({
        game_id: game.id,
        turn_number: game.current_turn,
        faction: myFaction,
        player_id: profile?.id,
        is_bot_move: false,
        card_id: resolvedDeckCard.card_id,
        card_name: resolvedDeckCard.card_name,
        card_type: resolvedDeckCard.card_type,
        // deltas semplificati (dal risultato applyCardEffects se mode=event)
        delta_nucleare: (deltas as Record<string, number>).nucleare ?? 0,
        delta_sanzioni: (deltas as Record<string, number>).sanzioni ?? 0,
        delta_opinione: (deltas as Record<string, number>).opinione ?? 0,
        delta_defcon:   (deltas as Record<string, number>).defcon   ?? 0,
        delta_risorse:  (deltas as Record<string, number>).risorse  ?? 0,
        delta_stabilita:(deltas as Record<string, number>).stabilita?? 0,
        stato_nucleare: newState.nucleare,
        stato_sanzioni: newState.sanzioni,
        stato_opinione: newState.opinione,
        stato_defcon:   newState.defcon,
      }).then(() => {});

    } catch (err: unknown) {
      console.error('[playCardUnified] ERRORE COMPLETO:', err);
      set({ error: err instanceof Error ? err.message : 'Errore sconosciuto in playCardUnified', loading: false });
    } finally {
      set({ loading: false }); // garantisce sempre il reset
    }
  },

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
      const risorseMax = risorseKey === 'risorse_coalizione' ? 15 : risorseKey === 'risorse_cina' ? 12 : 10;
      const nuoveRisorse = Math.min(risorseMax, risorseAttuali + quantita);

      // Aggiorna game_state: risorse +quantita
      const stateUpdate: Partial<GameState> = { [risorseKey]: nuoveRisorse };

      // Passa il turno al prossimo giocatore
      const nextFact = nextFaction(myFaction);
      const nextTurn = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;

      await withTimeout(Promise.all([
        supabase.from('game_state').update({
          ...stateUpdate,
          active_faction: nextFact,
        }).eq('game_id', game.id),
        supabase.from('games').update({ current_turn: nextTurn }).eq('id', game.id),
      ]), 8000, 'market-state');

      // Log mossa mercato (non bloccante)
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
      }).then(({ error }) => {
        if (error) console.warn('[moves_log] acquisto non salvato:', error.message);
      }).catch(() => {});

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
    } finally {
      set({ loading: false }); // garantisce sempre il reset
    }
  },

  // ── Carica territori e unità ────────────────────────────────────────────────
  loadTerritories: async () => {
    const { game } = get();
    if (!game) return;
    try {
      const [{ data: terr, error: terrErr }, { data: units }, { data: clog }] = await Promise.all([
        supabase.from('territories').select('*').eq('game_id', game.id),
        supabase.from('military_units').select('*').eq('game_id', game.id),
        supabase.from('combat_log').select('*').eq('game_id', game.id).order('created_at', { ascending: false }).limit(20),
      ]);
      // PGRST205 = tabella non ancora creata → ignora silenziosamente
      if (terrErr && terrErr.code !== 'PGRST205' && terrErr.code !== '42P01') {
        console.warn('[loadTerritories] errore:', terrErr);
      }
      set({
        territories:   terr  ?? [],
        militaryUnits: units ?? [],
        combatLog:     clog  ?? [],
      });
    } catch (e) {
      console.warn('[loadTerritories] tabelle mappa non disponibili:', e);
      set({ territories: [], militaryUnits: [], combatLog: [] });
    }
  },

  // ── Schiera unità in un territorio ─────────────────────────────────────────
  addInfluence: async (territory: string, delta: number) => {
    const { game, gameState, myFaction, territories: terrRecords } = get();
    if (!game || !gameState || !myFaction) return;
    // NON impostare loading: true — lo gestisce playCard chiamata subito dopo
    try {
      const infKey = `inf_${myFaction.toLowerCase()}` as string;
      const terrRec = terrRecords.find(t => t.game_id === game.id && t.territory === territory);
      const cur = terrRec ? ((terrRec as unknown) as Record<string, number>)[infKey] ?? 0 : 0;
      const next = Math.min(5, Math.max(0, cur + delta));

      await supabase.from('territories').upsert({
        game_id: game.id,
        territory,
        ...(terrRec ?? {}),
        [infKey]: next,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'game_id,territory' });

      // Aggiorna locale
      const updTerr = terrRec
        ? terrRecords.map(t =>
            t.game_id === game.id && t.territory === territory
              ? { ...t, [infKey]: next }
              : t
          )
        : [...terrRecords, {
            id: crypto.randomUUID(), game_id: game.id, territory,
            inf_iran: 0, inf_coalizione: 0, inf_russia: 0, inf_cina: 0, inf_europa: 0,
            [infKey]: next,
            updated_at: new Date().toISOString(),
          } as import('@/types/game').TerritoryRecord];

      set({
        territories: updTerr,
        notification: `🌐 ${myFaction}: +${delta} influenza su ${territory} (ora: ${next})`,
      });
    } catch (err: unknown) {
      // Non blocca il flusso: playCard viene comunque chiamata dopo
      console.warn('[addInfluence] errore (non bloccante):', err instanceof Error ? err.message : err);
    }
  },

  deployUnit: async (territory, unitType, qty) => {
    const { game, gameState, myFaction } = get();
    if (!game || !gameState || !myFaction) return;
    set({ loading: true, error: null });
    try {
      const unitsKey = `units_${myFaction.toLowerCase()}` as keyof typeof gameState;
      const pool = (gameState[unitsKey] as Record<string, number>) ?? {};
      const available = pool[unitType] ?? 0;
      if (available < qty) throw new Error(`Unità insufficienti: hai ${available} ${unitType}`);

      // Aggiorna pool (riduci disponibili)
      const newPool = { ...pool, [unitType]: available - qty };

      // Leggi quantità già schierata per sommare (non sovrascrivere)
      const { data: existingUnit } = await supabase
        .from('military_units')
        .select('quantity')
        .eq('game_id', game.id)
        .eq('faction', myFaction)
        .eq('territory', territory)
        .eq('unit_type', unitType)
        .maybeSingle();
      const existingQty = existingUnit?.quantity ?? 0;

      // Upsert con quantità sommata
      await Promise.all([
        supabase.from('military_units').upsert({
          game_id: game.id,
          faction: myFaction,
          territory,
          unit_type: unitType,
          quantity: existingQty + qty,
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

      set({ gameState: updatedGameState, militaryUnits: newUnits,
        notification: `🪖 ${myFaction}: ${qty}× ${unitType} schierato/i in ${territory}` });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore schieramento' });
      console.error('[deployUnit]', err);
    } finally {
      set({ loading: false }); // SEMPRE eseguito
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
      const newDefcon   = Math.max(1, Math.min(5, (gameState.defcon ?? 3) + defconChange));
      const stabKey     = `stabilita_${myFaction.toLowerCase()}` as keyof typeof gameState;
      const newStab     = Math.max(1, Math.min(10, ((gameState[stabKey] as number) ?? 5) + stabilityChange));

      // ─── Effetti speciali attacchi Coalizione su territori iraniani ───────
      const iranTargets = ['Iran', 'Natanz', 'Fordow', 'Teheran'];
      const isIranAttack = myFaction === 'Coalizione' && iranTargets.includes(territory);
      const nuclearTargets = ['Natanz', 'Fordow'];
      const capitalTargets = ['Teheran', 'Iran'];

      // Delta effetti speciali (inizializzati a 0, calcolati solo se iranAttack)
      let iranSpecialUpdates: Record<string, number> = {};
      let iranAttackNoteSuffix = '';

      if (isIranAttack) {
        const gs = gameState as unknown as Record<string, number>;

        // sanzioni +1 su qualsiasi attacco Iran
        const curSanzioni = gs['sanzioni'] ?? 0;
        iranSpecialUpdates['sanzioni'] = Math.min(10, Math.max(1, curSanzioni + 1));
        iranAttackNoteSuffix += ' sanzioni+1';

        if (nuclearTargets.includes(territory)) {
          const curNuc    = gs['nucleare'] ?? 0;
          iranSpecialUpdates['nucleare']                 = Math.max(1, curNuc - 1);
          // Iran guadagna simpatia internazionale (opinione -2)
          iranSpecialUpdates['opinione'] = Math.max(-10, Math.min(10, (gs['opinione'] ?? 0) - 2));
          iranAttackNoteSuffix += ' nucleare-1 tecnologia_nucleare-1 opinione-2';
        }

        if (capitalTargets.includes(territory)) {
          // Teheran/Iran: stabilita_iran -1, forze_militari_iran -1
          const curStabIran = gs['stabilita_iran'] ?? 0;
          const curForze    = gs['forze_militari_iran'] ?? 0;
          iranSpecialUpdates['stabilita_iran']     = Math.max(1, curStabIran - 1);
          iranSpecialUpdates['forze_militari_iran'] = Math.max(0, curForze - 1);
          // Iran guadagna ancora più simpatia internazionale (opinione -3)
          iranSpecialUpdates['opinione'] = Math.max(-10, Math.min(10, (gs['opinione'] ?? 0) - 3));
          iranAttackNoteSuffix += ' stabilita_iran-1 forze_militari-1 opinione-3';
        }

        if (Object.keys(iranSpecialUpdates).length > 0) {
          await supabase.from('game_state')
            .update(iranSpecialUpdates)
            .eq('game_id', game.id);
        }
      }
      // ─────────────────────────────────────────────────────────────────────

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

      // 4. Scrivi combat_log (includi extra_effects)
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
        notification: `⚔️ ${result.toUpperCase().replace('_', ' ')}: ${myFaction} attacca ${territory} — ${description}${isIranAttack && iranAttackNoteSuffix ? ` |${iranAttackNoteSuffix}` : ''}`,
      }); // loading: false → gestito dal finally

      // Controlla DEFCON 1 → game over immediato, NON passare il turno
      if (newDefcon <= 1) {
        set({ gameOverInfo: { winner: null, condition: 'defcon', message: '☢️ GUERRA TERMONUCLEARE — tutti perdono!' } });
        await supabase.from('games').update({ status: 'finished', winner_condition: 'defcon' }).eq('id', game.id);
        return; // stop: non passare il turno
      }

      // Passa il turno su DB (altrimenti gli altri client non vedono il cambio via realtime)
      const nextFact = nextFaction(myFaction);
      const nextTurnNum = nextFact === 'Iran' ? game.current_turn + 1 : game.current_turn;
      await Promise.all([
        supabase.from('game_state').update({ active_faction: nextFact }).eq('game_id', game.id),
        supabase.from('games').update({ current_turn: nextTurnNum }).eq('id', game.id),
      ]);
      set(s => ({
        gameState: { ...s.gameState!, active_faction: nextFact },
        game: { ...s.game!, current_turn: nextTurnNum },
      }));

      // Avvia bot se necessario
      const nextPlayer = players.find(p => p.faction === nextFact);
      if (nextPlayer?.is_bot) {
        setTimeout(() => get().runBotTurn(), 2000);
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore combattimento' });
      console.error('[attackTerritory]', err);
    } finally {
      set({ loading: false }); // SEMPRE eseguito anche in caso di errore
    }
  },

  // ── Gioca carta in modalità OP con una delle 3 azioni ────────────────────────
  playCardOps: async (cardId, action, params) => {
    const { game, gameState, myFaction, deployUnit, addInfluence, attackTerritory, playCardUnified } = get();
    if (!game || !gameState || !myFaction) return;
    set({ loading: true, error: null });
    try {
      if (action === 'buy') {
        // Acquista unità: aggiunge al pool della fazione (aumenta disponibili, NON richiede pool esistente)
        const { unitType = 'Convenzionale', qty = 1 } = params;
        const unitsKey = `units_${myFaction.toLowerCase()}` as keyof typeof gameState;
        const pool = { ...((gameState[unitsKey] as Record<string, number>) ?? {}) };
        pool[unitType] = (pool[unitType] ?? 0) + qty;
        await supabase.from('game_state').update({ [unitsKey]: pool }).eq('game_id', game.id);
        // Aggiorna lo stato locale prima di chiamare playCardUnified per evitare
        // che il guard active_faction scatti prima che Supabase realtime aggiorni
        set(s => ({
          gameState: { ...s.gameState!, [unitsKey]: pool } as typeof gameState,
          notification: `🏭 ${myFaction}: acquistate ${qty}× ${unitType}`,
        }));
        // ── Inserisci log acquisto unità separato (distinto dalla carta OP) ──
        const nuovaQty = pool[unitType] ?? qty;
        supabase.from('moves_log').insert({
          game_id:      game.id,
          faction:      myFaction,
          turn_number:  game.current_turn,
          player_id:    get().profile?.id ?? null,
          is_bot_move:  false,
          card_id:      `BUY_${unitType}_${Date.now()}`,
          card_name:    `Acquisto ${unitType} ×${qty}`,
          card_type:    'Acquisto',
          description:  `${unitType} aggiunta al pool — totale: ×${nuovaQty}`,
          delta_risorse: 0,
        }).then(({ error: logErr }) => {
          if (logErr) console.warn('[buyUnit] moves_log non salvato:', logErr.message);
        });
        console.log('[buyUnit] pool aggiornato, avanzando turno con playCardUnified…');
        // Passa il turno immediatamente — usa snapshot fresco di active_faction
        // (non delegare a playCardUnified il controllo active_faction, poiché
        //  il realtime potrebbe aver già cambiato active_faction prima che arrivi qui)
        try {
          await playCardUnified(cardId, 'ops');
        } catch (buyErr: unknown) {
          console.error('[buyUnit] playCardUnified fallita, fallback turno manuale:', buyErr);
          // Fallback: avanza il turno manualmente se playCardUnified non riesce
          const freshState = get().gameState;
          const freshGame  = get().game;
          if (freshGame && freshState && freshState.active_faction === myFaction) {
            const nextFact = nextFaction(myFaction);
            const nextTurn = nextFact === 'Iran' ? freshGame.current_turn + 1 : freshGame.current_turn;
            await supabase.from('game_state').update({ active_faction: nextFact }).eq('game_id', freshGame.id);
            await supabase.from('games').update({ current_turn: nextTurn }).eq('id', freshGame.id);
            // Marca carta come giocata
            await supabase.from('cards_deck').update({
              status: 'played',
              played_at_turn: freshGame.current_turn,
              held_by_faction: null,
              play_mode: 'ops',
            }).eq('card_id', cardId);
            set(s => ({
              gameState: { ...s.gameState!, active_faction: nextFact } as typeof freshState,
              game: { ...s.game!, current_turn: nextTurn },
              deckCards: s.deckCards.filter(dc => dc.card_id !== cardId),
              loading: false,
            }));
            const nextPlayer = get().players.find(p => p.faction === nextFact);
            if (nextPlayer?.is_bot) setTimeout(() => get().runBotTurn(), 2000);
          } else {
            set({ loading: false });
          }
        }
        return; // loading già gestito da playCardUnified o dal fallback sopra

      } else if (action === 'influence') {
        const { territory = '', opSpent = 1 } = params;
        // Aggiungi influenza: opSpent punti
        await addInfluence(territory, opSpent);

      } else if (action === 'attack') {
        const {
          territory = '', unitTypes = [], attackForce = 1, defenseForce = 1,
          result = 'stallo', infChangeAtk = 0, infChangeDef = 0,
          defconChange = 0, description = '', attackerUnitsLost = 0, stabilityChange = 0,
        } = params;

        // Trova il difensore principale nel territorio
        const { militaryUnits, territories: terrRecs } = get();
        const defUnits = militaryUnits.filter(u => u.territory === territory && u.faction !== myFaction);
        const terrRec  = terrRecs.find(t => t.territory === territory);
        let defender: import('@/types/game').Faction = 'Iran';
        if (defUnits.length > 0) {
          defender = defUnits[0].faction as import('@/types/game').Faction;
        } else if (terrRec) {
          // Trova la fazione con più influenza come difensore
          const factions: import('@/types/game').Faction[] = ['Iran','Coalizione','Russia','Cina','Europa'];
          const best = factions.reduce((max, f) => {
            const key = `inf_${f.toLowerCase()}` as keyof typeof terrRec;
            const val = (terrRec[key] as number) ?? 0;
            const maxKey = `inf_${max.toLowerCase()}` as keyof typeof terrRec;
            const maxVal = (terrRec[maxKey] as number) ?? 0;
            return val > maxVal ? f : max;
          }, factions.find(f => f !== myFaction) ?? 'Iran' as import('@/types/game').Faction);
          defender = best;
        }

        await attackTerritory({
          territory, defender, unitsUsed: unitTypes,
          attackForce, defenseForce,
          result: result as Parameters<typeof attackTerritory>[0]['result'],
          infChangeAtk, infChangeDef, defconChange, description,
          attackerUnitsLost, stabilityChange,
        });
        // attackTerritory gestisce già il passaggio di turno.
        // Segniamo solo la carta come giocata (senza secondo turno-advance).
        await supabase.from('cards_deck').update({
          status: 'played',
          played_at_turn: get().game?.current_turn ?? null,
          held_by_faction: null,
          play_mode: 'ops',
        }).eq('card_id', cardId);
        set(s => ({
          deckCards: s.deckCards.filter(dc => dc.card_id !== cardId),
          loading: false,
        }));
        return;
      }

      // Per influence: marca la carta come giocata e passa il turno
      await playCardUnified(cardId, 'ops');
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Errore azione OP', loading: false });
    } finally {
      // Garantisce sempre il reset di loading, anche se playCardUnified esce in anticipo
      set({ loading: false });
    }
  },

  // ── Obiettivi Segreti ──────────────────────────────────────────────────────

  assignObjectivesToFaction: async (faction: string, numDraw = 3): Promise<ObiettivoSegreto[]> => {
    const { game } = get();
    // 1) Mappa nomi corti Faction → nomi lunghi ObjFazione
    const FACTION_TO_OBJ: Record<string, ObjFazione> = {
      'Iran':                  'Iran',
      'Coalizione':            'Coalizione Occidentale',
      'Coalizione Occidentale':'Coalizione Occidentale',
      'Russia':                'Russia',
      'Cina':                  'Cina',
      'Europa':                'Unione Europea',
      'Unione Europea':        'Unione Europea',
    };
    const objFazione: ObjFazione = FACTION_TO_OBJ[faction] ?? (faction as ObjFazione);
    // 2) Estrai obiettivi dal pool locale (sempre disponibile offline)
    const localObs = assignObjectives(objFazione, numDraw);

    // 2) Salva in Supabase se la partita esiste
    if (game?.id) {
      try {
        // Prima rimuovi assegnazioni precedenti per questa fazione
        await supabase
          .from('game_objectives')
          .delete()
          .eq('game_id', game.id)
          .eq('faction', faction);

        // Inserisci i nuovi obiettivi
        if (localObs.length > 0) {
          await supabase.from('game_objectives').upsert(
            localObs.map(o => ({
              game_id:   game.id,
              faction,
              obj_id:    o.obj_id,
              completato: false,
              punteggio:  0,
            })),
            { onConflict: 'game_id,faction,obj_id', ignoreDuplicates: true }
          );
        }
      } catch (e) {
        console.warn('[assignObjectivesToFaction] Supabase fallback to local:', e);
      }
    }

    set({ myObjectives: localObs });
    return localObs;
  },

  loadMyObjectives: async (faction: string): Promise<void> => {
    const { game } = get();
    if (!game?.id) return;

    try {
      // Carica gli obj_id assegnati in Supabase
      const { data: rows } = await supabase
        .from('game_objectives')
        .select('obj_id, completato, punteggio')
        .eq('game_id', game.id)
        .eq('faction', faction);

      if (!rows || rows.length === 0) {
        // Nessun obiettivo in DB → assegna ora
        await get().assignObjectivesToFaction(faction);
        return;
      }

      // Ricostruisci gli ObiettivoSegreto dal pool locale (import statico)
      const loaded: ObiettivoSegreto[] = rows
        .map(r => TUTTI_GLI_OBIETTIVI.find(o => o.obj_id === r.obj_id))
        .filter((o): o is ObiettivoSegreto => !!o);

      set({ myObjectives: loaded });
    } catch (e) {
      console.warn('[loadMyObjectives] errore:', e);
    }
  },

  markObjectiveComplete: async (objId: string, completed: boolean): Promise<void> => {
    const { game, myObjectives } = get();
    const obj = myObjectives.find(o => o.obj_id === objId);
    if (!obj) return;

    if (game?.id) {
      try {
        await supabase
          .from('game_objectives')
          .update({ completato: completed, punteggio: completed ? obj.punti : 0 })
          .eq('game_id', game.id)
          .eq('obj_id', objId);
      } catch (e) {
        console.warn('[markObjectiveComplete] errore:', e);
      }
    }
    // Aggiorna lo stato locale
    set({
      myObjectives: myObjectives.map(o =>
        o.obj_id === objId
          ? { ...o, completato: true, data_completamento: new Date().toISOString() }
          : o
      )
    });
  },
}));

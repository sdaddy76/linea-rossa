// =============================================
// LINEA ROSSA — Stato della sessione e della partita aperta (edizione da tavolo v3)
// Le regole, le mosse e i BOT sono nel motore (src/game-v3) e sul server (funzione "tabletop").
// =============================================
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { sessionListener } from '@/integrations/supabase/session-listener';
import { normalizeFaction } from '@/lib/factions';
import { initializeTabletop } from '@/game-v3/online';
import type { Game, GamePlayer, GameState, Profile, Faction } from '@/types/game';

interface OnlineGameStore {
  profile: Profile | null;
  session: { user: { id: string; email?: string } } | null;
  game: Game | null;
  players: GamePlayer[];
  gameState: GameState | null;
  myFaction: Faction | null;
  loading: boolean;
  error: string | null;
  notification: string | null;
  initAuth: () => Promise<void>;
  /** Sospende onAuthStateChange (prima di updateUser) e lo riattiva dopo. */
  pauseAuthListener: () => void;
  resumeAuthListener: () => void;
  logout: () => Promise<void>;
  resetGame: () => void;
  loadGame: (gameId: string, forceFaction?: string | null) => Promise<void>;
  startGame: () => Promise<void>;
  subscribeToGame: (gameId: string) => () => void;
  clearError: () => void;
  setNotification: (msg: string | null) => void;
}

let _authUnsubscribe: (() => void) | null = null;
const EMPTY = { game: null, gameState: null, players: [], myFaction: null, error: null, loading: false, notification: null };

export const useOnlineGameStore = create<OnlineGameStore>((set, get) => {
  const listen = (cleanUrl: boolean) => {
    _authUnsubscribe?.();
    const listener = sessionListener<Profile>(session => {
      if (cleanUrl && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      set({ session });
      if (!session?.user) set({ profile: null, game: null, gameState: null, players: [] });
    }, async id => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      return data as Profile | null;
    }, profile => set({ profile }));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(listener.callback);
    _authUnsubscribe = () => { listener.cancel(); subscription.unsubscribe(); };
  };
  return {
    profile: null, session: null, ...EMPTY,

    initAuth: async () => {
      // Recupera la sessione esistente; AbortError (bug noto di Supabase JS su SPA) non blocca il flusso.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          set({ session });
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) set({ profile: profile as Profile });
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') console.warn('[initAuth] errore getSession:', e.message);
      }
      listen(true);
    },
    pauseAuthListener: () => { _authUnsubscribe?.(); _authUnsubscribe = null; },
    resumeAuthListener: () => listen(false),
    logout: async () => {
      await supabase.auth.signOut();
      set({ profile: null, session: null, game: null, gameState: null });
    },
    resetGame: () => set({ ...EMPTY }),

    loadGame: async (gameId, forceFaction) => {
      set({ ...EMPTY, loading: true });
      try {
        const [gameRes, playersRes, stateRes] = await Promise.all([
          supabase.from('games').select('*').eq('id', gameId).single(),
          supabase.from('game_players').select('*, profile:profiles(*)').eq('game_id', gameId),
          supabase.from('game_state').select('*').eq('game_id', gameId).single(),
        ]);
        const players = (playersRes.data ?? []) as GamePlayer[];
        const mine = players.find(p => p.player_id === get().profile?.id);
        // forceFaction: il redirect può arrivare prima che i BOT siano nel database.
        set({ game: gameRes.data as Game, players, gameState: stateRes.data as GameState,
          myFaction: normalizeFaction(mine?.faction ?? forceFaction), loading: false });
      } catch {
        set({ error: 'Errore nel caricamento della partita', loading: false });
      }
    },

    startGame: async () => {
      const { game, profile } = get();
      if (!game || !profile) return;
      set({ loading: true, error: null });
      try { await initializeTabletop(game.id, profile.id); await get().loadGame(game.id); }
      catch (err) { set({ error: err instanceof Error ? err.message : 'Errore avvio partita' }); }
      finally { set({ loading: false }); }
    },

    subscribeToGame: gameId => {
      const stateSub = supabase.channel(`game-state-${gameId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `game_id=eq.${gameId}` },
          payload => set(s => ({ gameState: { ...s.gameState, ...payload.new } as GameState })))
        .subscribe();
      const gameSub = supabase.channel(`game-${gameId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
          payload => set(s => ({ game: { ...s.game, ...payload.new } as Game })))
        .subscribe();
      const playersSub = supabase.channel(`players-${gameId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` }, async () => {
          const { data } = await supabase.from('game_players').select('*, profile:profiles(*)').eq('game_id', gameId);
          if (data) set({ players: data as GamePlayer[] });
        })
        .subscribe();
      return () => { stateSub.unsubscribe(); gameSub.unsubscribe(); playersSub.unsubscribe(); };
    },
    clearError: () => set({ error: null }),
    setNotification: msg => set({ notification: msg }),
  };
});

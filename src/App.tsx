import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { useOnlineGameStore } from "@/store/onlineGameStore";
import { supabase } from "@/integrations/supabase/client";

// Pagine
import CoverPage from "./pages/home/CoverPage";
import AuthPage from "./pages/auth/Index";
import LobbyPage from "./pages/lobby/Index";
import AdminMigration from '@/pages/admin/Migration';
import GamePage from "./pages/game/Index";
import NotFound from "./pages/not-found/Index";

const queryClient = new QueryClient();

// ------------------------------------------------
// Router principale con autenticazione + navigazione
// ------------------------------------------------
function AppRouter() {
  const { profile, session, game, initAuth, loadGame, subscribeToGame, logout } = useOnlineGameStore();
  const [view, setView] = useState<'cover' | 'auth' | 'lobby' | 'game' | 'admin'>('cover');

  useEffect(() => {
    initAuth();

    // ── Parsing manuale dei token dall'URL ──────────────────────────────────
    // detectSessionInUrl è disabilitato per evitare AbortError su SPA.
    // Gestiamo qui i redirect da conferma email e reset password.
    const hash = window.location.hash;
    const search = window.location.search;
    const raw = hash.startsWith('#') ? hash.slice(1) : search.startsWith('?') ? search.slice(1) : '';
    const params = new URLSearchParams(raw);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type'); // 'signup' | 'recovery' | 'magiclink'

    if (accessToken && refreshToken) {
      // Imposta la sessione manualmente dal token nell'URL
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (!error && data.session) {
            window.history.replaceState({}, document.title, window.location.pathname);
            if (type === 'recovery') {
              setView('auth'); // tornerà alla pagina auth in modalità new-password
            } else {
              setView('lobby');
            }
          }
        })
        .catch(() => { /* ignora */ });
    }

    // Ascolta cambi di stato auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        // Pulisci l'URL se ancora sporco
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Quando cambia la sessione/profilo, reindirizza
  useEffect(() => {
    if (session && profile && (view === 'auth' || view === 'cover')) {
      setView('lobby');
    }
    if (!session && view === 'lobby') {
      setView('cover');
    }
  }, [session, profile]);

  // Sottoscrivi real-time quando sei in partita
  useEffect(() => {
    if (game?.id && view === 'game') {
      const unsub = subscribeToGame(game.id);
      return unsub;
    }
  }, [game?.id, view]);

  const handleJoinGame = async (gameId: string, chosenFaction?: string) => {
    await loadGame(gameId, chosenFaction ?? null);
    setView('game');
  };

  const handleLogout = async () => {
    await logout();
    setView('home');
  };

  // Render basato su view
  if (view === 'auth') return <AuthPage />;
  if (view === 'admin') return <AdminMigration />;

  if (view === 'lobby' && profile) return (
    <LobbyPage
      profile={profile}
      onJoinGame={handleJoinGame}
      onLogout={handleLogout}
      onAdmin={() => setView('admin')}
    />
  );
  if (view === 'game') return (
    <GamePage onBack={() => setView('lobby')} />
  );

  // Cover page (default / home)
  return (
    <CoverPage
      onPlay={() => session ? setView('lobby') : setView('auth')}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRouter />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

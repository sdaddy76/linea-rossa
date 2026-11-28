import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useOnlineGameStore } from "@/store/onlineGameStore";
import { supabase } from "@/integrations/supabase/client";

// Pagine
import CoverPage from "./pages/home/CoverPage";
import AuthPage from "./pages/auth/Index";
import LobbyPage from "./pages/lobby/Index";
import ReadabilityPreview from "./pages/lobby/ReadabilityPreview";
import GameReadabilityPreview from "./game-v3/GameReadabilityPreview";
import AdminMigration from '@/pages/admin/Migration';
import LegacyGame from "./pages/game/LegacyGame";
import TabletopGamePage from "./game-v3/TabletopGamePage";
import GuidedGame from "./game-v3/tutorial/GuidedGame";
import RulesLibrary from "./game-v3/tutorial/RulesLibrary";
import TournamentsPage from "./game-v3/TournamentsPage";
import { readTabletop } from "./game-v3/online";
import NotFound from "./pages/not-found/Index";
import UserAnalytics from '@/pages/admin/UserAnalytics';
import { endAccessTracking, beginAccessTracking } from '@/lib/accessTracking';
import { isLineaRossaAdmin } from '@/lib/admin';

const queryClient = new QueryClient();

// ------------------------------------------------
// Router principale con autenticazione + navigazione
// ------------------------------------------------
function AppRouter() {
  const { profile, session, game, gameState, initAuth, loadGame, resetGame, subscribeToGame, logout } = useOnlineGameStore();

  // ── Rilevamento sincrono type=recovery PRIMA di qualsiasi render ──────────
  // Leggiamo l'URL subito (fuori da useEffect) per impostare il flag prima
  // che initAuth() + onAuthStateChange possano fare setView('lobby')
  const detectRecovery = () => {
    const hash   = window.location.hash;
    const search = window.location.search;
    const raw    = hash.startsWith('#') ? hash.slice(1) : search.startsWith('?') ? search.slice(1) : '';
    const params = new URLSearchParams(raw);
    return params.get('type') === 'recovery' && !!params.get('access_token');
  };

  const [view, setView] = useState<'cover' | 'auth' | 'lobby' | 'game' | 'admin' | 'admin-areas' | 'admin-stats' | 'tutorial' | 'rules' | 'tournaments' | 'readability-preview' | 'game-readability-preview'>(
    detectRecovery() ? 'auth' : window.location.hash === '#/leggibilita-gioco' ? 'game-readability-preview' : window.location.hash === '#/leggibilita' ? 'readability-preview' : window.location.hash === '#/partita-guidata' ? 'tutorial' : window.location.hash === '#/regole-animate' ? 'rules' : window.location.hash === '#/tornei' ? 'tournaments' : 'cover'
  );
  // Flag: siamo in flusso reset password (type=recovery) → non redirezionare a lobby automaticamente
  const isRecoveryFlow = useRef(detectRecovery());

  useEffect(() => {
    // The reading example is public and uses only fictional local data.
    if (view === 'readability-preview' || view === 'game-readability-preview') return;
    initAuth();

    // ── Parsing manuale dei token dall'URL ──────────────────────────────────
    // detectSessionInUrl è disabilitato per evitare AbortError su SPA.
    // Gestiamo qui i redirect da conferma email e reset password.
    const hash = window.location.hash;
    const search = window.location.search;
    const raw = hash.startsWith('#') ? hash.slice(1) : search.startsWith('?') ? search.slice(1) : '';
    const params = new URLSearchParams(raw);
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type         = params.get('type'); // 'signup' | 'recovery' | 'magiclink'

    if (accessToken && refreshToken) {
      // Imposta la sessione manualmente dal token nell'URL
      // NOTA: setSession fa scattare onAuthStateChange nello store (un solo listener)
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (!error && data.session) {
            window.history.replaceState({}, document.title, window.location.pathname);
            if (type === 'recovery') {
              isRecoveryFlow.current = true;
              setView('auth');
            } else {
              setView('lobby');
            }
          }
        })
        .catch(() => { /* ignora */ });
    }

    // ── NON registrare un secondo onAuthStateChange qui ──────────────────────
    // L'unico listener autorizzato è quello in initAuth() (onlineGameStore.ts).
    // Due listener contemporanei causano conflitti sul Web Lock di Supabase
    // → AbortError durante updateUser() (reset password).
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || view === 'game-readability-preview') return;
    return beginAccessTracking(userId);
  }, [session?.user?.id]);

  // Quando cambia la sessione/profilo, reindirizza
  // ECCEZIONE: se siamo in flusso reset password (recovery), non redirezionare a lobby
  useEffect(() => {
    if (session && profile && (view === 'auth' || view === 'cover')) {
      if (isRecoveryFlow.current) {
        // L'utente sta scegliendo la nuova password — non redirezionare
        return;
      }
      setView('lobby');
    }
    if (!session && view === 'lobby') {
      setView('cover');
    }
    // Quando il profilo è pronto e non siamo più in recovery, resetta il flag
    if (!isRecoveryFlow.current && session && profile && view === 'lobby') {
      isRecoveryFlow.current = false;
    }
  }, [session, profile]);

  // Reset store SOLO quando si torna al lobby dalla GamePage
  // (NON ad ogni render con view='lobby', altrimenti resetta anche la WaitingRoom)
  const handleBackToLobby = () => {
    resetGame();
    setView('lobby');
  };

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
    await endAccessTracking(session?.user?.id);
    await logout();
    setView('cover');
  };
  const openTutorial = () => {
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#/partita-guidata`);
    setView('tutorial');
  };
  const openRules = () => {
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#/regole-animate`);
    setView('rules');
  };
  const leaveTutorial = (play: boolean) => {
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    setView(session && profile ? 'lobby' : play ? 'auth' : 'cover');
  };

  // Render basato su view
  if (view === 'game-readability-preview') return <GameReadabilityPreview onBack={() => {
    window.location.assign(window.location.pathname + window.location.search);
  }}/>;
  if (view === 'readability-preview') return <ReadabilityPreview onBack={() => {
    // Reload the normal entry path so authentication is initialized normally.
    window.location.assign(window.location.pathname + window.location.search);
  }}/>;
  if (view === 'tournaments') {
    if (!session || !profile) return <AuthPage isRecovery={false} onPasswordSaved={() => setView('tournaments')} />;
    return <TournamentsPage profile={profile} isAdmin={isLineaRossaAdmin(session.user.email)}
      onBack={() => { window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`); setView('lobby'); }}
      onJoinGame={(gameId, faction) => { window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`); void handleJoinGame(gameId, faction); }} />;
  }
  if (view === 'rules') return <RulesLibrary onExit={() => leaveTutorial(false)} onTutorial={openTutorial}/>;
  if (view === 'tutorial') return <GuidedGame onExit={() => leaveTutorial(false)} onPlay={() => leaveTutorial(true)}/>;
  if (view === 'auth') return <AuthPage
    isRecovery={isRecoveryFlow.current}
    onPasswordSaved={() => { isRecoveryFlow.current = false; setView('lobby'); }}
  />;
  if (view === 'admin') return <AdminMigration onBack={() => setView('lobby')} />;
  if (view === 'admin-areas') return <AdminMigration initialSection="areas" onBack={() => setView('lobby')} />;
  if (view === 'admin-stats') {
    if (!session?.user?.email || !isLineaRossaAdmin(session.user.email)) {
      return <CoverPage
        onPlay={() => setView(session && profile ? 'lobby' : 'auth')}
        onTutorial={openTutorial}
        onRules={openRules}
      />;
    }
    return <UserAnalytics onBack={() => setView('lobby')} />;
  }

  if (view === 'lobby' && session && profile) return (
    <LobbyPage
      profile={profile}
      onJoinGame={handleJoinGame}
      onLogout={handleLogout}
      onAdmin={(section = 'database') => setView(
        section === 'areas' ? 'admin-areas' :
        section === 'player-stats' ? 'admin-stats' : 'admin',
      )}
      onTutorial={openTutorial}
        onRules={openRules}
      onTournaments={() => { window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#/tornei`); setView('tournaments'); }}
    />
  );
  if (view === 'game') return (
    readTabletop(gameState)
      ? <TabletopGamePage onBack={handleBackToLobby} />
      : <LegacyGame onBack={handleBackToLobby} />
  );

  // Cover page (default / home)
  return (
    <CoverPage
      onPlay={() => session ? setView('lobby') : setView('auth')}
      onTutorial={openTutorial}
        onRules={openRules}
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

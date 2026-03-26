import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { useOnlineGameStore } from "@/store/onlineGameStore";

// Pagine
import Index from "./pages/home/Index";
import AuthPage from "./pages/auth/Index";
import LobbyPage from "./pages/lobby/Index";
import GamePage from "./pages/game/Index";
import NotFound from "./pages/not-found/Index";

const queryClient = new QueryClient();

// ------------------------------------------------
// Router principale con autenticazione + navigazione
// ------------------------------------------------
function AppRouter() {
  const { profile, session, game, gameState, loading, initAuth, loadGame, subscribeToGame, logout } = useOnlineGameStore();
  const [view, setView] = useState<'home' | 'auth' | 'lobby' | 'game'>('home');

  useEffect(() => {
    initAuth();
  }, []);

  // Quando cambia la sessione/profilo, reindirizza
  useEffect(() => {
    if (session && profile && view === 'auth') {
      setView('lobby');
    }
    if (!session && view === 'lobby') {
      setView('auth');
    }
  }, [session, profile]);

  // Sottoscrivi real-time quando sei in partita
  useEffect(() => {
    if (game?.id && view === 'game') {
      const unsub = subscribeToGame(game.id);
      return unsub;
    }
  }, [game?.id, view]);

  const handleJoinGame = async (gameId: string) => {
    await loadGame(gameId);
    setView('game');
  };

  const handleLogout = async () => {
    await logout();
    setView('home');
  };

  // Render basato su view
  if (view === 'auth') return <AuthPage />;
  if (view === 'lobby' && profile) return (
    <LobbyPage
      profile={profile}
      onJoinGame={handleJoinGame}
      onLogout={handleLogout}
    />
  );
  if (view === 'game') return (
    <GamePage onBack={() => setView('lobby')} />
  );

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={
          <div>
            <Index />
            {/* Pulsante flottante per accedere al multiplayer */}
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={() => session ? setView('lobby') : setView('auth')}
                className="flex items-center gap-2 px-4 py-3 bg-[#00ff88] hover:bg-[#00dd77]
                  text-[#0a0e1a] font-bold font-mono rounded-xl shadow-2xl shadow-[#00ff8860]
                  transition-all hover:scale-105 text-sm">
                🌐 {session ? 'PARTITE ONLINE' : 'ACCEDI / GIOCA ONLINE'}
              </button>
            </div>
          </div>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
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

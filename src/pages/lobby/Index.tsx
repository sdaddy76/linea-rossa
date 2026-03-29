// =============================================
// LINEA ROSSA — Lobby
// Crea partita (ottieni codice) oppure unisciti
// con codice → WaitingRoom real-time
// =============================================
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Game, Profile } from '@/types/game';
import CardLibraryManager from '@/components/CardLibraryManager';
import BotCardLibraryManager from '@/components/BotCardLibraryManager';
import EventLibraryManager from '@/components/EventLibraryManager';
import WaitingRoom from '@/components/WaitingRoom';

interface LobbyPageProps {
  profile: Profile;
  onJoinGame: (gameId: string, chosenFaction?: string) => void;
  onLogout: () => void;
  onAdmin?: () => void;
}

export default function LobbyPage({ profile, onJoinGame, onLogout, onAdmin}: LobbyPageProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [gameName, setGameName] = useState('');
  const [maxTurns, setMaxTurns] = useState(20);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBotLibrary, setShowBotLibrary] = useState(false);
  const [showEventLibrary, setShowEventLibrary] = useState(false);

  // Sala d'attesa
  const [waitingGame, setWaitingGame] = useState<{
    id: string; code: string; name: string; isHost: boolean;
  } | null>(null);

  useEffect(() => { loadMyGames(); }, []);

  const loadMyGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .in('status', ['lobby', 'active'])
      .order('created_at', { ascending: false })
      .limit(8);
    if (data) setMyGames(data as Game[]);
  };

  // ── CREA PARTITA ─────────────────────────────────────────────────
  const createGame = async () => {
    if (!gameName.trim()) { setError('Inserisci un nome per la partita'); return; }
    if (!profile?.id) { setError('Sessione non valida — effettua di nuovo il login'); return; }
    setLoading(true); setError('');
    try {
      // Genera codice univoco: prova RPC, poi fallback locale con retry
      const PREFIXES = ['GULF','IRAN','ATOM','NUKE','HAWK','DOVE','SAND','SILK','BRIC','NATO'];
      const makeCode = () => {
        const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        return `${p}-${Math.floor(Math.random() * 900 + 10)}`;
      };
      let code = makeCode();
      try {
        const { data: codeData, error: rpcErr } = await supabase.rpc('generate_game_code');
        if (!rpcErr && codeData) code = codeData as string;
      } catch { /* RPC non deployata → usa fallback */ }

      // Retry: se il codice è già usato, genera un altro (max 5 tentativi)
      let game = null;
      let gameError = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await supabase
          .from('games')
          .insert({ name: gameName.trim(), code, created_by: profile.id, max_turns: maxTurns })
          .select()
          .single();
        game = res.data;
        gameError = res.error;
        if (!gameError) break;
        // codice duplicato → riprova con nuovo codice
        if (gameError.code === '23505') { code = makeCode(); continue; }
        // altro errore → esci dal loop
        break;
      }

      if (gameError) {
        console.error('[createGame] Supabase error:', gameError);
        throw new Error(gameError.message ?? gameError.details ?? 'Errore nella creazione partita');
      }
      if (!game) throw new Error('Partita non creata — risposta DB vuota');

      // Entra in sala d'attesa come host
      setWaitingGame({ id: game.id, code: game.code, name: game.name, isHost: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nella creazione';
      console.error('[createGame] errore:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── UNISCITI CON CODICE ──────────────────────────────────────────
  const joinGame = async () => {
    if (!joinCode.trim()) { setError('Inserisci il codice partita'); return; }
    setLoading(true); setError('');
    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', joinCode.trim().toUpperCase())
        .single();
      if (gameError || !game) throw new Error('Partita non trovata con questo codice');
      // Partita finita: permetti comunque di entrare (per rivedere risultato o ricreare)
      if (game.status === 'finished' || game.status === 'active') {
        // Entra direttamente nella schermata di gioco
        onJoinGame(game.id);
        return;
      }
      // status === 'lobby' → sala d'attesa
      setWaitingGame({
        id: game.id,
        code: game.code,
        name: game.name,
        isHost: game.created_by === profile.id,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Codice non valido');
    } finally {
      setLoading(false);
    }
  };

  // ── Riconnetti a partita recente ────────────────────────────────
  const rejoinGame = async (game: Game) => {
    if (game.status === 'active') {
      onJoinGame(game.id);
    } else {
      setWaitingGame({
        id: game.id, code: game.code, name: game.name,
        isHost: game.created_by === profile.id,
      });
    }
  };

  // ── WaitingRoom attiva ───────────────────────────────────────────
  if (waitingGame) {
    return (
      <WaitingRoom
        gameId={waitingGame.id}
        gameCode={waitingGame.code}
        gameName={waitingGame.name}
        profile={profile}
        isHost={waitingGame.isHost}
        onGameStart={(faction) => onJoinGame(waitingGame.id, faction)}
        onLeave={() => { setWaitingGame(null); loadMyGames(); }}
      />
    );
  }

  // ── Schermata principale Lobby ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-black text-[#00ff88] font-mono tracking-widest">☢️ LINEA ROSSA</h1>
            <p className="text-[#8899aa] text-xs font-mono mt-0.5">
              Benvenuto, <span className="text-white font-bold">{profile.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLibrary(true)}
              className="px-3 py-1.5 border border-[#1e3a5f] hover:border-[#00ff88]
                text-[#8899aa] hover:text-[#00ff88] rounded-lg font-mono text-xs transition-colors">
              🃏 Carte
            </button>
            <button onClick={() => setShowBotLibrary(true)}
              className="px-3 py-1.5 border border-[#1e3a5f] hover:border-[#c8a55a]
                text-[#8899aa] hover:text-[#c8a55a] rounded-lg font-mono text-xs transition-colors">
              🤖 BOT
            </button>
            <button onClick={() => setShowEventLibrary(true)}
              className="px-3 py-1.5 border border-[#1e3a5f] hover:border-[#f97316]
                text-[#8899aa] hover:text-[#f97316] rounded-lg font-mono text-xs transition-colors">
              🎴 Eventi
            </button>
            <button onClick={onAdmin}
  className="text-[#8899aa] hover:text-[#00ff88] font-mono text-xs border border-[#334455] rounded px-2 py-1">
  ⚙️ DB
</button>
<button onClick={onLogout}
              className="px-3 py-1.5 border border-[#334455] text-[#8899aa] hover:text-white
                rounded-lg font-mono text-xs transition-colors">
              ESCI
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-[#060d18] rounded-xl border border-[#1e3a5f]">
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className="py-2.5 rounded-lg font-mono text-sm font-bold transition-all"
              style={{
                background: tab === t ? '#00ff88' : 'transparent',
                color: tab === t ? '#0a0e1a' : '#8899aa',
              }}>
              {t === 'create' ? '🎮 Nuova partita' : '🔗 Entra con codice'}
            </button>
          ))}
        </div>

        {/* ── TAB: CREA ── */}
        {tab === 'create' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-1.5">
                  Nome partita
                </label>
                <input
                  value={gameName}
                  onChange={e => setGameName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createGame()}
                  placeholder="es. Crisi del Golfo 2026"
                  className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                    placeholder-[#334455] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-1.5">
                  Turni massimi
                </label>
                <select
                  value={maxTurns}
                  onChange={e => setMaxTurns(Number(e.target.value))}
                  className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]">
                  {[10, 15, 20, 25, 30].map(n => (
                    <option key={n} value={n}>{n} turni</option>
                  ))}
                </select>
              </div>

              {/* Info flusso */}
              <div className="flex gap-2 items-start p-3 rounded-lg bg-[#060d18] border border-[#1e2a3a]">
                <span className="text-base mt-0.5">💡</span>
                <p className="text-xs font-mono text-[#556677] leading-relaxed">
                  Dopo aver creato la partita riceverai un <strong className="text-[#8899aa]">codice</strong> da
                  condividere con gli altri giocatori. Ognuno sceglierà la propria fazione in sala d'attesa.
                  Le fazioni non assegnate saranno controllate dal bot.
                </p>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg border border-[#ff4444] bg-[#ff000010]
                text-[#ff6666] text-xs font-mono">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={createGame}
              disabled={loading || !gameName.trim()}
              className="w-full py-3.5 rounded-xl font-black font-mono tracking-widest text-sm
                transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                color: '#0a0e1a',
                boxShadow: '0 0 30px #00ff8840',
              }}>
              {loading ? '⏳ CREAZIONE…' : '🚀 CREA PARTITA'}
            </button>
          </div>
        )}

        {/* ── TAB: UNISCITI ── */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-1.5">
                  Codice partita
                </label>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinGame()}
                  placeholder="es. GULF-42"
                  maxLength={12}
                  className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg px-4 py-3
                    text-white font-mono text-xl tracking-[0.25em] text-center
                    focus:outline-none focus:border-[#00ff88] placeholder-[#334455]
                    placeholder:text-base placeholder:tracking-normal transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg border border-[#ff4444] bg-[#ff000010]
                text-[#ff6666] text-xs font-mono">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={joinGame}
              disabled={loading || !joinCode.trim()}
              className="w-full py-3.5 rounded-xl font-black font-mono tracking-widest text-sm
                transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                boxShadow: '0 0 30px #3b82f640',
              }}>
              {loading ? '⏳ RICERCA…' : '🔗 ENTRA NELLA PARTITA'}
            </button>

            {/* Partite recenti */}
            {myGames.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-[#445566] uppercase tracking-widest mb-2 mt-2">
                  Partite recenti
                </h3>
                <div className="space-y-2">
                  {myGames.map(game => (
                    <button
                      key={game.id}
                      onClick={() => rejoinGame(game)}
                      className="w-full flex items-center justify-between p-3 bg-[#0d1424]
                        border border-[#1e3a5f] hover:border-[#00ff88] rounded-xl transition-all text-left">
                      <div>
                        <p className="font-mono font-bold text-white text-sm">{game.name}</p>
                        <p className="font-mono text-[#556677] text-xs mt-0.5">
                          Codice: <span className="text-[#00ff88]">{game.code}</span>
                          {' · '}Turno {game.current_turn}/{game.max_turns}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ml-2 shrink-0 ${
                        game.status === 'lobby'
                          ? 'bg-[#f59e0b30] text-[#f59e0b]'
                          : 'bg-[#00ff8830] text-[#00ff88]'
                      }`}>
                        {game.status === 'lobby' ? 'IN ATTESA' : 'ATTIVA'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modali librerie */}
      {showLibrary && <CardLibraryManager onClose={() => setShowLibrary(false)} />}
      {showEventLibrary && <EventLibraryManager onClose={() => setShowEventLibrary(false)} />}
      {showBotLibrary && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3
              flex items-center justify-between z-10">
              <span className="font-bold text-gray-800">🤖 Gestione Carte BOT</span>
              <button onClick={() => setShowBotLibrary(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <BotCardLibraryManager />
          </div>
        </div>
      )}
    </div>
  );
}

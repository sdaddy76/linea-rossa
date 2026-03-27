// =============================================
// LINEA ROSSA — Pagina Lobby
// Crea nuova partita o entra con codice
// =============================================
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Game, Profile } from '@/types/game';
import CardLibraryManager from '@/components/CardLibraryManager';
import BotCardLibraryManager from '@/components/BotCardLibraryManager';

interface LobbyPageProps {
  profile: Profile;
  onJoinGame: (gameId: string) => void;
  onLogout: () => void;
}

const FACTION_INFO = {
  Iran:       { flag: '🇮🇷', color: '#22c55e', desc: '24 carte + mazzo speciale', side: 'Strategia offensiva' },
  Coalizione: { flag: '🇺🇸', color: '#3b82f6', desc: '24 carte + mazzo speciale', side: 'Pressione e sanzioni' },
  Russia:     { flag: '🇷🇺', color: '#ef4444', desc: '18 carte', side: 'Supporto a Iran' },
  Cina:       { flag: '🇨🇳', color: '#f59e0b', desc: '18 carte', side: 'Mediazione economica' },
  Europa:     { flag: '🇪🇺', color: '#8b5cf6', desc: '18 carte', side: 'Diplomazia neutrale' },
};

type Faction = keyof typeof FACTION_INFO;
type BotDiff = 'easy' | 'normal' | 'hard';

interface FactionAssignment {
  playerType: 'human' | 'bot';
  playerId?: string;
  botDifficulty: BotDiff;
}

export default function LobbyPage({ profile, onJoinGame, onLogout }: LobbyPageProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [gameName, setGameName] = useState('');
  const [maxTurns, setMaxTurns] = useState(20);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBotLibrary, setShowBotLibrary] = useState(false);

  // Assegnazione fazioni per creazione partita
  const [factionSetup, setFactionSetup] = useState<Record<Faction, FactionAssignment>>({
    Iran:       { playerType: 'human', playerId: profile.id, botDifficulty: 'normal' },
    Coalizione: { playerType: 'bot', botDifficulty: 'normal' },
    Russia:     { playerType: 'bot', botDifficulty: 'normal' },
    Cina:       { playerType: 'bot', botDifficulty: 'normal' },
    Europa:     { playerType: 'bot', botDifficulty: 'normal' },
  });

  useEffect(() => {
    loadMyGames();
  }, []);

  const loadMyGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .in('status', ['lobby', 'active'])
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setMyGames(data as Game[]);
  };

  const toggleFaction = (faction: Faction) => {
    setFactionSetup(prev => ({
      ...prev,
      [faction]: {
        ...prev[faction],
        playerType: prev[faction].playerType === 'human' ? 'bot' : 'human',
        playerId: prev[faction].playerType === 'bot' ? profile.id : undefined,
      }
    }));
  };

  const setBotDiff = (faction: Faction, diff: BotDiff) => {
    setFactionSetup(prev => ({ ...prev, [faction]: { ...prev[faction], botDifficulty: diff } }));
  };

  const createGame = async () => {
    if (!gameName.trim()) { setError('Inserisci un nome per la partita'); return; }
    setLoading(true); setError('');
    try {
      // 1. Genera codice partita
      const { data: codeData } = await supabase.rpc('generate_game_code');
      const code = codeData || `GULF-${Math.floor(Math.random()*90+10)}`;

      // 2. Crea la partita
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({ name: gameName.trim(), code, created_by: profile.id, max_turns: maxTurns })
        .select()
        .single();
      if (gameError) throw gameError;

      // 3. Crea i game_players per ogni fazione
      const factions = Object.keys(factionSetup) as Faction[];
      const players = factions.map((faction, idx) => {
        const setup = factionSetup[faction];
        return {
          game_id: game.id,
          faction,
          player_id: setup.playerType === 'human' ? setup.playerId : null,
          is_bot: setup.playerType === 'bot',
          bot_difficulty: setup.botDifficulty,
          turn_order: idx + 1,
          is_ready: setup.playerType === 'bot', // bot sempre pronto
        };
      });
      const { error: playersError } = await supabase.from('game_players').insert(players);
      if (playersError) throw playersError;

      // 4. Crea stato iniziale
      const { error: stateError } = await supabase.from('game_state').insert({
        game_id: game.id,
        nucleare: 1, sanzioni: 5, opinione: 0, defcon: 5,
        risorse_iran: 5, risorse_coalizione: 5, risorse_russia: 5, risorse_cina: 5, risorse_europa: 5,
        stabilita_iran: 5, stabilita_coalizione: 5, stabilita_russia: 5, stabilita_cina: 5, stabilita_europa: 5,
        active_faction: 'Iran',
      });
      if (stateError) throw stateError;

      onJoinGame(game.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!joinCode.trim()) { setError('Inserisci il codice partita'); return; }
    setLoading(true); setError('');
    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', joinCode.trim().toUpperCase())
        .single();
      if (gameError || !game) throw new Error('Partita non trovata');
      if (game.status === 'finished') throw new Error('Partita già terminata');
      onJoinGame(game.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Codice non valido');
    } finally {
      setLoading(false);
    }
  };

  const humanCount = Object.values(factionSetup).filter(f => f.playerType === 'human').length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#00ff88] font-mono tracking-widest">☢️ LINEA ROSSA</h1>
            <p className="text-[#8899aa] text-xs font-mono">Benvenuto, <span className="text-white">{profile.username}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e3a5f]
                hover:border-[#00ff88] text-[#8899aa] hover:text-[#00ff88]
                rounded-lg font-mono text-xs transition-colors">
              🃏 Libreria Carte
            </button>
            <button
              onClick={() => setShowBotLibrary(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e3a5f]
                hover:border-[#c8a55a] text-[#8899aa] hover:text-[#c8a55a]
                rounded-lg font-mono text-xs transition-colors">
              🤖 Carte BOT
            </button>
            <button onClick={onLogout}
              className="px-3 py-1.5 border border-[#334455] text-[#8899aa] hover:text-white
                rounded-lg font-mono text-xs transition-colors">
              ESCI
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['create','join'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${
                tab === t ? 'bg-[#00ff88] text-[#0a0e1a]' : 'border border-[#1e3a5f] text-[#8899aa] hover:text-white'
              }`}>
              {t === 'create' ? '🎮 NUOVA PARTITA' : '🔗 ENTRA CON CODICE'}
            </button>
          ))}
        </div>

        {/* CREATE */}
        {tab === 'create' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8899aa] mb-1">NOME PARTITA</label>
                <input value={gameName} onChange={e => setGameName(e.target.value)}
                  placeholder="es. Crisi del Golfo 2026"
                  className="w-full bg-[#111827] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88] placeholder-[#334455]" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#8899aa] mb-1">TURNI MAX</label>
                <select value={maxTurns} onChange={e => setMaxTurns(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]">
                  {[10,15,20,25,30].map(n => <option key={n} value={n}>{n} turni</option>)}
                </select>
              </div>
            </div>

            {/* Fazione setup */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-mono text-[#8899aa] font-bold">ASSEGNA FAZIONI</h3>
                <span className="text-xs font-mono text-[#00ff88]">
                  {humanCount} umano{humanCount !== 1 ? 'i' : ''} · {5 - humanCount} bot
                </span>
              </div>
              <div className="space-y-2">
                {(Object.keys(FACTION_INFO) as Faction[]).map(faction => {
                  const info = FACTION_INFO[faction];
                  const setup = factionSetup[faction];
                  const isHuman = setup.playerType === 'human';
                  return (
                    <div key={faction}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isHuman
                          ? 'border-[#00ff88] bg-[#00ff8810]'
                          : 'border-[#1e3a5f] bg-[#111827]'
                      }`}>
                      <span className="text-2xl">{info.flag}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm" style={{ color: info.color }}>
                            {faction}
                          </span>
                          <span className="text-[#334455] text-xs font-mono">{info.desc}</span>
                        </div>
                        <p className="text-[#8899aa] text-xs font-mono">{info.side}</p>
                      </div>
                      {/* Difficoltà bot */}
                      {!isHuman && (
                        <select
                          value={setup.botDifficulty}
                          onChange={e => setBotDiff(faction, e.target.value as BotDiff)}
                          onClick={e => e.stopPropagation()}
                          className="bg-[#0a0e1a] border border-[#1e3a5f] rounded px-2 py-1
                            text-[#8899aa] font-mono text-xs focus:outline-none">
                          <option value="easy">🟢 Facile</option>
                          <option value="normal">🟡 Normale</option>
                          <option value="hard">🔴 Difficile</option>
                        </select>
                      )}
                      {/* Toggle umano/bot */}
                      <button onClick={() => toggleFaction(faction)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                          isHuman
                            ? 'bg-[#00ff88] text-[#0a0e1a]'
                            : 'border border-[#334455] text-[#8899aa] hover:border-[#00ff88] hover:text-[#00ff88]'
                        }`}>
                        {isHuman ? '👤 TU' : '🤖 BOT'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-[#ff000015] border border-[#ff4444] rounded-lg p-3 text-[#ff6666] text-xs font-mono">
                ⚠️ {error}
              </div>
            )}

            <button onClick={createGame} disabled={loading}
              className="w-full py-3 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                text-[#0a0e1a] font-bold font-mono rounded-lg transition-all
                shadow-lg shadow-[#00ff8840] tracking-widest">
              {loading ? '⏳ CREAZIONE...' : '🚀 CREA PARTITA'}
            </button>
          </div>
        )}

        {/* JOIN */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#8899aa] mb-1">CODICE PARTITA</label>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="es. GULF-42"
                maxLength={10}
                className="w-full bg-[#111827] border border-[#1e3a5f] rounded-lg px-4 py-3
                  text-white font-mono text-lg tracking-widest focus:outline-none focus:border-[#00ff88]
                  placeholder-[#334455]" />
            </div>

            {error && (
              <div className="bg-[#ff000015] border border-[#ff4444] rounded-lg p-3 text-[#ff6666] text-xs font-mono">
                ⚠️ {error}
              </div>
            )}

            <button onClick={joinGame} disabled={loading}
              className="w-full py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50
                text-white font-bold font-mono rounded-lg transition-all tracking-widest">
              {loading ? '⏳ RICERCA...' : '🔗 ENTRA NELLA PARTITA'}
            </button>

            {/* Partite recenti */}
            {myGames.length > 0 && (
              <div>
                <h3 className="text-xs font-mono text-[#8899aa] mb-2">PARTITE RECENTI</h3>
                <div className="space-y-2">
                  {myGames.map(game => (
                    <button key={game.id} onClick={() => onJoinGame(game.id)}
                      className="w-full flex items-center justify-between p-3 bg-[#111827]
                        border border-[#1e3a5f] hover:border-[#00ff88] rounded-lg transition-all">
                      <div className="text-left">
                        <p className="font-mono font-bold text-white text-sm">{game.name}</p>
                        <p className="font-mono text-[#8899aa] text-xs">Turno {game.current_turn}/{game.max_turns}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#00ff88] text-xs font-bold">{game.code}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          game.status === 'lobby' ? 'bg-[#f59e0b30] text-[#f59e0b]' : 'bg-[#00ff8830] text-[#00ff88]'
                        }`}>
                          {game.status.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gestore libreria carte */}
      {showLibrary && (
        <CardLibraryManager onClose={() => setShowLibrary(false)} />
      )}

      {/* Gestore libreria carte BOT */}
      {showBotLibrary && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between z-10">
              <span className="font-bold text-gray-800">🤖 Gestione Carte BOT</span>
              <button
                onClick={() => setShowBotLibrary(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">
                ×
              </button>
            </div>
            <BotCardLibraryManager />
          </div>
        </div>
      )}
    </div>
  );
}

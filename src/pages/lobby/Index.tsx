// =============================================
// LINEA ROSSA — Lobby
// Tavolo aperto (chiunque) vs riservato (codice)
// Lista tavoli con fazioni libere / spettatore
// =============================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Game, Profile, Faction } from '@/types/game';
import CardLibraryManager from '@/components/CardLibraryManager';
import BotCardLibraryManager from '@/components/BotCardLibraryManager';
import EventLibraryManager from '@/components/EventLibraryManager';
import ObjectiveLibraryManager from '@/components/ObjectiveLibraryManager';
import WaitingRoom from '@/components/WaitingRoom';

interface LobbyPageProps {
  profile: Profile;
  onJoinGame: (gameId: string, chosenFaction?: string) => void;
  onLogout: () => void;
  onAdmin?: () => void;
}

const ALL_FACTIONS: Faction[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];

const FACTION_STYLE: Record<Faction, { color: string; bg: string; emoji: string }> = {
  Iran:       { color: '#ff6644', bg: '#ff664418', emoji: '☢️'  },
  Coalizione: { color: '#3b82f6', bg: '#3b82f618', emoji: '🦅'  },
  Russia:     { color: '#f43f5e', bg: '#f43f5e18', emoji: '🐻'  },
  Cina:       { color: '#f59e0b', bg: '#f59e0b18', emoji: '🐉'  },
  Europa:     { color: '#8b5cf6', bg: '#8b5cf618', emoji: '🕊️' },
};

// Partita arricchita con i giocatori correnti (per la lista)
interface GameWithPlayers extends Game {
  _players?: { faction: Faction; is_bot: boolean; player_id: string | null }[];
}

// ─── helpers codice ──────────────────────────────────────────────────────────
const PREFIXES = ['GULF','IRAN','ATOM','NUKE','HAWK','DOVE','SAND','SILK','BRIC','NATO'];
const makeCode = () => {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  return `${p}-${Math.floor(Math.random() * 900 + 10)}`;
};

export default function LobbyPage({ profile, onJoinGame, onLogout, onAdmin }: LobbyPageProps) {
  // ── Stato form crea ──────────────────────────────────────────────────────
  const [isPublic, setIsPublic]     = useState(true);   // aperta vs riservata
  const [customCode, setCustomCode] = useState('');      // codice scelto dall'host (riservata)
  const [maxTurns, setMaxTurns]     = useState(20);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // ── Stato join manuale ───────────────────────────────────────────────────
  const [joinCode, setJoinCode]     = useState('');
  const [tab, setTab]               = useState<'create' | 'join'>('create');

  // ── Sala d'attesa ────────────────────────────────────────────────────────
  const [waitingGame, setWaitingGame] = useState<{
    id: string; code: string; name?: string; isHost: boolean; isPublic: boolean;
  } | null>(null);

  // ── Lista tavoli ─────────────────────────────────────────────────────────
  const [openGames, setOpenGames]     = useState<GameWithPlayers[]>([]);
  const [recentGames, setRecentGames] = useState<GameWithPlayers[]>([]);

  // ── Partite nascoste (localStorage) ─────────────────────────────────────
  const HIDDEN_KEY = `linea_rossa_hidden_games_${profile.id}`;
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`linea_rossa_hidden_games_${profile.id}`);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [showHidden, setShowHidden] = useState(false);

  const hideGame = (gameId: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.add(gameId);
      try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next])); } catch { /* ignora */ }
      return next;
    });
  };

  const unhideGame = (gameId: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.delete(gameId);
      try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next])); } catch { /* ignora */ }
      return next;
    });
  };

  // ── Modali ───────────────────────────────────────────────────────────────
  const [showLibrary, setShowLibrary]         = useState(false);
  const [showBotLibrary, setShowBotLibrary]   = useState(false);
  const [showEventLibrary, setShowEventLibrary] = useState(false);
  const [showObjectiveLibrary, setShowObjectiveLibrary] = useState(false);
  const [showStats, setShowStats]             = useState(false);
  const [playerStats, setPlayerStats]         = useState<{giocate:number;inCorso:number;vinte:number}|null>(null);
  const [showAdminMenu, setShowAdminMenu]     = useState(false);

  // ── Controllo admin ─────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data?.user?.email === 'sdaddino@yahoo.it');
    });
  }, []);

  // Carica statistiche personali
  const loadPlayerStats = async () => {
    if (!profile?.id) return;
    const [played, active, won] = await Promise.all([
      supabase.from('game_players').select('game_id', { count: 'exact', head: true }).eq('player_id', profile.id),
      supabase.from('game_players').select('game_id', { count: 'exact', head: true }).eq('player_id', profile.id)
        .in('game_id', (await supabase.from('games').select('id').eq('status', 'active')).data?.map(g=>g.id) ?? []),
      supabase.from('games').select('id', { count: 'exact', head: true })
        .eq('status', 'finished').eq('winner_faction',
          (await supabase.from('game_players').select('faction,game_id').eq('player_id', profile.id).limit(100)).data
            ?.map(r=>r.faction)[0] ?? ''),
    ]);
    // Approccio semplificato: conta partite vinte dove il giocatore era nella fazione vincente
    const myGames = await supabase.from('game_players').select('game_id,faction').eq('player_id', profile.id);
    const gameIds = myGames.data?.map(r=>r.game_id) ?? [];
    let vinte = 0;
    if (gameIds.length > 0) {
      const wonGames = await supabase.from('games').select('id,winner_faction').eq('status','finished').in('id', gameIds);
      for (const g of wonGames.data ?? []) {
        const myRow = myGames.data?.find(r => r.game_id === g.id);
        if (myRow && myRow.faction === g.winner_faction) vinte++;
      }
    }
    setPlayerStats({
      giocate: played.count ?? 0,
      inCorso: active.count ?? 0,
      vinte,
    });
    void played; void active; void won;
  };

  // ─── Carica lista tavoli ─────────────────────────────────────────────────
  const loadGames = useCallback(async () => {
    // Tavoli aperti in lobby — con fallback se colonna is_public non ancora migrata
    let openData: Game[] | null = null;
    const openRes = await supabase
      .from('games')
      .select('*')
      .eq('is_public', true)
      .in('status', ['lobby', 'active'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (!openRes.error) {
      openData = openRes.data as Game[];
    } else {
      // Colonna is_public non ancora presente → carica tutti i lobby aperti
      const fallback = await supabase
        .from('games')
        .select('*')
        .in('status', ['lobby', 'active'])
        .order('created_at', { ascending: false })
        .limit(20);
      openData = (fallback.data as Game[]) ?? [];
    }

    // Partite recenti dell'utente (qualsiasi stato)
    const { data: recentData } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Carica giocatori per ogni partita trovata
    const allGames = [...(openData ?? []), ...(recentData ?? [])];
    const uniqueIds = [...new Set(allGames.map((g) => g.id))];

    let playersMap: Record<string, { faction: Faction; is_bot: boolean; player_id: string | null }[]> = {};
    if (uniqueIds.length > 0) {
      const { data: playersData } = await supabase
        .from('game_players')
        .select('game_id, faction, is_bot, player_id')
        .in('game_id', uniqueIds);
      (playersData ?? []).forEach((p) => {
        if (!playersMap[p.game_id]) playersMap[p.game_id] = [];
        playersMap[p.game_id].push(p as { faction: Faction; is_bot: boolean; player_id: string | null });
      });
    }

    const enrich = (g: Game): GameWithPlayers => ({
      ...g,
      _players: playersMap[g.id] ?? [],
    });

    setOpenGames((openData ?? []).map(enrich));
    setRecentGames((recentData ?? []).map(enrich));
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  // ── CREA PARTITA ──────────────────────────────────────────────────────────
  const createGame = async () => {
    if (!profile?.id) { setError('Sessione non valida — effettua di nuovo il login'); return; }
    setLoading(true); setError('');
    // Timeout di sicurezza: se dopo 12s non risponde, sblocca il bottone
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setError('⏱️ Timeout — il server non risponde. Riprova tra qualche secondo.');
    }, 12000);
    try {
      // Codice: se riservata e l'host ne ha inserito uno → usalo (uppercase)
      // altrimenti genera automatico
      let code = isPublic
        ? makeCode()
        : (customCode.trim().toUpperCase() || makeCode());

      // Fallback RPC
      if (isPublic) {
        try {
          const { data: rpcCode, error: rpcErr } = await supabase.rpc('generate_game_code');
          if (!rpcErr && rpcCode) code = rpcCode as string;
        } catch { /* ignora */ }
      }

      // Insert con retry su codice duplicato
      let game = null;
      let gameError = null;
      // Prova prima con is_public; se la colonna non esiste ancora (42703) riprova senza
      const buildPayload = (withIsPublic: boolean) => ({
        code,
        name: code,
        max_turns: maxTurns,
        created_by: profile.id,
        ...(withIsPublic ? { is_public: isPublic } : {}),
      });
      let useIsPublic = true;
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await supabase
          .from('games')
          .insert(buildPayload(useIsPublic))
          .select()
          .single();
        game = res.data;
        gameError = res.error;
        if (!gameError) break;
        // Colonna is_public non ancora migrata → riprova senza
        if (gameError.code === 'PGRST204' || gameError.message?.includes('is_public')) {
          useIsPublic = false; continue;
        }
        if (gameError.code === '23505') { code = makeCode(); continue; } // codice duplicato
        break;
      }

      if (gameError) throw new Error(gameError.message ?? 'Errore nella creazione');
      if (!game) throw new Error('Partita non creata');

      setWaitingGame({ id: game.id, code: game.code, isHost: true, isPublic: game.is_public ?? isPublic });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione');
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  // ── UNISCITI CON CODICE ───────────────────────────────────────────────────
  const joinWithCode = async () => {
    if (!joinCode.trim()) { setError('Inserisci il codice partita'); return; }
    setLoading(true); setError('');
    try {
      // Carica partita + giocatori in un'unica query
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', joinCode.trim().toUpperCase())
        .single();
      if (gameError || !game) throw new Error('Partita non trovata con questo codice');

      // Carica i giocatori separatamente (join non disponibile nel client)
      const { data: gamePlayers } = await supabase
        .from('game_players')
        .select('faction, player_id, is_bot, profile:profiles(username)')
        .eq('game_id', game.id);
      const players = (gamePlayers ?? []) as { faction: string; player_id: string | null; is_bot: boolean }[];

      if (game.status === 'finished') {
        // Partita finita → solo spettatore
        onJoinGame(game.id);
        return;
      }

      if (game.status === 'active') {
        // Partita in corso: rientra se già dentro, altrimenti apri WaitingRoom se ci sono fazioni libere
        const alreadyIn = players.some(p => p.player_id === profile.id && !p.is_bot);
        if (alreadyIn) { onJoinGame(game.id); return; }
        const takenByHumans = new Set(players.filter(p => p.player_id && !p.is_bot).map(p => p.faction));
        const allFactions = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
        const hasFree = allFactions.some(f => !takenByHumans.has(f));
        if (!hasFree) { onJoinGame(game.id); return; } // piena → spettatore
      }

      // status='lobby' o 'active' con posto libero → apri WaitingRoom per scegliere fazione
      setWaitingGame({
        id: game.id, code: game.code,
        isHost: game.created_by === profile.id,
        isPublic: game.is_public ?? false,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Codice non valido');
    } finally {
      setLoading(false);
    }
  };

  // ── ENTRA IN TAVOLO APERTO ────────────────────────────────────────────────
  const joinOpen = async (game: GameWithPlayers) => {
    const humanPs = (game._players ?? []).filter(p => !p.is_bot && p.player_id);
    const alreadyInGame = humanPs.some(p => p.player_id === profile.id);
    if (game.status === 'active' && alreadyInGame) {
      // Già in partita → rientra direttamente
      onJoinGame(game.id);
      return;
    }
    // Lobby o partita attiva con fazione libera → apri WaitingRoom per scegliere la fazione
    setWaitingGame({
      id: game.id, code: game.code,
      isHost: game.created_by === profile.id,
      isPublic: game.is_public ?? true,
    });
  };

  // ── WaitingRoom attiva ────────────────────────────────────────────────────
  if (waitingGame) {
    return (
      <WaitingRoom
        gameId={waitingGame.id}
        gameCode={waitingGame.code}
        isPublic={waitingGame.isPublic}
        profile={profile}
        isHost={waitingGame.isHost}
        onGameStart={(faction) => onJoinGame(waitingGame.id, faction)}
        onLeave={() => { setWaitingGame(null); loadGames(); }}
      />
    );
  }

  // ─── Componenti interni ───────────────────────────────────────────────────

  // Chip fazione: verde se libera (bot), grigio se presa
  const FactionChip = ({ faction, takenByHuman }: { faction: Faction; takenByHuman: boolean }) => {
    const s = FACTION_STYLE[faction];
    return (
      <span
        title={faction}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
        style={{
          background:  takenByHuman ? s.bg : '#1a2233',
          color:       takenByHuman ? s.color : '#445566',
          border:      `1px solid ${takenByHuman ? s.color + '60' : '#223344'}`,
        }}
      >
        <span>{s.emoji}</span>
        <span className="hidden sm:inline">{faction.slice(0,4)}</span>
      </span>
    );
  };

  // Card tavolo nella lista
  const TableRow = ({ game, isHiddenView = false }: { game: GameWithPlayers; isHiddenView?: boolean }) => {
    const humanPlayers  = (game._players ?? []).filter((p) => !p.is_bot && p.player_id);
    const takenFactions = new Set(humanPlayers.map((p) => p.faction));
    const isFinished    = game.status === 'finished';
    const isActive      = game.status === 'active';
    const isLobby       = game.status === 'lobby';
    const isMine        = game.created_by === profile.id;
    // Sono già in questa partita come giocatore?
    const alreadyIn     = humanPlayers.some(p => p.player_id === profile.id);
    // Ci sono ancora fazioni libere (non prese da umani)?
    const allFactions: string[] = ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'];
    const hasFreeFaction = allFactions.some(f => !takenFactions.has(f));
    // Posso unirmi: partita attiva, non sono già dentro, c'è una fazione libera
    const canJoinActive = isActive && !alreadyIn && hasFreeFaction;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3
        bg-[#0d1424] border border-[#1e3a5f] hover:border-[#2a4a6f] rounded-xl transition-all relative group/row">

        {/* Sinistra: badge + codice + fazioni */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Badge stato */}
          <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wider ${
            isFinished ? 'bg-[#33445520] text-[#445566]' :
            isActive   ? 'bg-[#00ff8820] text-[#00ff88]' :
                         'bg-[#f59e0b20] text-[#f59e0b]'
          }`}>
            {isFinished ? 'CHIUSA' : isActive ? 'IN GIOCO' : 'IN ATTESA'}
          </span>

          {/* Badge visibilità */}
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono ${
            game.is_public ? 'text-[#22d3ee] bg-[#22d3ee15]' : 'text-[#a78bfa] bg-[#a78bfa15]'
          }`}>
            {game.is_public ? '🌐 Aperta' : '🔒 Riservata'}
          </span>

          <div className="min-w-0">
            {/* Codice */}
            <p className="font-mono font-bold text-[#00ff88] text-sm tracking-wider leading-none">
              {game.code}
              {isMine && <span className="ml-1.5 text-[9px] text-[#445566]">tua</span>}
            </p>

            {/* Fazioni */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {ALL_FACTIONS.map((f) => (
                <FactionChip key={f} faction={f} takenByHuman={takenFactions.has(f)} />
              ))}
            </div>
          </div>
        </div>

        {/* Destra: info + pulsante */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Turno (partite attive/chiuse) */}
          {(isActive || isFinished) && (
            <span className="text-[#556677] text-xs font-mono whitespace-nowrap">
              Turno {game.current_turn}/{game.max_turns}
              {game.winner_faction && (
                <span className="ml-1.5 text-[#00ff88]">
                  · 🏆 {game.winner_faction}
                </span>
              )}
            </span>
          )}

          {/* Giocatori umani */}
          {!isFinished && (
            <span className="text-[#445566] text-xs font-mono whitespace-nowrap">
              {humanPlayers.length}/5
            </span>
          )}

          {/* CTA */}
          {isFinished ? (
            <button
              onClick={() => onJoinGame(game.id)}
              className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all
                border border-[#334455] text-[#8899aa] hover:border-[#556677] hover:text-white">
              👁 Spettatore
            </button>
          ) : isActive ? (
            <>
              {/* Già dentro → Rientra */}
              {alreadyIn && (
                <button
                  onClick={() => joinOpen(game)}
                  className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all
                    border border-[#00ff8840] text-[#00ff88] hover:bg-[#00ff8812]">
                  ↩ Rientra
                </button>
              )}
              {/* Non dentro + fazione libera → Unisciti alla partita in corso */}
              {canJoinActive && (
                <button
                  onClick={() => joinOpen(game)}
                  className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0e1a' }}>
                  ⚔️ Unisciti
                </button>
              )}
              {/* Non dentro + partita piena → solo spettatore */}
              {!alreadyIn && !canJoinActive && (
                <button
                  onClick={() => onJoinGame(game.id)}
                  className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all
                    border border-[#334455] text-[#8899aa] hover:border-[#556677] hover:text-white">
                  👁 Guarda
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => joinOpen(game)}
              className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg,#00ff88,#00cc66)',
                color: '#0a0e1a',
              }}>
              {isMine ? '↩ Rientra' : '+ Unisciti'}
            </button>
          )}

          {/* Pulsante nascondi/ripristina — visibile su hover */}
          {isHiddenView ? (
            <button
              onClick={(e) => { e.stopPropagation(); unhideGame(game.id); }}
              title="Ripristina partita nella lista"
              className="px-2 py-1.5 rounded-lg font-mono text-xs transition-all
                border border-[#334455] text-[#445566] hover:border-[#00ff88] hover:text-[#00ff88]">
              ↩
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); hideGame(game.id); }}
              title="Nascondi questa partita dalla lista"
              className="px-2 py-1.5 rounded-lg font-mono text-xs transition-all
                border border-[#334455] text-[#445566] hover:border-[#ff4444] hover:text-[#ff4444]
                opacity-0 group-hover/row:opacity-100">
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── Render principale ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#00ff88] font-mono tracking-widest">☢️ LINEA ROSSA</h1>
            <p className="text-[#8899aa] text-xs font-mono mt-0.5">
              Benvenuto, <span className="text-white font-bold">{profile.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* ── Pulsanti visibili a tutti ── */}
            <button onClick={() => { setShowStats(true); loadPlayerStats(); }}
              className="px-3 py-1.5 border border-[#1e3a5f] hover:border-[#22c55e]
                text-[#8899aa] hover:text-[#22c55e] rounded-lg font-mono text-xs transition-colors">
              📊 Statistiche
            </button>

            {/* ── Menu Impostazioni Admin (solo sdaddino@yahoo.it) ── */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(v => !v)}
                  className="px-3 py-1.5 border border-[#f59e0b55] hover:border-[#f59e0b]
                    text-[#f59e0b99] hover:text-[#f59e0b] rounded-lg font-mono text-xs transition-colors
                    flex items-center gap-1"
                  title="Impostazioni Admin"
                >
                  ⚙️ Impostazioni
                </button>
                {showAdminMenu && (
                  <>
                    {/* overlay trasparente per chiudere cliccando fuori */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)} />
                    <div className="absolute right-0 top-9 z-50 w-52 rounded-xl border border-[#f59e0b44]
                      bg-[#0d1220] shadow-2xl overflow-hidden"
                      style={{ boxShadow: '0 0 30px #f59e0b22' }}>
                      <div className="px-3 py-2 border-b border-[#1e3a5f]">
                        <p className="text-[9px] font-mono text-[#f59e0b] uppercase tracking-widest font-bold">
                          🔐 Area Admin
                        </p>
                        <p className="text-[8px] font-mono text-[#445566] mt-0.5">sdaddino@yahoo.it</p>
                      </div>
                      <div className="py-1">
                        {[
                          { label: '🃏 Gestione Carte',     action: () => { setShowLibrary(true);          setShowAdminMenu(false); }, color: '#00ff88' },
                          { label: '🤖 Gestione BOT',       action: () => { setShowBotLibrary(true);       setShowAdminMenu(false); }, color: '#c8a55a' },
                          { label: '🎴 Gestione Eventi',    action: () => { setShowEventLibrary(true);     setShowAdminMenu(false); }, color: '#f97316' },
                          { label: '🚨 Gestione Obiettivi', action: () => { setShowObjectiveLibrary(true); setShowAdminMenu(false); }, color: '#8b5cf6' },
                          { label: '⚙️ Database',           action: () => { onAdmin?.();                  setShowAdminMenu(false); }, color: '#64748b' },
                        ].map(({ label, action, color }) => (
                          <button key={label} onClick={action}
                            className="w-full text-left px-4 py-2 font-mono text-xs hover:bg-[#ffffff08] transition-colors"
                            style={{ color: '#8899aa' }}
                            onMouseEnter={e => (e.currentTarget.style.color = color)}
                            onMouseLeave={e => (e.currentTarget.style.color = '#8899aa')}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={onLogout}
              className="px-3 py-1.5 border border-[#334455] text-[#8899aa] hover:text-white
                rounded-lg font-mono text-xs transition-colors">
              ESCI
            </button>
          </div>
        </div>

        {/* ── Tavoli aperti ── */}
        {openGames.length > 0 && (
          <section>
            <h2 className="text-[10px] font-mono text-[#445566] uppercase tracking-widest mb-2">
              🌐 Tavoli aperti ({openGames.filter(g => !hiddenIds.has(g.id)).length})
            </h2>
            <div className="space-y-2">
              {openGames.filter(g => !hiddenIds.has(g.id)).map((g) => <TableRow key={g.id} game={g} />)}
              {openGames.filter(g => !hiddenIds.has(g.id)).length === 0 && (
                <p className="text-xs font-mono text-[#334455] italic px-1">Nessun tavolo aperto visibile.</p>
              )}
            </div>
          </section>
        )}

        {/* ── Tabs Crea / Entra ── */}
        <div>
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-[#060d18] rounded-xl border border-[#1e3a5f]">
            {(['create', 'join'] as const).map((t) => (
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
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5 space-y-5">

              {/* Toggle aperta / riservata */}
              <div>
                <p className="text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-2">
                  Tipo tavolo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: true,  label: '🌐 Aperta',    sub: 'Chiunque può unirsi' },
                    { val: false, label: '🔒 Riservata',  sub: 'Solo con codice' },
                  ].map(({ val, label, sub }) => (
                    <button
                      key={String(val)}
                      onClick={() => { setIsPublic(val); setError(''); }}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: isPublic === val ? (val ? '#22d3ee' : '#a78bfa') : '#1e3a5f',
                        background:  isPublic === val ? (val ? '#22d3ee0f' : '#a78bfa0f') : 'transparent',
                      }}>
                      <p className="font-mono font-bold text-sm"
                        style={{ color: isPublic === val ? (val ? '#22d3ee' : '#a78bfa') : '#8899aa' }}>
                        {label}
                      </p>
                      <p className="font-mono text-[10px] text-[#445566] mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Codice personalizzato (solo se riservata) */}
              {!isPublic && (
                <div>
                  <label className="block text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-1.5">
                    Codice partita <span className="text-[#334455] normal-case">(lascia vuoto per generarlo in automatico)</span>
                  </label>
                  <input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    placeholder="es. BRAVO-7"
                    maxLength={12}
                    className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                      text-[#a78bfa] font-mono text-lg tracking-[0.2em] text-center
                      focus:outline-none focus:border-[#a78bfa] placeholder-[#334455]
                      placeholder:text-sm placeholder:tracking-normal transition-colors"
                  />
                  <p className="text-[10px] font-mono text-[#334455] mt-1.5 text-center">
                    Condividi questo codice con i giocatori che vuoi invitare
                  </p>
                </div>
              )}

              {/* Turni massimi */}
              <div>
                <label className="block text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-1.5">
                  Turni massimi
                </label>
                <select
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(Number(e.target.value))}
                  className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]">
                  {[10, 15, 20, 25, 30].map((n) => (
                    <option key={n} value={n}>{n} turni</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg border border-[#ff4444] bg-[#ff000010]
                  text-[#ff6666] text-xs font-mono">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={createGame}
                disabled={loading}
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

          {/* ── TAB: ENTRA CON CODICE ── */}
          {tab === 'join' && (
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1424] p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#8899aa] uppercase tracking-widest mb-1.5">
                  Codice partita
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinWithCode()}
                  placeholder="es. GULF-42"
                  maxLength={12}
                  className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg px-4 py-3
                    text-white font-mono text-xl tracking-[0.25em] text-center
                    focus:outline-none focus:border-[#a78bfa] placeholder-[#334455]
                    placeholder:text-base placeholder:tracking-normal transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg border border-[#ff4444] bg-[#ff000010]
                  text-[#ff6666] text-xs font-mono">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={joinWithCode}
                disabled={loading || !joinCode.trim()}
                className="w-full py-3.5 rounded-xl font-black font-mono tracking-widest text-sm
                  transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  color: '#fff',
                  boxShadow: '0 0 30px #a78bfa40',
                }}>
                {loading ? '⏳ RICERCA…' : '🔗 ENTRA'}
              </button>
            </div>
          )}
        </div>

        {/* ── Partite recenti personali ── */}
        {recentGames.length > 0 && (
          <section>
            <h2 className="text-[10px] font-mono text-[#445566] uppercase tracking-widest mb-2">
              Le tue partite recenti
            </h2>
            <div className="space-y-2">
              {recentGames.filter(g => !hiddenIds.has(g.id)).map((g) => <TableRow key={g.id} game={g} />)}
              {recentGames.filter(g => !hiddenIds.has(g.id)).length === 0 && (
                <p className="text-xs font-mono text-[#334455] italic px-1">Nessuna partita recente visibile.</p>
              )}
            </div>

            {/* Toggle mostra/nascondi partite nascoste */}
            {hiddenIds.size > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowHidden(v => !v)}
                  className="text-[10px] font-mono text-[#445566] hover:text-[#8899aa] transition-colors underline underline-offset-2">
                  {showHidden
                    ? `▲ Nascondi partite archiviate (${hiddenIds.size})`
                    : `▼ Mostra partite nascoste (${hiddenIds.size})`}
                </button>
                {showHidden && (
                  <div className="mt-2 space-y-2 opacity-60">
                    {[...openGames, ...recentGames]
                      .filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i) // dedup
                      .filter(g => hiddenIds.has(g.id))
                      .map(g => <TableRow key={g.id} game={g} isHiddenView />)}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

      </div>

      {/* ── Modali ── */}
      {showLibrary    && <CardLibraryManager   onClose={() => setShowLibrary(false)} />}
      {showEventLibrary && <EventLibraryManager onClose={() => setShowEventLibrary(false)} />}
      {showObjectiveLibrary && <ObjectiveLibraryManager onClose={() => setShowObjectiveLibrary(false)} />}

      {/* Modal Statistiche personali */}
      {showStats && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowStats(false)}>
          <div className="bg-[#080e1a] border border-[#1e3a5f] rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black font-mono tracking-widest text-[#00ff88]">
                📊 STATISTICHE
              </h2>
              <button onClick={() => setShowStats(false)}
                className="text-[#445566] hover:text-white font-mono text-sm">✕</button>
            </div>
            <p className="text-xs font-mono text-[#445566] mb-5">
              Giocatore: <span className="text-[#8899aa] font-bold">{profile.username}</span>
            </p>
            {playerStats === null ? (
              <p className="text-xs font-mono text-[#445566] text-center py-4">Caricamento...</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Partite\ngiocate',  value: playerStats.giocate,  color: '#3b82f6', icon: '🎮' },
                  { label: 'Partite\nin corso',  value: playerStats.inCorso,  color: '#f59e0b', icon: '⚔️' },
                  { label: 'Partite\nvinte',     value: playerStats.vinte,    color: '#22c55e', icon: '🏆' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl"
                    style={{ background: '#0a0e1a', border: `1px solid ${color}44` }}>
                    <span className="text-xl">{icon}</span>
                    <span className="text-2xl font-black font-mono" style={{ color }}>{value}</span>
                    <span className="text-[10px] font-mono text-center leading-tight whitespace-pre-line"
                      style={{ color: '#445566' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
            {playerStats && playerStats.giocate > 0 && (
              <p className="text-xs font-mono text-center mt-4" style={{ color: '#445566' }}>
                Win rate:{' '}
                <span className="font-bold" style={{ color: '#22c55e' }}>
                  {Math.round((playerStats.vinte / playerStats.giocate) * 100)}%
                </span>
              </p>
            )}
          </div>
        </div>
      )}
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

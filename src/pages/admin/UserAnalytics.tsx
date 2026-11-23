import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LINEA_ROSSA_ADMIN_EMAIL } from '@/lib/admin';

type ProfileRow = { id: string; username: string };
type GameRow = {
  id: string;
  code: string | null;
  name: string | null;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  winner_faction: string | null;
};
type GamePlayerRow = {
  game_id: string;
  player_id: string | null;
  faction: string;
  is_bot: boolean | null;
};
type ResultRow = {
  game_id: string;
  player_id: string;
  faction: string;
  final_score: number;
  final_position: number;
  is_winner: boolean;
};
type SessionRow = {
  user_id: string;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
  timezone: string;
};
type PlayerAnalytics = {
  id: string;
  username: string;
  gamesPlayed: number;
  gamesFinished: number;
  wins: number;
  averageDurationMinutes: number | null;
  averageScore: number | null;
  averagePosition: number | null;
  mostPlayedFaction: string | null;
  totalConnectedMinutes: number;
  sessionCount: number;
  activeNow: boolean;
  usualAccessTime: string | null;
  gameHistory: PlayerGameHistory[];
  recentSessions: SessionRow[];
};

type PlayerGameHistory = {
  gameId: string;
  label: string;
  faction: string;
  status: string;
  startedAt: string | null;
  durationMinutes: number | null;
  winnerFaction: string | null;
  isWinner: boolean;
  score: number | null;
  position: number | null;
};

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function accessHour(timestamp: string, timezone: string): number | null {
  try {
    const value = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(timestamp));
    const hour = Number(value);
    return Number.isInteger(hour) && hour >= 0 && hour < 24 ? hour : null;
  } catch {
    return null;
  }
}

function formatMinutes(value: number | null): string {
  if (value === null) return '—';
  const minutes = Math.max(0, Math.round(value));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours} h ${remainder} min` : `${remainder} min`;
}

function buildAnalytics(
  profiles: ProfileRow[],
  games: GameRow[],
  gamePlayers: GamePlayerRow[],
  results: ResultRow[],
  sessions: SessionRow[],
): PlayerAnalytics[] {
  const gamesById = new Map(games.map(game => [game.id, game]));
  const now = Date.now();
  const byUser = new Map<string, PlayerAnalytics>();
  const factionsByUser = new Map<string, Map<string, number>>();
  const factionsByGameByUser = new Map<string, Map<string, Set<string>>>();
  const resultsByUser = new Map<string, ResultRow[]>();
  const resultsByGamePlayer = new Map<string, ResultRow>();
  const sessionsByUser = new Map<string, SessionRow[]>();

  for (const profile of profiles) {
    byUser.set(profile.id, {
      id: profile.id,
      username: profile.username,
      gamesPlayed: 0,
      gamesFinished: 0,
      wins: 0,
      averageDurationMinutes: null,
      averageScore: null,
      averagePosition: null,
      mostPlayedFaction: null,
      totalConnectedMinutes: 0,
      sessionCount: 0,
      activeNow: false,
      usualAccessTime: null,
      gameHistory: [],
      recentSessions: [],
    });
    factionsByUser.set(profile.id, new Map());
    resultsByUser.set(profile.id, []);
    sessionsByUser.set(profile.id, []);
  }

  const gameIdsByUser = new Map<string, Set<string>>();
  const finishedIdsByUser = new Map<string, Set<string>>();
  const winsByUser = new Map<string, Set<string>>();
  for (const player of gamePlayers) {
    if (!player.player_id || player.is_bot) continue;
    const analytics = byUser.get(player.player_id);
    if (!analytics) continue;

    const game = gamesById.get(player.game_id);
    if (!game || (game.status !== 'active' && game.status !== 'finished')) continue;
    const ids = gameIdsByUser.get(player.player_id) ?? new Set<string>();
    ids.add(player.game_id);
    gameIdsByUser.set(player.player_id, ids);

    const factions = factionsByUser.get(player.player_id)!;
    factions.set(player.faction, (factions.get(player.faction) ?? 0) + 1);
    const userGames = factionsByGameByUser.get(player.player_id) ?? new Map<string, Set<string>>();
    const gameFactions = userGames.get(player.game_id) ?? new Set<string>();
    gameFactions.add(player.faction);
    userGames.set(player.game_id, gameFactions);
    factionsByGameByUser.set(player.player_id, userGames);
    if (game?.status === 'finished') {
      const finished = finishedIdsByUser.get(player.player_id) ?? new Set<string>();
      finished.add(player.game_id);
      finishedIdsByUser.set(player.player_id, finished);
      if (game.winner_faction === player.faction) {
        const wins = winsByUser.get(player.player_id) ?? new Set<string>();
        wins.add(player.game_id);
        winsByUser.set(player.player_id, wins);
      }
    }
  }

  for (const [userId, ids] of gameIdsByUser) {
    const analytics = byUser.get(userId);
    if (analytics) {
      analytics.gamesPlayed = ids.size;
      analytics.gamesFinished = finishedIdsByUser.get(userId)?.size ?? 0;
    }
  }

  for (const result of results) {
    resultsByUser.get(result.player_id)?.push(result);
    resultsByGamePlayer.set(`${result.game_id}:${result.player_id}`, result);
    if (result.is_winner) {
      const wins = winsByUser.get(result.player_id) ?? new Set<string>();
      wins.add(result.game_id);
      winsByUser.set(result.player_id, wins);
    }
  }
  for (const [userId, analytics] of byUser) {
    analytics.wins = winsByUser.get(userId)?.size ?? 0;
  }

  for (const session of sessions) {
    sessionsByUser.get(session.user_id)?.push(session);
  }

  for (const [userId, analytics] of byUser) {
    const factionCounts = factionsByUser.get(userId)!;
    analytics.mostPlayedFaction = [...factionCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const userResults = resultsByUser.get(userId)!;
    analytics.averageScore = average(userResults.map(result => Number(result.final_score)));
    analytics.averagePosition = average(userResults.map(result => Number(result.final_position)));

    const userGames = [...(gameIdsByUser.get(userId) ?? [])]
      .map(gameId => gamesById.get(gameId))
      .filter((game): game is GameRow => game?.status === 'finished' && !!game.started_at && !!game.finished_at);
    analytics.averageDurationMinutes = average(userGames.map(game =>
      Math.max(0, (Date.parse(game.finished_at!) - Date.parse(game.started_at!)) / 60_000),
    ));

    const userSessions = sessionsByUser.get(userId)!;
    const hourCounts = new Map<number, number>();
    const intervals: Array<{ start: number; end: number }> = [];
    for (const session of userSessions) {
      const started = Date.parse(session.started_at);
      const ended = session.ended_at ? Date.parse(session.ended_at) : Date.parse(session.last_seen_at);
      if (!Number.isFinite(started) || !Number.isFinite(ended)) continue;
      if (ended > started) intervals.push({ start: started, end: ended });
      const hour = accessHour(session.started_at, session.timezone);
      if (hour !== null) hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      if (!session.ended_at && now - Date.parse(session.last_seen_at) <= 2 * 60_000) {
        analytics.activeNow = true;
      }
    }
    intervals.sort((a, b) => a.start - b.start);
    let mergedStart: number | null = null;
    let mergedEnd: number | null = null;
    for (const interval of intervals) {
      if (mergedStart === null || mergedEnd === null) {
        mergedStart = interval.start;
        mergedEnd = interval.end;
      } else if (interval.start <= mergedEnd) {
        mergedEnd = Math.max(mergedEnd, interval.end);
      } else {
        analytics.totalConnectedMinutes += (mergedEnd - mergedStart) / 60_000;
        mergedStart = interval.start;
        mergedEnd = interval.end;
      }
    }
    if (mergedStart !== null && mergedEnd !== null) {
      analytics.totalConnectedMinutes += (mergedEnd - mergedStart) / 60_000;
    }
    analytics.sessionCount = userSessions.length;
    analytics.recentSessions = [...userSessions]
      .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
      .slice(0, 5);
    const usualHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    analytics.usualAccessTime = usualHour === undefined
      ? null
      : `${String(usualHour).padStart(2, '0')}:00–${String((usualHour + 1) % 24).padStart(2, '0')}:00`;

    analytics.gameHistory = [...(factionsByGameByUser.get(userId) ?? new Map())]
      .map(([gameId, factions]) => {
        const game = gamesById.get(gameId);
        if (!game) return null;
        const result = resultsByGamePlayer.get(`${gameId}:${userId}`);
        const duration = game.started_at && game.finished_at
          ? Math.max(0, (Date.parse(game.finished_at) - Date.parse(game.started_at)) / 60_000)
          : null;
        return {
          gameId,
          label: game.name || game.code || gameId.slice(0, 8),
          faction: [...factions].join(', '),
          status: game.status ?? 'sconosciuto',
          startedAt: game.started_at,
          durationMinutes: duration,
          winnerFaction: game.winner_faction,
          isWinner: result?.is_winner ?? false,
          score: result ? Number(result.final_score) : null,
          position: result ? Number(result.final_position) : null,
        };
      })
      .filter((game): game is PlayerGameHistory => game !== null)
      .sort((a, b) => Date.parse(b.startedAt ?? '1970-01-01') - Date.parse(a.startedAt ?? '1970-01-01'));
  }

  return [...byUser.values()].sort((a, b) =>
    b.gamesPlayed - a.gamesPlayed || a.username.localeCompare(b.username, 'it'),
  );
}

export default function UserAnalytics({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<PlayerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [
      profilesResult,
      gamesResult,
      playersResult,
      resultsResult,
      sessionsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id,username').order('username').limit(5000),
      supabase.from('games').select('id,code,name,status,started_at,finished_at,winner_faction').limit(5000),
      supabase.from('game_players').select('game_id,player_id,faction,is_bot').limit(10000),
      supabase.from('game_player_results').select('game_id,player_id,faction,final_score,final_position,is_winner').limit(10000),
      supabase.from('user_access_sessions').select('user_id,started_at,last_seen_at,ended_at,timezone').limit(20000),
    ]);

    const failed = [
      profilesResult.error,
      gamesResult.error,
      playersResult.error,
      resultsResult.error,
      sessionsResult.error,
    ].find(Boolean);
    if (failed) {
      setError(failed.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(buildAnalytics(
      (profilesResult.data ?? []) as ProfileRow[],
      (gamesResult.data ?? []) as GameRow[],
      (playersResult.data ?? []) as GamePlayerRow[],
      (resultsResult.data ?? []) as ResultRow[],
      (sessionsResult.data ?? []) as SessionRow[],
    ));
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeCount = useMemo(() => rows.filter(row => row.activeNow).length, [rows]);
  const totalFinished = useMemo(() => rows.reduce((sum, row) => sum + row.gamesFinished, 0), [rows]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-400">Area amministratore · {LINEA_ROSSA_ADMIN_EMAIL}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Statistiche giocatori</h1>
            <p className="text-sm text-slate-400 mt-1">Partite, risultati e sessioni di accesso per account.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="px-3 py-2 rounded-lg border border-slate-700 text-sm hover:border-emerald-400">
              Aggiorna
            </button>
            <button onClick={onBack} className="px-3 py-2 rounded-lg border border-slate-700 text-sm hover:border-slate-400">
              ← Lobby
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Metric label="Utenti registrati" value={rows.length} />
          <Metric label="Utenti attivi ora*" value={activeCount} />
          <Metric label="Partecipazioni a partite finite" value={totalFinished} />
        </section>

        <p className="text-xs text-slate-500">
          * Attivo ora = ultimo heartbeat negli ultimi 2 minuti. Gli accessi e i risultati individuali vengono raccolti da quando è installata la migrazione; i risultati precedenti sono recuperabili solo se lo stato finale della partita è ancora disponibile.
          {lastUpdated && <span> Aggiornato alle {lastUpdated.toLocaleTimeString('it-IT')}.</span>}
        </p>

        {loading && <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-slate-400">Caricamento statistiche…</div>}
        {!loading && error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-5 text-red-200 space-y-2">
            <p>Non riesco a leggere le statistiche.</p>
            <p className="text-xs font-mono text-red-300 break-all">{error}</p>
            <p className="text-xs text-slate-400">Verifica che la migrazione ANALYTICS_AMMINISTRATORE sia stata applicata al progetto Supabase di Linea Rossa.</p>
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-slate-400">Nessun account registrato.</div>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  {['Utente','Partite','Finite','Vittorie','Fazione più giocata','Tempo medio partita','Punti medi','Posizione media','Tempo connesso','Sessioni','Ora tipica','Stato','Dettaglio'].map(label => (
                    <th key={label} className="px-3 py-3 font-mono">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <Fragment key={row.id}>
                  <tr className="border-t border-slate-800 bg-[#0d121d] hover:bg-slate-900/70">
                    <td className="px-3 py-3 font-semibold text-white">{row.username}</td>
                    <td className="px-3 py-3 tabular-nums">{row.gamesPlayed}</td>
                    <td className="px-3 py-3 tabular-nums">{row.gamesFinished}</td>
                    <td className="px-3 py-3 tabular-nums">{row.wins}</td>
                    <td className="px-3 py-3">{row.mostPlayedFaction ?? '—'}</td>
                    <td className="px-3 py-3">{formatMinutes(row.averageDurationMinutes)}</td>
                    <td className="px-3 py-3">{row.averageScore === null ? '—' : row.averageScore.toFixed(1)}</td>
                    <td className="px-3 py-3">{row.averagePosition === null ? '—' : `#${row.averagePosition.toFixed(1)}`}</td>
                    <td className="px-3 py-3">{formatMinutes(row.totalConnectedMinutes)}</td>
                    <td className="px-3 py-3 tabular-nums">{row.sessionCount}</td>
                    <td className="px-3 py-3">{row.usualAccessTime ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span className={row.activeNow ? 'text-emerald-400' : 'text-slate-500'}>
                        {row.activeNow ? '● Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="text-emerald-300 hover:text-white underline underline-offset-2"
                        onClick={() => setExpandedUser(current => current === row.id ? null : row.id)}
                      >
                        {expandedUser === row.id ? 'Nascondi' : 'Partite'}
                      </button>
                    </td>
                  </tr>
                  {expandedUser === row.id && (
                    <tr className="border-t border-slate-800 bg-[#090e17]">
                      <td colSpan={13} className="p-4">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          <section>
                            <h2 className="font-mono text-xs uppercase tracking-widest text-emerald-300 mb-2">Esiti per partita</h2>
                            {row.gameHistory.length === 0 ? <p className="text-xs text-slate-500">Nessuna partita avviata registrata.</p> : (
                              <div className="overflow-x-auto rounded-lg border border-slate-800">
                                <table className="w-full min-w-[820px] text-xs">
                                  <thead className="bg-slate-900 text-slate-400">
                                    <tr>{['Partita','Data','Fazione','Stato','Durata','Punti','Posizione','Esito'].map(label => <th key={label} className="text-left px-2 py-2">{label}</th>)}</tr>
                                  </thead>
                                  <tbody>
                                    {row.gameHistory.map(game => (
                                      <tr key={game.gameId} className="border-t border-slate-800">
                                        <td className="px-2 py-2 text-slate-200">{game.label}</td>
                                        <td className="px-2 py-2">{game.startedAt ? new Date(game.startedAt).toLocaleDateString('it-IT') : '—'}</td>
                                        <td className="px-2 py-2">{game.faction}</td>
                                        <td className="px-2 py-2">{game.status}</td>
                                        <td className="px-2 py-2">{formatMinutes(game.durationMinutes)}</td>
                                        <td className="px-2 py-2">{game.score ?? '—'}</td>
                                        <td className="px-2 py-2">{game.position === null ? '—' : `#${game.position}`}</td>
                                        <td className="px-2 py-2">
                                          {game.status !== 'finished' ? 'In corso' : game.isWinner ? 'Vincitore' : 'Non vincitore'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </section>
                          <section>
                            <h2 className="font-mono text-xs uppercase tracking-widest text-emerald-300 mb-2">Accessi recenti</h2>
                            {row.recentSessions.length === 0 ? <p className="text-xs text-slate-500">Nessuna sessione registrata da questa funzione.</p> : (
                              <div className="space-y-2">
                                {row.recentSessions.map((session, index) => {
                                  const started = Date.parse(session.started_at);
                                  const lastSeen = Date.parse(session.ended_at ?? session.last_seen_at);
                                  return (
                                    <div key={`${session.started_at}-${index}`} className="rounded-lg border border-slate-800 p-2 text-xs flex flex-wrap justify-between gap-2">
                                      <span>{new Date(started).toLocaleString('it-IT', { timeZone: session.timezone || 'UTC' })}</span>
                                      <span className="text-slate-400">{formatMinutes((lastSeen - started) / 60_000)}</span>
                                      <span className="text-slate-500">{session.timezone || 'UTC'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </section>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d121d] p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-300">{value}</p>
    </div>
  );
}

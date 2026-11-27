import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Users } from 'lucide-react';
import { ReadabilityFrame, useReadability } from '@/pages/lobby/Readability';
import { MIN_PLAYERS, PLACEMENT_POINTS, tableSizes } from './tournament';
import { createTournament, finishTournament, listTournaments, loadTournament, register, removePlayer, startNextRound, unregister,
  type TableView, type Tournament, type TournamentDetail } from './tournament-api';
import type { GameMode } from './engine';

const STATUS: Record<Tournament['status'], string> = { registration: 'Iscrizioni aperte', running: 'In corso', finished: 'Concluso' };
const GAME: Record<string, string> = { lobby: 'In preparazione', active: 'In corso', finished: 'Conclusa' };
const MODE: Record<GameMode, string> = { breve: 'Breve · 30', media: 'Media · 60', lunga: 'Lunga · 80' };
const box = 'rounded-xl border border-slate-700 bg-[#0d1424] p-4';
const primary = 'min-h-11 px-4 rounded-lg bg-emerald-400 text-slate-950 text-sm font-bold disabled:opacity-40';
const secondary = 'min-h-11 px-4 rounded-lg border border-slate-500 text-white text-sm disabled:opacity-40';

interface Props { profile: { id: string; username: string }; isAdmin: boolean; onBack: () => void; onJoinGame: (gameId: string, faction?: string) => void; initialId?: string }

/** Pagina dei tornei: iscrizione, tavoli di ogni turno, classifica; per l'amministratore anche la gestione. */
export default function TournamentsPage({ profile, isAdmin, onBack, onJoinGame, initialId }: Props) {
  const { high, toggle } = useReadability();
  const [list, setList] = useState<Tournament[]>([]);
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', rounds_planned: 3, game_length: 'breve' as GameMode });

  const refresh = useCallback(async () => {
    setError('');
    try {
      setList(await listTournaments());
      setDetail(openId ? await loadTournament(openId) : null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Errore di caricamento.'); }
  }, [openId]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const t = setInterval(() => void refresh(), 30000); return () => clearInterval(t); }, [refresh]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label); setError('');
    try { await action(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Operazione non riuscita.'); }
    finally { setBusy(''); }
  };

  const t = detail?.tournament;
  const enrolled = !!detail?.players.includes(profile.id);
  const name = (id: string) => detail?.names[id] ?? 'Giocatore';
  const rounds = detail ? [...new Set(detail.tables.map(x => x.round))].sort((a, b) => b - a) : [];
  const current = detail?.tables.filter(x => x.round === t?.current_round) ?? [];
  const pending = current.filter(x => !x.ended).length;
  const myTable = current.find(x => x.seats.some(s => s.player_id === profile.id));
  const canStart = !!t && t.status !== 'finished' && (t.current_round < t.rounds_planned || current.some(x => !x.game_id || x.game_status === 'lobby'))
    && (detail?.players.length ?? 0) >= MIN_PLAYERS;
  const nextLabel = t && current.some(x => !x.game_id || x.game_status === 'lobby') ? `Riprendi l’avvio del turno ${t.current_round}` : `Avvia il turno ${(t?.current_round ?? 0) + 1}`;

  const startRound = () => run('start', async () => {
    if (!detail) return;
    if (pending > 0 && !current.some(x => !x.game_id || x.game_status === 'lobby')
      && !window.confirm(`${pending} tavoli del turno ${t!.current_round} non sono ancora conclusi: per la classifica varranno 0 punti. Avviare comunque il turno successivo?`)) return;
    await startNextRound(detail, profile.id, Math.random, (done, total) => setBusy(`start:${done}/${total}`));
  });

  return <ReadabilityFrame high={high} onToggle={toggle}>
    <div className="readability-content min-h-screen bg-[#0a0e1a] p-4">
      <div className="lobby-container max-w-3xl mx-auto space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={openId ? () => { setOpenId(null); setDetail(null); } : onBack} className="inline-flex items-center gap-2 text-sm text-slate-300 min-h-11">
            <ArrowLeft size={16} aria-hidden="true"/> {openId ? 'Tutti i tornei' : 'Torna alla lobby'}</button>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 min-h-11 px-3 border border-slate-600 rounded-lg text-sm text-slate-200">
            <RefreshCw size={16} aria-hidden="true"/> Aggiorna</button>
        </header>
        <div><p className="text-xs uppercase tracking-widest text-cyan-300">Competizione</p>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2"><Trophy size={24} aria-hidden="true"/> {t ? t.name : 'Tornei'}</h1></div>
        {error && <div role="alert" className="rounded-lg border border-red-600 bg-red-950 p-3 text-sm text-red-200">{error}</div>}

        {!openId && <>
          {isAdmin && <form className={box + ' space-y-3'} onSubmit={e => { e.preventDefault(); void run('create', async () => {
            const created = await createTournament({ ...form, name: form.name.trim() }); setForm({ ...form, name: '' }); setOpenId(created.id); }); }}>
            <h2 className="font-bold text-white">Nuovo torneo</h2>
            <label className="block text-sm text-slate-300">Nome
              <input required minLength={3} maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1 block w-full min-h-11 rounded-lg border border-slate-600 bg-[#060d18] px-3 text-white" placeholder="Es. Torneo d’inverno"/></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-300">Turni
                <select value={form.rounds_planned} onChange={e => setForm({ ...form, rounds_planned: Number(e.target.value) })}
                  className="mt-1 block w-full min-h-11 rounded-lg border border-slate-600 bg-[#060d18] px-3 text-white">
                  {Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Durata di ogni partita
                <select value={form.game_length} onChange={e => setForm({ ...form, game_length: e.target.value as GameMode })}
                  className="mt-1 block w-full min-h-11 rounded-lg border border-slate-600 bg-[#060d18] px-3 text-white">
                  {(Object.keys(MODE) as GameMode[]).map(m => <option key={m} value={m}>{MODE[m]}</option>)}</select></label>
            </div>
            <button className={primary} disabled={busy === 'create'}>{busy === 'create' ? 'Creazione…' : 'Crea torneo'}</button>
          </form>}
          <section className="space-y-3" aria-label="Elenco dei tornei">
            {list.map(x => <button key={x.id} onClick={() => setOpenId(x.id)} className={box + ' w-full text-left flex flex-wrap items-center justify-between gap-2'}>
              <span><strong className="block text-lg text-emerald-300">{x.name}</strong>
                <span className="text-sm text-slate-300">{x.current_round ? `Turno ${x.current_round} di ${x.rounds_planned}` : `${x.rounds_planned} turni`} · partite {MODE[x.game_length]}</span></span>
              <span className={`rounded px-2 py-1 text-xs ${x.status === 'registration' ? 'bg-amber-950 text-amber-200' : x.status === 'running' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>{STATUS[x.status]}</span>
            </button>)}
            {!list.length && <p className="rounded-xl border border-dashed border-slate-600 p-6 text-center text-sm text-slate-300">Nessun torneo in programma.</p>}
          </section>
        </>}

        {openId && t && detail && <>
          <section className={box + ' space-y-2'}>
            <p className="text-sm text-white"><strong>{STATUS[t.status]}</strong> · {t.current_round ? `turno ${t.current_round} di ${t.rounds_planned}` : `${t.rounds_planned} turni`} · partite {MODE[t.game_length]}</p>
            <p className="text-sm text-slate-300">A ogni turno i giocatori vengono divisi in tavoli da 3 a 5, con potenze sorteggiate (cercando di non ripeterle); le potenze senza giocatore sono BOT.
              Punti per piazzamento al tavolo, BOT compresi: {PLACEMENT_POINTS.map((p, i) => `${i + 1}° ${p}`).join(' · ')}. Spareggio: punti vittoria totali, poi vittorie.</p>
          </section>

          {myTable?.game_id && t.status === 'running' && <section className="rounded-xl border border-emerald-500 bg-emerald-950 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-white">Turno {t.current_round}: {myTable.ended ? 'la tua partita è conclusa. Attendi il turno successivo.' : <>sei al <strong>tavolo {myTable.table_no}</strong> con <strong>{myTable.seats.find(s => s.player_id === profile.id)!.faction}</strong>.</>}</p>
            {!myTable.ended && <button className={primary} onClick={() => onJoinGame(myTable.game_id!, myTable.seats.find(s => s.player_id === profile.id)!.faction)}>Vai al tuo tavolo</button>}
          </section>}

          {t.status === 'registration' && <section className={box + ' space-y-3'}>
            <h2 className="font-bold text-white flex items-center gap-2"><Users size={18} aria-hidden="true"/> Iscritti · {detail.players.length}</h2>
            {detail.players.length >= MIN_PLAYERS && <p className="text-sm text-slate-300">Con questi iscritti il primo turno avrà {tableSizes(detail.players.length).length} tavoli ({tableSizes(detail.players.length).join(', ')} giocatori).</p>}
            <ul className="grid grid-cols-2 gap-2 text-sm">{detail.players.map(p => <li key={p} className="rounded-lg border border-slate-700 px-3 py-2 flex justify-between gap-2 min-w-0">
              <span className="text-white break-words">{name(p)}{p === profile.id && ' (tu)'}</span>
              {isAdmin && <button className="text-xs text-red-300 underline" onClick={() => window.confirm(`Togliere ${name(p)} dal torneo?`) && void run('remove', () => removePlayer(t.id, p))}>Togli</button>}
            </li>)}</ul>
            {enrolled ? <button className={secondary} disabled={!!busy} onClick={() => void run('leave', () => unregister(t.id, profile.id))}>Ritira l’iscrizione</button>
              : <button className={primary} disabled={!!busy} onClick={() => void run('join', () => register(t.id, profile.id))}>Iscriviti al torneo</button>}
          </section>}

          {isAdmin && t.status !== 'finished' && <section className="rounded-xl border border-amber-600 bg-amber-950 p-4 space-y-3">
            <h2 className="font-bold text-amber-200">Gestione del torneo</h2>
            {detail.players.length < MIN_PLAYERS && <p className="text-sm text-amber-200">Servono almeno {MIN_PLAYERS} iscritti per avviare un turno.</p>}
            {pending > 0 && t.status === 'running' && <p className="text-sm text-amber-200">Tavoli del turno {t.current_round} ancora da concludere: {pending}.</p>}
            <div className="flex flex-wrap gap-2">
              {canStart && <button className={primary} disabled={!!busy} onClick={() => void startRound()}>
                {busy.startsWith('start') ? `Creazione dei tavoli… ${busy.split(':')[1] ?? ''}` : nextLabel}</button>}
              {t.status === 'running' && <button className={secondary} disabled={!!busy} onClick={() => window.confirm('Chiudere il torneo? La classifica diventa definitiva.') && void run('finish', () => finishTournament(t.id))}>Chiudi il torneo</button>}
            </div>
            {t.status === 'registration' && <p className="text-xs text-amber-200">Avviando il primo turno le iscrizioni si chiudono.</p>}
          </section>}

          {detail.standings.some(s => s.played) && <section className={box + ' space-y-2'}>
            <h2 className="font-bold text-white flex items-center gap-2"><Trophy size={18} aria-hidden="true"/> Classifica{t.status === 'finished' && ' finale'}</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left">
              <thead className="text-slate-400"><tr><th className="py-1 pr-2">#</th><th className="pr-2">Giocatore</th><th className="pr-2 text-right">Punti</th><th className="pr-2 text-right">PV</th><th className="pr-2 text-right">Vittorie</th><th className="text-right">Partite</th></tr></thead>
              <tbody>{detail.standings.map(s => <tr key={s.player_id} className={`border-t border-slate-700 ${s.player_id === profile.id ? 'text-emerald-300 font-bold' : 'text-white'}`}>
                <td className="py-2 pr-2">{s.place}</td><td className="pr-2 break-words">{name(s.player_id)}</td><td className="pr-2 text-right">{s.points}</td>
                <td className="pr-2 text-right">{s.pv}</td><td className="pr-2 text-right">{s.wins}</td><td className="text-right">{s.played}</td></tr>)}</tbody>
            </table></div>
          </section>}

          {rounds.map(r => <section key={r} className="space-y-2" aria-label={`Turno ${r}`}>
            <h2 className="font-bold text-white">Turno {r}</h2>
            <div className="grid gap-3 sm:grid-cols-2">{detail.tables.filter(x => x.round === r).map(x => <TableCard key={x.table_no} table={x} me={profile.id} name={name} onJoinGame={onJoinGame}/>)}</div>
          </section>)}
        </>}
      </div>
    </div>
  </ReadabilityFrame>;
}

function TableCard({ table, me, name, onJoinGame }: { table: TableView; me: string; name: (id: string) => string; onJoinGame: Props['onJoinGame'] }) {
  const mine = table.seats.find(s => s.player_id === me);
  const status = table.ended ? 'Conclusa' : table.game_status ? GAME[table.game_status] : 'Da creare';
  return <article className={box + ' space-y-2'}>
    <div className="flex justify-between gap-2"><h3 className="font-bold text-emerald-300">Tavolo {table.table_no}</h3>
      <span className={`rounded px-2 py-0.5 text-xs ${table.ended ? 'bg-slate-800 text-slate-300' : 'bg-emerald-950 text-emerald-200'}`}>{status}</span></div>
    <ul className="text-sm space-y-1">{table.seats.map(s => <li key={s.player_id} className={s.player_id === me ? 'text-emerald-300 font-bold' : 'text-white'}>
      <span className="text-slate-400">{s.faction}</span> · {name(s.player_id)}{s.player_id === me && ' (tu)'}</li>)}
      {table.seats.length < 5 && <li className="text-slate-400">{table.seats.length === 4 ? 'L’altra potenza è un BOT' : `Le altre ${5 - table.seats.length} potenze sono BOT`}</li>}</ul>
    {table.game_id && <button className={mine ? primary : secondary} onClick={() => onJoinGame(table.game_id!, mine?.faction)}>
      {mine ? (table.ended ? 'Rivedi la partita' : 'Entra') : 'Guarda'}</button>}
  </article>;
}

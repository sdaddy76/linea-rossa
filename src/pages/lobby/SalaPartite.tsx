import { useState } from 'react';
import { Archive, ArchiveRestore, Clock3, Users, RefreshCw } from 'lucide-react';
import { FACTIONS } from '@/game-v3/catalog-types';
import { openedAt, tableSeats, type RoomGame } from './sala';

interface Props {
  games: RoomGame[]; userId: string; loading: boolean; error: string;
  updatedAt: string | null; onRefresh: () => void; onEnter: (game: RoomGame) => void;
  onCreate: () => void; onCode: () => void;
  /** Chi può archiviare il tavolo: il creatore oppure l'amministratore. */
  canArchive?: (game: RoomGame) => boolean;
  onArchive?: (games: RoomGame[]) => Promise<boolean>;
  /** Solo amministratore: tavoli archiviati e ripristino. */
  archived?: RoomGame[];
  onRestore?: (games: RoomGame[]) => Promise<boolean>;
  busy?: boolean;
}
export default function SalaPartite({ games, userId, loading, error, updatedAt, onRefresh, onEnter, onCreate, onCode, canArchive = () => false, onArchive, archived, onRestore, busy = false }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'archived'>('all');
  const showingArchive = filter === 'archived' && !!onRestore;
  const [search, setSearch] = useState('');
  const waiting = games.filter(g => g.status === 'lobby');
  const source = showingArchive ? archived ?? [] : games;
  const visible = source.filter(g => showingArchive || filter === 'all' || g.status === (filter === 'waiting' ? 'lobby' : 'active'))
    .filter(g => `${g.code} ${g.name ?? ''} ${g._players.map(p => p.profile?.username ?? '').join(' ')}`.toLocaleLowerCase('it').includes(search.trim().toLocaleLowerCase('it')));
  const action = showingArchive ? onRestore : onArchive;
  const selectable = action ? (showingArchive ? visible : visible.filter(canArchive)) : [];
  const chosen = selectable.filter(g => selected.has(g.id));
  const allChosen = selectable.length > 0 && chosen.length === selectable.length;
  const toggle = (id: string) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const run = async (list: RoomGame[]) => {
    if (!action || !list.length) return;
    if (await action(list)) setSelected(prev => { const next = new Set(prev); list.forEach(g => next.delete(g.id)); return next; });
  };
  const ActionIcon = showingArchive ? ArchiveRestore : Archive, verb = showingArchive ? 'Ripristina' : 'Archivia';
  return <section aria-labelledby="sala-title" className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs uppercase tracking-widest text-cyan-300">Tavoli pubblici</p>
        <h2 id="sala-title" className="text-2xl font-bold text-white mt-1">Sala partite</h2>
        <p className="text-sm text-slate-300 mt-2">Scegli un tavolo, prenota una fazione libera e attendi l’avvio dell’host.</p></div>
      <button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 min-h-10 px-3 border border-slate-600 rounded-lg text-sm text-slate-200 disabled:opacity-50">
        <RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''}/> Aggiorna
      </button>
    </header>
    <div className="grid grid-cols-3 gap-2 text-center">
      {[['Tavoli', games.length], ['In attesa', waiting.length], ['Con posti liberi', waiting.filter(g => tableSeats(g, userId).canJoin).length]].map(([label, count]) =>
        <div key={label} className="rounded-xl border border-slate-700 bg-[#0d1424] p-3"><strong className="text-xl text-white block">{count}</strong><span className="text-xs text-slate-300">{label}</span></div>)}
    </div>
    <div className="flex flex-wrap gap-2">
      {([['all', 'Tutte'], ['waiting', 'In attesa'], ['active', 'In corso'], ...(onRestore ? [['archived', `Archiviate (${archived?.length ?? 0})`]] : [])] as [typeof filter, string][]).map(([value, label]) =>
        <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setSelected(new Set()); }}
          className={`min-h-10 rounded-lg px-4 text-sm border ${filter === value ? 'border-cyan-400 bg-cyan-950 text-cyan-100' : 'border-slate-600 text-slate-300'}`}>{label}</button>)}
    </div>
    <label className="block text-sm text-slate-300">Cerca tavolo o giocatore
      <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Codice, nome del tavolo o giocatore"
        className="mt-1 block w-full min-h-11 rounded-lg border border-slate-600 bg-[#060d18] px-3 text-white focus:outline-cyan-300"/>
    </label>
    {showingArchive && <p className="text-sm text-slate-300">Tavoli archiviati: nessun giocatore li vede più. Solo tu puoi ripristinarli e tornano com’erano.</p>}
    {selectable.length > 0 && <div className="sala-delete-bar flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-700 bg-red-950 px-3 py-2">
      <label className="flex items-center gap-2 text-sm text-red-200">
        <input type="checkbox" className="h-5 w-5 accent-red-500" checked={allChosen}
          onChange={() => setSelected(allChosen ? new Set() : new Set(selectable.map(g => g.id)))} />
        Seleziona tutte ({selectable.length})
      </label>
      <button onClick={() => void run(chosen)} disabled={!chosen.length || busy}
        className={`inline-flex items-center gap-2 min-h-10 px-3 rounded-lg text-sm font-bold disabled:opacity-40 ${showingArchive ? 'bg-emerald-400 text-slate-950' : 'bg-red-600 text-white'}`}>
        <ActionIcon size={16} aria-hidden="true"/> {busy ? 'Attendi…' : `${verb} selezionate (${chosen.length})`}
      </button>
    </div>}
    {error && <div role="alert" className="rounded-lg border border-red-600 bg-red-950 p-3 text-sm text-red-200">{error} <button onClick={onRefresh} className="underline">Riprova</button></div>}
    <p role="status" className="text-xs text-slate-400">{loading ? 'Aggiornamento dei tavoli…' : updatedAt ? `Ultimo aggiornamento ${new Date(updatedAt).toLocaleTimeString('it-IT')}. Aggiornamento automatico attivo.` : 'Sala pronta.'}</p>
    <div className="space-y-3">
      {visible.map(game => {
        const seats = tableSeats(game, userId), host = game.created_by === userId;
        const label = game.status === 'active' ? (seats.enrolled || host ? 'Rientra in partita' : 'Guarda partita')
          : seats.enrolled || host ? 'Rientra al tavolo' : seats.canJoin ? 'Iscriviti al tavolo' : 'Vedi tavolo';
        return <article key={game.id} className="rounded-xl border border-slate-700 bg-[#0d1424] p-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            {action && (showingArchive || canArchive(game)) && <input type="checkbox" aria-label={`Seleziona il tavolo ${game.name || game.code}`} checked={selected.has(game.id)}
              onChange={() => toggle(game.id)} className="mt-1 h-5 w-5 shrink-0 accent-red-500" />}
            <div className="min-w-0 flex-1"><h3 className="font-bold text-lg text-emerald-300 break-words">{game.name || game.code}</h3>
              <p className="text-xs text-slate-400 font-mono">{game.code}{host && ' · Il tuo tavolo'}{seats.enrolled && ' · Sei iscritto'}{game.archived_at && ` · archiviata il ${openedAt(game.archived_at)}`}</p></div>
            <span className={`self-start rounded px-2 py-1 text-xs ${game.status === 'lobby' ? 'bg-amber-950 text-amber-200' : 'bg-emerald-950 text-emerald-200'}`}>
              {game.status === 'active' ? 'In corso · iscrizioni chiuse' : seats.canJoin ? 'In attesa di giocatori' : 'In attesa dell’avvio'}
            </span>
          </div>
          <p className="room-date flex items-center gap-2 text-sm text-slate-300"><Clock3 size={15} aria-hidden="true"/> Aperta il <time dateTime={game.created_at}>{openedAt(game.created_at)}</time></p>
          <p className="flex items-center gap-2 text-sm text-white"><Users size={16} aria-hidden="true"/>
            {seats.humans.length}/5 giocatori{seats.bots > 0 && ` · ${seats.bots} BOT`}{game.status === 'lobby' && ` · ${seats.free.length} posti liberi`}
          </p>
          <ul aria-label={`Giocatori al tavolo ${game.code}`} className="grid grid-cols-2 gap-2 text-sm">
            {FACTIONS.map(faction => {
              const p = game._players.find(p => p.faction === faction);
              return <li key={faction} className="rounded-lg border border-slate-700 px-2 py-1.5 sm:px-3 sm:py-2 min-w-0">
                <span className="block text-xs text-slate-400">{faction}</span>
                <span className={`block break-words ${p?.player_id && !p.is_bot ? 'text-white' : 'text-slate-400'}`}>
                  {p?.player_id && !p.is_bot ? (p.profile?.username || 'Giocatore') + (p.player_id === userId ? ' (tu)' : '') + (p.player_id === game.created_by ? ' · host' : '')
                    : p?.is_bot ? 'BOT' : p ? 'Fazione neutrale' : game.status === 'lobby' ? 'Posto libero' : 'Nessun giocatore'}
                </span>
              </li>;
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">{game.status === 'lobby' ? 'I posti non scelti saranno completati con BOT all’avvio.' : 'Puoi assistere senza entrare come giocatore.'}</p>
            <div className="flex flex-wrap gap-2">
              {action && (showingArchive || canArchive(game)) && <button onClick={() => void run([game])} disabled={busy}
                title={showingArchive ? 'Rimetti il tavolo nella Sala partite' : 'Archivia: il tavolo sparisce dalle liste dei giocatori'}
                className={`inline-flex items-center gap-2 min-h-11 px-3 rounded-lg border text-sm font-bold disabled:opacity-40 ${showingArchive ? 'border-emerald-500 text-emerald-300' : 'border-red-600 text-red-300'}`}>
                <ActionIcon size={16} aria-hidden="true"/> {verb}</button>}
              {!showingArchive && <button onClick={() => onEnter(game)} className="min-h-11 px-4 rounded-lg bg-emerald-400 text-slate-950 text-sm font-bold hover:bg-emerald-300">{label}</button>}
            </div>
          </div>
        </article>;
      })}
      {showingArchive && visible.length === 0 && <p className="rounded-xl border border-dashed border-slate-600 p-6 text-center text-sm text-slate-300">Nessuna partita archiviata.</p>}
      {!showingArchive && !loading && !error && visible.length === 0 && <div className="rounded-xl border border-dashed border-slate-600 p-6 text-center space-y-3">
        <h3 className="font-bold text-white">{games.length ? 'Nessun tavolo corrisponde alla ricerca' : 'Nessun tavolo pubblico aperto'}</h3>
        <p className="text-sm text-slate-300">Puoi aprire un nuovo tavolo o raggiungere una partita riservata con il codice invito.</p>
        <div className="flex flex-wrap justify-center gap-2"><button onClick={onCreate} className="min-h-11 px-4 rounded-lg bg-emerald-400 text-slate-950 font-bold">Apri un tavolo</button>
          <button onClick={onCode} className="min-h-11 px-4 rounded-lg border border-slate-500 text-white">Entra con codice</button></div>
      </div>}
    </div>
    <p className="text-xs text-slate-400">Le date sono mostrate nel tuo fuso orario. Le partite riservate non sono elencate nella sala pubblica.</p>
  </section>;
}

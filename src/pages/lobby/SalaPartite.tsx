import { useState } from 'react';
import { Clock3, Users, RefreshCw } from 'lucide-react';
import { FACTIONS } from '@/game-v3/catalog-types';
import { openedAt, tableSeats, type RoomGame } from './sala';

interface Props {
  games: RoomGame[]; userId: string; loading: boolean; error: string;
  updatedAt: string | null; onRefresh: () => void; onEnter: (game: RoomGame) => void;
  onCreate: () => void; onCode: () => void;
}
export default function SalaPartite({ games, userId, loading, error, updatedAt, onRefresh, onEnter, onCreate, onCode }: Props) {
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active'>('all');
  const [search, setSearch] = useState('');
  const waiting = games.filter(g => g.status === 'lobby');
  const visible = games.filter(g => (filter === 'all' || g.status === (filter === 'waiting' ? 'lobby' : 'active')))
    .filter(g => `${g.code} ${g.name ?? ''} ${g._players.map(p => p.profile?.username ?? '').join(' ')}`.toLocaleLowerCase('it').includes(search.trim().toLocaleLowerCase('it')));
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
      {([['all', 'Tutte'], ['waiting', 'In attesa'], ['active', 'In corso']] as const).map(([value, label]) =>
        <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}
          className={`min-h-10 rounded-lg px-4 text-sm border ${filter === value ? 'border-cyan-400 bg-cyan-950 text-cyan-100' : 'border-slate-600 text-slate-300'}`}>{label}</button>)}
    </div>
    <label className="block text-sm text-slate-300">Cerca tavolo o giocatore
      <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Codice, nome del tavolo o giocatore"
        className="mt-1 block w-full min-h-11 rounded-lg border border-slate-600 bg-[#060d18] px-3 text-white focus:outline-cyan-300"/>
    </label>
    {error && <div role="alert" className="rounded-lg border border-red-600 bg-red-950 p-3 text-sm text-red-200">{error} <button onClick={onRefresh} className="underline">Riprova</button></div>}
    <p role="status" className="text-xs text-slate-400">{loading ? 'Aggiornamento dei tavoli…' : updatedAt ? `Ultimo aggiornamento ${new Date(updatedAt).toLocaleTimeString('it-IT')}. Aggiornamento automatico attivo.` : 'Caricamento della sala…'}</p>
    <div className="space-y-3">
      {visible.map(game => {
        const seats = tableSeats(game, userId), host = game.created_by === userId;
        const label = game.status === 'active' ? (seats.enrolled || host ? 'Rientra in partita' : 'Guarda partita')
          : seats.enrolled || host ? 'Rientra al tavolo' : seats.canJoin ? 'Iscriviti al tavolo' : 'Vedi tavolo';
        return <article key={game.id} className="rounded-xl border border-slate-700 bg-[#0d1424] p-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="min-w-0"><h3 className="font-bold text-lg text-emerald-300 break-words">{game.name || game.code}</h3>
              <p className="text-xs text-slate-400 font-mono">{game.code}{host && ' · Il tuo tavolo'}{seats.enrolled && ' · Sei iscritto'}</p></div>
            <span className={`self-start rounded px-2 py-1 text-xs ${game.status === 'lobby' ? 'bg-amber-950 text-amber-200' : 'bg-emerald-950 text-emerald-200'}`}>
              {game.status === 'active' ? 'In corso · iscrizioni chiuse' : seats.canJoin ? 'In attesa di giocatori' : 'In attesa dell’avvio'}
            </span>
          </div>
          <p className="flex items-center gap-2 text-sm text-slate-300"><Clock3 size={15} aria-hidden="true"/> Aperta il <time dateTime={game.created_at}>{openedAt(game.created_at)}</time></p>
          <p className="flex items-center gap-2 text-sm text-white"><Users size={16} aria-hidden="true"/>
            {seats.humans.length}/5 giocatori{seats.bots > 0 && ` · ${seats.bots} BOT`}{game.status === 'lobby' && ` · ${seats.free.length} posti liberi`}
          </p>
          <ul aria-label={`Giocatori al tavolo ${game.code}`} className="grid sm:grid-cols-2 gap-2 text-sm">
            {FACTIONS.map(faction => {
              const p = game._players.find(p => p.faction === faction);
              return <li key={faction} className="rounded-lg border border-slate-700 px-3 py-2 min-w-0">
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
            <button onClick={() => onEnter(game)} className="min-h-11 px-4 rounded-lg bg-emerald-400 text-slate-950 text-sm font-bold hover:bg-emerald-300">{label}</button>
          </div>
        </article>;
      })}
      {!loading && !error && visible.length === 0 && <div className="rounded-xl border border-dashed border-slate-600 p-6 text-center space-y-3">
        <h3 className="font-bold text-white">{games.length ? 'Nessun tavolo corrisponde alla ricerca' : 'Nessun tavolo pubblico aperto'}</h3>
        <p className="text-sm text-slate-300">Puoi aprire un nuovo tavolo o raggiungere una partita riservata con il codice invito.</p>
        <div className="flex flex-wrap justify-center gap-2"><button onClick={onCreate} className="min-h-11 px-4 rounded-lg bg-emerald-400 text-slate-950 font-bold">Apri un tavolo</button>
          <button onClick={onCode} className="min-h-11 px-4 rounded-lg border border-slate-500 text-white">Entra con codice</button></div>
      </div>}
    </div>
    <p className="text-xs text-slate-400">Le date sono mostrate nel tuo fuso orario. Le partite riservate non sono elencate nella sala pubblica.</p>
  </section>;
}

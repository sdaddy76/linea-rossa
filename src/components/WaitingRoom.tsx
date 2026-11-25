import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/game';
import { FACTIONS, type Faction } from '@/game-v3/catalog-types';
import type { GameMode } from '@/game-v3/engine';
import { initializeTabletop, readTabletop } from '@/game-v3/online';
import { Materials } from '@/game-v3/Materials';
import { openedAt } from '@/pages/lobby/sala';
import { ReadabilityFrame } from '@/pages/lobby/Readability';

interface Player { id: string; faction: string; player_id: string | null; is_bot: boolean; profile?: { username: string } | null }
interface Props {
  gameId: string; gameCode: string; gameName?: string; isPublic?: boolean; profile: Profile; isHost: boolean;
  onGameStart: (faction: string | null) => void; onLeave: () => void;
  initialFaction?: string; initialBots?: Set<string>; autoStart?: boolean;
  tabletopMode?: GameMode;
  highReadability?: boolean; onToggleReadability?: () => void;
}
export default function WaitingRoom({ gameId, gameCode, gameName, isPublic, profile, isHost, onGameStart, onLeave, initialFaction, autoStart, tabletopMode, highReadability = false, onToggleReadability = () => {} }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(tabletopMode ?? 'media');
  const [neutrals, setNeutrals] = useState<Faction[]>([]);
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [joinsAllowed, setJoinsAllowed] = useState(true);
  const mounted = useRef(true);
  const choosing = useRef(false);
  const launched = useRef(false);
  const initialChosen = useRef(false);
  const startCallback = useRef(onGameStart);
  startCallback.current = onGameStart;
  const mine = players.find(p => p.player_id === profile.id);
  const factionRef = useRef<string | null>(null);
  factionRef.current = mine?.faction ?? factionRef.current;
  const refresh = useCallback(async () => {
    const [result, table] = await Promise.all([
      supabase.from('game_players').select('*, profile:profiles(username)').eq('game_id', gameId).order('turn_order'),
      supabase.from('games').select('status,created_at,allow_join').eq('id', gameId).single(),
    ]);
    if (mounted.current) {
      if (result.error || table.error) setError(result.error?.message || table.error?.message || 'Impossibile aggiornare il tavolo.');
      else {
        const roster = (result.data ?? []) as Player[];
        setPlayers(roster);
        factionRef.current = roster.find(p => p.player_id === profile.id && !p.is_bot)?.faction ?? null;
        setOpened(table.data.created_at);
        setJoinsAllowed(table.data.allow_join !== false && table.data.status === 'lobby');
        if (table.data.status === 'active') startCallback.current(factionRef.current);
        else if (table.data.status === 'finished') setError('Questo tavolo è stato chiuso. Torna alla sala partite.');
      }
    }
  }, [gameId, profile.id]);
  useEffect(() => {
    mounted.current = true;
    refresh();
    const channel = supabase.channel('tabletop-lobby-' + gameId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: 'game_id=eq.' + gameId }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: 'id=eq.' + gameId }, refresh).subscribe();
    const interval = setInterval(() => { if (!document.hidden) void refresh(); }, 10000);
    return () => { mounted.current = false; clearInterval(interval); supabase.removeChannel(channel); };
  }, [gameId, refresh]);
  const choose = useCallback(async (faction: Faction) => {
    if (choosing.current) return;
    choosing.current = true;
    setBusy(true); setError('');
    try {
      const status = await supabase.from('games').select('status,allow_join').eq('id', gameId).single();
      if (status.error) throw status.error;
      if (status.data.status !== 'lobby') throw new Error('La partita è iniziata. Rientra dalla lobby senza cambiare fazione.');
      const setup = await supabase.from('game_state').select('special_uses').eq('game_id', gameId).maybeSingle();
      if (setup.error) throw setup.error;
      if (readTabletop(setup.data)) throw new Error('L’host sta completando l’avvio. Le fazioni sono già state fissate.');
      const current = await supabase.from('game_players').select('*').eq('game_id', gameId);
      if (current.error) throw current.error;
      const occupied = current.data.find(p => p.faction === faction);
      if (occupied && occupied.player_id !== profile.id) throw new Error('Questa fazione è già occupata. Scegline una libera.');
      const me = current.data.find(p => p.player_id === profile.id);
      if (!me && status.data.allow_join === false) throw new Error('Le iscrizioni a questo tavolo sono chiuse.');
      const values = { faction, is_ready: true, is_bot: false, turn_order: FACTIONS.indexOf(faction) + 1 };
      const result = me
        ? await supabase.from('game_players').update(values).eq('id', me.id).eq('player_id', profile.id).select('id')
        : await supabase.from('game_players').insert({ ...values, player_id: profile.id, game_id: gameId }).select('id');
      if (result.error) {
        if (result.error.code === '23505') throw new Error('Un altro giocatore ha appena preso questa fazione. Aggiorna il tavolo e scegline una libera.');
        throw result.error;
      }
      if (!result.data?.length) throw new Error('Iscrizione non salvata. Aggiorna il tavolo e riprova.');
      factionRef.current = faction;
      await refresh();
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : (err as { message: string }).message); }
    finally { choosing.current = false; if (mounted.current) setBusy(false); }
  }, [gameId, profile.id, refresh]);
  const start = useCallback(async () => {
    if (!factionRef.current || launched.current) return;
    launched.current = true; setBusy(true); setError('');
    try {
      await initializeTabletop(gameId, profile.id, gameMode, neutrals.filter(f => !players.some(p => p.faction === f && p.player_id && !p.is_bot)));
      startCallback.current(factionRef.current);
    } catch (err) {
      launched.current = false;
      if (mounted.current) setError(err instanceof Error ? err.message : 'Avvio non riuscito. Riprova.');
    } finally { if (mounted.current) setBusy(false); }
  }, [gameId, profile.id, gameMode, neutrals, players]);
  useEffect(() => {
    if (initialFaction && isHost && !initialChosen.current) {
      initialChosen.current = true;
      if (FACTIONS.includes(initialFaction as Faction)) void choose(initialFaction as Faction);
    }
  }, [initialFaction, isHost, choose]);
  useEffect(() => {
    if (autoStart && isHost && mine?.faction && !busy && !error && !launched.current) void start();
  }, [autoStart, isHost, mine?.faction, busy, error, start]);
  const leave = async () => {
    if (!mine || isHost) return;
    if (!window.confirm('Vuoi annullare la tua iscrizione e liberare la fazione?')) return;
    setBusy(true); setError('');
    try {
      const table = await supabase.from('games').select('status').eq('id', gameId).single();
      if (table.error) throw table.error;
      if (table.data.status !== 'lobby') throw new Error('La partita è già iniziata: non puoi liberare il posto dalla sala.');
      const result = await supabase.from('game_players').delete().eq('id', mine.id).eq('player_id', profile.id).select('id');
      if (result.error) throw result.error;
      if (!result.data?.length) throw new Error('Iscrizione non annullata. Riprova.');
      factionRef.current = null;
      onLeave();
    } catch (err) { setError((err as { message: string }).message); setBusy(false); }
  };
  return <ReadabilityFrame high={highReadability} onToggle={onToggleReadability}>
  <main className="readability-content min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
    <div className="lobby-container max-w-2xl mx-auto space-y-5">
      <header className="waiting-header flex justify-between gap-4"><div><p className="text-red-400 text-xs uppercase tracking-widest">Linea Rossa · Edizione da tavolo</p>
        <h1 className="text-2xl font-bold mt-2">{gameName || 'Sala di attesa'}</h1><p className="text-slate-400 text-sm">{isPublic ? 'Tavolo aperto prima dell’avvio' : 'Tavolo riservato'}</p></div>
        <button disabled={busy} onClick={onLeave} className="text-slate-300 underline">Torna alla sala</button></header>
      <section aria-label="Giocatori iscritti" className="p-4 rounded-xl border border-slate-700 bg-slate-900 text-sm space-y-2">
        <div className="waiting-summary flex justify-between gap-3"><p className="font-bold">{players.filter(p => p.player_id && !p.is_bot).length}/5 giocatori iscritti</p>
          <button disabled={busy} onClick={() => void refresh()} className="text-cyan-300 underline">Aggiorna tavolo</button></div>
        <p className="text-slate-300">{players.filter(p => p.player_id && !p.is_bot).map(p => p.profile?.username || 'Giocatore').join(', ') || 'Nessun giocatore iscritto'}</p>
        {opened && <p className="text-slate-400">Aperta il <time dateTime={opened}>{openedAt(opened)}</time></p>}
        <p className="text-slate-400">Tornando alla sala mantieni l’iscrizione. {mine && !isHost && <button disabled={busy} onClick={leave} className="text-red-300 underline">Annulla iscrizione</button>}</p>
      </section>
      <section className="waiting-invite p-5 rounded-xl bg-slate-900 border border-slate-700 flex justify-between items-center">
        <div><p className="text-xs text-slate-400">CODICE INVITO</p><strong className="text-2xl tracking-widest">{gameCode}</strong></div>
        <button onClick={async () => { try { await navigator.clipboard.writeText(gameCode); setCopied(true); } catch { setError('Copia manualmente il codice visualizzato.'); } }} className="border rounded-lg px-4 py-2">{copied ? 'Copiato' : 'Copia codice'}</button>
      </section>
      <section className="p-5 rounded-xl bg-slate-900 border border-slate-700">
        <h2 className="font-bold">Scegli la tua fazione</h2><p className="text-sm text-slate-400 mb-4">Invita gli altri giocatori prima dell’avvio. Ogni fazione non scelta sarà gestita dal suo mazzo BOT.</p>
        <div className="grid sm:grid-cols-2 gap-3">{FACTIONS.map(f => {
          const player = players.find(p => p.faction === f);
          const isMine = player?.player_id === profile.id;
          return <button key={f} disabled={busy || (!!player && !isMine) || (!mine && !joinsAllowed)} onClick={() => choose(f)}
            className={'p-4 rounded-lg border text-left disabled:opacity-60 ' + (isMine ? 'border-red-400 bg-red-950' : 'border-slate-600 hover:border-slate-300')}>
            <strong>{f}</strong><span className="block text-sm text-slate-300">{isMine ? 'La tua fazione' : player ? player.profile?.username || 'Occupata' : 'Libera · BOT se nessuno la sceglie'}</span>
          </button>;
        })}</div>
      </section>
      {isHost && <section className="p-5 rounded-xl bg-slate-900 border border-slate-700">
        <label htmlFor="waiting-game-mode" className="block font-bold mb-2">Durata della partita</label>
        <select id="waiting-game-mode" className="w-full rounded-lg bg-slate-800 border border-slate-600 p-3" disabled={busy}
          value={gameMode} onChange={event => setGameMode(event.target.value as GameMode)}>
          <option value="breve">Breve · 30 caselle</option><option value="media">Media · 60 caselle</option><option value="lunga">Lunga · 80 caselle</option>
        </select>
        <fieldset className="mt-4 space-y-2"><legend className="font-bold">Fazioni senza giocatore</legend>
          <p className="text-sm text-slate-400">Per ogni posto libero scegli BOT attivo o fazione neutrale passiva (cap. 14). La scelta si applica all’avvio.</p>
          {FACTIONS.filter(f => !players.some(p => p.faction === f && p.player_id && !p.is_bot)).map(f =>
            <label key={f} className="waiting-options flex items-center justify-between gap-3 text-sm">{f}
              <select disabled={busy} className="rounded bg-slate-800 p-2" value={neutrals.includes(f) ? 'neutral' : 'bot'}
                onChange={e => setNeutrals(old => e.target.value === 'neutral' ? [...old.filter(x => x !== f), f] : old.filter(x => x !== f))}>
                <option value="bot">BOT</option><option value="neutral">Neutrale</option>
              </select>
            </label>)}
        </fieldset>
      </section>}
      <section className="text-sm text-slate-300 space-y-2 p-5 border border-slate-700 rounded-xl">
        <p>Regolamento v3.11: due attivazioni per fazione, segnalini Influenza nei riquadri, unità accanto allo Stato (massimo 5 per tipo), controllo dato da unità + Influenza.</p>
        <p>Durata: soglia segna-turni 30 / 60 / 80 secondo la modalità; gli eventi di blocco fermano l’avanzamento. Nessuna unità iniziale gratuita.</p>
        <p>Nel nuovo mazzo BOT tutte le carte riportano lo Stato dell’Influenza a fine round e il piazzamento è automatico. Le partite già avviate mantengono la scelta manuale prevista dal loro salvataggio.</p>
        <button className="underline text-red-300" onClick={() => setMaterials(true)}>Sfoglia carte, tabellone, plance e regolamento</button>
      </section>
      {error && <p role="alert" className="p-4 bg-red-950 text-red-200 border border-red-700 rounded-lg">{error}</p>}
      {isHost ? <button disabled={busy || !mine?.faction} onClick={start} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 rounded-xl py-4 font-bold">
        {busy ? 'Preparazione della partita…' : 'Avvia partita · completa i posti con BOT'}</button>
        : <p className="text-center text-slate-300">{mine ? 'Fazione pronta. In attesa dell’host.' : 'Scegli una fazione per partecipare.'}</p>}
    </div>
  </main>{materials && <Materials onClose={() => setMaterials(false)} />}
  </ReadabilityFrame>;
}

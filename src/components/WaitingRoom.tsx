import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/game';
import { FACTIONS, type Faction } from '@/game-v3/catalog-types';
import { initializeTabletop, readTabletop } from '@/game-v3/online';
import { Materials } from '@/game-v3/Materials';

interface Player { id: string; faction: string; player_id: string | null; is_bot: boolean; profile?: { username: string } | null }
interface Props {
  gameId: string; gameCode: string; gameName?: string; isPublic?: boolean; profile: Profile; isHost: boolean;
  onGameStart: (faction: string | null) => void; onLeave: () => void;
  initialFaction?: string; initialBots?: Set<string>; autoStart?: boolean;
}
export default function WaitingRoom({ gameId, gameCode, gameName, isPublic, profile, isHost, onGameStart, onLeave, initialFaction, autoStart }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState(false);
  const [copied, setCopied] = useState(false);
  const mounted = useRef(true);
  const launched = useRef(false);
  const initialChosen = useRef(false);
  const startCallback = useRef(onGameStart);
  startCallback.current = onGameStart;
  const mine = players.find(p => p.player_id === profile.id);
  const factionRef = useRef<string | null>(null);
  factionRef.current = mine?.faction ?? factionRef.current;
  const refresh = useCallback(async () => {
    const result = await supabase.from('game_players').select('*, profile:profiles(username)').eq('game_id', gameId).order('turn_order');
    if (mounted.current) {
      if (result.error) setError(result.error.message);
      else setPlayers((result.data ?? []) as Player[]);
    }
  }, [gameId]);
  useEffect(() => {
    mounted.current = true;
    refresh();
    const channel = supabase.channel('tabletop-lobby-' + gameId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: 'game_id=eq.' + gameId }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: 'id=eq.' + gameId }, payload => {
        if (payload.new.status === 'active') startCallback.current(factionRef.current);
      }).subscribe();
    return () => { mounted.current = false; supabase.removeChannel(channel); };
  }, [gameId, refresh]);
  const choose = useCallback(async (faction: Faction) => {
    setBusy(true); setError('');
    try {
      const status = await supabase.from('games').select('status').eq('id', gameId).single();
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
      const values = { faction, is_ready: true, is_bot: false, turn_order: FACTIONS.indexOf(faction) + 1 };
      const result = me
        ? await supabase.from('game_players').update(values).eq('id', me.id).eq('player_id', profile.id)
        : await supabase.from('game_players').insert({ ...values, player_id: profile.id, game_id: gameId });
      if (result.error) throw result.error;
      factionRef.current = faction;
      await refresh();
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : (err as { message: string }).message); }
    finally { if (mounted.current) setBusy(false); }
  }, [gameId, profile.id, refresh]);
  const start = useCallback(async () => {
    if (!factionRef.current || launched.current) return;
    launched.current = true; setBusy(true); setError('');
    try {
      await initializeTabletop(gameId, profile.id);
      startCallback.current(factionRef.current);
    } catch (err) {
      launched.current = false;
      if (mounted.current) setError(err instanceof Error ? err.message : 'Avvio non riuscito. Riprova.');
    } finally { if (mounted.current) setBusy(false); }
  }, [gameId, profile.id]);
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
    setBusy(true); setError('');
    // Leaving the room does not delete the host's table or anyone else's data.
    try {
      if (!isHost && mine) {
        const result = await supabase.from('game_players').delete().eq('id', mine.id).eq('player_id', profile.id);
        if (result.error) throw result.error;
      }
      onLeave();
    } catch (err) { setError((err as { message: string }).message); setBusy(false); }
  };
  return <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
    <div className="max-w-2xl mx-auto space-y-5">
      <header className="flex justify-between gap-4"><div><p className="text-red-400 text-xs uppercase tracking-widest">Linea Rossa · Edizione da tavolo</p>
        <h1 className="text-2xl font-bold mt-2">{gameName || 'Sala di attesa'}</h1><p className="text-slate-400 text-sm">{isPublic ? 'Tavolo aperto prima dell’avvio' : 'Tavolo riservato'}</p></div>
        <button disabled={busy} onClick={leave} className="text-slate-300 underline">Torna alla lobby</button></header>
      <section className="p-5 rounded-xl bg-slate-900 border border-slate-700 flex justify-between items-center">
        <div><p className="text-xs text-slate-400">CODICE INVITO</p><strong className="text-2xl tracking-widest">{gameCode}</strong></div>
        <button onClick={async () => { try { await navigator.clipboard.writeText(gameCode); setCopied(true); } catch { setError('Copia manualmente il codice visualizzato.'); } }} className="border rounded-lg px-4 py-2">{copied ? 'Copiato' : 'Copia codice'}</button>
      </section>
      <section className="p-5 rounded-xl bg-slate-900 border border-slate-700">
        <h2 className="font-bold">Scegli la tua fazione</h2><p className="text-sm text-slate-400 mb-4">Invita gli altri giocatori prima dell’avvio. Ogni fazione non scelta sarà gestita dal suo mazzo BOT.</p>
        <div className="grid sm:grid-cols-2 gap-3">{FACTIONS.map(f => {
          const player = players.find(p => p.faction === f);
          const isMine = player?.player_id === profile.id;
          return <button key={f} disabled={busy || (!!player && !isMine)} onClick={() => choose(f)}
            className={'p-4 rounded-lg border text-left disabled:opacity-60 ' + (isMine ? 'border-red-400 bg-red-950' : 'border-slate-600 hover:border-slate-300')}>
            <strong>{f}</strong><span className="block text-sm text-slate-300">{isMine ? 'La tua fazione' : player ? player.profile?.username || 'Occupata' : 'Libera · BOT se nessuno la sceglie'}</span>
          </button>;
        })}</div>
      </section>
      <section className="text-sm text-slate-300 space-y-2 p-5 border border-slate-700 rounded-xl">
        <p>Regolamento v3: mazzo fazione condiviso, speciali in riserva, tre obiettivi segreti per giocatore e due attivazioni per fazione in ogni round.</p>
        <p>Durata: 6 round sul tracciato, massimo 8 effettivi con gli eventi di blocco. Nessuna unità iniziale gratuita.</p>
        <p>Errata approvata: lo Scudo Missilistico annulla il bonus dei Missili balistici attaccanti.</p>
        <button className="underline text-red-300" onClick={() => setMaterials(true)}>Sfoglia carte, tabellone, plance e regolamento</button>
      </section>
      {error && <p role="alert" className="p-4 bg-red-950 text-red-200 border border-red-700 rounded-lg">{error}</p>}
      {isHost ? <button disabled={busy || !mine?.faction} onClick={start} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 rounded-xl py-4 font-bold">
        {busy ? 'Preparazione della partita…' : 'Avvia partita · completa i posti con BOT'}</button>
        : <p className="text-center text-slate-300">{mine ? 'Fazione pronta. In attesa dell’host.' : 'Scegli una fazione per partecipare.'}</p>}
    </div>{materials && <Materials onClose={() => setMaterials(false)} />}
  </main>;
}

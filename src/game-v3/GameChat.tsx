import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FACTIONS, type Faction } from './catalog-types';

export interface ChatMessage { id: string; game_id: string; sender_id: string; sender_faction: Faction; recipient_faction: Faction | null; body: string; created_at: string }
type Seat = { faction: string | null; player_id: string | null; is_bot: boolean };

/** Conversazione visibile: "Tavolo" (pubblica) o privata con una potenza. */
export function threadOf(m: ChatMessage, own: Faction | null): 'tavolo' | Faction {
  if (!m.recipient_faction) return 'tavolo';
  return m.sender_faction === own ? m.recipient_faction : m.sender_faction;
}
const seenKey = (gameId: string) => `linea_rossa_chat_seen_${gameId}`;

export function GameChat({ gameId, own, tone, players }: { gameId: string; own: Faction | null; tone: Record<Faction, string>; players: Seat[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<'tavolo' | Faction>('tavolo');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem(seenKey(gameId)) ?? ''; } catch { return ''; } });
  const list = useRef<HTMLDivElement>(null);
  const humans = useMemo(() => FACTIONS.filter(f => f !== own && players.some(p => p.faction === f && p.player_id && !p.is_bot)), [players, own]);

  useEffect(() => {
    let live = true;
    void supabase.from('game_messages').select('*').eq('game_id', gameId).order('created_at', { ascending: true }).limit(300)
      .then(r => { if (live && !r.error) setMessages((r.data ?? []) as ChatMessage[]); });
    const channel = supabase.channel(`chat-${gameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_messages', filter: `game_id=eq.${gameId}` },
        payload => setMessages(old => old.some(m => m.id === (payload.new as ChatMessage).id) ? old : [...old, payload.new as ChatMessage]))
      .subscribe();
    return () => { live = false; void supabase.removeChannel(channel); };
  }, [gameId]);

  const unread = messages.filter(m => m.created_at > seen && m.sender_faction !== own).length;
  const visible = messages.filter(m => threadOf(m, own) === thread);
  useEffect(() => {
    if (!open) return;
    const last = messages[messages.length - 1]?.created_at ?? '';
    if (last && last > seen) { setSeen(last); try { localStorage.setItem(seenKey(gameId), last); } catch { /* memoria non disponibile */ } }
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [open, messages, thread, seen, gameId]);

  const send = async () => {
    const body = text.trim();
    if (!body || !own) return;
    setError('');
    const { data, error: err } = await supabase.from('game_messages').insert({ game_id: gameId, sender_faction: own, recipient_faction: thread === 'tavolo' ? null : thread, body } as never).select('*').single();
    if (err) { setError(err.message.includes('row-level') ? 'Solo i giocatori seduti al tavolo possono scrivere.' : err.message); return; }
    setText(''); setMessages(old => old.some(m => m.id === (data as ChatMessage).id) ? old : [...old, data as ChatMessage]);
  };
  const unreadIn = (t: 'tavolo' | Faction) => messages.filter(m => m.created_at > seen && m.sender_faction !== own && threadOf(m, own) === t).length;
  const tab = 'rounded-md px-2 py-1 text-sm border';

  return <>
    <button className="fixed bottom-4 right-4 z-30 rounded-full border border-slate-500 bg-slate-800 px-4 py-3 text-sm font-semibold shadow-lg"
      aria-expanded={open} onClick={() => setOpen(!open)}>💬 Chat{unread ? ` · ${unread} nuovi` : ''}</button>
    {open && <section aria-label="Chat della partita" className="game-chat fixed bottom-20 right-4 z-30 flex w-[min(380px,calc(100vw-2rem))] max-h-[70vh] flex-col rounded-xl border border-slate-600 bg-slate-900 shadow-2xl">
      <div className="flex flex-wrap gap-1 border-b border-slate-700 p-2">
        <button className={tab + (thread === 'tavolo' ? ' border-slate-300 bg-slate-700' : ' border-slate-700')} onClick={() => setThread('tavolo')}>Tavolo{unreadIn('tavolo') ? ` (${unreadIn('tavolo')})` : ''}</button>
        {own && humans.map(f => <button key={f} className={tab + (thread === f ? ' border-slate-300 bg-slate-700' : ' border-slate-700')} style={{ color: tone[f] }}
          onClick={() => setThread(f)} title={`Messaggi privati con ${f}`}>🔒 {f}{unreadIn(f) ? ` (${unreadIn(f)})` : ''}</button>)}
      </div>
      <p className="px-3 pt-2 text-xs text-slate-400">{thread === 'tavolo' ? 'Messaggi visibili a tutti i giocatori della partita.' : `Conversazione privata: la leggete solo tu e ${thread}.`}</p>
      <div ref={list} className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {!visible.length && <p className="text-sm text-slate-500">Nessun messaggio.</p>}
        {visible.map(m => <div key={m.id} className={'rounded-lg p-2 text-sm ' + (m.sender_faction === own ? 'ml-6 bg-slate-800' : 'mr-6 bg-slate-950')}>
          <p className="text-xs"><strong style={{ color: tone[m.sender_faction] }}>{m.sender_faction}</strong> <span className="text-slate-500">· {new Date(m.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></p>
          <p className="whitespace-pre-wrap break-words">{m.body}</p></div>)}
      </div>
      {own ? <form className="flex gap-2 border-t border-slate-700 p-2" onSubmit={e => { e.preventDefault(); void send(); }}>
        <textarea aria-label="Scrivi un messaggio" className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-slate-600 bg-slate-800 p-2 text-sm" maxLength={1000} rows={2}
          value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder={thread === 'tavolo' ? 'Scrivi a tutto il tavolo…' : `Scrivi in privato a ${thread}…`} />
        <button className="rounded-lg border border-slate-500 bg-slate-700 px-3 text-sm" disabled={!text.trim()}>Invia</button>
      </form> : <p className="border-t border-slate-700 p-2 text-xs text-slate-400">Solo i giocatori seduti al tavolo possono scrivere.</p>}
      {error && <p role="alert" className="px-3 pb-2 text-xs text-amber-300">{error}</p>}
    </section>}
  </>;
}

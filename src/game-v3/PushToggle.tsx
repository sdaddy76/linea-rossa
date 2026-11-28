import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const PUSH_WORKER = '/push-sw.js';

type Status = 'unsupported' | 'denied' | 'off' | 'on' | 'working';
const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export function keyBytes(base64url: string) {
  const raw = atob(base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - base64url.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
const sameKey = (a: ArrayBuffer | null | undefined, b: Uint8Array) => !!a && a.byteLength === b.length && new Uint8Array(a).every((x, i) => x === b[i]);

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('tabletop', { body });
  if (error) {
    let message = error.message;
    try { const d = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.(); if (d?.error) message = d.error; } catch { /* non JSON */ }
    throw new Error(message);
  }
  return data as T;
}
/** La chiave pubblica la fornisce il server, che genera e custodisce la coppia di chiavi. */
export const serverKey = async () => (await call<{ publicKey: string }>({ action: 'vapid' })).publicKey;

export async function currentSubscription() {
  if (!supported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(PUSH_WORKER);
  return reg ? reg.pushManager.getSubscription() : null;
}
export async function enablePush() {
  if (!supported()) throw new Error('Questo browser non supporta le notifiche. Su iPhone e iPad aggiungi prima il sito alla schermata Home (Condividi → Aggiungi alla schermata Home) e aprilo da lì.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifiche non autorizzate nel browser.');
  const key = keyBytes(await serverKey());
  const reg = await navigator.serviceWorker.register(PUSH_WORKER);
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  // Un'iscrizione fatta con un'altra chiave non riceverebbe nulla: si rifà.
  if (sub && !sameKey(sub.options.applicationServerKey, key)) { await sub.unsubscribe(); sub = null; }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const json = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({ endpoint: json.endpoint, subscription: json } as never, { onConflict: 'endpoint' });
  if (error) throw new Error(error.message);
}
export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
export const testPush = () => call<{ devices: number; sent: number }>({ action: 'test-push' });

/** Pulsante "Avvisami quando tocca a me": notifica anche a sito chiuso. */
export function PushToggle({ className }: { className: string }) {
  const [status, setStatus] = useState<Status>('off');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!supported()) { setStatus('unsupported'); return; }
    if (Notification.permission === 'denied') { setStatus('denied'); return; }
    void currentSubscription().then(sub => setStatus(sub ? 'on' : 'off')).catch(() => {});
  }, []);
  if (status === 'unsupported') return <button className={className} onClick={() => setMessage('Su iPhone e iPad: Condividi → Aggiungi alla schermata Home, poi apri il sito dall’icona e attiva gli avvisi.')}
    title="Notifiche non disponibili in questo browser">🔕 Avvisi non disponibili{message && <span className="block text-[10px] font-normal">{message}</span>}</button>;
  const toggle = async () => {
    const was = status; setStatus('working'); setMessage('');
    try { if (was === 'on') { await disablePush(); setStatus('off'); } else { await enablePush(); setStatus('on'); setMessage('Avvisi attivi su questo dispositivo.'); } }
    catch (err) { setMessage((err as Error).message); setStatus(Notification.permission === 'denied' ? 'denied' : was); }
  };
  const test = async () => {
    setMessage('Invio della notifica di prova…');
    try { const r = await testPush(); setMessage(r.sent ? 'Notifica di prova inviata: dovrebbe comparire tra pochi secondi.' : 'Nessun dispositivo iscritto: riattiva gli avvisi.'); }
    catch (err) { setMessage((err as Error).message); }
  };
  return <span className="inline-flex flex-wrap items-center gap-2">
    <button className={className} aria-pressed={status === 'on'} disabled={status === 'working' || status === 'denied'} onClick={toggle}
      title={status === 'denied' ? 'Notifiche bloccate: riattivale nelle impostazioni del browser per questo sito' : 'Ricevi un avviso quando è il tuo turno, anche a sito chiuso'}>
      {status === 'on' ? '🔔 Avvisi attivi' : status === 'denied' ? '🔕 Avvisi bloccati' : status === 'working' ? 'Attivazione…' : '🔔 Avvisami quando tocca a me'}
    </button>
    {status === 'on' && <button className={className} onClick={test}>Prova</button>}
    {message && <span role="status" className="text-[11px] text-slate-300 max-w-[18rem]">{message}</span>}
  </span>;
}

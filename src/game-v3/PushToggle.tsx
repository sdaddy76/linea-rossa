import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Chiave pubblica VAPID: la privata sta solo nei segreti della funzione "tabletop". */
export const VAPID_PUBLIC_KEY = 'BL9Uz-tzsSkPZ1IHaFCTChrz1ZI8fr7x4q1ChrnlcaOt7uUy-wgLEECeCx2cWvIo9-Z1hDYlVbf8Z1Ma7YR_4Us';
export const PUSH_WORKER = '/push-sw.js';

type Status = 'unsupported' | 'denied' | 'off' | 'on' | 'working';
const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function keyBytes(base64url: string) {
  const raw = atob(base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - base64url.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

export async function currentSubscription() {
  if (!supported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(PUSH_WORKER);
  return reg ? reg.pushManager.getSubscription() : null;
}
export async function enablePush() {
  if (!supported()) throw new Error('Questo browser non supporta le notifiche. Su iPhone aggiungi prima il sito alla schermata Home.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifiche non autorizzate nel browser.');
  const reg = await navigator.serviceWorker.register(PUSH_WORKER);
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
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

/** Pulsante "Avvisami quando tocca a me": notifica anche a sito chiuso. */
export function PushToggle({ className }: { className: string }) {
  const [status, setStatus] = useState<Status>('off');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!supported()) { setStatus('unsupported'); return; }
    if (Notification.permission === 'denied') { setStatus('denied'); return; }
    void currentSubscription().then(sub => setStatus(sub ? 'on' : 'off')).catch(() => {});
  }, []);
  if (status === 'unsupported') return null;
  const toggle = async () => {
    const was = status; setStatus('working'); setMessage('');
    try { if (was === 'on') { await disablePush(); setStatus('off'); } else { await enablePush(); setStatus('on'); } }
    catch (err) { setMessage((err as Error).message); setStatus(Notification.permission === 'denied' ? 'denied' : was); }
  };
  return <button className={className} aria-pressed={status === 'on'} disabled={status === 'working' || status === 'denied'} onClick={toggle}
    title={message || (status === 'denied' ? 'Notifiche bloccate: riattivale nelle impostazioni del browser' : 'Ricevi un avviso quando è il tuo turno, anche a sito chiuso')}>
    {status === 'on' ? '🔔 Avvisi attivi' : status === 'denied' ? '🔕 Avvisi bloccati' : status === 'working' ? 'Attivazione…' : '🔔 Avvisami quando tocca a me'}
  </button>;
}

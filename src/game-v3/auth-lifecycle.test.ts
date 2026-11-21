import test from 'node:test';
import assert from 'node:assert/strict';
import type { Session } from '@supabase/supabase-js';
import { sessionListener } from '../integrations/supabase/session-listener';
import { databaseFetch } from '../integrations/supabase/request';
const session = (id: string) => ({ user: { id } }) as Session;

test('auth callback releases the session lock before any database token lookup', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let locked = true, loaded = false, profile = '';
  const listener = sessionListener(() => {}, async id => {
    assert.equal(locked, false, 'profile request must run outside auth callback');
    loaded = true; return id;
  }, value => { profile = value; });
  assert.equal(listener.callback('SIGNED_IN', session('host')), undefined);
  assert.equal(loaded, false);
  locked = false;
  t.mock.timers.tick(1); await Promise.resolve(); await Promise.resolve();
  assert.equal(profile, 'host'); listener.cancel();
});
test('signout/unsubscribe invalidate late profile results and recovery does not mutate session', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const profiles: string[] = [], sessions: (Session | null)[] = [];
  let resolve!: (value: string) => void;
  const listener = sessionListener(s => sessions.push(s), () => new Promise<string>(done => { resolve = done; }), p => profiles.push(p));
  listener.callback('SIGNED_IN', session('first'));
  t.mock.timers.tick(1);
  listener.callback('SIGNED_OUT', null);
  resolve('stale'); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(profiles, []);
  listener.callback('PASSWORD_RECOVERY', session('recovery'));
  assert.equal(sessions.length, 2);
  listener.callback('TOKEN_REFRESHED', session('second')); listener.cancel();
  t.mock.timers.tick(1); assert.deepEqual(profiles, []);
});
test('HTTP timeout aborts the actual pending request and never retries a mutation', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', (_input: unknown, init: RequestInit) => {
    calls++;
    return new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason)));
  });
  const request = databaseFetch('https://example.org', { method: 'POST' });
  t.mock.timers.tick(20001);
  await assert.rejects(request, /20 secondi/);
  assert.equal(calls, 1);
});
test('HTTP transport preserves caller cancellation and clears its timer', async t => {
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init: RequestInit) => {
    if (init.signal?.aborted) throw init.signal.reason;
    return new Response('ok');
  });
  assert.equal(await (await databaseFetch('https://example.org')).text(), 'ok');
  const controller = new AbortController(); controller.abort(new Error('cancelled'));
  await assert.rejects(databaseFetch('https://example.org', { signal: controller.signal }), /cancelled/);
});

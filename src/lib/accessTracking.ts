import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY_PREFIX = 'linea-rossa-access-session:';
const HEARTBEAT_INTERVAL_MS = 60_000;

function getSessionId(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  try {
    const current = window.sessionStorage.getItem(key);
    if (current) return current;
    const created = window.crypto?.randomUUID?.();
    if (!created) return null;
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return null;
  }
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

async function start(sessionId: string) {
  const { error } = await supabase.rpc('start_user_access_session', {
    p_session_id: sessionId,
    p_timezone: getTimezone(),
  });
  if (error) console.warn('[access tracking] avvio sessione non riuscito:', error.message);
  return !error;
}

async function heartbeat(sessionId: string) {
  const { error } = await supabase.rpc('heartbeat_user_access_session', {
    p_session_id: sessionId,
    p_timezone: getTimezone(),
  });
  if (error) console.warn('[access tracking] heartbeat non riuscito:', error.message);
}

export function beginAccessTracking(userId: string): () => void {
  const sessionId = getSessionId(userId);
  if (!sessionId) return () => {};

  let stopped = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  void start(sessionId).then(ok => {
    if (!ok || stopped) return;
    timer = setInterval(() => {
      void heartbeat(sessionId);
    }, HEARTBEAT_INTERVAL_MS);
  });

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

export async function endAccessTracking(userId: string | null | undefined) {
  if (!userId || typeof window === 'undefined') return;
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  let sessionId: string | null = null;
  try {
    sessionId = window.sessionStorage.getItem(key);
  } catch {
    return;
  }
  if (!sessionId) return;

  const { error } = await supabase.rpc('end_user_access_session', {
    p_session_id: sessionId,
  });
  if (error) console.warn('[access tracking] chiusura sessione non riuscita:', error.message);
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // La sessione è già terminata sul server; non bloccare il logout.
  }
}

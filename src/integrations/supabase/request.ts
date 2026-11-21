/** Bound the HTTP request itself, not just a UI timer. No automatic retry of
 * mutations: a lost response can mean the write already reached the server. */
export async function databaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('Il server non ha risposto entro 20 secondi. Controlla le partite recenti prima di riprovare.')), 20000);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

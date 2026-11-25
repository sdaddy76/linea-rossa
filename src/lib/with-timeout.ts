/** Supabase queries are thenables, not necessarily native Promises. */
export async function withTimeout<T>(
  operation: PromiseLike<T>, ms = 8000, label = '',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout ${label} dopo ${ms}ms`)), ms);
  });
  try {
    // Assimilation also turns query rejection into a normal Promise rejection.
    // A timed-out mutation is never retried here.
    return await Promise.race([Promise.resolve(operation), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

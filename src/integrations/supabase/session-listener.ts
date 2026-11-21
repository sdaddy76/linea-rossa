import type { Session } from '@supabase/supabase-js';

/** Auth callbacks run inside GoTrue's session lock. Never await another Supabase
 * request there: its token lookup would wait for the very same lock. */
export function sessionListener<T>(
  onSession: (session: Session | null) => void,
  loadProfile: (id: string) => PromiseLike<T | null>,
  onProfile: (profile: T) => void,
) {
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { generation++; clearTimeout(timer); };
  return {
    cancel,
    callback(event: string, session: Session | null): void {
      if (event === 'PASSWORD_RECOVERY') return;
      cancel();
      onSession(session);
      if (!session?.user) return;
      const current = generation;
      timer = setTimeout(() => {
        void Promise.resolve(loadProfile(session.user.id)).then(profile => {
          if (current === generation && profile) onProfile(profile);
        }).catch(() => { /* A transient profile read must not lock authentication. */ });
      }, 0);
    },
  };
}

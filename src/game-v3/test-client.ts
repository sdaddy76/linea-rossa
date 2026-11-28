/** Test-only in-memory PostgREST fixture. Never imported by the application. */
export const database = {
  game: { created_by: 'host', status: 'lobby' } as { created_by: string; status: string; game_length?: string; track_limit?: number; max_turns?: number },
  members: [{ faction: 'Iran', player_id: 'host', is_bot: false }],
  state: null as Record<string, unknown> | null,
  calls: [] as { table: string; operation: string; values: unknown; filters: [string, unknown][] }[],
  failState: false,
};
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
class Query implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  operation = 'select';
  values: Record<string, unknown> = {};
  filters: [string, unknown][] = [];
  constructor(private table: string) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  single() { return this; }
  maybeSingle() { return this; }
  update(value: Record<string, unknown>) { this.operation = 'update'; this.values = value; return this; }
  insert(value: Record<string, unknown>) { this.operation = 'insert'; this.values = value; return this; }
  upsert(value: Record<string, unknown>) { this.operation = 'upsert'; this.values = value; return this; }
  async execute(): Promise<{ data: unknown; error: { message: string } | null }> {
    database.calls.push({ table: this.table, operation: this.operation, values: clone(this.values), filters: this.filters });
    if (this.operation === 'select') return {
      data: clone(this.table === 'games' ? database.game : this.table === 'game_players' ? database.members : database.state),
      error: null,
    };
    if (this.table === 'game_state') {
      if (database.failState) return { data: null, error: { message: 'Salvataggio negato' } };
      const revisionFilter = this.filters.find(([key]) => key === 'special_uses->tabletop_v3->>revision');
      const revision = (database.state?.special_uses as { tabletop_v3?: { revision: number } })?.tabletop_v3?.revision;
      if (revisionFilter && String(revision) !== revisionFilter[1]) return { data: [], error: null };
      database.state = { ...database.state, ...clone(this.values) };
      return { data: [{ game_id: 'game' }], error: null };
    }
    if (this.table === 'games') database.game = { ...database.game, ...this.values };
    return { data: [], error: null };
  }
  then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    resolve?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(resolve, reject); }
}
/** Server di gioco finto: stesse regole e permessi della funzione "tabletop", in memoria. */
export const server = {
  row: null as null | { revision: number; state: import('./engine').EngineState; turnStartedAt: string },
  user: 'host', faction: 'Iran' as import('./catalog-types').Faction | null,
  calls: [] as Record<string, unknown>[], fail: '' as string,
};
async function invoke(name: string, { body }: { body: Record<string, unknown> }) {
  const core = await import('./server-core'); const engine = await import('./engine');
  server.calls.push({ name, ...body });
  const fail = (message: string) => ({ data: null, error: { message: 'Edge Function returned a non-2xx status code', context: { json: async () => ({ error: message }) } } });
  if (server.fail) return fail(server.fail);
  const caller = { userId: server.user, faction: server.faction, member: true, host: server.user === database.game.created_by, admin: false };
  const view = () => ({ data: { revision: server.row!.revision, state: core.redact(server.row!.state), turnStartedAt: server.row!.turnStartedAt,
    mine: caller.faction ? core.privateView(server.row!.state, caller.faction) : null }, error: null });
  try {
    if (body.action === 'start') {
      if (!caller.host) return fail('Solo il creatore può avviare la partita.');
      if (server.row) return view();
      const plan = core.planStart(database.members, (body.neutrals as never) ?? [], body.mode as never, database.game.game_length);
      server.row = { revision: 1, state: core.runBots(engine.createGame({ bots: plan.bots, neutrals: plan.neutrals, mode: plan.mode, rulesRevision: '2026-11-21', botInfluenceEdition: '2026-11-22' })), turnStartedAt: new Date(0).toISOString() };
      database.game = { ...database.game, status: 'active', game_length: plan.mode, track_limit: plan.limit, max_turns: plan.limit };
      return view();
    }
    if (!server.row) return fail('Stato della partita non disponibile.');
    if (body.action === 'command') {
      if (body.revision !== server.row.revision) return fail('Un altro giocatore ha aggiornato la partita. Stato ricaricato: ripeti la scelta.');
      server.row = { ...server.row, revision: server.row.revision + 1, state: core.applyCommand(server.row.state, caller, body.actor as never, body.command as never) };
      return view();
    }
    if (body.action === 'sync') return view();
    return fail('Azione sconosciuta.');
  } catch (e) { return fail((e as Error).message); }
}
export const supabase = { from: (table: string) => new Query(table), functions: { invoke } };

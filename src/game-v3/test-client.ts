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
export const supabase = { from: (table: string) => new Query(table) };

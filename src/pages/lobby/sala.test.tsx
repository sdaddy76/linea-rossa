import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import SalaPartite from './SalaPartite';
import { loadRoom, openedAt, tableSeats, type RoomGame } from './sala';

const game = (id: string, extra: Partial<RoomGame> = {}): RoomGame => ({
  id, code: `TABLE-${id}`, name: `Tavolo ${id}`, status: 'lobby', is_public: true,
  current_turn: 1, max_turns: 60, created_by: 'host', created_at: '2026-11-25T12:00:00Z',
  _players: [{ faction: 'Iran', player_id: 'host', is_bot: false, profile: { username: 'Stefano' } }],
  ...extra,
});
test('room exposes names, five seats, creation time and registration without private data', () => {
  const html = renderToStaticMarkup(<SalaPartite games={[game('one')]} userId="guest" loading={false}
    error="" updatedAt={null} onRefresh={() => {}} onEnter={() => {}} onCreate={() => {}} onCode={() => {}}/>);
  for (const label of ['Sala partite', 'Stefano', 'host', '1/5', '4 posti liberi', 'Iscriviti al tavolo', '2026-11-25T12:00:00Z']) assert.ok(html.includes(label), label);
  assert.ok(!html.includes('email'));
});
test('active tables cannot gain new players; members re-enter and others observe', () => {
  const active = game('one', { status: 'active' });
  assert.equal(tableSeats(active, 'guest').canJoin, false);
  const render = (userId: string) => renderToStaticMarkup(<SalaPartite games={[active]} userId={userId} loading={false}
    error="" updatedAt={null} onRefresh={() => {}} onEnter={() => {}} onCreate={() => {}} onCode={() => {}}/>);
  assert.ok(render('guest').includes('Guarda partita'));
  assert.ok(render('host').includes('Rientra in partita'));
});
test('full, closed and BOT-occupied tables do not offer registration', () => {
  const full = game('full', { _players: ['Iran', 'Coalizione', 'Russia', 'Cina', 'Europa'].map((f, i) =>
    ({ faction: f as 'Iran', player_id: `p${i}`, is_bot: false })) });
  assert.equal(tableSeats(full, 'guest').free.length, 0);
  assert.equal(tableSeats(full, 'guest').canJoin, false);
  assert.equal(tableSeats(game('closed', { allow_join: false }), 'guest').canJoin, false);
  const bot = game('bot', { _players: [{ faction: 'Iran', is_bot: true, player_id: null }] });
  assert.equal(tableSeats(bot, 'guest').humans.length, 0);
  assert.equal(tableSeats(bot, 'guest').bots, 1);
  assert.ok(!tableSeats(bot, 'guest').free.includes('Iran'));
});
test('empty and failed loads are explicit rather than silently looking like no games', () => {
  const render = (error: string) => renderToStaticMarkup(<SalaPartite games={[]} userId="guest" loading={false}
    error={error} updatedAt={null} onRefresh={() => {}} onEnter={() => {}} onCreate={() => {}} onCode={() => {}}/>);
  assert.ok(render('').includes('Nessun tavolo pubblico aperto'));
  assert.ok(render('Connessione persa').includes('role="alert"'));
  assert.ok(!render('Connessione persa').includes('Nessun tavolo pubblico aperto'));
  assert.equal(openedAt('invalid'), 'Data non disponibile');
});
test('waiting room preserves enrollment on return, confirms withdrawal and reports unique-seat collisions', () => {
  const source = readFileSync('src/components/WaitingRoom.tsx', 'utf8');
  assert.match(source, /onClick=\{onLeave\}[^>]*>Torna alla sala/);
  assert.ok(source.includes('Annulla iscrizione'));
  assert.ok(source.includes("result.error.code === '23505'"));
  assert.ok(source.includes("if (!result.data?.length)"));
  assert.ok(source.includes("setInterval("));
});

/** Bounded PostgREST fixture that checks filtering, pagination and join projection. */
function fakeClient(fail = false) {
  const calls: { table: string; selected: string; filters: [string, unknown][]; range?: [number, number] }[] = [];
  const publicGames = Array.from({ length: 103 }, (_, i) => game(String(i)));
  const privateGame = game('private', { is_public: false, created_by: 'guest' });
  const client = {
    from(table: string) {
      const call = { table, selected: '', filters: [] as [string, unknown][], range: undefined as [number, number] | undefined };
      calls.push(call);
      let cap = Infinity;
      const q = {
        select(columns: string) { call.selected = columns; return q; },
        eq(key: string, value: unknown) { call.filters.push([key, value]); return q; },
        in(key: string, value: unknown) { call.filters.push([key, value]); return q; },
        order() { return q; }, range(a: number, b: number) { call.range = [a, b]; return q; },
        limit(n: number) { cap = n; return q; },
        then(resolve: (value: unknown) => unknown) {
          if (fail) return Promise.resolve(resolve({ data: null, error: { message: 'Network failed' } }));
          let rows: Record<string, unknown>[] = table === 'games'
            ? [...publicGames, privateGame] as unknown as Record<string, unknown>[]
            : call.selected === 'game_id' ? [{ game_id: '3', player_id: 'guest' }]
              : publicGames.map(g => ({ ...g._players[0], game_id: g.id }));
          for (const [key, value] of call.filters) rows = rows.filter(row => Array.isArray(value) ? value.includes(row[key]) : row[key] === value);
          if (call.range) rows = rows.slice(call.range[0], call.range[1] + 1);
          return Promise.resolve(resolve({ data: rows.slice(0, cap), error: null }));
        },
      };
      return q;
    },
  };
  return { client: client as unknown as Parameters<typeof loadRoom>[0], calls };
}
test('loader pages all public tables, loads names for every batch, and keeps personal history personal', async () => {
  const { client, calls } = fakeClient();
  const result = await loadRoom(client, 'guest');
  assert.equal(result.open.length, 103);
  assert.ok(result.open.every(g => g._players[0]?.profile?.username === 'Stefano'));
  assert.deepEqual(result.recent.map(g => g.id).sort(), ['3', 'private']);
  assert.ok(!result.open.some(g => g.id === 'private'));
  assert.equal(calls.filter(c => c.range).length, 2);
  assert.ok(calls.filter(c => c.selected.includes('profile:')).every(c => !c.selected.includes('*')));
  assert.ok(calls.filter(c => c.table === 'game_players' && c.selected.includes('profile:'))
    .every(c => (c.filters.find(([key]) => key === 'game_id')?.[1] as string[]).length <= 10));
});
test('loader surfaces database errors; it never falls back to displaying private games', async () => {
  const { client, calls } = fakeClient(true);
  await assert.rejects(loadRoom(client, 'guest'), { message: 'Network failed' });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].filters.some(([key, value]) => key === 'is_public' && value === true));
});

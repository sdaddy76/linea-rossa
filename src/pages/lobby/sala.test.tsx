import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import SalaPartite from './SalaPartite';
import { loadRoom, openedAt, tableSeats, type RoomGame } from './sala';
import { ReadabilityFrame, READABLE_PALETTE, READABILITY_KEY, readPreference, savePreference } from './Readability';
import ReadabilityPreview from './ReadabilityPreview';

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
  const archivedGame = game('archived', { created_by: 'guest', archived_at: '2026-11-20T10:00:00Z' });
  const client = {
    from(table: string) {
      const call = { table, selected: '', filters: [] as [string, unknown][], range: undefined as [number, number] | undefined };
      calls.push(call);
      let cap = Infinity;
      const q = {
        select(columns: string) { call.selected = columns; return q; },
        eq(key: string, value: unknown) { call.filters.push([key, value]); return q; },
        in(key: string, value: unknown) { call.filters.push([key, value]); return q; },
        is(key: string, value: unknown) { call.filters.push([`is:${key}`, value]); return q; },
        order() { return q; }, range(a: number, b: number) { call.range = [a, b]; return q; },
        limit(n: number) { cap = n; return q; },
        then(resolve: (value: unknown) => unknown) {
          if (fail) return Promise.resolve(resolve({ data: null, error: { message: 'Network failed' } }));
          let rows: Record<string, unknown>[] = table === 'games'
            ? [...publicGames, privateGame, archivedGame] as unknown as Record<string, unknown>[]
            : call.selected === 'game_id' ? [{ game_id: '3', player_id: 'guest' }]
              : publicGames.map(g => ({ ...g._players[0], game_id: g.id }));
          for (const [key, value] of call.filters) rows = rows.filter(row => key.startsWith('is:') ? (row[key.slice(3)] ?? null) === value
            : Array.isArray(value) ? value.includes(row[key]) : row[key] === value);
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
  assert.ok(![...result.open, ...result.recent].some(g => g.id === 'archived'), 'archived tables are hidden from players');
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

test('readability control has an accessible pressed state and preserves both appearances', () => {
  const render = (high: boolean) => renderToStaticMarkup(<ReadabilityFrame high={high} onToggle={() => {}}>
    <SalaPartite games={[game('one')]} userId="guest" loading={false} error="" updatedAt={null}
      onRefresh={() => {}} onEnter={() => {}} onCreate={() => {}} onCode={() => {}}/>
  </ReadabilityFrame>);
  assert.ok(render(true).includes('data-readability="high"'));
  assert.ok(render(true).includes('aria-pressed="true"'));
  assert.ok(render(true).includes('Tema chiaro'));
  assert.ok(render(false).includes('data-readability="standard"'));
  assert.ok(render(false).includes('Alta leggibilità'));
  for (const high of [true, false]) {
    assert.ok(render(high).includes('Iscriviti al tavolo'));
    assert.ok(render(high).includes('Stefano'));
  }
});
test('reading preference persists, rejects unexpected values and survives unavailable storage', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } };
  assert.equal(readPreference(storage), false);
  savePreference(true, storage);
  assert.equal(values.get(READABILITY_KEY), 'high');
  assert.equal(readPreference(storage), true);
  savePreference(false, storage);
  assert.equal(readPreference(storage), false);
  values.set(READABILITY_KEY, 'unexpected');
  assert.equal(readPreference(storage), false);
  const blocked = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceeded'); } };
  assert.equal(readPreference(blocked), false);
  assert.doesNotThrow(() => savePreference(true, blocked));
});
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
test('light reading palette meets WCAG AA for normal text and primary actions', () => {
  const p = READABLE_PALETTE;
  for (const surface of [p.background, p.surface, p.inset]) {
    for (const text of [p.text, p.muted, p.cyan, p.purple, p.danger, p.warning]) {
      assert.ok(contrast(text, surface) >= 4.5, `${text} on ${surface}`);
    }
  }
  assert.ok(contrast(p.primary, p.onPrimary) >= 4.5);
  const css = readFileSync('src/pages/lobby/readability.css', 'utf8');
  for (const color of Object.values(p)) assert.ok(css.includes(color), color);
  assert.ok(css.includes('font-size: 16px'));
  assert.ok(css.includes('font-size: 18px'));
  assert.ok(css.includes('min-height: 48px'));
  assert.ok(css.includes('grid-template-columns: 1fr'));
  assert.ok(!css.includes('!important'));
});
test('public example renders the same room, marks fixture data and never queries Supabase', () => {
  const html = renderToStaticMarkup(<ReadabilityPreview onBack={() => {}}/>);
  assert.ok(html.includes('data-readability="high"'));
  assert.ok(html.includes('dati dimostrativi'));
  assert.ok(html.includes('Iscriviti al tavolo'));
  assert.ok(html.includes('3 posti liberi'));
  assert.ok(html.includes('Guarda partita'));
  const source = readFileSync('src/pages/lobby/ReadabilityPreview.tsx', 'utf8');
  assert.ok(!source.includes('supabase'));
  assert.ok(source.includes('<SalaPartite'));
});
test('archive controls appear only for tables the user may archive; only the admin sees and restores archived tables', () => {
  const mine = game('mine', { created_by: 'host' }), other = game('other', { created_by: 'someone' });
  const props = { loading: false, error: '', updatedAt: null, onRefresh: () => {}, onEnter: () => {}, onCreate: () => {}, onCode: () => {}, onArchive: async () => true };
  const host = renderToStaticMarkup(<SalaPartite {...props} games={[mine, other]} userId="host" canArchive={g => g.created_by === 'host'} />);
  assert.equal((host.match(/> Archivia<\/button>/g) ?? []).length, 1);
  assert.ok(host.includes('Seleziona tutte (1)') && host.includes('Archivia selezionate (0)'));
  assert.ok(!host.includes('Archiviate (') && !host.includes('Elimina'));
  const admin = renderToStaticMarkup(<SalaPartite {...props} games={[mine, other]} userId="admin" canArchive={() => true}
    archived={[game('old', { archived_at: '2026-11-20T10:00:00Z' })]} onRestore={async () => true} />);
  assert.equal((admin.match(/> Archivia<\/button>/g) ?? []).length, 2);
  assert.ok(admin.includes('Archiviate (1)'));
  const guest = renderToStaticMarkup(<SalaPartite {...props} games={[mine, other]} userId="guest" canArchive={() => false} />);
  assert.ok(!guest.includes('Archivia') && !guest.includes('Seleziona tutte'));
  const sql = readFileSync('supabase/migrations/20261126_archive_games.sql', 'utf8');
  assert.match(sql, /created_by = auth\.uid\(\) OR public\.is_linea_rossa_admin\(\)/);
  assert.match(sql, /IF NOT public\.is_linea_rossa_admin\(\) THEN RAISE EXCEPTION/);
  assert.ok(!/DELETE FROM/i.test(sql), 'games are never deleted');
});

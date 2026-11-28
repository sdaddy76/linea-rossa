// Funzione "tabletop": motore di gioco sul server.
// Sorgente: questo file + src/game-v3. `node scripts/build-edge.mjs` genera public/edge/tabletop-core.js,
// che la funzione (index.ts) importa all'avvio; le librerie npm le passa index.ts.
import { FACTIONS, type Faction } from '../../../src/game-v3/catalog-types';
import { createGame, currentActor, type Command, type EngineState, type GameMode } from '../../../src/game-v3/engine';
import { applyCommand, applyTimeout, isRedacted, planStart, privateView, redact, resume, runBots, substitute, turnKey, type Caller, type Seat } from '../../../src/game-v3/server-core';

// deno-lint-ignore no-explicit-any
type Deps = { createClient: (url: string, key: string, options: unknown) => any; webpush: any; env: (name: string) => string | undefined };
// deno-lint-ignore no-explicit-any
let db: any, webpush: any, env: Deps['env'];
const ADMIN_EMAIL = 'sdaddino@yahoo.it';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
class HttpError extends Error { constructor(message: string, public status = 400, public extra?: unknown) { super(message); } }

const must = <T>(r: { data: T; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.data; };

interface Row { game_id: string; revision: number; state: EngineState; turn_key: string; turn_started_at: string }

async function callerFor(gameId: string, userId: string, email: string): Promise<Caller & { game: Record<string, unknown> }> {
  const game = must(await db.from('games').select('*').eq('id', gameId).maybeSingle()) as Record<string, unknown> | null;
  if (!game) throw new HttpError('Partita non trovata.', 404);
  const seats = must(await db.from('game_players').select('faction, player_id, is_bot').eq('game_id', gameId)) as { faction: string; player_id: string | null; is_bot: boolean }[];
  const seat = seats.find(p => p.player_id === userId && !p.is_bot);
  const admin = email.toLowerCase() === ADMIN_EMAIL;
  const host = game.created_by === userId;
  return { userId, faction: (seat?.faction as Faction) ?? null, member: !!seat || host || admin, host, admin, game };
}

/** Partite avviate prima del motore sul server: lo stato completo stava nella copia pubblica. */
async function load(gameId: string): Promise<Row | null> {
  const row = must(await db.from('tabletop_games').select('*').eq('game_id', gameId).maybeSingle()) as Row | null;
  if (row) return row;
  const pub = must(await db.from('game_state').select('special_uses, updated_at').eq('game_id', gameId).maybeSingle()) as { special_uses?: { tabletop_v3?: { revision: number; state: EngineState } }; updated_at?: string } | null;
  const legacy = pub?.special_uses?.tabletop_v3;
  if (!legacy?.state || legacy.state.version !== 3 || isRedacted(legacy.state)) return null;
  const imported: Row = { game_id: gameId, revision: legacy.revision, state: legacy.state, turn_key: turnKey(legacy.state), turn_started_at: pub?.updated_at ?? new Date().toISOString() };
  must(await db.from('tabletop_games').upsert(imported, { onConflict: 'game_id', ignoreDuplicates: true }));
  await publish(imported, null);
  return must(await db.from('tabletop_games').select('*').eq('game_id', gameId).single()) as Row;
}

/** Scrive stato completo, copia pubblica e mani private; avvisa chi deve muovere. */
async function save(prev: Row | null, gameId: string, state: EngineState) {
  const key = turnKey(state);
  const row: Row = { game_id: gameId, revision: (prev?.revision ?? 0) + 1, state, turn_key: key,
    turn_started_at: prev && prev.turn_key === key ? prev.turn_started_at : new Date().toISOString() };
  if (prev) {
    const updated = must(await db.from('tabletop_games').update({ ...row, updated_at: new Date().toISOString() }).eq('game_id', gameId).eq('revision', prev.revision).select('game_id')) as unknown[];
    if (!updated.length) throw new HttpError('Un altro giocatore ha aggiornato la partita. Stato ricaricato: ripeti la scelta.', 409);
  } else must(await db.from('tabletop_games').insert(row));
  await publish(row, prev);
  return row;
}

async function publish(row: Row, prev: Row | null) {
  const s = row.state;
  const existing = must(await db.from('game_state').select('special_uses').eq('game_id', row.game_id).maybeSingle()) as { special_uses?: Record<string, unknown> } | null;
  const values = { game_id: row.game_id, nucleare: s.globals.Nucleare, sanzioni: s.globals.Sanzioni, active_faction: currentActor(s),
    special_uses: { ...(existing?.special_uses ?? {}), tabletop_v3: { revision: row.revision, state: redact(s), redacted: true, turnStartedAt: row.turn_started_at } } };
  must(existing ? await db.from('game_state').update(values).eq('game_id', row.game_id) : await db.from('game_state').insert(values));
  const seats = must(await db.from('game_players').select('faction, player_id, is_bot').eq('game_id', row.game_id)) as { faction: Faction; player_id: string | null; is_bot: boolean }[];
  const humans = seats.filter(p => p.player_id && !p.is_bot && FACTIONS.includes(p.faction));
  if (humans.length) must(await db.from('tabletop_private').upsert(humans.map(p => ({ game_id: row.game_id, faction: p.faction, player_id: p.player_id,
    revision: row.revision, ...privateView(s, p.faction), updated_at: new Date().toISOString() })), { onConflict: 'game_id,faction' }));
  if (s.phase === 'ended') {
    await db.from('games').update({ status: 'finished', finished_at: new Date().toISOString(), winner_faction: s.result?.winners.join(',') ?? null }).eq('id', row.game_id).neq('status', 'finished');
  }
  const actor = currentActor(s);
  if (actor && !s.players[actor].bot && !s.players[actor].neutral && (!prev || prev.turn_key !== row.turn_key)) {
    const seat = humans.find(p => p.faction === actor);
    if (seat) await notify(seat.player_id!, row.game_id, actor).catch(e => console.warn('push', e));
  }
}

/** Chiavi VAPID: generate dal server al primo uso e conservate in una tabella leggibile solo dal server. */
let vapid: { publicKey: string; privateKey: string } | null = null;
async function vapidKeys() {
  if (vapid) return vapid;
  const read = async () => must(await db.from('push_config').select('public_key, private_key').eq('id', 1).maybeSingle()) as { public_key: string; private_key: string } | null;
  let row = await read();
  if (!row) {
    const k = webpush.generateVAPIDKeys();
    await db.from('push_config').upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey }, { onConflict: 'id', ignoreDuplicates: true });
    row = await read();   // in caso di due avvii contemporanei vale la prima chiave salvata
  }
  if (!row) throw new Error('Chiavi delle notifiche non disponibili.');
  vapid = { publicKey: row.public_key, privateKey: row.private_key };
  webpush.setVapidDetails('mailto:' + ADMIN_EMAIL, vapid.publicKey, vapid.privateKey);
  return vapid;
}

async function push(userId: string, message: { title: string; body: string; url: string; gameId?: string }) {
  await vapidKeys();
  const subs = must(await db.from('push_subscriptions').select('*').eq('user_id', userId)) as { id: string; subscription: unknown }[];
  let sent = 0;
  for (const sub of subs) {
    try { await webpush.sendNotification(sub.subscription as never, JSON.stringify(message), { TTL: 86400 }); sent++; }
    catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      // Iscrizione scaduta o creata con una chiave diversa: si rimuove, il browser si iscriverà di nuovo.
      if (code === 403 || code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', sub.id);
      else console.warn('push', code, (e as Error).message);
    }
  }
  return { devices: subs.length, sent };
}

async function notify(userId: string, gameId: string, faction: Faction) {
  const game = must(await db.from('games').select('name, code').eq('id', gameId).maybeSingle()) as { name?: string; code?: string } | null;
  await push(userId, { title: 'Linea Rossa · tocca a te', body: `${game?.name || 'Partita ' + (game?.code ?? '')}: tocca a ${faction}.`, url: '/', gameId });
}

function view(row: Row, caller: Caller) {
  return { revision: row.revision, state: redact(row.state), turnStartedAt: row.turn_started_at,
    mine: caller.faction && row.state.phase !== 'ended' ? privateView(row.state, caller.faction) : null };
}

async function start(gameId: string, caller: Caller & { game: Record<string, unknown> }, mode?: GameMode, neutrals: Faction[] = []) {
  const game = caller.game;
  if (!caller.host && !caller.admin) throw new HttpError('Solo il creatore può avviare la partita.', 403);
  const existing = await load(gameId);
  if (existing) return existing;   // avvio interrotto: niente seconda distribuzione
  if (game.status !== 'lobby') throw new HttpError('La partita è già stata avviata.');
  const members = must(await db.from('game_players').select('*').eq('game_id', gameId)) as Seat[];
  const first = planStart(members, neutrals, mode, game.game_length);
  if (first.empty.length) must(await db.from('game_players').upsert(first.empty.map(f => ({ game_id: gameId, faction: f, player_id: null, is_bot: true,
    bot_difficulty: 'normal', is_ready: true, turn_order: FACTIONS.indexOf(f) + 1 })), { onConflict: 'game_id,faction', ignoreDuplicates: true }));
  // Chi si è seduto mentre l'organizzatore avviava conserva il posto.
  const plan = planStart(must(await db.from('game_players').select('*').eq('game_id', gameId)) as Seat[], neutrals, mode, game.game_length);
  const state = runBots(createGame({ bots: plan.bots, neutrals: plan.neutrals, mode: plan.mode, rulesRevision: '2026-11-21', botInfluenceEdition: '2026-11-22' }));
  const row = await save(null, gameId, state);
  must(await db.from('games').update({ status: state.phase === 'ended' ? 'finished' : 'active', started_at: new Date().toISOString(), max_turns: plan.limit, game_length: plan.mode, track_limit: plan.limit, allow_join: false }).eq('id', gameId).eq('status', 'lobby'));
  return row;
}

export function createHandler(deps: Deps) {
  db = deps.createClient(deps.env('SUPABASE_URL')!, deps.env('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  webpush = deps.webpush; env = deps.env;
  return handle;
}
async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const auth = await db.auth.getUser(token);
    if (auth.error || !auth.data.user) throw new HttpError('Accesso richiesto.', 401);
    const body = await req.json() as { action: string; gameId: string; actor?: Faction; command?: Command; revision?: number; faction?: Faction; mode?: GameMode; neutrals?: Faction[] };
    if (body.action === 'vapid') return json({ publicKey: (await vapidKeys()).publicKey });
    if (body.action === 'test-push') return json(await push(auth.data.user.id, { title: 'Linea Rossa · prova', body: 'Le notifiche funzionano: ti avviseremo quando tocca a te.', url: '/' }));
    if (!body.gameId) throw new HttpError('Partita mancante.');
    const caller = await callerFor(body.gameId, auth.data.user.id, auth.data.user.email ?? '');
    if (!caller.member) throw new HttpError('Non partecipi a questa partita.', 403);
    if (body.action === 'start') return json(view(await start(body.gameId, caller, body.mode, body.neutrals ?? []), caller));
    let row = await load(body.gameId);
    if (!row) throw new HttpError('Stato della partita non disponibile.', 404);
    if (body.action === 'sync') {
      // Ogni apertura della partita controlla il tempo limite e fa avanzare i BOT rimasti indietro.
      const timedOut = applyTimeout(row.state, Date.parse(row.turn_started_at), Date.now());
      const next = timedOut ?? runBots(row.state);
      if (next !== row.state) { try { row = await save(row, body.gameId, next); } catch (e) { if (!(e instanceof HttpError && e.status === 409)) throw e; row = (await load(body.gameId))!; } }
      return json(view(row, caller));
    }
    if (body.action === 'command') {
      if (body.revision !== row.revision) throw new HttpError('Un altro giocatore ha aggiornato la partita. Stato ricaricato: ripeti la scelta.', 409, view(row, caller));
      return json(view(await save(row, body.gameId, applyCommand(row.state, caller, body.actor!, body.command!)), caller));
    }
    if (body.action === 'substitute') return json(view(await save(row, body.gameId, substitute(row.state, caller, body.faction!)), caller));
    if (body.action === 'resume') return json(view(await save(row, body.gameId, resume(row.state, caller)), caller));
    throw new HttpError('Azione sconosciuta.');
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError((e as Error).message ?? 'Errore', 400);
    return json({ error: err.message, view: err.extra ?? null }, err.status);
  }
}

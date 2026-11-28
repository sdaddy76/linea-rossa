-- Motore sul server, carte nascoste, tempo limite, avvisi push e chat di partita.

-- 1. Stato completo: lo legge e lo scrive solo la funzione "tabletop" (service role).
create table if not exists public.tabletop_games (
  game_id uuid primary key references public.games(id) on delete cascade,
  revision integer not null,
  state jsonb not null,
  turn_key text not null default '',
  turn_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tabletop_games enable row level security;

-- 2. Dati privati di ogni giocatore: mano, obiettivi segreti, Rete informativa.
create table if not exists public.tabletop_private (
  game_id uuid not null references public.games(id) on delete cascade,
  faction text not null,
  player_id uuid not null,
  revision integer not null,
  hand jsonb not null default '[]',
  objectives jsonb not null default '[]',
  intel jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  primary key (game_id, faction)
);
create index if not exists tabletop_private_player_idx on public.tabletop_private (player_id);
alter table public.tabletop_private enable row level security;
drop policy if exists tabletop_private_select on public.tabletop_private;
create policy tabletop_private_select on public.tabletop_private for select to authenticated
  using (player_id = (select auth.uid()));

-- 3. Copia pubblica senza informazioni nascoste.
create or replace function public.tabletop_mask(a jsonb) returns jsonb
language sql immutable set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg('"?"'::jsonb), '[]'::jsonb) from jsonb_array_elements(coalesce(a, '[]'::jsonb))
$$;
create or replace function public.tabletop_redact(st jsonb) returns jsonb
language plpgsql immutable set search_path = public, pg_temp as $$
declare s jsonb := st; f text; t text;
begin
  if s->>'phase' = 'ended' then return s; end if;
  foreach f in array array['Iran','Coalizione','Russia','Cina','Europa'] loop
    s := jsonb_set(s, array['players', f, 'hand'], public.tabletop_mask(s #> array['players', f, 'hand']));
    s := jsonb_set(s, array['players', f, 'objectives'], public.tabletop_mask(s #> array['players', f, 'objectives']));
    s := jsonb_set(s, array['intel', f], '[]'::jsonb);
    for t in select jsonb_object_keys(coalesce(s #> array['botDecks', f], '{}'::jsonb)) loop
      s := jsonb_set(s, array['botDecks', f, t], public.tabletop_mask(s #> array['botDecks', f, t]));
    end loop;
  end loop;
  s := jsonb_set(s, '{deck}', public.tabletop_mask(s->'deck'));
  s := jsonb_set(s, '{specialReserve}', public.tabletop_mask(s->'specialReserve'));
  s := jsonb_set(s, '{eventDeck}', public.tabletop_mask(s->'eventDeck'));
  return s;
end $$;

-- 4. Le partite in corso passano al server: stato completo nella tabella privata, copia pubblica oscurata.
insert into public.tabletop_games (game_id, revision, state, turn_key, turn_started_at)
select gs.game_id, (gs.special_uses->'tabletop_v3'->>'revision')::int, gs.special_uses->'tabletop_v3'->'state', '', now()
from public.game_state gs join public.games g on g.id = gs.game_id
where gs.special_uses ? 'tabletop_v3' and g.status = 'active'
  and (gs.special_uses->'tabletop_v3'->'state'->>'version') = '3'
  and coalesce(gs.special_uses->'tabletop_v3'->>'redacted', 'false') <> 'true'
on conflict (game_id) do nothing;

insert into public.tabletop_private (game_id, faction, player_id, revision, hand, objectives, intel)
select tg.game_id, gp.faction, gp.player_id, tg.revision,
  coalesce(tg.state #> array['players', gp.faction, 'hand'], '[]'),
  coalesce(tg.state #> array['players', gp.faction, 'objectives'], '[]'),
  coalesce(tg.state #> array['intel', gp.faction], '[]')
from public.tabletop_games tg join public.game_players gp on gp.game_id = tg.game_id
where gp.player_id is not null and not gp.is_bot
on conflict (game_id, faction) do nothing;

update public.game_state gs
set special_uses = jsonb_set(gs.special_uses, '{tabletop_v3}', jsonb_build_object(
  'revision', tg.revision, 'state', public.tabletop_redact(tg.state), 'redacted', true, 'turnStartedAt', tg.turn_started_at))
from public.tabletop_games tg where tg.game_id = gs.game_id;

-- 5. Da ora la copia pubblica la scrive solo il server.
create or replace function public.guard_tabletop_state() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'supabase_admin')
     and (new.special_uses->'tabletop_v3') is distinct from (case when tg_op = 'UPDATE' then old.special_uses->'tabletop_v3' else null end) then
    raise exception 'Lo stato della partita si modifica solo tramite il server di gioco.';
  end if;
  return new;
end $$;
drop trigger if exists guard_tabletop_state on public.game_state;
create trigger guard_tabletop_state before insert or update on public.game_state
  for each row execute function public.guard_tabletop_state();

-- 6. Avvisi "tocca a te" (notifiche push del browser).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_own on public.push_subscriptions;
create policy push_subscriptions_own on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 7. Chat di partita: messaggi pubblici al tavolo o privati tra due potenze.
create table if not exists public.game_messages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  sender_id uuid not null default auth.uid(),
  sender_faction text not null,
  recipient_faction text,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists game_messages_game_idx on public.game_messages (game_id, created_at);
alter table public.game_messages enable row level security;
drop policy if exists game_messages_select on public.game_messages;
create policy game_messages_select on public.game_messages for select to authenticated using (
  public.is_game_member(game_id) and (
    recipient_faction is null or sender_id = (select auth.uid())
    or exists (select 1 from public.game_players gp where gp.game_id = game_messages.game_id
               and gp.player_id = (select auth.uid()) and gp.faction = game_messages.recipient_faction)));
drop policy if exists game_messages_insert on public.game_messages;
create policy game_messages_insert on public.game_messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.game_players gp where gp.game_id = game_messages.game_id
              and gp.player_id = (select auth.uid()) and not gp.is_bot and gp.faction = game_messages.sender_faction)
  and (recipient_faction is null or (recipient_faction <> sender_faction
       and recipient_faction in ('Iran','Coalizione','Russia','Cina','Europa'))));

do $$ begin
  begin alter publication supabase_realtime add table public.tabletop_private; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.game_messages; exception when duplicate_object then null; end;
end $$;

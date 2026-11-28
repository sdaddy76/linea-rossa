-- Storico personale e classifica generale (edizione da tavolo v3).

-- Risultati delle partite v3 concluse prima di questa migrazione.
do $$ declare g record; begin
  for g in select ga.id from public.games ga join public.game_state gs on gs.game_id = ga.id
           where ga.status = 'finished' and gs.special_uses ? 'tabletop_v3'
             and not exists (select 1 from public.game_player_results r where r.game_id = ga.id) loop
    perform public.capture_game_player_results(g.id);
  end loop;
end $$;

-- Le mie partite concluse, dalla più recente.
create or replace function public.linea_rossa_my_games(p_limit integer default 50)
returns table (game_id uuid, name text, code text, finished_at timestamptz, faction text, final_score integer,
               final_position integer, is_winner boolean, humans integer, mode text, reason text)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.game_id, g.name, g.code, g.finished_at, r.faction, r.final_score, r.final_position, r.is_winner,
         (select count(*)::int from public.game_players gp where gp.game_id = g.id and gp.player_id is not null and not gp.is_bot),
         g.game_length, gs.special_uses -> 'tabletop_v3' -> 'state' -> 'result' ->> 'reason'
  from public.game_player_results r
  join public.games g on g.id = r.game_id
  join public.game_state gs on gs.game_id = g.id and gs.special_uses ? 'tabletop_v3'
  where r.player_id = (select auth.uid())
  order by g.finished_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Classifica: punti per piazzamento 10/6/4/2/1 (come nei tornei), poi vittorie, poi PV medi.
create or replace function public.linea_rossa_leaderboard(p_min_games integer default 1)
returns table (player_id uuid, username text, games integer, wins integer, ranking_points integer,
               avg_score numeric, avg_position numeric, favourite_faction text)
language sql stable security definer set search_path = public, pg_temp as $$
  with v3 as (
    select r.* from public.game_player_results r
    join public.game_state gs on gs.game_id = r.game_id and gs.special_uses ? 'tabletop_v3'
    where r.player_id is not null
  ), fav as (
    select distinct on (player_id) player_id, faction from v3
    group by player_id, faction order by player_id, count(*) desc, faction
  )
  select v.player_id, coalesce(p.username, 'Giocatore'), count(*)::int, count(*) filter (where v.is_winner)::int,
         sum(case v.final_position when 1 then 10 when 2 then 6 when 3 then 4 when 4 then 2 when 5 then 1 else 0 end)::int,
         round(avg(v.final_score), 1), round(avg(v.final_position), 2), f.faction
  from v3 v left join public.profiles p on p.id = v.player_id left join fav f on f.player_id = v.player_id
  group by v.player_id, p.username, f.faction
  having count(*) >= greatest(1, coalesce(p_min_games, 1))
  order by 5 desc, 4 desc, 6 desc
  limit 200;
$$;

revoke all on function public.linea_rossa_my_games(integer) from public, anon;
revoke all on function public.linea_rossa_leaderboard(integer) from public, anon;
grant execute on function public.linea_rossa_my_games(integer) to authenticated;
grant execute on function public.linea_rossa_leaderboard(integer) to authenticated;

-- Notifiche push: la funzione "tabletop" genera al primo uso la coppia di chiavi VAPID e la conserva qui.
-- Nessuna regola di accesso: la leggono e la scrivono solo il server e l'amministratore del database.
create table if not exists public.push_config (
  id integer primary key check (id = 1),
  public_key text not null,
  private_key text not null,
  created_at timestamptz not null default now()
);
alter table public.push_config enable row level security;
revoke all on table public.push_config from anon, authenticated;

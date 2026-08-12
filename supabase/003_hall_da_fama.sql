-- Hall da Fama — ranking global seguro
-- Ordem: conclusões > diplomas > XP.
-- Esta migration já foi aplicada no projeto Supabase conectado.

create schema if not exists private;

create table if not exists public.leaderboard (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  game_completions integer not null default 0 check (game_completions >= 0),
  diploma_count integer not null default 0 check (diploma_count >= 0),
  xp bigint not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

revoke all on table public.leaderboard from anon;
revoke insert, update, delete on table public.leaderboard from authenticated;
grant select on table public.leaderboard to authenticated;

drop policy if exists "voltz_leaderboard_authenticated_read" on public.leaderboard;
create policy "voltz_leaderboard_authenticated_read"
on public.leaderboard
for select
to authenticated
using (true);

create or replace function private.sync_leaderboard_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diploma_total integer := 0;
  completion_total integer := 0;
  progress_doc jsonb := coalesce(new.progresso, '{}'::jsonb);
begin
  if jsonb_typeof(progress_doc #> '{_world,diplomas}') = 'object' then
    select count(*)::integer
      into diploma_total
      from jsonb_object_keys(progress_doc #> '{_world,diplomas}');
  end if;

  if coalesce(progress_doc #>> '{_world,gameCompletions}', '') ~ '^[0-9]+$' then
    completion_total := (progress_doc #>> '{_world,gameCompletions}')::integer;
  end if;

  insert into public.leaderboard (
    user_id, display_name, game_completions, diploma_count, xp, updated_at
  )
  values (
    new.id,
    coalesce(nullif(trim(new.nome), ''), 'Aluno'),
    completion_total,
    diploma_total,
    greatest(coalesce(new.xp, 0), 0),
    now()
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      game_completions = excluded.game_completions,
      diploma_count = excluded.diploma_count,
      xp = excluded.xp,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_leaderboard_from_profile() from public, anon, authenticated;

drop trigger if exists profiles_sync_leaderboard on public.profiles;
create trigger profiles_sync_leaderboard
after insert or update of nome, xp, progresso
on public.profiles
for each row
execute function private.sync_leaderboard_from_profile();

insert into public.leaderboard (
  user_id, display_name, game_completions, diploma_count, xp, updated_at
)
select
  p.id,
  coalesce(nullif(trim(p.nome), ''), 'Aluno'),
  case
    when coalesce(p.progresso #>> '{_world,gameCompletions}', '') ~ '^[0-9]+$'
      then (p.progresso #>> '{_world,gameCompletions}')::integer
    else 0
  end,
  case
    when jsonb_typeof(p.progresso #> '{_world,diplomas}') = 'object'
      then (select count(*)::integer from jsonb_object_keys(p.progresso #> '{_world,diplomas}'))
    else 0
  end,
  greatest(coalesce(p.xp, 0), 0),
  now()
from public.profiles p
on conflict (user_id) do update
set display_name = excluded.display_name,
    game_completions = excluded.game_completions,
    diploma_count = excluded.diploma_count,
    xp = excluded.xp,
    updated_at = excluded.updated_at;

create or replace function public.get_leaderboard(limit_count integer default 10)
returns table (
  rank_position bigint,
  user_id uuid,
  display_name text,
  game_completions integer,
  diploma_count integer,
  xp bigint,
  is_current_user boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ranked as (
    select
      row_number() over (
        order by l.game_completions desc,
                 l.diploma_count desc,
                 l.xp desc,
                 l.display_name asc,
                 l.user_id asc
      ) as rank_position,
      l.user_id,
      l.display_name,
      l.game_completions,
      l.diploma_count,
      l.xp
    from public.leaderboard l
  )
  select
    r.rank_position,
    r.user_id,
    r.display_name,
    r.game_completions,
    r.diploma_count,
    r.xp,
    r.user_id = (select auth.uid()) as is_current_user
  from ranked r
  where r.rank_position <= greatest(coalesce(limit_count, 10), 1)
     or r.user_id = (select auth.uid())
  order by r.rank_position;
$$;

revoke all on function public.get_leaderboard(integer) from public, anon;
grant execute on function public.get_leaderboard(integer) to authenticated;

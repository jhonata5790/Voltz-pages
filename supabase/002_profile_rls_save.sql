-- Voltz Education — corrige permissões de SAVE do perfil
-- Execute uma vez no SQL Editor do Supabase.
-- Cada usuário autenticado só pode acessar a própria linha em public.profiles.

alter table public.profiles enable row level security;

-- Garante acesso da role autenticada à tabela.
grant select, insert, update on table public.profiles to authenticated;

-- Removemos apenas policies com os nomes do Voltz para o script poder ser executado novamente.
drop policy if exists "voltz_profiles_select_own" on public.profiles;
drop policy if exists "voltz_profiles_insert_own" on public.profiles;
drop policy if exists "voltz_profiles_update_own" on public.profiles;

create policy "voltz_profiles_select_own"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy "voltz_profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy "voltz_profiles_update_own"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

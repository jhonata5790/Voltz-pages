-- Voltz Education — preparação do perfil para progresso persistente.
-- Execute uma vez no SQL Editor do Supabase.
-- Não remove colunas nem políticas existentes.

alter table public.profiles
  add column if not exists xp bigint not null default 0,
  add column if not exists moedas bigint not null default 0,
  add column if not exists combo integer not null default 0,
  add column if not exists rank text not null default 'Iniciante',
  add column if not exists progresso jsonb not null default '{}'::jsonb;

create index if not exists profiles_xp_idx on public.profiles (xp desc);

comment on column public.profiles.progresso is
  'Progresso por reino. Ex.: {"reino-matematica":{"defeatedEnemyIds":[],"miniBossDefeated":false,"bossDefeated":false}}';

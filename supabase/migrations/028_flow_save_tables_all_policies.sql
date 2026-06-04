-- Idempotent: ensure flow save tables + unified RLS (FOR ALL per user).
-- Safe to run in Supabase SQL Editor if saves fail with missing table/policy errors.

-- thumbnail_concepts
create table if not exists public.thumbnail_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  concepts jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists thumbnail_concepts_user_created_idx
  on public.thumbnail_concepts (user_id, created_at desc);

alter table public.thumbnail_concepts enable row level security;

drop policy if exists "thumbnail_concepts_select_own" on public.thumbnail_concepts;
drop policy if exists "thumbnail_concepts_insert_own" on public.thumbnail_concepts;
drop policy if exists "thumbnail_concepts_delete_own" on public.thumbnail_concepts;
drop policy if exists "Users can insert own thumbnail concepts" on public.thumbnail_concepts;
drop policy if exists "Users can select own thumbnail concepts" on public.thumbnail_concepts;
drop policy if exists "Users can delete own thumbnail concepts" on public.thumbnail_concepts;
drop policy if exists "Users can manage own thumbnail concepts" on public.thumbnail_concepts;

create policy "Users can manage own thumbnail concepts"
  on public.thumbnail_concepts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- niche_saves
create table if not exists public.niche_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  niche_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists niche_saves_user_id_idx on public.niche_saves (user_id);

alter table public.niche_saves enable row level security;

drop policy if exists "niche_saves_select_own" on public.niche_saves;
drop policy if exists "niche_saves_insert_own" on public.niche_saves;
drop policy if exists "niche_saves_delete_own" on public.niche_saves;
drop policy if exists "Users can manage own niche saves" on public.niche_saves;

create policy "Users can manage own niche saves"
  on public.niche_saves
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- saved_scripts
create table if not exists public.saved_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text,
  script text not null,
  settings jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_scripts_user_created_idx
  on public.saved_scripts (user_id, created_at desc);

alter table public.saved_scripts enable row level security;

drop policy if exists "saved_scripts_select_own" on public.saved_scripts;
drop policy if exists "saved_scripts_insert_own" on public.saved_scripts;
drop policy if exists "saved_scripts_delete_own" on public.saved_scripts;
drop policy if exists "Users can manage own scripts" on public.saved_scripts;

create policy "Users can manage own scripts"
  on public.saved_scripts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- outlier_results
create table if not exists public.outlier_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  niche text,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists outlier_results_user_created_idx
  on public.outlier_results (user_id, created_at desc);

alter table public.outlier_results enable row level security;

drop policy if exists "outlier_results_select_own" on public.outlier_results;
drop policy if exists "outlier_results_insert_own" on public.outlier_results;
drop policy if exists "outlier_results_delete_own" on public.outlier_results;
drop policy if exists "Users can manage own outlier results" on public.outlier_results;

create policy "Users can manage own outlier results"
  on public.outlier_results
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- remix_results
create table if not exists public.remix_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  original_url text,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists remix_results_user_created_idx
  on public.remix_results (user_id, created_at desc);

alter table public.remix_results enable row level security;

drop policy if exists "remix_results_select_own" on public.remix_results;
drop policy if exists "remix_results_insert_own" on public.remix_results;
drop policy if exists "remix_results_delete_own" on public.remix_results;
drop policy if exists "Users can manage own remix results" on public.remix_results;

create policy "Users can manage own remix results"
  on public.remix_results
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

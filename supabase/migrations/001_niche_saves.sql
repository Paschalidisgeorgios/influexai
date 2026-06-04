-- YouTube Niche Analyzer: gespeicherte Nischen pro Nutzer
-- In Supabase SQL Editor ausführen oder via CLI migrieren

create table if not exists public.niche_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  niche_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists niche_saves_user_id_idx on public.niche_saves (user_id);

alter table public.niche_saves enable row level security;

create policy "niche_saves_select_own"
  on public.niche_saves for select
  using (auth.uid() = user_id);

create policy "niche_saves_insert_own"
  on public.niche_saves for insert
  with check (auth.uid() = user_id);

create policy "niche_saves_delete_own"
  on public.niche_saves for delete
  using (auth.uid() = user_id);

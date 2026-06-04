-- Video Remix: gespeicherte Remix-Analysen pro Nutzer

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

create policy "remix_results_select_own"
  on public.remix_results for select using (auth.uid() = user_id);

create policy "remix_results_insert_own"
  on public.remix_results for insert with check (auth.uid() = user_id);

-- Outlier Detector: gespeicherte Analysen pro Nutzer

create table if not exists public.outlier_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  niche text not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists outlier_results_user_created_idx
  on public.outlier_results (user_id, created_at desc);

alter table public.outlier_results enable row level security;

create policy "outlier_results_select_own"
  on public.outlier_results for select using (auth.uid() = user_id);

create policy "outlier_results_insert_own"
  on public.outlier_results for insert with check (auth.uid() = user_id);

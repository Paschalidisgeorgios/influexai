-- Creator Growth Agent: tägliche Video-Ideen pro User

create table if not exists public.daily_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestions jsonb not null,
  niche text,
  created_at timestamptz not null default now()
);

create index if not exists daily_suggestions_user_created_idx
  on public.daily_suggestions (user_id, created_at desc);

alter table public.daily_suggestions enable row level security;

drop policy if exists "Users can read own suggestions" on public.daily_suggestions;
create policy "Users can read own suggestions"
  on public.daily_suggestions for select
  using (auth.uid() = user_id);

alter table public.profiles
  add column if not exists daily_suggestions_email boolean not null default true;

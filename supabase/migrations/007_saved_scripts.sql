-- Script Generator: gespeicherte Scripts pro Nutzer

create table if not exists public.saved_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  script text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_scripts_user_created_idx
  on public.saved_scripts (user_id, created_at desc);

alter table public.saved_scripts enable row level security;

create policy "saved_scripts_select_own"
  on public.saved_scripts for select using (auth.uid() = user_id);

create policy "saved_scripts_insert_own"
  on public.saved_scripts for insert with check (auth.uid() = user_id);

create policy "saved_scripts_delete_own"
  on public.saved_scripts for delete using (auth.uid() = user_id);

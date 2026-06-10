create table if not exists public.creator_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  nische       text,
  zielgruppe   text,
  tonalitaet   text,
  plattformen  text[] not null default '{}',
  produkte     text[] not null default '{}',
  notizen      jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

create policy "creator_profiles_owner_select"
  on public.creator_profiles for select to authenticated
  using (user_id = auth.uid());

create policy "creator_profiles_owner_insert"
  on public.creator_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy "creator_profiles_owner_update"
  on public.creator_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "creator_profiles_owner_delete"
  on public.creator_profiles for delete to authenticated
  using (user_id = auth.uid());

comment on table public.creator_profiles is
  'Persistent creator memory for KI Agent (nische, zielgruppe, plattformen, produkte).';

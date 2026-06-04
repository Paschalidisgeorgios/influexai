-- Churn prevention: win-back emails, nudges, activity tracking

alter table public.profiles
  add column if not exists last_active_at timestamptz,
  add column if not exists is_churned boolean not null default false;

-- Allow win-back resends; nurture types still deduped in app code
alter table public.email_logs drop constraint if exists email_logs_user_id_email_type_key;

create index if not exists email_logs_user_type_sent_idx
  on public.email_logs (user_id, email_type, sent_at desc);

alter table public.email_logs drop constraint if exists email_logs_email_type_check;
alter table public.email_logs add constraint email_logs_email_type_check check (
  email_type in (
    'welcome',
    'activation',
    'feature_discovery',
    'retention',
    'upgrade',
    'winback_high',
    'winback_critical'
  )
);

create table if not exists public.dismissed_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  dismissed_at timestamptz not null default now(),
  unique (user_id, feature)
);

create index if not exists dismissed_nudges_user_idx on public.dismissed_nudges (user_id);

alter table public.dismissed_nudges enable row level security;

create policy "dismissed_nudges_select_own"
  on public.dismissed_nudges for select using (auth.uid() = user_id);

create policy "dismissed_nudges_insert_own"
  on public.dismissed_nudges for insert with check (auth.uid() = user_id);

create policy "dismissed_nudges_delete_own"
  on public.dismissed_nudges for delete using (auth.uid() = user_id);

create table if not exists public.user_activity_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  visited_at timestamptz not null default now()
);

create index if not exists user_activity_visits_user_idx
  on public.user_activity_visits (user_id, visited_at desc);

alter table public.user_activity_visits enable row level security;

create policy "user_activity_visits_insert_own"
  on public.user_activity_visits for insert with check (auth.uid() = user_id);

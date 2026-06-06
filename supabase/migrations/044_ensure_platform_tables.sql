-- Platform banners, maintenance mode, daily suggestions, web push
-- Idempotent re-apply if migrations 019 / 033 / 038 were never run on the project.

-- ── 019: announcements + platform_settings ────────────────────────────────

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_announcements_active
  on public.announcements (is_active, expires_at desc);

create table if not exists public.platform_settings (
  id uuid not null default gen_random_uuid(),
  key text primary key,
  value jsonb not null default 'false',
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_settings_id_idx
  on public.platform_settings (id);

insert into public.platform_settings (key, value)
values ('maintenance_mode', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.announcements enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "announcements_select_active" on public.announcements;
create policy "announcements_select_active"
  on public.announcements for select
  using (is_active = true and expires_at > now());

drop policy if exists "platform_settings_select" on public.platform_settings;
create policy "platform_settings_select"
  on public.platform_settings for select
  using (true);

-- ── 033: daily_suggestions ───────────────────────────────────────────────────

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

-- ── 038: push_notifications (PushPermission banner) ───────────────────────

create table if not exists public.push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_notifications_user_id_idx
  on public.push_notifications (user_id);

alter table public.push_notifications enable row level security;

drop policy if exists "push_notifications_select_own" on public.push_notifications;
create policy "push_notifications_select_own"
  on public.push_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "push_notifications_insert_own" on public.push_notifications;
create policy "push_notifications_insert_own"
  on public.push_notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_notifications_update_own" on public.push_notifications;
create policy "push_notifications_update_own"
  on public.push_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_notifications_delete_own" on public.push_notifications;
create policy "push_notifications_delete_own"
  on public.push_notifications for delete
  using (auth.uid() = user_id);

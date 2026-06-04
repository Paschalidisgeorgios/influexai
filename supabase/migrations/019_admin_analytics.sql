-- Admin business analytics: Stripe payments log, announcements, platform settings

create table if not exists public.stripe_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null default 0,
  currency text not null default 'eur',
  plan text,
  credits_amount integer not null default 0,
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_stripe_payments_created
  on public.stripe_payments (created_at desc);

create index if not exists idx_stripe_payments_user
  on public.stripe_payments (user_id, created_at desc);

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
  key text primary key,
  value jsonb not null default 'false',
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('maintenance_mode', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.stripe_payments enable row level security;
alter table public.announcements enable row level security;
alter table public.platform_settings enable row level security;

-- Service role / admin writes via server; public read active announcement only
create policy "announcements_select_active"
  on public.announcements for select
  using (is_active = true and expires_at > now());

create policy "platform_settings_select"
  on public.platform_settings for select using (true);

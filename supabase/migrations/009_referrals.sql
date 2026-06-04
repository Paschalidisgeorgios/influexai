-- Referral system

alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by text;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referred_id uuid not null references auth.users (id) on delete cascade unique,
  status text not null default 'signed_up' check (status in ('signed_up', 'purchased')),
  credits_awarded_signup boolean not null default false,
  credits_awarded_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
create index if not exists referrals_referred_idx on public.referrals (referred_id);

alter table public.referrals enable row level security;

create policy "referrals_select_as_referrer"
  on public.referrals for select
  using (auth.uid() = referrer_id);

create policy "referrals_select_as_referred"
  on public.referrals for select
  using (auth.uid() = referred_id);

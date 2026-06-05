-- Agency plan fields on owner profiles (mirrors tenant subscription)
alter table public.profiles
  add column if not exists agency_plan text
    check (agency_plan is null or agency_plan in ('starter', 'pro', 'enterprise')),
  add column if not exists agency_credits integer not null default 0;

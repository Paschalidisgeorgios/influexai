-- Onboarding fields on profiles
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists channel_name text,
  add column if not exists creator_niche text,
  add column if not exists subscriber_count text,
  add column if not exists creator_goal text;

-- profiles.niche for onboarding (mirrors creator_niche on save)
alter table public.profiles
  add column if not exists niche text;

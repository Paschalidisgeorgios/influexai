-- Creator Growth Agent — run in Supabase SQL Editor (idempotent)
-- Project: hszjafdelcydnppyolkm

-- 033: daily_suggestions + profiles.daily_suggestions_email
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

-- Cron 07:00 UTC (requires vault secret supabase_service_role_key)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-growth-agent') then
    perform cron.unschedule('daily-growth-agent');
  end if;
end $$;

select cron.schedule(
  'daily-growth-agent',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/growth-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret
         from vault.decrypted_secrets
         where name = 'supabase_service_role_key'
         limit 1),
        ''
      )
    ),
    body := '{"mode":"cron"}'::jsonb
  ) as request_id;
  $$
);

select jobname, schedule, active from cron.job where jobname = 'daily-growth-agent';

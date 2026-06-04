-- =============================================================================
-- Beta + Nurture — Run in Supabase Dashboard → SQL Editor
-- Project: hszjafdelcydnppyolkm
-- Idempotent: safe to run multiple times.
-- =============================================================================

-- 010: nurture profile columns + email_logs
alter table public.profiles
  add column if not exists email_sequence_day integer not null default 0,
  add column if not exists last_nurture_email_at timestamptz,
  add column if not exists nurture_unsubscribed boolean not null default false;

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email_type text not null check (
    email_type in (
      'welcome',
      'activation',
      'feature_discovery',
      'retention',
      'upgrade'
    )
  ),
  sent_at timestamptz not null default now(),
  opened boolean not null default false,
  unique (user_id, email_type)
);

create index if not exists email_logs_user_sent_idx
  on public.email_logs (user_id, sent_at desc);

alter table public.email_logs enable row level security;

drop policy if exists "email_logs_select_own" on public.email_logs;
create policy "email_logs_select_own"
  on public.email_logs for select using (auth.uid() = user_id);

-- 014: beta_signups
create table if not exists public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  niche text,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'waitlisted')),
  converted_to_user boolean not null default false,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists beta_signups_email_idx on public.beta_signups (lower(email));
create index if not exists beta_signups_status_created_idx
  on public.beta_signups (status, created_at desc);

alter table public.profiles
  add column if not exists is_beta boolean not null default false,
  add column if not exists beta_code text;

alter table public.beta_signups enable row level security;

-- Extensions for cron (enable in Dashboard → Database → Extensions if missing)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Vault secret for cron → edge function auth (replace with your service_role key once):
-- select vault.create_secret(
--   '<SERVICE_ROLE_KEY>',
--   'supabase_service_role_key',
--   'Bearer for nurture/churn cron'
-- );

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-nurture-emails') then
    perform cron.unschedule('daily-nurture-emails');
  end if;
  if exists (select 1 from cron.job where jobname = 'daily-churn-winback') then
    perform cron.unschedule('daily-churn-winback');
  end if;
end $$;

select cron.schedule(
  'daily-nurture-emails',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/send-nurture-email',
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

select cron.schedule(
  'daily-churn-winback',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/send-nurture-email',
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
    body := '{"mode":"churn_winback"}'::jsonb
  ) as request_id;
  $$
);

-- Verify
select 'beta_signups' as check_name, count(*) as rows from public.beta_signups;
select jobname, schedule, active from cron.job
where jobname in ('daily-nurture-emails', 'daily-churn-winback');

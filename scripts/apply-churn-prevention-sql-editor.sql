-- Churn Prevention — run in Supabase SQL Editor (idempotent)

-- Table log (if 035 not applied via CLI)
create table if not exists public.churn_prevention (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  type text not null check (type in ('day3', 'day7', 'day14'))
);

create index if not exists churn_prevention_user_sent_idx
  on public.churn_prevention (user_id, sent_at desc);

alter table public.churn_prevention enable row level security;

drop policy if exists "churn_prevention_select_own" on public.churn_prevention;
create policy "churn_prevention_select_own"
  on public.churn_prevention for select
  using (auth.uid() = user_id);

-- Verify structure
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'churn_prevention'
order by ordinal_position;

-- Cron 10:00 UTC
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-churn-winback') then
    perform cron.unschedule('daily-churn-winback');
  end if;
  if exists (select 1 from cron.job where jobname = 'daily-churn-prevention') then
    perform cron.unschedule('daily-churn-prevention');
  end if;
end $$;

select cron.schedule(
  'daily-churn-prevention',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/churn-prevention',
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

select jobname, schedule, active from cron.job
where jobname = 'daily-churn-prevention';

-- Log für Churn-Prevention Re-Engagement Emails (Tag 3 / 7 / 14)

create table if not exists public.churn_prevention (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  type text not null check (type in ('day3', 'day7', 'day14'))
);

create index if not exists churn_prevention_user_sent_idx
  on public.churn_prevention (user_id, sent_at desc);

create index if not exists churn_prevention_user_type_idx
  on public.churn_prevention (user_id, type);

alter table public.churn_prevention enable row level security;

-- Service role inserts from edge function; users read own log (optional dashboard)
create policy "churn_prevention_select_own"
  on public.churn_prevention for select
  using (auth.uid() = user_id);

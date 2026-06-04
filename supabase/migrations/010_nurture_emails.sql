-- Email nurturing sequence (Resend + send-nurture-email edge function)

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

create policy "email_logs_select_own"
  on public.email_logs for select using (auth.uid() = user_id);

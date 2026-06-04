-- Track low-credit notification emails (one per threshold per user)

create table if not exists public.credit_emails_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  threshold integer not null check (threshold in (0, 3, 10)),
  sent_at timestamptz not null default now(),
  unique (user_id, threshold)
);

create index if not exists credit_emails_sent_user_idx
  on public.credit_emails_sent (user_id);

alter table public.credit_emails_sent enable row level security;

create policy "credit_emails_sent_select_own"
  on public.credit_emails_sent for select using (auth.uid() = user_id);

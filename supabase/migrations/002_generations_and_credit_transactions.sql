-- Generierungen & Credit-Historie für Dashboard

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  prompt text not null default '',
  credits_used integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.generations enable row level security;
alter table public.credit_transactions enable row level security;

create policy "generations_select_own"
  on public.generations for select using (auth.uid() = user_id);

create policy "generations_insert_own"
  on public.generations for insert with check (auth.uid() = user_id);

create policy "credit_transactions_select_own"
  on public.credit_transactions for select using (auth.uid() = user_id);

create policy "credit_transactions_insert_own"
  on public.credit_transactions for insert with check (auth.uid() = user_id);

-- Generations + credit_transactions — paste into Supabase SQL Editor
-- Project: hszjafdelcydnppyolkm
-- Fixes createGenerationRecord / "Generierung konnte nicht gespeichert werden."
-- Idempotent — safe to run multiple times.

-- (same as supabase/migrations/045_ensure_generations.sql)

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  prompt text not null default '',
  credits_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.generations
  add column if not exists result jsonb;

alter table public.generations
  add column if not exists is_pinned boolean not null default false;

alter table public.generations
  add column if not exists is_public boolean not null default false;

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

create index if not exists idx_generations_user_created
  on public.generations (user_id, created_at desc);

create index if not exists idx_generations_user_type
  on public.generations (user_id, type);

create index if not exists idx_generations_user_type_result
  on public.generations (user_id, type)
  where result is not null;

create index if not exists idx_generations_public_created
  on public.generations (created_at desc)
  where is_public = true;

alter table public.generations enable row level security;

drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own"
  on public.generations for select
  using (auth.uid() = user_id);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own"
  on public.generations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own generations" on public.generations;
create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

drop policy if exists "generations_update_own" on public.generations;
create policy "generations_update_own"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "credit_transactions_insert_own" on public.credit_transactions;
create policy "credit_transactions_insert_own"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id);

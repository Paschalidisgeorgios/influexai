-- Public Developer API: API keys and request logs

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  name text not null default 'Default',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  request_count bigint not null default 0,
  is_active boolean not null default true
);

create index if not exists idx_api_keys_user on public.api_keys (user_id, created_at desc);
create index if not exists idx_api_keys_hash on public.api_keys (key_hash) where is_active = true;

create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  credits_used integer not null default 0,
  response_time_ms integer not null default 0,
  status_code integer not null default 200,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_logs_key_created
  on public.api_logs (api_key_id, created_at desc);

create index if not exists idx_api_logs_user_created
  on public.api_logs (user_id, created_at desc);

create index if not exists idx_api_logs_created
  on public.api_logs (created_at desc);

alter table public.api_keys enable row level security;
alter table public.api_logs enable row level security;

create policy "api_keys_select_own"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "api_logs_select_own"
  on public.api_logs for select
  using (auth.uid() = user_id);

create policy "api_keys_delete_own"
  on public.api_keys for delete
  using (auth.uid() = user_id);

create table if not exists public.agent_executions (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  user_id          uuid references auth.users(id) on delete cascade,
  prompt           text not null,
  intent           text,
  selected_tools   text[],
  status           text not null default 'idle',
  steps            jsonb not null default '[]'::jsonb,
  result           jsonb,
  estimated_credits int default 0,
  used_credits     int default 0
);
create index if not exists agent_executions_user_id_idx
  on public.agent_executions (user_id);
create index if not exists agent_executions_status_idx
  on public.agent_executions (status);
alter table public.agent_executions enable row level security;
create policy "agent_executions_owner"
  on public.agent_executions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

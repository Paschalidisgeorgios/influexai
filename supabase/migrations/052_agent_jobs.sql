create table if not exists public.agent_jobs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  user_id       uuid references auth.users(id) on delete cascade,
  type          text not null,
  status        text not null default 'queued',
  payload       jsonb not null default '{}'::jsonb,
  result        jsonb,
  error         text,
  estimated_duration int,
  started_at    timestamptz,
  completed_at  timestamptz
);
create index if not exists agent_jobs_user_id_idx
  on public.agent_jobs (user_id);
create index if not exists agent_jobs_status_idx
  on public.agent_jobs (status);
alter table public.agent_jobs enable row level security;
create policy "agent_jobs_owner"
  on public.agent_jobs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

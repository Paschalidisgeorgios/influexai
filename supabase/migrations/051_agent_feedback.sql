create table if not exists public.agent_feedback (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid references auth.users(id) on delete set null,
  execution_id uuid references public.agent_executions(id)
               on delete set null,
  action       text not null,
  tool         text,
  intent       text,
  rating       int check (rating between 1 and 5),
  notes        text
);
create index if not exists agent_feedback_user_id_idx
  on public.agent_feedback (user_id);
alter table public.agent_feedback enable row level security;
create policy "agent_feedback_owner"
  on public.agent_feedback for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

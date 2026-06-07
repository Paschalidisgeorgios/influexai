-- Repair ab_events schema drift when remote DB lacks the event column (012 not applied fully)

create table if not exists public.ab_events (
  id uuid primary key default gen_random_uuid(),
  variant text not null check (variant in ('a', 'b')),
  session_id text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.ab_events add column if not exists event text;

update public.ab_events
set event = 'view'
where event is null;

alter table public.ab_events alter column event set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ab_events_event_check'
  ) then
    alter table public.ab_events
      add constraint ab_events_event_check
      check (event in ('view', 'signup_click', 'signup_complete'));
  end if;
end $$;

create index if not exists ab_events_variant_event_idx
  on public.ab_events (variant, event);

create index if not exists ab_events_created_at_idx
  on public.ab_events (created_at desc);

alter table public.ab_events enable row level security;

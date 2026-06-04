-- Landing page A/B test events

create table if not exists public.ab_events (
  id uuid primary key default gen_random_uuid(),
  variant text not null check (variant in ('a', 'b')),
  event text not null check (event in ('view', 'signup_click', 'signup_complete')),
  session_id text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists ab_events_variant_event_idx
  on public.ab_events (variant, event);

create index if not exists ab_events_created_at_idx
  on public.ab_events (created_at desc);

alter table public.ab_events enable row level security;

-- No public policies: inserts/reads via service role API routes only

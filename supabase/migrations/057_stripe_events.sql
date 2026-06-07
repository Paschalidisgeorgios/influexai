-- Idempotent Stripe webhook processing (dedupe by event.id).

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

-- No policies: only service_role (webhook) reads/writes; bypasses RLS.

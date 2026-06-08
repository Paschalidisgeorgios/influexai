-- Claim-before-mutate dedup for Stripe checkout sessions and renewal invoices.

create table if not exists public.processed_checkout_sessions (
  stripe_session_id text primary key,
  checkout_type text not null,
  user_id uuid null references auth.users (id) on delete set null,
  tenant_id uuid null references public.tenants (id) on delete set null,
  credits_granted integer null,
  created_at timestamptz not null default now()
);

create index if not exists idx_processed_checkout_sessions_user
  on public.processed_checkout_sessions (user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_processed_checkout_sessions_tenant
  on public.processed_checkout_sessions (tenant_id, created_at desc)
  where tenant_id is not null;

create table if not exists public.processed_stripe_invoices (
  stripe_invoice_id text primary key,
  stripe_subscription_id text null,
  user_id uuid null references auth.users (id) on delete set null,
  tenant_id uuid null references public.tenants (id) on delete set null,
  credits_granted integer null,
  created_at timestamptz not null default now()
);

create index if not exists idx_processed_stripe_invoices_user
  on public.processed_stripe_invoices (user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_processed_stripe_invoices_subscription
  on public.processed_stripe_invoices (stripe_subscription_id, created_at desc)
  where stripe_subscription_id is not null;

alter table public.processed_checkout_sessions enable row level security;
alter table public.processed_stripe_invoices enable row level security;

-- No policies: only service_role (webhook) reads/writes; bypasses RLS.

-- Stripe subscription fields on user profiles (platform plans)
alter table public.profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text;

create index if not exists idx_profiles_stripe_subscription
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

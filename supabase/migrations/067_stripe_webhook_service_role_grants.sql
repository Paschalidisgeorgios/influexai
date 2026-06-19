-- Explicit PostgreSQL grants for Stripe webhook handler (service_role client).
-- Tables from 019 (stripe_payments), 057 (stripe_events), 058 (processed_*).
-- RLS remains enabled with no authenticated policies on webhook-only tables;
-- service_role must still hold table-level GRANTs (permission denied otherwise).

grant select, insert on table public.stripe_events to service_role;

grant select, insert on table public.processed_checkout_sessions to service_role;

grant select, insert on table public.processed_stripe_invoices to service_role;

grant select, insert, update on table public.stripe_payments to service_role;

-- Subscription checkout / renewal updates plan and Stripe fields on profiles.
grant select, update on table public.profiles to service_role;

-- Agency tenant subscription lifecycle (customer.subscription.* events).
grant select, update on table public.tenants to service_role;

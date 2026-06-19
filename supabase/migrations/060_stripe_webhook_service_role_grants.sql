-- Webhook handler uses service_role JWT; tables from 057/058 were created without DML grants.

grant select, insert, update, delete on public.stripe_events to service_role;
grant select, insert, update, delete on public.processed_checkout_sessions to service_role;
grant select, insert, update, delete on public.processed_stripe_invoices to service_role;
grant select, insert, update, delete on public.stripe_payments to service_role;

-- Platform subscription checkout updates plan + stripe ids on profiles.
grant select, update on public.profiles to service_role;

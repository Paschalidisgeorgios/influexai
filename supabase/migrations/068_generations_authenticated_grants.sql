-- Table-level GRANTs for generations gallery SSOT + credit_transactions.
-- Staging hit HTTP 500 "Generierung konnte nicht gespeichert werden." with
-- Postgres 42501 permission denied for table generations (RLS policies present
-- but authenticated/service_role lacked GRANT — see G.10-F diagnosis).

grant select, insert, update, delete on table public.generations to authenticated;

grant select, insert, update, delete on table public.generations to service_role;

grant select, insert on table public.credit_transactions to authenticated;

grant select, insert on table public.credit_transactions to service_role;

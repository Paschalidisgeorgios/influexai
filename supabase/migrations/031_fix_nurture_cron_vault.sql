-- Fix nurture/churn cron jobs: use service role from Supabase Vault instead of placeholder.
--
-- One-time setup in SQL Editor (Dashboard → Project Settings → Vault):
--   select vault.create_secret(
--     '<YOUR_SERVICE_ROLE_KEY>',
--     'supabase_service_role_key',
--     'Bearer token for pg_cron → edge functions'
--   );
--
-- If jobs were scheduled with YOUR_SERVICE_ROLE_KEY, they always returned 401.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-nurture-emails') then
    perform cron.unschedule('daily-nurture-emails');
  end if;
  if exists (select 1 from cron.job where jobname = 'daily-churn-winback') then
    perform cron.unschedule('daily-churn-winback');
  end if;
end $$;

select cron.schedule(
  'daily-nurture-emails',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/send-nurture-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret
         from vault.decrypted_secrets
         where name = 'supabase_service_role_key'
         limit 1),
        ''
      )
    ),
    body := '{"mode":"cron"}'::jsonb
  ) as request_id;
  $$
);

select cron.schedule(
  'daily-churn-winback',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/send-nurture-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret
         from vault.decrypted_secrets
         where name = 'supabase_service_role_key'
         limit 1),
        ''
      )
    ),
    body := '{"mode":"churn_winback"}'::jsonb
  ) as request_id;
  $$
);

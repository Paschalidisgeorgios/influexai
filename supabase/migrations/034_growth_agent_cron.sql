-- Daily Growth Agent cron — 07:00 UTC
-- Prerequisites: pg_cron + pg_net, growth-agent deployed, vault secret supabase_service_role_key
-- See scripts/apply-growth-agent-sql-editor.sql

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-growth-agent') then
    perform cron.unschedule('daily-growth-agent');
  end if;
end $$;

select cron.schedule(
  'daily-growth-agent',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/growth-agent',
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

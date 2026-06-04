-- Churn Prevention cron @ 10:00 UTC (replaces legacy daily-churn-winback → send-nurture-email)

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-churn-winback') then
    perform cron.unschedule('daily-churn-winback');
  end if;
  if exists (select 1 from cron.job where jobname = 'daily-churn-prevention') then
    perform cron.unschedule('daily-churn-prevention');
  end if;
end $$;

select cron.schedule(
  'daily-churn-prevention',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/churn-prevention',
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

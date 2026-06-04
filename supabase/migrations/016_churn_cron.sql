-- Daily churn win-back email cron (run after migration 015 and deploying send-nurture-email)
--
-- Prerequisites: pg_cron + pg_net enabled, edge function deployed with churn.ts
-- Replace YOUR_SERVICE_ROLE_KEY with Project Settings → API → service_role key

-- SELECT cron.unschedule('daily-churn-winback');  -- use to remove job

select cron.schedule(
  'daily-churn-winback',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/send-nurture-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{"mode":"churn_winback"}'::jsonb
  ) as request_id;
  $$
);

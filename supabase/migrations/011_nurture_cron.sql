-- Daily nurture email cron (run once in Supabase SQL Editor after deploying the edge function)
--
-- Prerequisites:
-- 1. Database → Extensions → enable pg_cron and pg_net
-- 2. Deploy: supabase functions deploy send-nurture-email
-- 3. Set Edge Function secrets: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY (auto), NURTURE_UNSUBSCRIBE_SECRET
-- 4. Replace YOUR_SERVICE_ROLE_KEY below with the key from Project Settings → API

-- SELECT cron.unschedule('daily-nurture-emails');  -- use to remove job

select cron.schedule(
  'daily-nurture-emails',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://hszjafdelcydnppyolkm.supabase.co/functions/v1/send-nurture-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{"mode":"cron"}'::jsonb
  ) as request_id;
  $$
);

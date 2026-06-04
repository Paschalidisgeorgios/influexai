/**
 * Churn Prevention — Cron schedule
 *
 * Schedule: "0 10 * * *" (daily 10:00 UTC)
 * Applied via supabase/migrations/037_churn_prevention_cron.sql (pg_cron + pg_net)
 *
 * Manual test:
 * POST /functions/v1/churn-prevention
 * Authorization: Bearer <SERVICE_ROLE_KEY>
 * Body: { "mode": "cron" } or { "userId": "<uuid>" }
 */

export const CHURN_PREVENTION_CRON_SCHEDULE = "0 10 * * *";
export const CHURN_PREVENTION_CRON_JOB = "daily-churn-prevention";

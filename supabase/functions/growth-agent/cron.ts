/**
 * Creator Growth Agent — Cron schedule
 *
 * Schedule: "0 7 * * *" (daily 07:00 UTC)
 *
 * Supabase schedules Edge Functions via pg_cron + pg_net, not config.toml.
 * Applied in: supabase/migrations/034_growth_agent_cron.sql
 *
 * Manual invoke (service role):
 * POST /functions/v1/growth-agent
 * Body: { "mode": "cron" }
 */

export const GROWTH_AGENT_CRON_SCHEDULE = "0 7 * * *";

export const GROWTH_AGENT_CRON_JOB_NAME = "daily-growth-agent";

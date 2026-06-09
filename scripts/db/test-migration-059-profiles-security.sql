-- =============================================================================
-- Staging / Local test: Migration 059 — profiles sensitive column protection
-- =============================================================================
--
-- See also: scripts/db/README-test-migration-059.md
--
-- PURPOSE
--   Verify migration 059 (protect_profiles_sensitive_columns trigger +
--   column REVOKE + deduct_credits bypass) on STAGING or LOCAL Supabase only.
--
-- PREREQUISITES
--   1. STAGING / LOCAL database — NEVER Production.
--   2. Migration 059 applied (supabase db reset locally, or staging push).
--   3. Dedicated test users in public.profiles (not real customers).
--   4. Replace placeholders:
--        <TEST_USER_ID>    — primary test user uuid
--        <OTHER_USER_ID>   — second user (cross-user deduct_credits)
--        <TEST_TENANT_ID>  — existing tenant uuid (tenant block / agency tests)
--
-- HOW TO RUN
--   Execute sections manually, one block at a time. Read result, then continue.
--   Do NOT wrap all tests in one ROLLBACK transaction — hides trigger/RPC behaviour.
--
-- AUTH CONTEXT (required for realistic tests)
--   SQL Editor as postgres bypasses REVOKE. Simulate Supabase clients:
--
--   Authenticated:
--     reset role;
--     set local role authenticated;
--     select set_config('request.jwt.claim.role', 'authenticated', true);
--     select set_config('request.jwt.claim.sub', '<TEST_USER_ID>', true);
--
--   Service role (webhooks / server):
--     reset role;
--     set local role service_role;
--     select set_config('request.jwt.claim.role', 'service_role', true);
--
--   deduct_credits requires auth.uid() = p_user_id for authenticated callers.
--
-- NOT FOR PRODUCTION — mutates profile fields and credits on test users.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — Schema checks (read-only, safe as postgres)
-- =============================================================================

-- 1a) Sensitive columns on public.profiles
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'tenant_id',
    'tenant_role',
    'credits',
    'plan',
    'stripe_customer_id',
    'stripe_subscription_id',
    'agency_plan',
    'agency_credits',
    'role',
    'is_admin',
    'referral_code',
    'referred_by',
    'is_beta',
    'beta_code',
    'email_sequence_day',
    'last_nurture_email_at',
    'is_churned',
    'nurture_unsubscribed'
  )
order by column_name;

-- EXPECTED: One row per column that exists. `plan` may be created by 059.
-- Missing rows → REVOKE/trigger skip that column; document gaps.


-- 1b) Harmless columns (should remain user-updatable — not in REVOKE list)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'full_name',
    'username',
    'bio',
    'daily_suggestions_email',
    'push_token',
    'onboarding_completed'
  )
order by column_name;

-- EXPECTED: Columns that exist in your schema are listed.


-- 1c) Trigger protect_profiles_sensitive_columns
select
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles'
  and tgname = 'protect_profiles_sensitive_columns'
  and not t.tgisinternal;

-- EXPECTED: one row; enabled; BEFORE UPDATE ... protect_profiles_sensitive_columns().


-- 1d) Trigger function — SECURITY DEFINER + search_path
select
  p.proname as function_name,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) ilike '%search_path%public%' as has_search_path_public
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'protect_profiles_sensitive_columns';

-- EXPECTED: security_definer = true; search_path includes public.


-- 1e) deduct_credits RPC
select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'deduct_credits';

-- EXPECTED: security_definer = true; authenticated + service_role can EXECUTE.


-- 1f) add_credits RPC (webhook path — service_role only per migration 056)
select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'add_credits';

-- EXPECTED: service_role can execute; authenticated should NOT (056).


-- 1g) Old protect_profiles_role trigger removed
select tgname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles'
  and tgname = 'protect_profiles_role'
  and not t.tgisinternal;

-- EXPECTED: zero rows.


-- 1h) UPDATE privileges for authenticated (sample: credits vs full_name)
-- Migration 059 uses table-level REVOKE + explicit GRANT on harmless columns only.
-- Do NOT rely on column REVOKE alone when GRANT UPDATE ON TABLE exists (Supabase default).
-- Primary enforcement: trigger + privileged grant model; has_column_privilege is informational.
select
  has_column_privilege('authenticated', 'public.profiles', 'credits', 'UPDATE') as auth_can_update_credits,
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') as auth_can_update_full_name,
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as auth_can_update_table;

-- EXPECTED after 059:
--   auth_can_update_credits = false
--   auth_can_update_full_name = true
--   auth_can_update_table = false (no blanket table UPDATE grant)
-- If auth_can_update_table = true, verify trigger still blocks sensitive columns (Sections 3 + 5).


-- 1i) Baseline snapshot — save output before mutating tests
select
  id,
  full_name,
  username,
  tenant_id,
  tenant_role,
  credits,
  plan,
  stripe_customer_id,
  stripe_subscription_id,
  agency_plan,
  agency_credits,
  is_admin,
  role
from public.profiles
where id = '<TEST_USER_ID>'::uuid;

-- EXPECTED: one row. Keep for cleanup (Section 8).


-- =============================================================================
-- SECTION 2 — Allowed profile updates (authenticated context)
-- =============================================================================
-- Set authenticated context (see header) before each test.


-- TEST A1 — full_name
-- update public.profiles
-- set full_name = 'Staging Security Test 059'
-- where id = '<TEST_USER_ID>'::uuid
-- returning id, full_name;
-- EXPECTED: SUCCESS — 1 row.


-- TEST A2 — username (skip if column absent)
-- update public.profiles
-- set username = 'sec_test_059'
-- where id = '<TEST_USER_ID>'::uuid
-- returning id, username;
-- EXPECTED: SUCCESS — 1 row (or unique violation if taken — use another value).


-- TEST A3 — bio
-- update public.profiles
-- set bio = 'Migration 059 harmless field test'
-- where id = '<TEST_USER_ID>'::uuid
-- returning id, bio;
-- EXPECTED: SUCCESS — 1 row.


-- TEST A4 — daily_suggestions_email
-- update public.profiles
-- set daily_suggestions_email = false
-- where id = '<TEST_USER_ID>'::uuid
-- returning id, daily_suggestions_email;
-- EXPECTED: SUCCESS — 1 row.


-- TEST A5 — push_token (skip if column absent)
-- update public.profiles
-- set push_token = 'ExponentPushToken[staging-test-059]'
-- where id = '<TEST_USER_ID>'::uuid
-- returning id, push_token;
-- EXPECTED: SUCCESS — 1 row.


-- TEST A6 — onboarding_completed (skip if column absent)
-- update public.profiles
-- set onboarding_completed = true
-- where id = '<TEST_USER_ID>'::uuid
-- returning id, onboarding_completed;
-- EXPECTED: SUCCESS — 1 row.


-- =============================================================================
-- SECTION 3 — Blocked sensitive columns (authenticated context)
-- =============================================================================
-- Each UPDATE must FAIL (42501 trigger and/or permission denied on column).
-- Verify credits/balance unchanged after credit-related tests.


-- TEST B — tenant_id
-- update public.profiles set tenant_id = '<TEST_TENANT_ID>'::uuid where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.tenant_id cannot be changed by users


-- TEST C — tenant_role
-- update public.profiles set tenant_role = 'owner' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.tenant_role cannot be changed by users


-- TEST D — credits direct increase
-- update public.profiles set credits = credits + 999 where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.credits cannot be changed directly (or permission denied)


-- TEST E — plan
-- update public.profiles set plan = 'pro' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.plan cannot be changed by users


-- TEST F — stripe_customer_id
-- update public.profiles set stripe_customer_id = 'cus_staging_test_block' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.stripe_customer_id cannot be changed by users


-- TEST G — stripe_subscription_id
-- update public.profiles set stripe_subscription_id = 'sub_staging_test_block' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.stripe_subscription_id cannot be changed by users


-- TEST H — agency_plan
-- update public.profiles set agency_plan = 'pro' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.agency_plan cannot be changed by users


-- TEST I — agency_credits
-- update public.profiles set agency_credits = agency_credits + 100 where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.agency_credits cannot be changed by users


-- TEST J — is_admin
-- update public.profiles set is_admin = true where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.is_admin cannot be changed by users


-- TEST K — referral_code
-- update public.profiles set referral_code = 'FAKECODE059' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.referral_code cannot be changed by users


-- TEST L — referred_by
-- update public.profiles set referred_by = '<OTHER_USER_ID>'::uuid where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.referred_by cannot be changed by users


-- TEST M — is_beta
-- update public.profiles set is_beta = true where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.is_beta cannot be changed by users


-- TEST N — beta_code
-- update public.profiles set beta_code = 'BETA059' where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.beta_code cannot be changed by users


-- TEST O — email_sequence_day
-- update public.profiles set email_sequence_day = 99 where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.email_sequence_day cannot be changed by users


-- TEST P — last_nurture_email_at
-- update public.profiles set last_nurture_email_at = now() where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.last_nurture_email_at cannot be changed by users


-- TEST Q — is_churned
-- update public.profiles set is_churned = true where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.is_churned cannot be changed by users


-- TEST R — nurture_unsubscribed
-- update public.profiles set nurture_unsubscribed = true where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR — profiles.nurture_unsubscribed cannot be changed by users
-- NOTE: Production unsubscribe API uses service_role — see Section 6.


-- =============================================================================
-- SECTION 4 — Credits RPC (authenticated + service_role)
-- =============================================================================

-- TEST S1 — deduct_credits success (authenticated, credits >= 1)
-- Prerequisites: authenticated context; claim.sub = <TEST_USER_ID>; credits >= 1
-- select public.deduct_credits('<TEST_USER_ID>'::uuid, 1);
-- EXPECTED: integer — new balance (previous minus 1). Not NULL.


-- TEST S2 — deduct_credits insufficient credits (must not go negative)
-- Prerequisites: set test user credits to 0 via service_role first, then authenticated:
-- select public.deduct_credits('<TEST_USER_ID>'::uuid, 1);
-- EXPECTED: NULL (no row updated; balance stays 0).


-- TEST S3 — deduct_credits cross-user (authenticated caller, different p_user_id)
-- Prerequisites: authenticated as <TEST_USER_ID>, call deduct for <OTHER_USER_ID>:
-- select public.deduct_credits('<OTHER_USER_ID>'::uuid, 1);
-- EXPECTED: NULL — must not deduct another user's credits.


-- TEST S4 — add_credits via service_role (webhook regression)
-- Prerequisites: service_role context; test user credits known:
-- select public.add_credits('<TEST_USER_ID>'::uuid, 5);
-- EXPECTED: integer — balance increased by 5.


-- TEST S5 — add_credits blocked for authenticated (optional)
-- Prerequisites: authenticated context:
-- select public.add_credits('<TEST_USER_ID>'::uuid, 5);
-- EXPECTED: permission denied (function not granted to authenticated in 056).


-- =============================================================================
-- SECTION 5 — GUC bypass attack (authenticated context) — P0
-- =============================================================================
-- Simulates forged billing GUC + direct credits UPDATE (SQL injection / psql attack).
--
-- P0 requirement (staging 2026-06-09): forged GUC must NOT allow credit inflation.
-- Trigger blocks NEW.credits > OLD.credits for non-service_role regardless of GUC.
--
-- Run as authenticated (NOT postgres superuser):
--
-- TEST P0-A — forged GUC + credit inflation (must FAIL)
--   reset role;
--   set local role authenticated;
--   select set_config('request.jwt.claim.role', 'authenticated', true);
--   select set_config('request.jwt.claim.sub', '<TEST_USER_ID>', true);
--   select set_config('app.profile_billing_update', '1', true);
--   update public.profiles
--     set credits = credits + 999
--     where id = '<TEST_USER_ID>'::uuid;
--
-- EXPECTED: FAILURE — one of:
--   - permission denied for column credits (grant model)
--   - ERROR 42501 profiles.credits cannot be increased by users (trigger)
--   - ERROR 42501 profiles.credits cannot be changed directly (trigger fallback)
-- MUST NOT succeed with increased credits.
--
-- After P0-A, verify balance unchanged:
--   select credits from public.profiles where id = '<TEST_USER_ID>'::uuid;
--
-- TEST P0-B — deduct_credits still works after GUC forgery attempt
-- Prerequisites: restore credits to known value (e.g. 100) via service_role; authenticated context:
--   select public.deduct_credits('<TEST_USER_ID>'::uuid, 1);
-- EXPECTED: integer — balance decreased by 1 (e.g. 99). Not NULL.
--
-- LIMITATIONS:
--   - postgres superuser bypasses REVOKE — invalid test context.
--   - Supabase REST/PostgREST clients cannot run arbitrary set_config; simulates SQL injection.
--   - Section 9 P0 sign-off requires P0-A blocked AND P0-B success.


-- =============================================================================
-- SECTION 6 — Agency / tenant flows
-- =============================================================================

-- TEST T1 — User cannot self-assign tenant (authenticated)
-- update public.profiles
--   set tenant_id = '<TEST_TENANT_ID>'::uuid, tenant_role = 'member'
--   where id = '<TEST_USER_ID>'::uuid;
-- EXPECTED: ERROR on tenant_id or tenant_role (Section 3 B/C).


-- TEST T2 — Service role agency invite path (simulates acceptTenantInvite server action)
-- Prerequisites: service_role context; test user not yet in tenant:
-- update public.profiles
--   set tenant_id = '<TEST_TENANT_ID>'::uuid,
--       tenant_role = 'member'
--   where id = '<TEST_USER_ID>'::uuid
-- returning id, tenant_id, tenant_role;
-- EXPECTED: SUCCESS — 1 row. Server-side invite flow remains viable.


-- TEST T3 — Service role nurture_unsubscribed (simulates /api/unsubscribe)
-- update public.profiles
--   set nurture_unsubscribed = true
--   where id = '<TEST_USER_ID>'::uuid
-- returning id, nurture_unsubscribed;
-- EXPECTED: SUCCESS under service_role (users blocked in TEST R).


-- TEST T4 — Manual app smoke (document only — not SQL)
-- [ ] Accept tenant invite via app join link on staging/local
-- [ ] Verify profile.tenant_id set by server, not client PATCH
-- [ ] Agency dashboard loads for owner test account


-- =============================================================================
-- SECTION 7 — Service role regression (webhooks / billing)
-- =============================================================================
-- Use service_role context. Revert in Section 8.


-- TEST U1 — plan update (Stripe webhook path)
-- update public.profiles set plan = 'starter' where id = '<TEST_USER_ID>'::uuid returning plan;
-- EXPECTED: SUCCESS


-- TEST U2 — stripe fields
-- update public.profiles
--   set stripe_customer_id = 'cus_staging_svc_test',
--       stripe_subscription_id = 'sub_staging_svc_test'
--   where id = '<TEST_USER_ID>'::uuid
-- returning stripe_customer_id, stripe_subscription_id;
-- EXPECTED: SUCCESS


-- TEST U3 — direct credits update (service_role bypasses trigger)
-- update public.profiles set credits = 100 where id = '<TEST_USER_ID>'::uuid returning credits;
-- EXPECTED: SUCCESS


-- TEST U4 — agency_plan + agency_credits
-- update public.profiles
--   set agency_plan = 'starter', agency_credits = 50
--   where id = '<TEST_USER_ID>'::uuid
-- returning agency_plan, agency_credits;
-- EXPECTED: SUCCESS


-- =============================================================================
-- SECTION 8 — Cleanup (service_role context)
-- =============================================================================
-- Restore baseline from snapshot 1i:
--
-- update public.profiles
-- set
--   full_name = '<ORIGINAL_FULL_NAME>',
--   username = <baseline or null>,
--   bio = <baseline or null>,
--   daily_suggestions_email = <baseline>,
--   push_token = <baseline or null>,
--   onboarding_completed = <baseline>,
--   tenant_id = <baseline tenant_id or null>,
--   tenant_role = <baseline tenant_role or null>,
--   credits = <baseline credits>,
--   plan = <baseline plan or null>,
--   stripe_customer_id = <baseline or null>,
--   stripe_subscription_id = <baseline or null>,
--   agency_plan = <baseline or null>,
--   agency_credits = coalesce(<baseline agency_credits>, 0),
--   is_admin = <baseline>,
--   nurture_unsubscribed = <baseline>
-- where id = '<TEST_USER_ID>'::uuid;
--
-- verify:
-- select id, full_name, credits, plan, tenant_id, tenant_role from public.profiles
-- where id = '<TEST_USER_ID>'::uuid;


-- =============================================================================
-- SECTION 9 — Coverage checklist (manual sign-off)
-- =============================================================================
-- Schema
-- [ ] 1a–1i schema checks passed
--
-- Allowed updates (authenticated)
-- [ ] A1 full_name
-- [ ] A2 username (if column exists)
-- [ ] A3 bio
-- [ ] A4 daily_suggestions_email
-- [ ] A5 push_token (if column exists)
-- [ ] A6 onboarding_completed (if column exists)
--
-- Blocked columns (authenticated)
-- [ ] B  tenant_id
-- [ ] C  tenant_role
-- [ ] D  credits direct
-- [ ] E  plan
-- [ ] F  stripe_customer_id
-- [ ] G  stripe_subscription_id
-- [ ] H  agency_plan
-- [ ] I  agency_credits
-- [ ] J  is_admin
-- [ ] K  referral_code
-- [ ] L  referred_by
-- [ ] M  is_beta
-- [ ] N  beta_code
-- [ ] O  email_sequence_day
-- [ ] P  last_nurture_email_at
-- [ ] Q  is_churned
-- [ ] R  nurture_unsubscribed
--
-- Credits RPC
-- [ ] S1 deduct_credits success
-- [ ] S2 deduct_credits insufficient → NULL, no negative balance
-- [ ] S3 deduct_credits cross-user → NULL
-- [ ] S4 add_credits service_role success
-- [ ] S5 add_credits authenticated denied (optional)
--
-- GUC attack (P0 — staging sign-off blocked until green)
-- [ ] P0-A forged GUC + credits +999 blocked; balance unchanged
-- [ ] P0-B deduct_credits still reduces balance after P0-A
--
-- GUC attack (legacy checklist)
-- [ ] Section 5 — set_config + credits UPDATE blocked under authenticated
--
-- Agency / service paths
-- [ ] T1 user self-tenant blocked
-- [ ] T2 service_role tenant assign OK
-- [ ] T3 service_role nurture_unsubscribed OK
-- [ ] T4 manual app smoke (optional)
--
-- Service role regression
-- [ ] U1 plan
-- [ ] U2 stripe fields
-- [ ] U3 credits
-- [ ] U4 agency fields
--
-- Cleanup
-- [ ] Section 8 baseline restored
-- =============================================================================

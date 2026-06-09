# Migration 059 — Local / Staging Test Plan

**Migration:** `supabase/migrations/059_protect_profiles_sensitive_columns.sql`  
**Test script:** `scripts/db/test-migration-059-profiles-security.sql`

## Hard rules

- **Never** run the test script against **Production**.
- **Never** run `supabase db push`, SQL Editor migrations, or remote DDL against Production until sign-off below.
- Use a **dedicated test user** (not a real customer). The script mutates profile fields and credits.

## What migration 059 does

- Adds `BEFORE UPDATE` trigger `protect_profiles_sensitive_columns` on `public.profiles`.
- `REVOKE UPDATE` on sensitive columns from `anon` and `authenticated`.
- Replaces `deduct_credits` with a version that sets `app.profile_billing_update = '1` for controlled credit deductions.
- Drops legacy trigger `protect_profiles_role` (superseded by the new trigger).

## Option A — Local Supabase (recommended first)

### Prerequisites

- Docker running (Supabase local stack).
- Repo checked out at branch containing migration 059.
- Supabase CLI installed.

### Steps

1. **Confirm you are not on Production**

   ```bash
   # Local only — API URL should be http://127.0.0.1:54321
   supabase status
   ```

2. **Reset local DB and apply all migrations**

   ```bash
   supabase db reset
   ```

   This applies migrations `001` … `059` including the profiles protection migration.

3. **Create a test user**

   - Sign up via local app (`npm run dev` + `http://localhost:3000/signup`), **or**
   - Insert via Supabase Studio / SQL using `auth.users` + `profiles` (match your local auth flow).

4. **Note IDs**

   - `<TEST_USER_ID>` — uuid of the test profile.
   - `<TEST_TENANT_ID>` — optional uuid from `public.tenants` (for tenant block tests).
   - `<OTHER_USER_ID>` — second test user (for cross-user `deduct_credits` test).

5. **Run the test script**

   - Open `scripts/db/test-migration-059-profiles-security.sql`.
   - Replace placeholders.
   - Execute **one section at a time** in psql or Supabase Studio SQL editor connected to **local** only.
   - For authenticated tests, set JWT simulation (see script header) before each block.

6. **Sign-off**

   Complete the checklist at the bottom of the test script. All items must pass.

## Option B — Staging Supabase project

Use when local tests pass and you need a cloud-like environment.

### Prerequisites

- Separate Supabase **staging** project (not the Production project ref).
- Staging env vars documented (e.g. `STAGING_SUPABASE_URL` — do not reuse Production `.env.local`).

### Steps

1. **Verify environment**

   - Confirm SQL client / CLI points at **staging** project ref.
   - Double-check URL host matches staging dashboard, not Production.

2. **Apply migration 059 on staging only**

   ```bash
   # Example — adjust for your staging link; NEVER use Production project ref
   supabase link --project-ref <STAGING_PROJECT_REF>
   supabase db push
   ```

   Alternatively paste migration SQL into **staging** SQL Editor once (manual apply).

3. **Create staging test user**

   - Dedicated email like `security-test-059@your-staging-domain.test`.
   - Ensure row exists in `public.profiles`.

4. **Run test script**

   Same as local: manual blocks, authenticated JWT simulation, checklist sign-off.

5. **Cleanup**

   Use Section 8 in the test script to restore baseline credits and profile fields.

## Production release gate

Do **not** apply migration 059 to Production until **all** of the following are true:

| Gate | Owner |
|------|--------|
| Local Supabase: test script checklist 100% green | Engineering |
| Staging Supabase: test script checklist 100% green | Engineering |
| Manual smoke: signup, settings name save, credit deduction via app | QA |
| Manual smoke: Stripe webhook path (service role) still updates plan/credits | Engineering |
| Manual smoke: agency invite accept (service role sets `tenant_id`) | Engineering |
| Database backup / point-in-time recovery confirmed | Ops |
| Agency-WIP **not** deployed before 059 is live | Product/Eng |

## Auth context cheat sheet

**Authenticated user (simulates Supabase client):**

```sql
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '<TEST_USER_ID>', true);
```

**Service role (simulates webhooks / server service client):**

```sql
reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
```

**Important:** Default `postgres` superuser in SQL Editor is **not** the same as `authenticated` or `service_role`. Superuser bypasses REVOKE; use role simulation for realistic tests.

## Files in this folder

| File | Purpose |
|------|---------|
| `test-migration-059-profiles-security.sql` | Manual test blocks + checklist |
| `README-test-migration-059.md` | This plan |

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| All updates succeed as postgres | Wrong session role — use authenticated simulation |
| `deduct_credits` returns NULL | `auth.uid()` not set to test user, or insufficient credits |
| Column missing in 1a schema check | Older migration not applied — run `supabase db reset` locally |
| GUC test still increases credits | Critical bug — do not deploy; REVOKE on `credits` should block direct UPDATE |

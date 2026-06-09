# Migration 059 — Staging Test Plan (Supabase Cloud)

**Branch:** `fix/security-profiles-migration-059`  
**Migration:** `supabase/migrations/059_protect_profiles_sensitive_columns.sql`  
**Test script:** `scripts/db/test-migration-059-profiles-security.sql`  
**Local test README:** `scripts/db/README-test-migration-059.md`

This document is the **operational plan** for testing Migration 059 on a **separate Supabase staging project**. It does **not** authorize any Production change.

---

## 1. Why staging is required

| Blocker | Impact |
|---------|--------|
| Local Supabase unavailable (Docker Desktop + WSL2 missing) | Cannot run `supabase db reset` locally |
| Production has **no** Migration 059 yet | Client self-update of `credits`, `plan`, `tenant_id` etc. is a **P0 risk** until 059 is validated |
| Agency-WIP must not deploy before 059 | Staging is the safe gate before Production DDL |

Staging proves:

- Trigger + column REVOKE block user escalation
- `deduct_credits` / `add_credits` still work
- Service-role webhook/agency paths still work
- Harmless profile fields remain editable

---

## 2. Hard prohibitions

**Never during staging prep or execution:**

- Touch **Production** database (SQL Editor, CLI, app pointed at Production)
- Run `supabase db push` against Production project ref
- Run `supabase link` against Production project ref
- Paste migration SQL into Production SQL Editor
- Run `scripts/db/test-migration-059-profiles-security.sql` against Production
- Push this branch to `main` or `master` as part of migration testing
- Deploy app code to Production solely to test 059 (optional staging app only)
- Copy Production customer data into staging

**If you are unsure which project is which — stop. Do not proceed.**

---

## 3. Prerequisites

### 3.1 Separate Supabase project

Create or designate a **dedicated staging project** in Supabase Dashboard:

- Name suggestion: `influexai-staging` or `influexai-security-059`
- Region: same as Production (EU) if possible, for parity
- **Must not** be the Production project used by `influexaicreator.com`

### 3.2 Credentials (store separately — never commit)

| Variable | Purpose |
|----------|---------|
| `STAGING_SUPABASE_URL` | Staging API URL (`https://<ref>.supabase.co`) |
| `STAGING_SUPABASE_ANON_KEY` | Staging anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Staging service role (server/tests only) |
| `STAGING_PROJECT_REF` | 20-char project ref for `supabase link` |

Use a **separate env file**, e.g. `.env.staging.local` (gitignored). Do **not** reuse Production `.env.local`.

### 3.3 CLI auth

```bash
supabase login
# Uses browser; stores token locally — do not commit
```

### 3.4 Schema baseline on staging

Staging DB should match Production **pre-059** schema:

- Either: fresh project + apply migrations `001`–`058` only first, **then** 059
- Or: staging clone/snapshot from Production **before** 059 (no customer PII if avoidable)

**Recommended:** empty staging project + full migration history from repo up to `058`, verify, then apply `059`.

### 3.5 No real customer data

- Synthetic emails only (`security-test-059+…@example.test`)
- No Production user UUIDs copied unless anonymized test clones

### 3.6 Staging project identification (before any link)

Confirm **all** of the following in Supabase Dashboard and `supabase projects list` before `supabase link`:

| Check | Requirement |
|-------|-------------|
| Project name | Dedicated staging name (e.g. `influexai-staging`) — **not** the live app project |
| Dashboard status | Project shows **Healthy** (if Unhealthy → stop; staging not ready) |
| Project ref | 20-char ref stored only in `.env.staging.local` / password manager — **never** commit |
| Ref verification | Masked ref in ops notes must match list output (e.g. `vjmq…jlpxh`) and **must not** match the Production app ref |
| API URL | Staging `https://<ref>.supabase.co` — different hostname from Production app env |
| Keys | Separate anon + service_role keys from Dashboard → Settings → API |

After link, verify without logging full ref in chat/logs:

```powershell
# Local check only — compare masked ref to staging notes
Get-Content supabase\.temp\project-ref
```

If ref matches Production app project → **unlink immediately**, do not run `db push`.

### 3.7 Local Supabase blocked (this environment)

Docker Desktop and WSL2 are **not** installed on the primary dev machine. `supabase status` against local stack will fail. **Cloud staging is mandatory** for Migration 059 validation until local stack is available.

---

## 4. Minimal test data

Create **after** staging schema is ready (before or after 059 depending on step):

| Asset | Purpose |
|-------|---------|
| **`<TEST_USER_ID>`** | Primary test user (`auth.users` + `profiles`) |
| Profile row | `credits >= 10` for deduct tests |
| **`<OTHER_USER_ID>`** | Second user for cross-user `deduct_credits` (Section 4 S3) |
| **`<TEST_TENANT_ID>`** | Optional `tenants` row for agency block/assign tests (Section 6) |
| Baseline snapshot | Run test script Section 1i; save output for cleanup |

### Seed checklist (manual)

- [ ] Test user A signed up or inserted via service role
- [ ] Test user B signed up or inserted
- [ ] User A `credits` set to known value (e.g. 100) via **service role**
- [ ] Optional: tenant row + owner for agency invite simulation

---

## 5. Allowed commands (staging only)

Execute **only** after manual confirmation that `STAGING_PROJECT_REF` ≠ Production ref.

### 5.1 Pre-flight (read-only)

```bash
cd C:\Projekte\influexai-security-059
git checkout fix/security-profiles-migration-059

# Confirm NOT linked to Production
# - No supabase/.temp/project-ref pointing at Production
# - Dashboard URL matches STAGING project name/ref

supabase projects list
# Visually confirm staging project ref before linking
```

### 5.2 Link to staging (interactive — confirm ref twice)

```bash
# STOP if ref matches Production app project
supabase link --project-ref <STAGING_PROJECT_REF>
```

When prompted for database password, use **staging** DB password from Dashboard (not Production).

### 5.3 Apply migrations

**Option A — full push (staging empty or behind repo):**

```bash
# DANGER: only after STAGING_PROJECT_REF confirmed
supabase db push
```

**Option B — single migration (staging already at 058):**

Paste `supabase/migrations/059_protect_profiles_sensitive_columns.sql` into **staging** SQL Editor once, or:

```bash
supabase migration up --include-all
# Only if migration history matches repo
```

### 5.4 Run test script

- Open **staging** Supabase Dashboard → SQL Editor  
  **or** `psql` with staging connection string from Dashboard (Settings → Database)
- Run `scripts/db/test-migration-059-profiles-security.sql` section by section
- Use JWT simulation from script header (`authenticated` / `service_role`)

**Do not** run the script via Production Studio URL.

---

## 6. Release gates (staging sign-off)

All must pass before Production migration is even scheduled:

### 6.1 Test script Section 9 checklist

| Section | Must pass |
|---------|-----------|
| 1 Schema | Trigger, functions, REVOKE checks |
| 2 Allowed updates | full_name, bio, daily_suggestions_email, etc. |
| 3 Blocked columns | All sensitive columns reject authenticated UPDATE |
| 4 Credits/RPC | deduct success, insufficient→NULL, cross-user→NULL, add_credits service |
| 5 GUC bypass | set_config + credits UPDATE **fails** as authenticated |
| 6 Agency | user self-tenant blocked; service role assign OK |
| 7 Service role | plan, stripe, credits, agency fields updatable |
| 8 Cleanup | baseline restored |

### 6.2 Regression gates

- [ ] `deduct_credits` works from authenticated session (app-like)
- [ ] `add_credits` works as service role only
- [ ] Normal profile settings save (name, daily email toggle) works in app **if** staging app configured
- [ ] No unexpected block on `daily_suggestions_email`, `push_token`, `username`
- [ ] Agency invite accept path (service role sets `tenant_id`) — manual or SQL TEST T2

### 6.3 Security gates

- [ ] Authenticated user **cannot** set `credits`, `plan`, `tenant_id`, `is_admin`
- [ ] GUC bypass does **not** allow credit inflation via direct UPDATE
- [ ] Production **not** linked during test session

---

## 7. Production release (after staging PASS only)

**Do not execute this section until staging sign-off is documented.**

| Gate | Requirement |
|------|-------------|
| Staging | Section 9 checklist 100% green |
| Backup | Supabase PITR / manual backup confirmed |
| Window | Low-traffic maintenance window agreed |
| Rollback | Plan to drop trigger + restore `deduct_credits` from 056 if critical failure |
| App smoke | Post-migration: signup, settings name, one credit deduction, Stripe webhook dry-run on staging |
| Agency | Agency-WIP deploy **blocked** until Production 059 applied + smoke PASS |

Production apply methods (future — not in this doc's scope):

- `supabase link --project-ref <PRODUCTION_REF>` + reviewed `db push` **only** with explicit ops approval
- Or controlled SQL in Production SQL Editor with two-person review

---

## 8.1 Staging P0 — forged billing GUC (2026-06-09)

Initial staging run on `influexai-staging` (`jvjm...lpxh`) found **P0**:

- `set_config('app.profile_billing_update', '1')` as authenticated
- then `UPDATE profiles SET credits = credits + 999`
- **Result:** credits inflated (100 → 1099)

**Root cause:** Trigger allowed any credits change with forged GUC; column REVOKE alone was unreliable with `GRANT UPDATE ON profiles`.

**Fix in migration 059 (security branch):**

| Requirement | Fix |
|-------------|-----|
| Forged GUC must not allow credit **increase** | Trigger rejects `NEW.credits > OLD.credits` for non-service roles |
| `deduct_credits` must still work | GUC bypass allows **decrease only** (`NEW.credits <= OLD.credits`) |
| `add_credits` / Stripe webhooks | Unchanged — `service_role` / `supabase_admin` bypass at trigger top |
| Harmless profile updates | Table `REVOKE UPDATE` + explicit `GRANT UPDATE (harmless columns)` |

**Production remains blocked** until staging re-test Sections 1–9 are **100% green**, including:

- [ ] P0-A: forged GUC + `credits + 999` blocked, balance unchanged
- [ ] P0-B: `deduct_credits` still deducts after P0-A attempt
- [ ] S4: `add_credits` via service_role still works

Do **not** run `db push` on Production until this checklist passes on staging.

---

## 8. Command plan (DO NOT RUN until staging confirmed)

Copy this checklist; check each box manually before running the next command.

```
[ ] I created or identified a SEPARATE Supabase staging project
[ ] I verified STAGING_PROJECT_REF is NOT the Production app project
[ ] I am in worktree: C:\Projekte\influexai-security-059
[ ] Branch: fix/security-profiles-migration-059 @ `b113a93` or later (includes this README at `9f87fe0+`)
[ ] supabase login completed
[ ] .env.staging.local created (gitignored) with staging keys only

--- Link (staging only) ---
[ ] supabase link --project-ref <STAGING_PROJECT_REF>
[ ] Dashboard URL opened — project name says staging

--- Schema ---
[ ] Staging at migration 058 (or full push from repo)
[ ] supabase db push   # ONLY if ref confirmed staging

--- Test data ---
[ ] Test users A/B created
[ ] Credits seeded via service role

--- Tests ---
[ ] scripts/db/test-migration-059-profiles-security.sql — all sections PASS
[ ] Section 9 checklist signed off

--- Production ---
[ ] NOT RUN — separate change ticket after staging PASS
```

### Reference commands (staging)

```bash
cd C:\Projekte\influexai-security-059
git checkout fix/security-profiles-migration-059
supabase login
supabase projects list

# CONFIRM STAGING REF TWICE
supabase link --project-ref <STAGING_PROJECT_REF>

# Review diff before push
supabase db diff --linked

# Apply pending migrations to STAGING only
supabase db push

# Optional: verify migration version
supabase migration list
```

### Commands explicitly forbidden on Production

```bash
# NEVER for Migration 059 testing:
supabase link --project-ref <PRODUCTION_PROJECT_REF>
supabase db push --linked    # when linked to Production
# SQL Editor on Production dashboard with 059 script
```

---

## 9. Troubleshooting

| Issue | Action |
|-------|--------|
| `supabase login` fails | Browser auth; check SUPABASE_ACCESS_TOKEN not in committed files |
| Linked wrong project | `supabase unlink` or delete `supabase/.temp`; re-link staging only |
| `db push` wants to drop objects | Stop; review diff; staging should be disposable |
| Tests pass as postgres but fail as authenticated | Use role simulation from test script header |
| Local Docker later available | Prefer local first per `README-test-migration-059.md`; staging still required before Production |

---

## 10. Related files

| File | Role |
|------|------|
| `supabase/migrations/059_protect_profiles_sensitive_columns.sql` | Migration under test |
| `scripts/db/test-migration-059-profiles-security.sql` | Manual test blocks |
| `scripts/db/README-test-migration-059.md` | Local + general test plan |
| `scripts/db/README-staging-migration-059.md` | This staging plan |

---

## 11. Current environment status

Last audit: **2026-06-09** (P0 GUC fix committed — staging re-test pending)

| Check | Status |
|-------|--------|
| Worktree | `C:\Projekte\influexai-security-059` |
| Branch | `fix/security-profiles-migration-059` |
| Staging linked | `jvjm...lpxh` (when `supabase/.temp/project-ref` present) |
| Migration 059 P0 fix | **committed** — awaiting staging re-test |
| Staging test (pre-fix) | **FAIL** — GUC credit inflation |
| Production DB / SQL / `db push` | **No** — not touched |
| Production migration | **Blocked** until staging re-test green |
| Agency-WIP deploy | **Blocked** until Production 059 live |

### Next operator steps (staging re-test after P0 fix)

1. Confirm linked ref = staging `jvjm...lpxh` (not Production)
2. Re-apply migration 059 SQL on staging (replace trigger + privilege block)
3. Seed test users (§4)
4. Run `scripts/db/test-migration-059-profiles-security.sql` Sections 1–9
5. **P0 gate:** Section 5 P0-A + P0-B must pass
6. Sign off §6 before any Production scheduling (§7)

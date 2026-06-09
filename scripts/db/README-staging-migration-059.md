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

Last audit: **2026-06-03** (security worktree prep — no migration executed)

| Check | Status |
|-------|--------|
| Worktree | `C:\Projekte\influexai-security-059` |
| Branch | `fix/security-profiles-migration-059` |
| HEAD | `9f87fe0` (test script `b113a93`; app baseline `1f70415` on `origin/main` / `origin/master`) |
| Working tree | clean |
| Local Supabase (Docker/WSL2) | **blocked** — not available |
| `supabase/.temp/project-ref` | **absent** — not linked to any cloud project |
| Worktree linked to Supabase cloud | **No** |
| Linked project type | **unknown** (no link file) |
| Production link excluded | **Yes** — no cloud link; Production not targeted by CLI in this session |
| `supabase login` (automation shell) | **missing** — run `supabase login` in operator terminal before link |
| Staging project `influexai-staging` | **pending** — create/link per §3.6; confirm Healthy in Dashboard |
| Migration 059 applied on staging | **No** |
| Test script green | **pending** |
| Production DB / SQL / `db push` | **No** — not touched |
| Push to `main` / `master` | **No** |
| Deploy | **No** |

### Next operator steps (staging only)

1. `supabase login` in terminal used for migration work
2. `supabase projects list` — confirm staging project name + masked ref (§3.6)
3. Dashboard: staging project **Healthy**
4. `supabase link --project-ref <STAGING_PROJECT_REF>` — **not** Production ref
5. Verify `supabase\.temp\project-ref` matches staging masked ref
6. Seed minimal test data (§4)
7. `supabase db push` **only** after manual staging ref confirmation (§8)
8. Run `scripts/db/test-migration-059-profiles-security.sql` Sections 1–9 on staging
9. Sign off §6 before any Production scheduling (§7)

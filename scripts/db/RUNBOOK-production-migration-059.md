# Production Runbook — Migration 059 (profiles security)

**Status:** Prepared — **NOT authorized for execution** until explicit ops sign-off.  
**Security branch:** `fix/security-profiles-migration-059`  
**Required commit:** `20b9c2b` — `fix(db): prevent forged billing bypass credit inflation`  
**Migration file:** `supabase/migrations/059_protect_profiles_sensitive_columns.sql`  
**Staging sign-off:** PASS (2026-06-09, `influexai-staging`, ref `jvjm...lpxh`)  
**Test script (staging/local only):** `scripts/db/test-migration-059-profiles-security.sql`  
**Staging plan:** `scripts/db/README-staging-migration-059.md`

---

## 1. Purpose

Migration 059 protects sensitive columns on `public.profiles`:

| Goal | Mechanism |
|------|-----------|
| Block client self-elevation of billing/access fields | `BEFORE UPDATE` trigger `protect_profiles_sensitive_columns` |
| Block direct credit/plan/tenant/admin changes by users | Trigger exceptions + table-level `REVOKE UPDATE` + explicit harmless-column `GRANT` |
| Close forged GUC credit inflation (P0) | Trigger rejects `NEW.credits > OLD.credits` for non-service roles; GUC bypass allows **decrease only** |
| Preserve billing RPCs | `deduct_credits` (authenticated decrease), `add_credits` (service_role) |
| Preserve webhooks / server paths | `service_role` / `supabase_admin` bypass at trigger top |

**Production without 059:** authenticated users can PATCH sensitive profile fields — **P0 risk**.  
**Agency-WIP deploy:** blocked until 059 is live on Production **and** post-migration smoke passes.

---

## 2. Prerequisites (all required before Production window)

| # | Requirement | Verify |
|---|-------------|--------|
| 1 | Staging re-test **PASS** at commit `20b9c2b` | Sections 1–5, 7–9 green; P0-A/P0-B pass (see staging README §8.1) |
| 2 | This runbook reviewed by operator + second reviewer (DB/security) | Sign-off row in §9 |
| 3 | **Backup / recovery** ready | Supabase PITR enabled **or** manual backup taken immediately before DDL |
| 4 | **Low-traffic window** scheduled | Off-peak EU; on-call available |
| 5 | Operator confirms **Production** project | Dashboard name **`influexai`**; ref **`hszj...olkm`** — **NOT** `jvjm...lpxh` (staging) |
| 6 | Agency-WIP **not** deployed to Production during migration window | Communicate freeze to team |
| 7 | Security branch at `20b9c2b` (or later with same migration content) checked out locally | `git log -1 --oneline` |
| 8 | Rollback decision maker identified | See §8 |

### Environment identification (never skip)

| Environment | Project name | Ref (masked) | Linked in CLI? |
|-------------|--------------|--------------|----------------|
| **Production** | `influexai` | `hszj...olkm` | Only during approved window |
| **Staging** | `influexai-staging` | `jvjm...lpxh` | Must **not** be linked during Production apply |

Production may **only** be linked or modified after **explicit written/verbal ops approval** for this runbook execution.

---

## 3. Absolute prohibitions

**Do not:**

- Run blind `supabase db push` on Production (staging proved baseline/duplicate-version issues)
- Link CLI to wrong project (double-check ref before any command)
- Execute migration without verified backup
- Run migration SQL while linked to staging ref
- Deploy Agency-WIP or access-layer changes before post-migration smoke PASS
- Merge security branch to `main`/`master` **before** Production migration succeeds (if migration files must live on default branch)
- Paste migration into Production SQL Editor without two-person ref check
- Share or commit API keys / service_role keys

**If unsure which project is Production — STOP.**

---

## 4. Pre-checks (Production — read-only until §6)

Execute in order. **Read-only** checks may use Production SQL Editor or `supabase db query --linked` **only after** ref verified as `hszj...olkm`.

### 4.1 Git / artifact

```powershell
cd C:\Projekte\influexai-security-059
git checkout fix/security-profiles-migration-059
git log -1 --oneline
# EXPECTED: 20b9c2b fix(db): prevent forged billing bypass credit inflation
```

- [ ] Branch correct  
- [ ] Migration file matches reviewed commit: `supabase/migrations/059_protect_profiles_sensitive_columns.sql`

### 4.2 Supabase Dashboard (Production)

- [ ] Open project **`influexai`** (not `influexai-staging`)
- [ ] Ref in Settings → General matches **`hszj...olkm`**
- [ ] Project status **Healthy**
- [ ] Note current time (UTC) for change log

### 4.3 Backup

- [ ] Settings → Database → Backups: PITR available **or** manual backup created
- [ ] Backup timestamp recorded: _______________
- [ ] Recovery path understood (PITR restore vs point-in-time)

### 4.4 Schema baseline (read-only SQL on Production)

Run in Production SQL Editor; save outputs.

**Profiles columns (sample):**

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by column_name;
```

**Existing triggers on profiles:**

```sql
select tgname, pg_get_triggerdef(t.oid)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles' and not t.tgisinternal;
```

**Migration 059 not yet applied — expect:**

- [ ] No trigger `protect_profiles_sensitive_columns` (or note if partial apply)
- [ ] Legacy `protect_profiles_role` may exist (059 drops it)

**Functions:**

```sql
select proname, prosecdef
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname in ('deduct_credits', 'add_credits', 'protect_profiles_sensitive_columns');
```

**Grants (informational):**

```sql
select
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as auth_table_update,
  has_column_privilege('authenticated', 'public.profiles', 'credits', 'UPDATE') as auth_credits_update,
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') as auth_fullname_update;
```

**Rough scale:**

```sql
select count(*) as profile_count from public.profiles;
select count(*) as auth_user_count from auth.users;
```

- [ ] Counts recorded: profiles __________ auth.users __________

### 4.5 Pre-check sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Operator | | | [ ] |
| Reviewer | | | [ ] |

**Do not proceed to §6 unless all §4 boxes checked.**

---

## 5. Recommended execution path

### Preferred: Production SQL Editor (controlled DDL)

**Why:** Staging showed `supabase db push` on empty/partial baselines fails (missing `profiles` bootstrap, duplicate migration versions `033`/`038`, extension ordering). Production already has full schema; **single-file apply** is lower risk than full push.

**Steps overview:**

1. Confirm Dashboard project = **`influexai`** / ref **`hszj...olkm`**
2. Open SQL Editor in **that** project
3. Paste **entire** contents of `059_protect_profiles_sensitive_columns.sql` from commit `20b9c2b`
4. Review in second tab: trigger logic, grant list, `deduct_credits` replacement
5. Execute once
6. Capture success/error output
7. Run §7 post-migration smoke (read-only + minimal app checks)

### Alternative: CLI `db push` (higher risk — avoid unless migration history verified)

Only if **all** true:

- `supabase migration list` shows Production at `058`, local `059` pending only
- No duplicate-version conflicts
- Operator accepts full diff

```powershell
# ONLY AFTER EXPLICIT APPROVAL — verify ref twice
cd C:\Projekte\influexai-security-059
# Confirm supabase/.temp/project-ref masked = hszj...olkm
supabase link --project-ref <PRODUCTION_REF>
supabase db diff --linked   # review
supabase db push            # NOT recommended as default path
```

**Default recommendation:** SQL Editor apply (§6).

---

## 6. Production execution steps (authorized window only)

**STOP** if ref is `jvjm...lpxh` or project name is `influexai-staging`.

| Step | Action | Done |
|------|--------|------|
| 1 | Announce maintenance / low-traffic window | [ ] |
| 2 | Final backup taken or PITR confirmed | [ ] |
| 3 | Dashboard: project **`influexai`**, ref **`hszj...olkm`** | [ ] |
| 4 | SQL Editor → New query | [ ] |
| 5 | Paste full `059_protect_profiles_sensitive_columns.sql` from `20b9c2b` | [ ] |
| 6 | Reviewer confirms SQL matches repo file | [ ] |
| 7 | **Run** query | [ ] |
| 8 | Result: success / error (paste to change log, not public chat) | [ ] |
| 9 | Proceed immediately to §7 smoke | [ ] |

**Expected DDL effects:**

- `plan` column added if missing
- Trigger function + trigger created/replaced
- Legacy `protect_profiles_role` trigger dropped
- Table `REVOKE UPDATE` + harmless-column `GRANT UPDATE` for `authenticated`
- `deduct_credits` replaced (GUC decrease-only path)

**Do not run** test script Section 3–5 mutating blocks on real customer rows in Production.

---

## 7. Post-migration smoke

### 7.1 SQL checks (Production — read-only / synthetic)

Use **operator test account** or dedicated smoke user — **not** random customers.

**Schema:**

```sql
-- Trigger exists
select tgname from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where c.relname = 'profiles' and tgname = 'protect_profiles_sensitive_columns';

-- Grants after 059
select
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as auth_table_update,
  has_column_privilege('authenticated', 'public.profiles', 'credits', 'UPDATE') as auth_credits_update,
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') as auth_fullname_update;
-- EXPECTED: table_update=false, credits_update=false, fullname_update=true
```

| Check | Pass |
|-------|------|
| Trigger `protect_profiles_sensitive_columns` exists | [ ] |
| `deduct_credits` / `add_credits` exist | [ ] |
| Grant model matches staging (no blanket table UPDATE) | [ ] |

**Functional (use smoke test user `<SMOKE_USER_ID>`):**

- [ ] Harmless update: `full_name` saves via app Settings
- [ ] User **cannot** increase `credits` via API/client (expect error or no-op)
- [ ] User **cannot** change `tenant_id`, `tenant_role`, `plan`, `is_admin`
- [ ] One real `deduct_credits` flow (e.g. small generation) reduces balance correctly
- [ ] Stripe webhook test event / known billing path still credits via service_role (or monitor next real webhook)
- [ ] **P0 regression:** forged GUC + credit increase **not** tested on Production with SQL — validated on staging only

### 7.2 Application smoke (Production app)

| Check | Pass |
|-------|------|
| Login / signup callback | [ ] |
| Dashboard loads | [ ] |
| Credits display loads | [ ] |
| Settings: name + daily email toggle save | [ ] |
| KI-Agent plan preview | [ ] |
| Gallery loads | [ ] |
| Agency dashboard (if applicable smoke account) | [ ] optional — T4 from staging |

### 7.3 Post-smoke sign-off

| Role | Name | Date | PASS/FAIL |
|------|------|------|-----------|
| Operator | | | |
| Reviewer | | | |

**Agency-WIP deploy:** remains blocked until this table is **PASS**.

---

## 8. Rollback / emergency

**Do not auto-rollback.** Escalate to DB owner.

### Symptoms → actions

| Symptom | Immediate action |
|---------|------------------|
| Login/dashboard broken | Capture error logs; **do not** deploy Agency-WIP; assess PITR |
| Harmless profile updates fail | Check harmless-column `GRANT UPDATE` list in migration § grant block |
| `deduct_credits` returns NULL / errors | Inspect trigger + function definitions; compare to `20b9c2b` file |
| Webhooks fail to credit | Confirm service_role path; trigger bypass for `service_role` |
| Widespread 42501 errors | Identify column; may need emergency grant fix (harmless only) |

### Rollback options (manual decision only)

1. **PITR / backup restore** — preferred for catastrophic failure  
2. **Surgical SQL** (last resort, two-person review):

   - Drop trigger: `drop trigger if exists protect_profiles_sensitive_columns on public.profiles;`
   - Restore previous `deduct_credits` from migration `056_atomic_credits.sql` (repo)
   - Re-grant table UPDATE if app requires pre-059 behavior (understand security regression)

**Warning:** Rollback re-opens P0 client escalation until 059 is re-applied correctly.

Document all emergency SQL in internal change log — not in public channels.

---

## 9. Sign-off criteria (Production complete)

Migration considered **live** only when:

- [ ] §6 executed successfully on **`hszj...olkm`**
- [ ] §7 SQL + app smoke **PASS**
- [ ] No open **P0/P1** from migration
- [ ] P0 GUC bypass confirmed closed on staging (`20b9c2b`) — do not re-prove via Production exploit
- [ ] Agency-WIP re-evaluated for deploy (separate checklist)
- [ ] Security branch merge to `main`/`master` scheduled if migration files must ship with app (separate PR — not part of this runbook execution)
- [ ] Team notified: sensitive profile PATCH blocked; billing via RPC/webhooks only

---

## 10. Related artifacts

| File | Role |
|------|------|
| `supabase/migrations/059_protect_profiles_sensitive_columns.sql` | DDL to apply |
| `scripts/db/test-migration-059-profiles-security.sql` | Staging/local tests — **not** Production customer data |
| `scripts/db/README-staging-migration-059.md` | Staging evidence + P0 fix notes |
| `scripts/db/RUNBOOK-production-migration-059.md` | This document |

---

## 11. Change log (fill during execution)

| Field | Value |
|-------|-------|
| Planned window (UTC) | |
| Operator | |
| Reviewer | |
| Backup/PITR ref | |
| Execution method | SQL Editor / db push |
| Result | |
| Post-smoke | PASS / FAIL |
| Notes | |

---

**This runbook does not authorize execution by itself. Explicit ops approval required.**

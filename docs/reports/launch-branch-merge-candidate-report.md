# Launch Branch Merge Candidate Report — PHASE 4G.8-C

**Date:** 2026-06-16  
**Branch:** `launch-train/overnight-safe-completion`  
**HEAD:** `f01d156`  
**Merge-base (master before launch):** `6d1c9b9`  
**Report type:** Human review only — **no automatic merge action**

---

## Executive Summary

| Item | Status |
|------|--------|
| Preconditions | ✅ All pass |
| Security diff | ✅ Clean |
| Migration 067 | ✅ Present + staging applied |
| Provider guards | ✅ 85 routes |
| Quality checks | ✅ Green |
| **Recommendation** | **FULL MERGE** |

> **Repository note (2026-06-16):** `origin/master` already contains merge commit `0dbe06d` (`merge: overnight launch train readiness`), which incorporates all commits through `f01d156`. The launch branch has **no diff vs current master** (`git diff master...HEAD` empty). This report documents merge candidacy; if merge is already on master, use this for audit trail and post-merge follow-ups.

---

## 1. Preconditions

| Check | Result |
|-------|--------|
| Branch | `launch-train/overnight-safe-completion` ✅ |
| `.env.local` staged | No ✅ |
| `public/images/lora-training/` staged | No (untracked only) ✅ |
| Secrets in diff vs master | None ✅ |
| Lint | 0 errors, 62 warnings ✅ |
| Unit tests | 197/197 ✅ |
| Typecheck | ✅ |
| Build | ✅ |
| Migration 067 | `supabase/migrations/067_stripe_webhook_service_role_grants.sql` ✅ |
| Provider guard sweep | 85 API routes with `providerRouteGuardResponse` ✅ |

**Stop conditions:** None triggered.

---

## 2. Commits Since Merge-Base (`6d1c9b9..f01d156`)

| Commit | Message | Category | Merge assessment |
|--------|---------|----------|------------------|
| `6077cc1` | chore: prepare first provider staging flow | Provider guard + tests | ✅ Safe mergeable — **critical** |
| `1cfd602` | chore: prepare output persistence gallery flow | Gallery copy | ✅ Safe mergeable |
| `e7f229e` | chore: refine tool workspace ux states | UX/readiness | ✅ Safe mergeable |
| `f90c522` | style: polish pricing and credits surfaces | UI/polish | ✅ Safe mergeable (optional cherry-pick) |
| `73b1df3` | style: align dashboard workspace surfaces | UI/polish | ✅ Safe mergeable (optional cherry-pick) |
| `0ad66b6` | docs: add production readiness audit | Docs only | ✅ Safe mergeable |
| `c29463e` | docs: fix overnight report final HEAD | Docs only | ✅ Safe mergeable |
| `f5c4c5f` | chore: harden launch branch merge readiness | Migration + guard sweep | ✅ Safe mergeable — **critical** |
| `f01d156` | docs: add final self review safety gate | Docs only | ✅ Safe mergeable |

**None** marked "should not merge" or "needs blocking review."

---

## 3. Security Diff Review

Compared `6d1c9b9..f01d156` (98 files, +900 / −181).

| Area | Finding |
|------|---------|
| Secrets / `.env.local` | Not in diff ✅ |
| Stripe Live activation | Detection-only guards; no live keys ✅ |
| Production Supabase activation | Detection default ref only in `environment-safety.server.ts` ✅ |
| Provider activation | `PROVIDERS_DISABLED` enforced server-side; not removed ✅ |
| Upload/training new paths | None added ✅ |
| Guards removed | None; guards **added** ✅ |
| Plan gates loosened | No; `hasPaidBillingPlan` for credit top-ups unchanged ✅ |
| `canExecute` with PROVIDERS_DISABLED | `tool-action-readiness.ts` keeps `canExecute=false` when disabled ✅ |
| Webhook safety | Idempotency + livemode check unchanged in stripe webhook ✅ |
| Idempotency removed | No ✅ |

**Security review:** **PASS**

---

## 4. Migration 067 Status

| Item | Detail |
|------|--------|
| File | `supabase/migrations/067_stripe_webhook_service_role_grants.sql` |
| Removed duplicate | `060_stripe_webhook_service_role_grants.sql` (version conflict with `060_characters`) |
| Content | GRANTs only — `stripe_events`, `processed_checkout_*`, `stripe_payments`, `profiles`, `tenants` |
| RLS | Not disabled ✅ |
| Staging | Local 067 = Remote 067 ✅ |
| Production | **Not applied** — apply only at intentional prod deploy |

---

## 5. Provider Guard Status

| Metric | Value |
|--------|-------|
| Routes with `providerRouteGuardResponse` | **85** |
| Direct FAL/Akool/Anthropic/ElevenLabs imports missing guard | **0** |
| Unit tests | `provider-execution-guard.test.ts` (4 tests) |

**Intentional exclusions (not blockers):**

- Stripe billing/webhook routes
- `lora/webhook` — inbound FAL callback with `FAL_WEBHOOK_SECRET`
- DB-only routes (`ai-creator/characters` CRUD, `dashboard/asset`)
- `scrape-product` — non-AI HTTP scrape

---

## 6. Gallery Status

| Source | Role | Status |
|--------|------|--------|
| `generations` | **Active** — `/dashboard/gallery` | ✅ |
| `gallery_assets` | **Legacy** — Studio init sidebar | Table missing on staging; no repo migration |
| UI copy | Points to `/dashboard/gallery` | ✅ Accurate |

**Blocker for provider smoke:** SSOT decision recommended, not merge blocker.

---

## 7. Billing Status

| Check | Status |
|-------|--------|
| Stripe test mode guards | Unchanged ✅ |
| Webhook runtime + livemode | Unchanged ✅ |
| Idempotency tables | Unchanged ✅ |
| Credit top-up plan gate | `hasPaidBillingPlan` ✅ |
| Migration 067 webhook GRANTs | Fixes staging `permission denied` ✅ |

---

## 8. UX / Design Changes (low risk)

- Pricing container mobile overflow clip (`influex-foundation.css`)
- Dashboard section header typography (`DashboardSurface.tsx`)
- Tool readiness copy when provider disabled (`tool-action-readiness.ts`)
- `ToolExecutionDisabledNotice` test id
- Gallery path hint in `production-tool-setup-ui.ts`

---

## 9. Open Risks (post-merge, not launch)

| ID | Risk | Severity |
|----|------|----------|
| R1 | Gallery dual schema | Info |
| R2 | Migration 067 not on production yet | Info — deploy step |
| R3 | Provider staging smoke not executed | Info — human QA |
| R4 | Auth-gated UI smokes incomplete | Low |

---

## 10. Recommendation

### **FULL MERGE**

All safety preconditions met. No DO NOT MERGE blockers.

**Human review still required** for:
- Spot-check `environment-safety.server.ts` and migration 067 SQL
- Confirm 85-route guard sweep in PR diff (mostly mechanical import swap)
- Acknowledge gallery SSOT as follow-up

### If cherry-picking instead

**Must-have:** `6077cc1`, `f5c4c5f`  
**Optional:** docs commits, style commits

---

## 11. Commands for Human (next day)

**If merge not yet on master:**

```bash
git checkout master
git pull --ff-only origin master
git merge --no-ff launch-train/overnight-safe-completion -m "merge: overnight launch train readiness"
npm run lint && npm run test:unit -- --run && npm run typecheck && npm run build
git push origin master
```

**If merge already on master (`0dbe06d`):**

```bash
# Verify parity
git diff master launch-train/overnight-safe-completion

# Post-merge staging checks
supabase migration list   # confirm 067 on staging
# Stripe webhook smoke — no permission denied on stripe_events
```

**Do not:** enable Stripe Live, set `PROVIDERS_DISABLED=false`, or run provider smokes without explicit approval.

---

## 12. Related Reports

| Report | Status |
|--------|--------|
| `overnight-launch-train-report.md` | ✅ |
| `production-readiness-audit.md` | ✅ |
| `final-self-review-safety-gate.md` | ✅ FULL MERGE |
| `provider-staging-smoke-plan.md` | ❌ Not separate (see overnight report Block 2) |
| `provider-guard-coverage.md` | ❌ Not separate (see this report §5) |
| `gallery-persistence-decision.md` | ❌ Not separate (see this report §6) |

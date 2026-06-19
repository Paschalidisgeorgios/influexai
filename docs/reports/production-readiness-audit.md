# Production Readiness Audit — InfluexAI Creator Studio

**Date:** 2026-06-16  
**Branch audited:** `launch-train/overnight-safe-completion` @ `73b1df3`  
**Scope:** Read-only audit — no production activation performed

---

## Executive Summary

| Area | Staging-ready | Production-ready | Blocked |
|------|---------------|------------------|---------|
| Auth & sessions | ✅ | ⚠️ needs prod Supabase review | — |
| Stripe billing (test) | ✅ | ❌ live keys not validated | Live activation |
| Webhooks & idempotency | ✅ (staging) | ⚠️ grants may need migration file | Missing repo migration for service_role GRANTs |
| Credits & plan gates | ✅ | ⚠️ needs load testing | — |
| Provider execution | ❌ disabled by design | ❌ | Human Go/No-Go |
| Gallery / storage | ⚠️ partial | ❌ | Dual schema, no real writes in safe-dev |
| Legal pages | ⚠️ placeholder-level | ❌ | Final legal review |
| Monitoring | ⚠️ basic | ❌ | No dedicated prod observability stack documented |

**Go/No-Go for production launch:** **NO-GO** — providers, legal finalization, gallery SSOT, and human-supervised provider smoke still required. **Merge to master for hardening:** **GO** (after human PR review).

---

## What Is Production-Ready?

- **Application build pipeline:** lint (0 errors), unit tests (196/196), typecheck, and `next build` pass on the launch branch.
- **Environment safety layer:** `environment-safety.server.ts` detects production Supabase ref, Stripe live keys, active provider keys, and blocks mutating writes in non-production runtimes unless explicit override flags are set.
- **Stripe test-mode checkout flow:** Subscription and credit-pack checkout with redirect URLs, plan gate for top-ups, and user-facing error mapping validated in prior smokes.
- **Webhook idempotency design:** `stripe_events`, `processed_checkout_sessions`, and atomic credit grants with dedup tables (migrations 057, 058, 056).
- **Auth & RLS foundation:** Supabase auth with profile-based plan/credits; sensitive column protection (migration 059).
- **Legal page shells:** `/impressum`, `/datenschutz`, `/agb` exist with structured layout components.

---

## What Is Staging-Ready?

- **Supabase staging** (`jvjmqtxlqfqaoyjklpxh`): linked locally; migration history 001–066 in sync (per project baseline).
- **Stripe test mode:** `STRIPE_MODE=test`, `sk_test_***`, `pk_test_***`, test price IDs via env check script.
- **Safe-dev defaults:** `PROVIDERS_DISABLED=true`, no provider calls from guarded routes (`/api/generate-image`, `/api/viral-hook`).
- **Billing smokes (prior session):**
  - Subscription grant: `test@influexai.test` → Starter, 50 credits, Stripe customer + subscription IDs set.
  - Credit pack: +25 credits (Small Pack), subscription unchanged.
  - Idempotency: webhook replay → no double credit.
  - Cancel: no DB mutation, correct redirect URLs.
- **Dev tooling:** `scripts/check-stripe-checkout-env.mjs`, `scripts/merge-stripe-env.mjs`, Stripe CLI webhook forwarding documented.

---

## What Is Blocked?

| Blocker | Reason | Owner action |
|---------|--------|--------------|
| Provider live execution | `PROVIDERS_DISABLED=true`; most API routes still use `developmentWriteGuardResponse` only | Enable per-tool after staging smoke plan approval |
| Stripe Live | No live key validation; test-only smokes | Configure live products/prices + webhook endpoint in Stripe dashboard |
| Production Supabase | Staging ref hardcoded as safe default; prod ref `hszjafdelcydnppyolkm` detected in docs only | Verify prod env vars on Vercel; never use prod locally |
| Gallery dual schema | `generations` table + `/dashboard/gallery` vs legacy `gallery_assets` / Studio paths | Consolidation decision |
| `gallery_assets` migration | No migration file in repo for legacy table | Confirm if table exists only in prod/staging manually |
| Service role GRANTs for webhooks | ✅ migration 067 in repo + staging applied | Prod deploy must run 067 | Duplicate 060_stripe file removed |
| Legal final claims | Impressum populated; AGB/Datenschutz need legal review for launch claims | External legal review |
| Real uploads / LoRA / training | Explicitly out of scope for safe-dev | Separate launch phase |

---

## What Is Risky?

1. **Incomplete provider guard coverage:** ~~Only 2 routes~~ **Resolved in 4G.8-B** — 85 API routes guarded; scrape-product and DB-only routes intentionally excluded.
2. ~~**Webhook GRANTs not in repo**~~ **Resolved** — migration 067 committed and applied to staging.
3. **Credit double-booking:** Idempotency tested manually once; no automated integration test against live Stripe CLI replay in CI.
4. **Production-like local runtime:** `next start` locally treated as non-production with write guards — good — but misconfigured `.env.local` could still point at prod Supabase if override flags set.
5. **Intent-based pricing copy:** Marketing intent URLs on `/pricing` promise capabilities (Avatar Studio, Autopilot) not fully provider-enabled.
6. **Mobile UX:** Light polish applied; not exhaustively tested at 390px for all tool workspaces.

---

## Human Decisions Required

1. **First provider to enable in staging:** Recommended `POST /api/generate-image` (FAL, 5 credits, gallery persist) — approve env: `PROVIDERS_DISABLED=false`, sandbox FAL key, staging Supabase only.
2. **Gallery consolidation:** Single source of truth — `generations` + storage bucket `generated_assets` vs legacy Studio gallery.
3. ~~**Migration 067:** Commit service_role GRANTs~~ ✅ Done — apply on production at deploy time.
4. **Stripe Live go-live checklist:** Products, prices, webhook signing secret, Customer Portal, tax settings.
5. **Legal sign-off:** AGB, Datenschutz, AI output disclaimers, refund policy alignment with Stripe.
6. **Production env on Vercel:** Confirm all vars; ensure `PROVIDERS_DISABLED` strategy for preview vs production.

---

## Recommended Next Steps (Concrete)

1. ~~Add `supabase/migrations/067_stripe_webhook_service_role_grants.sql`~~ ✅ Done + applied to staging
2. ~~Extend `providerRouteGuardResponse()` to all FAL/Akool/Anthropic mutating routes~~ ✅ 85 routes guarded
3. Run documented staging provider smoke (human-supervised): generate-image → −5 credits → gallery entry → refund on forced failure.
4. Run Stripe live **test-mode parity check** on Vercel preview with staging Supabase before switching keys.
5. Legal review pass on `/agb` and `/datenschutz`.
6. Add CI job: `npm run lint && npm run test:unit && npm run typecheck && npm run build` (already green locally).

---

## Security Status

| Check | Status |
|-------|--------|
| No secrets in git | ✅ `.env.local` untracked |
| No Stripe live keys in repo | ✅ |
| Staging Supabase only in safe-dev | ✅ verified via env script |
| `public/images/lora-training/` untracked | ✅ |
| Provider calls blocked when disabled | ✅ 85 API routes guarded |
| Webhook signature verification | ✅ implemented in stripe webhook route |

---

## Test & Build Baseline (launch branch)

- **Lint:** 0 errors, 63 warnings (pre-existing)
- **Unit tests:** 196 passed
- **Typecheck:** pass
- **Build:** pass

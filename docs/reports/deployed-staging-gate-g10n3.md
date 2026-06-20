# Deployed Staging/Preview Gate — G.10-N3

**Date:** 2026-06-16  
**Branch:** `master`  
**Repo HEAD:** `6c3c7a9`  
**Staging Supabase ref (local/docs):** `jvjmqtxlqfqaoyjklpxh`

---

## 1. Safety (local preflight)

| Check | Result |
|-------|--------|
| `PROVIDERS_DISABLED` (local) | `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` (local) | `false` |
| `STRIPE_MODE` (local) | `test` |
| Local Supabase ref | staging `jvjmqtxlqfqaoyjklpxh` |
| Stripe keys (local prefix) | `sk_test_` / `pk_test_` |
| Provider smoke executed | **no** |
| Stripe smoke executed | **no** |
| `vercel --prod` executed | **no** |
| Provider-Call ausgeführt | **no** (only `{}` probe on public URL) |

Local tests: lint ✅ (0 errors), unit 228 ✅, typecheck ✅, build ✅.

---

## 2. Vercel situation

| Item | Result |
|------|--------|
| Vercel CLI | `54.14.2`, authenticated as `paschalidisgeorgios` |
| Project linked | yes (`paschalidisgeorgios-projects/influexai`) |
| Preview deploy created (this phase) | **yes** — `npx vercel --yes` (no `--prod`) |
| Preview URL | https://influexai-e8j8cvtws-paschalidisgeorgios-projects.vercel.app |
| Preview target | `preview` |
| Latest production deployment (pre-existing, not triggered by `--prod`) | https://influexai-3qv9cddhh-paschalidisgeorgios-projects.vercel.app |
| Production aliases (unchanged) | `influexai.vercel.app`, `influexaicreator.com`, `www.influexaicreator.com`, … |
| Commit intent | master HEAD `6c3c7a9`; production auto-deploy ~16:39 local (after G.10-N2 push) |

**Note:** Production deployment existed before this gate; we did **not** run `vercel --prod`. A new **Preview-only** deployment was created for isolation.

---

## 3. Env audit (Vercel — names only, no values)

### Present on Vercel

| Variable | Preview | Production |
|----------|---------|------------|
| `STRIPE_SECRET_KEY` | ✅ | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | ✅ |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ✅ |
| `FAL_KEY` | ✅ (Preview **main** branch only) | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ |

### Missing on Vercel (both Preview and Production)

| Variable | Required for this gate |
|----------|------------------------|
| `PROVIDERS_DISABLED` | **yes** — must be `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | **yes** — must be `false` |
| `STRIPE_MODE` | **yes** — should be `test` on staging gate |
| `NEXT_PUBLIC_PROVIDERS_DISABLED` | recommended (mirrors server flag in `next.config.ts`) |

**Prefix verification:** Stripe key **prefixes on Vercel could not be verified** without pulling decrypted values (not done). Local `.env.local` confirms `sk_test_` / `pk_test_` pattern only for local dev.

**Supabase ref on Vercel Production:** encrypted — **not verified** in this phase. Must be confirmed manually that Production env points to staging ref `jvjmqtxlqfqaoyjklpxh` before any provider smoke.

---

## 4. Preview URL gate results

**URL:** https://influexai-e8j8cvtws-paschalidisgeorgios-projects.vercel.app

| Check | Result |
|-------|--------|
| Deployment Protection | **401** without Vercel SSO / bypass |
| `vercel curl` bypass (home) | **500** `MIDDLEWARE_INVOCATION_FAILED` |
| Root cause (inferred) | Preview env lacks `NEXT_PUBLIC_SUPABASE_URL` / Supabase keys |
| Route matrix | **not completed** on Preview (app does not boot) |
| Provider API probe | **not completed** on Preview (middleware failure) |

Preview is **not** a usable staging gate URL until Preview env is completed.

---

## 5. Production alias read-only checks (informational — not staging target)

**URL used:** https://influexai.vercel.app (public, existing production deployment)

These checks validate deploy health only. **This URL is not approved as a provider-disabled staging gate** (see §6).

| Route | Status | Notes |
|-------|--------|-------|
| `/` | 200 | OK |
| `/pricing` | 200 | OK |
| `/auth/sign-in` | 200 | OK |
| `/auth/sign-up` | 200 | OK |
| `/dashboard/image-generator` | 307 | Auth redirect (expected) |
| `/dashboard/image-gen` | 308 → `/dashboard/image-generator` | Redirect OK |
| `/dashboard?tool=image-gen` | 307 | Auth redirect (expected) |
| `/dashboard/gallery` | 307 | Auth redirect (expected) |
| `/checkout/success` | 200 | OK |

No 500 on public routes tested. No Stripe checkout triggered.

---

## 6. Provider-disabled API guard (deployed)

**Probe:** `POST /api/generate-image` body `{}`  
**URL:** https://influexai.vercel.app/api/generate-image

| Expected (gate) | Actual |
|-----------------|--------|
| 503 `PROVIDERS_DISABLED` | **400** `{"error":"Bitte gib eine Beschreibung ein."}` |

**Interpretation:**

- Request passed provider guard and reached validation → **`PROVIDERS_DISABLED` is not active on Vercel Production**.
- No generation was triggered (empty prompt rejected).
- No credits deducted (no auth, no successful generation).
- **Blocker:** deployed production runtime does **not** enforce provider-disabled gate.

Auth-before-guard is acceptable for authenticated flows; the issue is guard absence, not 401 vs 503 on unauthenticated `{}`.

---

## 7. Auth / visual QA

| Item | Status |
|------|--------|
| Logged-in visual QA on Preview | **deferred** — Preview middleware failure + Deployment Protection |
| Logged-in visual QA on Production alias | **deferred** — out of scope for provider-disabled staging gate |
| Local G.10-N/N2 Playwright | prior phase PASS (reference) |

---

## 8. Gate verdict

| Gate | Result |
|------|--------|
| **Deployed Staging Gate (providers disabled)** | **FAIL** |
| Repo/build ready to deploy | **PASS** |
| Preview URL usable | **FAIL** (env + protection) |
| Provider-disabled on deployed URL | **FAIL** (production alias) |

### Blockers

1. **Vercel Preview missing Supabase env** → middleware crash.
2. **Vercel missing `PROVIDERS_DISABLED=true`** (Preview + Production) → provider guard open on production URL.
3. **Preview Deployment Protection** blocks unauthenticated automated route QA without bypass token workflow.

### Pre-live gates (before provider smoke)

1. Set on **Preview** (and verify on any staging target):
   - `PROVIDERS_DISABLED=true`
   - `NEXT_PUBLIC_PROVIDERS_DISABLED=true` (optional UI mirror)
   - `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`
   - `STRIPE_MODE=test`
   - Staging `NEXT_PUBLIC_SUPABASE_URL` / anon / service role keys (`jvjmqtxlqfqaoyjklpxh`)
   - Stripe **test** keys only (`sk_test_` / `pk_test_`)
2. Re-deploy Preview; confirm `POST /api/generate-image {}` → **503** `PROVIDERS_DISABLED`.
3. Confirm Supabase ref is staging, not production ref `hszjafdelcydnppyolkm`.
4. Only then: supervised provider smoke (`npm run smoke:generate-image:run-safe`) in explicit window.

---

## 8. Gate verdict (updated G.10-N4B)

| Gate | N4 | N4B |
|------|----|-----|
| **Preview Staging Gate (providers disabled)** | FAIL | **PASS** |
| **Production domain readiness** | FAIL | **FAIL** (500 — Supabase env) |
| Repo/build deployable | PASS | PASS |

---

## 9. Final provider-UI-smoke freigabe?

**G.10-O on Preview:** freigabefähig nach N4B (supervised window, Preview URL only).

**Production alias / www.influexaicreator.com:** **not** until Production Readiness Gate.

---

## 10. Stop rules (next smoke)

- Do **not** set `PROVIDERS_DISABLED=false` until Preview returns 503 when disabled.
- Do **not** run `npm run smoke:generate-image:run-safe` on production alias.
- Do **not** run `vercel --prod` for smoke.
- Do **not** use Stripe live keys or production Supabase.
- Re-verify credits baseline (`billingtest@`) immediately before smoke.

---

## 11. Follow-up G.10-N4 / N4B (2026-06-16)

- **G.10-N4:** Manual Vercel env checklist — see `docs/reports/vercel-env-hardening-g10n4.md` §4.
- **G.10-N4B:** Preview Gate **PASS**
  - URL: https://influexai-9aamkaafv-paschalidisgeorgios-projects.vercel.app
  - `POST /api/generate-image` → `success=false`, `code=PROVIDERS_DISABLED` (via `vercel curl`)
  - No provider call, no generation, no credits changed
- **Production Pre-Live:** `www.influexaicreator.com` logs **500** (Supabase URL/Key missing in Production runtime) — **no `vercel --prod`**

---

## 12. Env (no secrets)

**Local now:** `PROVIDERS_DISABLED=true`, `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`, `STRIPE_MODE=test`, staging Supabase ref.

**Vercel (observed):** safety kill-switch vars **absent**; Preview Supabase **absent**; Production Supabase **present** (ref unverified).

**Outside / required before smoke:** set kill-switch on target deploy env; staging Supabase only; Stripe test mode only.

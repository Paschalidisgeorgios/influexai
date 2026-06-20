# Provider Smoke Safe Path — PHASE G.10-D

**Date:** 2026-06-20  
**Branch:** `master`  
**Status:** Path decided + narrow local override implemented — **no provider call in this phase**

---

## Executive Summary

| Item | Decision |
|------|----------|
| **Recommended path** | **Vercel Preview** (staging env) with narrow `ALLOW_SAFE_DEV_PROVIDER_SMOKE` |
| Local override built | ✅ Yes — **only** `POST /api/generate-image` |
| Broad overrides | ❌ Not used (`ALLOW_PRODUCTION_DEV_WRITES` / `I_UNDERSTAND_*`) |
| Provider call in G.10-D | ❌ **None** — preparation only |

**Why Preview + narrow override:** G.10-C showed that `PROVIDERS_DISABLED=false` + FAL + service role on **local `next dev`** triggers `DEV_WRITE_GUARD_BLOCKED`. Vercel Preview is also non-production (`VERCEL_ENV=preview`), so the **same guard applies** without the narrow override. Preview remains the preferred **isolation** target; the override is the **mechanism** to allow one supervised smoke safely.

---

## 1. Vercel Preview / Staging Suitability

| Criterion | Preview + staging | Local `next dev` |
|-----------|---------------------|------------------|
| Staging Supabase `jvjmqtxlqfqaoyjklpxh` | ✅ Configurable in Vercel Preview env | ✅ `.env.local` |
| Stripe test mode | ✅ | ✅ |
| FAL sandbox key | ✅ Preview env only | ✅ `.env.local` only |
| Dev write guard | Blocks without override | Blocks without override (G.10-C) |
| Production runtime | ❌ Never use `VERCEL_ENV=production` | N/A |
| **Verdict** | ✅ **Preferred** for first real smoke | ✅ Allowed **only** with `ALLOW_SAFE_DEV_PROVIDER_SMOKE` |

---

## 2. Implemented: Narrow Override (G.10-D)

### Code

| File | Change |
|------|--------|
| `src/lib/environment-safety.server.ts` | `assessSafeDevProviderSmoke()`, `generateImageProviderGuardResponse()` |
| `src/app/api/generate-image/route.ts` | Uses narrow guard instead of `providerRouteGuardResponse()` |
| `tests/unit/lib/environment-safety.test.ts` | Override assessment tests |
| `tests/unit/lib/provider-execution-guard.test.ts` | generate-image guard wiring |
| `scripts/supervised-generate-image-smoke.mjs` | Audit includes `safe_provider_smoke` |
| `.env.staging.example` | Documented smoke env names |

### Env: `ALLOW_SAFE_DEV_PROVIDER_SMOKE`

**Must be `true` only during the supervised smoke window.**

All conditions required (server-side `assessSafeDevProviderSmoke()`):

| Check | Required |
|-------|----------|
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `true` |
| `PROVIDERS_DISABLED` | **`false`** (providers enabled for smoke) |
| Supabase ref | Staging `jvjmqtxlqfqaoyjklpxh` |
| `STRIPE_MODE` | `test` |
| Stripe secret | `sk_test_*` only |
| FAL key | `FAL_API_KEY` or `FAL_KEY` present |
| Akool keys | **Must be absent** |
| ElevenLabs key | **Must be absent** |
| Runtime | Non-production (`development` / `preview`, not `production`) |

### What stays blocked

- All other provider routes (still use `providerRouteGuardResponse()`)
- LoRA, Face Swap, Live Creator, Akool, ElevenLabs, uploads, training
- Stripe live, production Supabase
- Broad dev-write overrides
- Multi-tool agent runs

---

## 3. Env Checklist (no secrets committed)

### Default (day-to-day)

```env
PROVIDERS_DISABLED=true
# FAL_API_KEY in .env.local / Preview only — never commit
# ALLOW_SAFE_DEV_PROVIDER_SMOKE unset
```

### Supervised smoke window only (Preview or local)

Set in Vercel Preview env **or** local `.env.local` (never commit):

```env
ALLOW_SAFE_DEV_PROVIDER_SMOKE=true
PROVIDERS_DISABLED=false
# FAL_API_KEY=<sandbox>
# Staging Supabase + sk_test_ Stripe (already configured)
```

**After smoke — immediately revert:**

```env
PROVIDERS_DISABLED=true
# unset ALLOW_SAFE_DEV_PROVIDER_SMOKE
```

---

## 4. Smoke Execution Steps (G.10-E — not run yet)

### A — Pre-flight

```bash
git checkout master && git pull
npm run lint && npm run test:unit -- --run && npm run typecheck && npm run build
node scripts/supervised-generate-image-smoke.mjs audit
# Expect: safe_to_proceed: true, safe_provider_smoke.allowed: true
node scripts/supervised-generate-image-smoke.mjs baseline
```

### B — Preview deployment (preferred)

1. Push branch with G.10-D code to trigger Vercel Preview.
2. In Vercel → Preview env: set smoke window vars (§3).
3. Confirm Preview URL uses staging Supabase ref.
4. **Do not** enable production env vars.

### C — Smoke window

1. Human observer assigned.
2. Set `ALLOW_SAFE_DEV_PROVIDER_SMOKE=true` + `PROVIDERS_DISABLED=false` on Preview (or local).
3. Redeploy / restart dev server.
4. **Exactly one run:**

```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app \
  node scripts/supervised-generate-image-smoke.mjs run
```

Prompt (harmless):

> Minimal cinematic product-style test image, abstract lime-green glass cube on soft ivory background, no text, no logo

### D — Verify

- HTTP 200, `success: true`
- Credits: **−5**
- `generations` row + image URL
- Gallery `/dashboard/gallery` (SSOT)
- No secrets in logs

### E — Close window

1. Revert env: `PROVIDERS_DISABLED=true`, remove `ALLOW_SAFE_DEV_PROVIDER_SMOKE`.
2. Redeploy Preview or restart local dev.
3. Guard probe → other routes still 503/403 as before; generate-image blocked again without override.

---

## 5. Local fallback (if Preview unavailable)

Same as §4 but on `http://localhost:3000`:

1. Add to `.env.local` only: `ALLOW_SAFE_DEV_PROVIDER_SMOKE=true`, `PROVIDERS_DISABLED=false`.
2. Ensure **single** `PROVIDERS_DISABLED` line (G.10-C duplicate caused 503).
3. Restart `npm run dev`.
4. One run: `node scripts/supervised-generate-image-smoke.mjs run`
5. Revert `.env.local` immediately.

---

## 6. Open Risks

| Risk | Mitigation |
|------|------------|
| Leaving override enabled | Revert checklist in §4E; audit script flags override |
| Duplicate env keys | One `PROVIDERS_DISABLED` line only |
| Preview misconfigured to prod | `assessSafeDevProviderSmoke` blocks production ref |
| Accidental second provider call | Single run policy; no retries without human Go |

---

## 7. Next Step

**G.10-E:** Human-approved smoke on **Vercel Preview** with override env set for the window only — one `generate-image` call, then revert.

---

## References

- `docs/reports/provider-smoke-generate-image-result.md` — G.10-A/B/C outcomes
- `docs/reports/provider-staging-smoke-plan.md` — original Go/No-Go
- `docs/environment-safety.md` — guard tiers

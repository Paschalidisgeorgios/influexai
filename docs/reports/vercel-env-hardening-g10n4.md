# Vercel Env Hardening & Preview Re-Gate — G.10-N4

**Date:** 2026-06-16  
**Branch:** `master`  
**Repo HEAD (N4):** `a96f2b7` → **N4B finalized after manual env + Preview redeploy**  
**Outcome (N4):** Env manual action required — Preview redeploy deferred  
**Outcome (N4B):** **Preview Gate PASS** — Provider guard confirmed; Production domain remains Pre-Live blocker

---

## 1. Safety (local preflight)

| Check | Result |
|-------|--------|
| `PROVIDERS_DISABLED` (local) | `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` (local) | `false` |
| `STRIPE_MODE` (local) | `test` |
| Local Supabase ref | staging `jvjmqtxlqfqaoyjklpxh` |
| Stripe keys (local prefix) | `sk_test_` / `pk_test_` |
| Provider smoke | **not executed** |
| Stripe smoke | **not executed** |
| `vercel --prod` | **not executed** |
| Valid prompt provider probe | **not executed** (kill-switch not confirmed on Vercel) |
| `.env.local` staged | **no** |

Tests: lint ✅ (0 errors), unit 228 ✅, typecheck ✅, build ✅.

---

## 2. Required env names (from code — no values)

### Supabase (middleware + auth + server)

| Key | Source |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/client.ts`, `server.ts`, middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/client.ts`, `server.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase/service.ts`, webhooks |

### Stripe core

| Key | Source |
|-----|--------|
| `STRIPE_SECRET_KEY` | `src/lib/stripe-runtime-mode.server.ts` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | checkout UI |
| `STRIPE_WEBHOOK_SECRET` | `src/app/api/stripe/webhook/route.ts` |
| `STRIPE_MODE` | `src/lib/environment-safety.server.ts`, smoke guards |
| `NEXT_PUBLIC_STRIPE_MODE` | `src/lib/pricing-surface.ts` |

### Stripe price IDs (subscription + credit packs)

| Key | Source |
|-----|--------|
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY` | `src/lib/subscription-plans.ts` |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_YEARLY` | same |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY` | same |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_YEARLY` | same |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY` | same |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_YEARLY` | same |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY` | same |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_YEARLY` | same |
| `STRIPE_CREDITS_25` | `src/lib/credit-packages.ts` (preferred Small pack) |
| `STRIPE_CREDITS_50` | legacy alias |
| `STRIPE_CREDITS_150` | credit packs |
| `STRIPE_CREDITS_350` | credit packs |
| `STRIPE_CREDITS_800` | credit packs |

Optional client price aliases: `NEXT_PUBLIC_STRIPE_PRICE_SMALL|MEDIUM|LARGE|XL` (`.env.staging.example`).

### Provider kill-switch & smoke guards

| Key | Source |
|-----|--------|
| `PROVIDERS_DISABLED` | `src/lib/environment-safety.server.ts`, `generate-image` guard |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `assessSafeDevProviderSmoke()` — must stay unset/`false` |
| `NEXT_PUBLIC_PROVIDERS_DISABLED` | **build-time** from `PROVIDERS_DISABLED` via `next.config.ts` — set `PROVIDERS_DISABLED=true` at build; separate Vercel key optional but not required if server flag set |

### App / redirects

| Key | Source |
|-----|--------|
| `NEXT_PUBLIC_APP_URL` | auth redirects, checkout return URLs |

### Preview boot minimum (G.10-N3 failure root cause)

Preview **must** have all three Supabase keys + kill-switch vars above or middleware crashes.

---

## 3. Vercel env status (names only — `vercel env ls`)

**Project:** `paschalidisgeorgios-projects/influexai`  
**CLI:** Vercel 54.14.2, linked ✅

### Preview — present

- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Stripe prices: all 8 `NEXT_PUBLIC_STRIPE_INFLUEXAI_*`, `STRIPE_CREDITS_50|150|350|800`
- Providers (main branch only): `FAL_KEY`, `FAL_WEBHOOK_SECRET`, `AKOOL_*`, `ELEVENLABS_API_KEY`
- App: `NEXT_PUBLIC_APP_URL` (Preview main branch)
- Misc: Turnstile, Blob, GA

### Preview — **missing** (blockers)

| Key | Required value type |
|-----|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase URL (`*.supabase.co`, ref `jvjmqtxlqfqaoyjklpxh`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role key |
| `PROVIDERS_DISABLED` | `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `false` (or unset) |
| `STRIPE_MODE` | `test` |
| `NEXT_PUBLIC_STRIPE_MODE` | `test` (recommended) |
| `STRIPE_CREDITS_25` | Stripe test price ID (preferred over legacy `STRIPE_CREDITS_50`) |

### Production — present (partial)

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe core + prices (same as Preview)
- Provider keys: `FAL_KEY`, `AKOOL_*`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`
- Sentry, Resend, Agency Stripe IDs

### Production — **missing kill-switch** (blockers)

| Key | Required value type |
|-----|---------------------|
| `PROVIDERS_DISABLED` | `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `false` (or unset) |
| `STRIPE_MODE` | `test` until live launch |
| `NEXT_PUBLIC_STRIPE_MODE` | `test` (recommended) |

### Live key detection

- **Cannot verify** `sk_live_` / `pk_live_` from Vercel CLI (values encrypted).
- **No live key names** exposed in env list.
- **Supabase ref on Production** not verified without decrypting — must confirm manually equals staging `jvjmqtxlqfqaoyjklpxh`, not production ref `hszjafdelcydnppyolkm`.

---

## 4. Manual Vercel Dashboard checklist

Set in **Vercel → influexai → Settings → Environment Variables**.  
Use **same staging values as local `.env.local`** (never commit). No live Stripe, no production Supabase.

### A — Preview (required before Preview redeploy)

| # | Key | Scope | Value type |
|---|-----|-------|------------|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | **Preview** | Staging URL (`jvjmqtxlqfqaoyjklpxh.supabase.co`) |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Preview** | Staging anon key |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | **Preview** | Staging service role key |
| 4 | `PROVIDERS_DISABLED` | **Preview** | `true` |
| 5 | `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | **Preview** | `false` |
| 6 | `STRIPE_MODE` | **Preview** | `test` |
| 7 | `NEXT_PUBLIC_STRIPE_MODE` | **Preview** | `test` |
| 8 | `STRIPE_CREDITS_25` | **Preview** | Stripe test price ID (optional but recommended) |

After save: **Redeploy Preview** (`npx vercel --yes`, no `--prod`).

### B — Production kill-switch (required before any public provider activity)

| # | Key | Scope | Value type |
|---|-----|-------|------------|
| 1 | `PROVIDERS_DISABLED` | **Production** | `true` |
| 2 | `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | **Production** | `false` |
| 3 | `STRIPE_MODE` | **Production** | `test` (until controlled go-live) |
| 4 | `NEXT_PUBLIC_STRIPE_MODE` | **Production** | `test` |

Also verify Production `NEXT_PUBLIC_SUPABASE_URL` ref is **staging** until intentional production cutover.

### C — Verification after manual set

1. `npx vercel --yes` → note Preview URL
2. `POST /api/generate-image` body `{}` → expect **503** `PROVIDERS_DISABLED` (not 400 validation)
3. Optional valid prompt probe (only after step 2 passes):

```json
{
  "prompt": "safe provider disabled guard probe only, no generation should run",
  "category": "creator",
  "skipPromptEnhancement": true
}
```

Expect **503** — never 200 / `imageUrl` / `generationId`.

---

## 5. Preview deploy

### G.10-N4 (initial audit)

| Item | Result |
|------|--------|
| Preview redeploy executed | **no** — env incomplete |
| Previous Preview URL (G.10-N3) | https://influexai-e8j8cvtws-paschalidisgeorgios-projects.vercel.app |
| Middleware crash fixed | **not verified** — blocked on env |

### G.10-N4B (after manual Vercel env + Preview redeploy)

| Item | Result |
|------|--------|
| Manual Vercel env applied | **yes** (Dashboard — no secrets in repo) |
| Preview redeploy executed | **yes** (`npx vercel --yes`, no `--prod`) |
| Preview status | **Ready** |
| Preview URL | https://influexai-9aamkaafv-paschalidisgeorgios-projects.vercel.app |
| Deployment Protection | **active** — public curl returns 401; `vercel curl` required |
| Middleware crash | **resolved** on Preview (Supabase + kill-switch env present) |
| Landing `/` | loads ✅ |
| `/auth/sign-in` | loads ✅ |

---

## 6. Route checks & provider guard

### G.10-N4 (initial audit)

| Check | Result |
|-------|--------|
| Route matrix on new Preview | **skipped** — no redeploy |
| Provider guard valid prompt probe | **skipped** — `PROVIDERS_DISABLED` not confirmed on Vercel |
| G.10-N3 known state | Production alias returned 400 (guard open) |

### G.10-N4B (Preview verification)

| Check | Method | Result |
|-------|--------|--------|
| `/` | `vercel curl` (bypass) | loads ✅ |
| `/auth/sign-in` | `vercel curl` | loads ✅ |
| `POST /api/generate-image` | `vercel curl` | **PASS** |
| Response shape | JSON | `success=false`, `code=PROVIDERS_DISABLED` |
| Provider call | — | **no** |
| `generationId` | — | **no** |
| `imageUrl` | — | **no** |
| Credits changed | — | **no** |
| Valid prompt probe with generation | — | **not executed** (guard JSON sufficient) |

**Preview Provider Guard: PASS**

---

## 7. Production domain — Pre-Live blocker (not Preview blocker)

| Item | Result |
|------|--------|
| Domain | `www.influexaicreator.com` |
| Vercel logs (observed) | **500** on requests |
| Error class | Supabase URL/Key missing in **Production** runtime |
| Preview impact | **none** — Preview gate independent |
| `vercel --prod` now | **forbidden** until Production Readiness Gate |
| Production Supabase / Stripe Live | deferred to **Production Readiness Gate** |

Do **not** redeploy Production until Production env is complete and verified separately.

---

## 8. G.10-O freigabe?

**Freigabefähig nach sauberem N4B-Report:** supervised **G.10-O** Provider-UI-Smoke may proceed **on Preview URL only**, in explicit window:

1. Credits baseline `billingtest@` documented
2. `PROVIDERS_DISABLED=false` + `ALLOW_SAFE_DEV_PROVIDER_SMOKE=true` **only on Preview**, supervised
3. `npm run smoke:generate-image:run-safe` — **not** on production domain
4. Re-enable kill-switch immediately after smoke

**Not freigabefähig:** production domain fix, live Stripe, production Supabase — separate Pre-Live gate.

---

## 9. Env summary (no secrets)

**Local:** `PROVIDERS_DISABLED=true`, `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`, `STRIPE_MODE=test`, staging Supabase.

**Vercel Preview (N4B):** env manually completed; guard returns `PROVIDERS_DISABLED`; app boots.

**Vercel Production:** kill-switch + Supabase runtime issues on live domain remain **Pre-Live** work; do not `--prod` redeploy in this train step.

---

## 10. Stop rules (unchanged)

- No `vercel --prod`
- No `npm run smoke:generate-image:run-safe` until Preview 503 confirmed
- No `PROVIDERS_DISABLED=false` on any environment without explicit supervised window
- No Stripe live keys, no production Supabase for staging gate

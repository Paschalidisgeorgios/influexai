# Production Credentials Readiness — LIVE-2

Generated: 2026-06-21T07:25:00.000Z

## Launch Status

| Check | Result |
|-------|--------|
| **Launch Status** | **NO-GO** |
| `npm run launch:production` | **not executed** |
| Production deploy | **not executed** |
| Provider runs | **0** |
| Secrets logged | **no** |

---

## 1. `.env.production.local`

| Check | Result |
|-------|--------|
| File exists | **yes** |
| Keys in file | 34 |
| Non-empty production values | **none** for live cutover keys |
| Vercel-pulled empty placeholders | 25 keys with empty values (including Supabase + Stripe) |

**Finding:** `.env.production.local` exists but does **not** contain usable production credentials. Empty values do not override `.env.local`; merged audit falls back to **staging Supabase + Stripe test** from `.env.local`.

**Created:** `.env.production.local.example` — safe placeholder template for manual fill-in (committed, no secrets).

---

## 2. Production Supabase Readiness

**Target ref:** `hszjafdelcydnppyolkm`

| Check | Result |
|-------|--------|
| Merged env URL ref | `jvjmqtxlqfqaoyjklpxh` (staging) — **FAIL** |
| Merged env anon ref | `jvjmqtxlqfqaoyjklpxh` (staging) — **FAIL** |
| Production ref credentials in `.env.production.local` | **missing** (empty) |
| `DATABASE_URL` / `SUPABASE_DB_PASSWORD` | **missing** |
| Local repo migrations | 67 files, max **068** — repo PASS |
| Remote migration 068 | **NOT VERIFIED** |
| `profiles` | **NOT VERIFIED** |
| `generations` | **NOT VERIFIED** |
| `credit_transactions` | **NOT VERIFIED** |
| `deduct_credits` RPC | **NOT VERIFIED** |
| Storage buckets / policies | **NOT VERIFIED** |
| RLS / grants | **NOT VERIFIED** |
| Production DB mutation | **none** |

**Production Supabase Readiness: FAIL** — read-only audit skipped (no production service role + DB URL for ref `hszjafdelcydnppyolkm`).

---

## 3. Stripe Live Readiness

Audit via prefix/existence only (merged env = `.env.local` fallback):

| Key / check | Result |
|-------------|--------|
| `STRIPE_MODE=live` | **missing** (actual: `test`) |
| `NEXT_PUBLIC_STRIPE_MODE=live` | **missing** |
| `STRIPE_SECRET_KEY` | `sk_test_` — **FAIL** (need `sk_live_`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_` — **FAIL** (need `pk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` present (test webhook from local) — **not verified as live** |
| Subscription price IDs (8×) | `price_id_set` (test prices from `.env.local`) |
| `STRIPE_CREDITS_25` | `price_id_set` (test) |
| `STRIPE_CREDITS_50` | **missing** |
| `STRIPE_CREDITS_150/350/800` | `price_id_set` (test) |

**Stripe Live Readiness: FAIL**

---

## 4. Missing Keys (exact list)

Populate in `.env.production.local` (copy from `.env.production.local.example`):

### Production Supabase

- `NEXT_PUBLIC_SUPABASE_URL` (must contain ref `hszjafdelcydnppyolkm`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production JWT)
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` **or** `SUPABASE_DB_PASSWORD` (for read-only migration audit)

### Stripe Live

- `STRIPE_MODE=live`
- `NEXT_PUBLIC_STRIPE_MODE=live`
- `STRIPE_SECRET_KEY` (`sk_live_…`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`)
- `STRIPE_WEBHOOK_SECRET` (`whsec_…` live endpoint)
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_YEARLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_YEARLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_YEARLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_YEARLY`
- `STRIPE_CREDITS_25`
- `STRIPE_CREDITS_50`
- `STRIPE_CREDITS_150`
- `STRIPE_CREDITS_350`
- `STRIPE_CREDITS_800`

### Provider / launch operator

- `FAL_API_KEY` or `FAL_KEY`
- `PROVIDERS_DISABLED=true`
- `NEXT_PUBLIC_PROVIDERS_DISABLED=true`
- `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`
- `LAUNCH_QA_PASSWORD` (for post-cutover smoke only)

---

## 5. Migration / RLS / RPC Readiness

| Item | Status |
|------|--------|
| Migrations 001–068 on production DB | **NOT VERIFIED** |
| `deduct_credits` RPC | **NOT VERIFIED** |
| RLS / grants | **NOT VERIFIED** |
| Storage policies | **NOT VERIFIED** |
| Blind migration executed | **no** |

When credentials are available, re-run:

```powershell
$env:LAUNCH_MODE='live'
$env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'
npm run launch:production
```

Operator Step 2 performs read-only Supabase checks before any env sync or deploy.

---

## 6. Deploy

| Action | Result |
|--------|--------|
| `vercel --prod` | **not executed** |
| `PROVIDERS_DISABLED=false` | **not executed** |
| Provider run | **0** |

---

## Immediate Next Step

1. Copy `.env.production.local.example` → `.env.production.local`
2. Fill all production Supabase + Stripe Live values (never commit)
3. Add `DATABASE_URL` or `SUPABASE_DB_PASSWORD` for production ref `hszjafdelcydnppyolkm`
4. Re-run LIVE-2 audit or launch operator:

```powershell
$env:LAUNCH_MODE='live'
$env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'
npm run launch:production
```

---

No secrets in this report.

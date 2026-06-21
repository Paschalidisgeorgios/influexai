# Production Live Readiness — LIVE-1 Cutover Gate

Generated: 2026-06-21T07:15:00.000Z

## Go/No-Go

| Check | Result |
|-------|--------|
| **Live Launch Status** | **NO-GO** |
| Provider runs this session | **0** |
| `vercel --prod` with live env | **not executed** |
| `PROVIDERS_DISABLED=false` | **not executed** |
| Secrets logged | **no** |

## Context

- G.10-S Production Dry-Run: **PASS** (staging Supabase + Stripe test + providers locked on `www.influexaicreator.com`)
- G.10-R Preview Provider UI Smoke: **PASS**
- HEAD at audit: `10d7728 chore: add production launch operator`
- Branch: `master`

---

## 1. Safety Preflight

| Check | Result |
|-------|--------|
| `npm run lint` | PASS (warnings only, 0 errors) |
| `npm run test:unit -- --run` | PASS (235/235) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

---

## 2. Working Tree

| Item | Status |
|------|--------|
| Branch | `master` |
| Committed operator | `scripts/production-launch-operator.mjs` (from prior LIVE-1 commit) |
| Untracked `public/images/lora-training/` | kept untracked (not staged) |
| Untracked `scripts/launch-production-dry-run.mjs` | **kept** — functional G.10-S dry-run tooling |
| Untracked `scripts/verify-production-dry-run.mjs` | **kept** — functional post-deploy verification |
| `.env.local` / `.env.production.local` | not staged, not committed |

Dry-run scripts are usable and were not deleted. They remain optional local tooling only.

---

## 3. Production Supabase Readiness

**Target ref:** `hszjafdelcydnppyolkm` (read-only audit requested)

| Check | Result |
|-------|--------|
| Local migration files | **67 files**, max **068** / expected 068 — **PASS (repo)** |
| Remote migration 068 on prod DB | **NOT VERIFIED** |
| `profiles` table | **NOT VERIFIED** |
| `generations` table | **NOT VERIFIED** |
| `credit_transactions` table | **NOT VERIFIED** |
| `deduct_credits` RPC | **NOT VERIFIED** |
| Storage buckets / policies | **NOT VERIFIED** |
| RLS / grants | **NOT VERIFIED** |
| Staging data on production deploy | **yes** — staging ref in live bundle (see §7) |
| Supabase CLI linked project | `jvjmqtxlqfqaoyjklpxh` (staging, not production) |

### Why not verified

Production Supabase credentials for ref `hszjafdelcydnppyolkm` are **not available locally**:

- `.env.local` → staging ref `jvjmqtxlqfqaoyjklpxh`
- `.env.production.local` → Vercel-pulled placeholders (empty values for Supabase keys)
- Vercel Production deploy (G.10-S) intentionally uses **staging** Supabase
- No `DATABASE_URL` / `SUPABASE_DB_PASSWORD` for production ref in local env

**No migrations were executed.** Per STOP rules, blind migration is forbidden.

### Migration plan (when credentials available)

```text
# Manual approval required — do NOT run without review
supabase link --project-ref hszjafdelcydnppyolkm
supabase db push
```

Or run read-only gate via launch operator after populating `.env.production.local`:

```powershell
$env:LAUNCH_MODE='live'
$env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'
npm run launch:production
```

**Production Supabase Readiness: FAIL (blocked — credentials + remote audit missing)**

---

## 4. Stripe Live Readiness

**No checkout executed.** Audit of local env + deployed production state only.

### Local env (`.env.local`, non-empty values)

| Check | Result |
|-------|--------|
| `STRIPE_MODE` | `test` — **FAIL for live** |
| `NEXT_PUBLIC_STRIPE_MODE` | missing — **FAIL** |
| `STRIPE_SECRET_KEY` | `sk_test_` — **FAIL for live** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_` — **FAIL for live** |
| `STRIPE_WEBHOOK_SECRET` | set (test) |
| Subscription price IDs (8×) | all `price_id_set` (test prices) |
| Credit pack IDs | `STRIPE_CREDITS_50` **missing** locally; others set |

### Vercel Production (deployed G.10-S dry-run)

| Check | Result |
|-------|--------|
| Env key slots (47 keys) | present incl. Stripe/Supabase/provider keys |
| Deployed `STRIPE_MODE` | `test` (per G.10-S report) |
| Deployed Stripe key mode | `sk_test_` / `pk_test_` |
| Live `sk_live_` / `pk_live_` | **not configured for cutover** |
| Live price IDs for production cutover | **not verified** (live keys not in local env) |

**Stripe Live Readiness: FAIL**

Missing for live cutover:

- `STRIPE_MODE=live`
- `NEXT_PUBLIC_STRIPE_MODE=live`
- `STRIPE_SECRET_KEY` (`sk_live_…`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`)
- Live `STRIPE_WEBHOOK_SECRET`
- Live subscription price IDs (8× `NEXT_PUBLIC_STRIPE_INFLUEXAI_*`)
- Live credit pack IDs (`STRIPE_CREDITS_25/50/150/350/800`) — incl. `STRIPE_CREDITS_50` missing locally

---

## 5. Legal / Launch Surface

Checked on `https://www.influexaicreator.com` (current G.10-S dry-run deploy):

| Route | HTTP | Result |
|-------|------|--------|
| `/` | 200 | ok |
| `/pricing` | 200 | ok |
| `/impressum` | 200 | ok |
| `/datenschutz` | 200 | ok |
| `/agb` | 200 | ok |
| `/auth/sign-in` | 200 | ok |

| Surface check | Result |
|---------------|--------|
| Footer legal links (Impressum/Datenschutz/AGB) | **PASS** |
| Refund / credit hint on pricing or home | **PASS** |
| Risky active tool claims (LoRA/Akool/ElevenLabs/Face Swap) | **PASS** (none detected as active) |
| Public test-mode banner / Stripe test signal in bundle | **PRESENT** — expected while G.10-S test Stripe is deployed |

**Legal Readiness: PASS for pages/links; SOFT BLOCKER for live cutover** — remove Stripe test signals from public deploy before go-live.

---

## 6. Provider Readiness

| Check | Result |
|-------|--------|
| Provider runs this session | **0** |
| `PROVIDERS_DISABLED=false` | **not set** |
| Production provider guard | **PASS** — `PROVIDERS_DISABLED`, no `generationId`, no `imageUrl` |
| `FAL_API_KEY` / `FAL_KEY` locally | present |
| `PROVIDERS_DISABLED` locally | `true` |
| `NEXT_PUBLIC_PROVIDERS_DISABLED` locally | not set to `true` (set before cutover) |

**Provider Readiness: NOT READY for open** — guard correctly closed on production; live Supabase + Stripe must PASS first.

---

## 7. Deployed Production Bundle (current)

Scanned 101 JS chunks on `www.influexaicreator.com`:

| Ref | In bundle |
|-----|-----------|
| Staging `jvjmqtxlqfqaoyjklpxh` | **yes** |
| Production `hszjafdelcydnppyolkm` | **no** |

Confirms G.10-S dry-run state: production domain serves staging Supabase + Stripe test.

---

## Blockers (summary)

1. **Production Supabase ref `hszjafdelcydnppyolkm` not audited** — no prod service role / DB URL locally; remote tables/RPC/storage/migrations unverified
2. **Stripe Live not configured** — test mode and test keys on deployed production
3. **`STRIPE_CREDITS_50` missing** in local env
4. **Production deploy still on staging Supabase** (intentional G.10-S; must cut over before live)
5. **Public Stripe test signal in bundle** — acceptable for dry-run, blocker for live marketing cutover
6. **`NEXT_PUBLIC_PROVIDERS_DISABLED`** not explicitly set locally for closed-start audit

---

## Immediate Next Step

1. Populate `.env.production.local` (never commit) with **Production Supabase** ref `hszjafdelcydnppyolkm` + **Stripe Live** keys and all live price IDs
2. Add `DATABASE_URL` or `SUPABASE_DB_PASSWORD` for read-only migration/table audit on production
3. Re-run read-only gate:

```powershell
$env:LAUNCH_MODE='live'
$env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'
npm run launch:production
```

Operator will: verify prod DB → sync closed env → dry-run deploy → legal check → only then open provider (not done in this readiness audit).

---

No secrets in this report.

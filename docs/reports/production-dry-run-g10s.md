# Production Dry-Run — G.10-S

Generated: 2026-06-21T07:00:00.000Z

## Launch Gate

| Check | Result |
|-------|--------|
| Production Dry-Run PASS | **YES** |
| Domain live | yes |
| Provider guard | **PASS** |
| Go/No-Go real live launch | **NO-GO until live Stripe + Production Supabase cutover** |

## Safety

- Branch: `master`
- HEAD: `4e80fe6 chore: add final provider ui smoke operator`
- Provider call: **no**
- Stripe Live: **no**
- Production Supabase: **no** (staging ref `jvjmqtxlqfqaoyjklpxh` on production deploy)
- Production deploy: yes (`npx vercel --prod`)
- Production deployment: `influexai-445comhqg-paschalidisgeorgios-projects.vercel.app`
- Custom domain: `https://www.influexaicreator.com`

## Git Cleanup

- `launch-operator-g10q.md`: accidental FAIL overwrite **reverted** (restored G.10-Q PASS report)
- `public/images/lora-training/`: untracked (not committed)

## Production Dry-Run Env

- PROVIDERS_DISABLED: `true`
- NEXT_PUBLIC_PROVIDERS_DISABLED: `true`
- ALLOW_SAFE_DEV_PROVIDER_SMOKE: `false`
- STRIPE_MODE: `test`
- NEXT_PUBLIC_STRIPE_MODE: `test`
- Supabase URL ref: `jvjmqtxlqfqaoyjklpxh` (staging)
- Anon JWT ref: `jvjmqtxlqfqaoyjklpxh` (staging)
- Stripe key mode: test (`sk_test_` / `pk_test_`)
- Provider active: **no**
- Env keys synced to Production: 23
- Env sync failed: none

## Domain Checks

| Route | Status | OK |
|-------|--------|-----|
| `/` | 200 | yes |
| `/pricing` | 200 | yes |
| `/auth/sign-in` | 200 | yes |
| `/dashboard/image-generator` | 200 | yes |
| `/dashboard/gallery` | 200 | yes |

- Middleware crash detected: **no**
- Dashboard routes: load without server 500 (client auth gating expected for unauthenticated visitors)

## Production Bundle

- Staging URL ref in bundle: **yes** (`jvjmqtxlqfqaoyjklpxh`)
- Staging anon ref in bundle: **yes** (`jvjmqtxlqfqaoyjklpxh`)
- Production URL ref in bundle: **no**
- Production anon ref in bundle: **no**
- Bundle gate: **PASS**

## Provider Guard

- POST `/api/generate-image` on `www.influexaicreator.com`
- Pass: **yes**
- Code: `PROVIDERS_DISABLED`
- success: `false`
- generationId: **no**
- imageUrl: **no**
- Provider call: **no**

## Credits (visualqa@influexai.test)

- Credits after dry-run: **70** (unchanged from G.10-R)
- Generation created during dry-run: **no**

## Blockers

- none

## Diagnosis

**g10s_pass**

## Next Step

Domain is live and safely locked (providers disabled, Stripe test, staging Supabase). Before a real live launch:

1. Cut over Production Supabase ref + anon/service keys
2. Cut over Stripe Live keys + live price IDs
3. Re-enable providers only after explicit launch approval
4. Re-run provider guard + billing smoke on production config

---
No secrets in this report.

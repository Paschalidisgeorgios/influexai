# Production Live Launch Gate — LIVE-1

Generated: 2026-06-21T09:42:50.133Z

## Go/No-Go

| Check | Result |
|-------|--------|
| Live Launch Status | **CHECK-ONLY PASS (Steps 0–2)** |
| Check-only mode | yes |
| Provider runs | 0 (max 1) |
| Secrets logged | **no** |

## Safety

- Branch: `master`
- HEAD: `93c709c docs: add production local env example template`
- Production deploy: no
- Provider window closed on failure: n/a

## Required Env

- Production Supabase ref: hszjafdelcydnppyolkm
- Stripe mode: live
- Stripe key mode: sk_live_
- Provider key: FAL_API_KEY
- Missing env keys: none

## Production Supabase Readiness

- Local migrations max: 68 / 68
- Remote migration 068: yes
- Tables: profiles=ok, generations=ok, credit_transactions=ok
- deduct_credits RPC: ok
- Storage: ok
- Readiness: PASS

## Migration Query Diagnostics

- Query: `select version from supabase_migrations.schema_migrations order by version`
- Transport: postgres_direct_pooler
- Connection method: DATABASE_URL
- Connection ref: hszjafdelcydnppyolkm
- Supabase URL ref: hszjafdelcydnppyolkm
- Production ref checked: yes
- Connect OK: yes
- Migration schema exists: yes
- Migration table query OK: yes
- Error class: n/a
- Error code: n/a
- Sanitized error: none

## Dry-Run Deploy (Provider Disabled)

- Landing: n/a
- Pricing: n/a
- Auth: n/a
- Dashboard route: n/a
- Provider guard: FAIL (n/a)

## Legal / Surface

- Impressum: fail
- Datenschutz: fail
- AGB: fail
- Footer legal links: no
- Testmode banner: no
- Refund/credit hint: not found

## Provider Live

- Provider opened: no
- Deploy after open: no
- Smoke user: `launchqa@influexai.test`
- Credits before: n/a
- Credits after: n/a
- generationId: n/a
- imageUrl: n/a
- Gallery: fail
- Provider remained active: no

## Blockers

- none

## Diagnosis

**live_check_only_pass**

## Immediate Next Action

Check-only complete. No Vercel env sync, no deploy, no provider.
Next (manual): set LIVE_ENV_SYNC_CONFIRM then re-run for Step 3 only via full operator.
$env:LIVE_ENV_SYNC_CONFIRM='I_UNDERSTAND_THIS_UPDATES_VERCEL_PRODUCTION_ENV'
$env:LIVE_DEPLOY_CONFIRM='I_UNDERSTAND_THIS_DEPLOYS_TO_PRODUCTION'
npm run launch:production

---
No secrets in this report.

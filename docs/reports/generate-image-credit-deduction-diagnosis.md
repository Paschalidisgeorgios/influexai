# Generate-Image Credit Deduction Diagnosis (G.10-H)

**Date:** 2026-06-20  
**Branch:** `master` @ `1cabf38`  
**Staging ref:** `jvjmqtxlqfqaoyjklpxh`

---

## Summary

First real generate-image provider smoke **succeeded technically** (HTTP 200, generation row, image fetch). **Billing proof failed:** profile credits stayed **75 → 75** because smoke user `test@influexai.test` is **credit-exempt** via `ADMIN_EMAIL_ALLOWLIST`. No `deduct_credits` RPC, no `credit_transactions`. Smoke is valid for **provider/generation MVP**, not for **revenue/credit deduction MVP**.

---

## Safety status (G.10-H close)

| Check | Status |
|-------|--------|
| Provider call in G.10-H | **No** |
| `PROVIDERS_DISABLED` | **`true`** |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | **`false`** |
| Supabase | Staging `jvjmqtxlqfqaoyjklpxh` only |
| Stripe | `STRIPE_MODE=test`, no live keys |
| Migration applied in G.10-H | **No** |
| `.env.local` committed | **No** |
| `scripts/supervised-smoke-result.json` committed | **No** (gitignored) |

---

## Symptom (first successful provider smoke)

| Field | Value |
|-------|-------|
| HTTP | **200**, `success: true` |
| `generationId` | `4251258f-37d2-45a9-b427-a3a927eb9dce` |
| `imageUrl` | present, fetch **200** `image/jpeg` |
| `generation_row` | present, `credits_used: 5`, model `krea/v2/large/text-to-image` |
| API `creditsUsed` | **5** (before G.10-H fix: nominal tool cost even when exempt) |
| API `creditsLeft` | **75** |
| Profile credits before/after | **75 → 75** (delta **0**) |
| Expected delta (non-exempt) | **−5** |
| Smoke `pass` | **false** (billing leg failed) |

---

## Root cause

**`test@influexai.test` is credit-exempt via `ADMIN_EMAIL_ALLOWLIST`.**

| Check | Result |
|-------|--------|
| `profiles.is_admin` | `false` |
| `profiles.role` | `user` |
| Email in `ADMIN_EMAIL_ALLOWLIST` | **yes** |
| `deduct_credits` RPC called | **no** |
| `credit_transactions` rows | **0** (recent sample empty) |
| Refund after success | **no** (exempt path skips deduct entirely) |

### Code path

```
POST /api/generate-image
  → isCreditExemptUser() → isPlatformAdminServer(email in ADMIN_EMAIL_ALLOWLIST)
  → deductCredits(): skip RPC + skip logCreditTransaction
  → FAL + save generation ✅
  → response creditsUsed: creditCost (5)  ← misleading before fix
  → profiles.credits unchanged (75)
  → generation.credits_used: 5            ← nominal metadata, not billing proof
```

Relevant code:

- `src/lib/credits.ts` — `isCreditExemptUser`, exempt branch in `deductCredits`
- `src/lib/platform-admin.server.ts` / `src/lib/admin-allowlist.server.ts` — allowlist
- `src/app/api/generate-image/route.ts` — always returned `creditsUsed: creditCost` pre-fix

**Not the cause:** refund loop, wrong balance read in smoke script, save failure, wrong user id.

---

## DB findings (staging, no secrets)

User: `test@influexai.test` (`13346d5c-f673-41ba-853d-4635b0fccb8b`)

| Table / field | Value |
|---------------|-------|
| `profiles.plan` | `starter` |
| `profiles.credits` | `75` |
| `profiles.is_admin` | `false` |
| `profiles.role` | `user` |
| `credit_transactions` | none for this smoke |
| `generations` (smoke id) | row exists, `credits_used: 5` |

Verify locally (no provider):

```bash
npm run smoke:generate-image:credit-check
```

---

## Fixes applied (G.10-H)

| Change | Purpose |
|--------|---------|
| API: `creditExempt`, `creditsUsed: 0` when exempt | Response matches actual billing |
| API: `generations.credits_used: 0` when exempt | DB aligns with no deduct |
| Smoke: `generation_pass` vs `billing_pass` | Generation can pass while billing is N/A for exempt user |
| Smoke: `credit-check` command | Diagnose exempt + transactions without provider |
| `scripts/ensure-staging-billing-user.mjs` | Staging user **not** in allowlist |
| `tests/unit/lib/credit-exempt-diagnosis.test.ts` | Unit coverage for exempt rules |

**Intentionally unchanged:** global admin credit bypass (product behavior).

---

## Answers to core questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Is `test@influexai.test` credit-exempt? | **Yes** — email allowlist |
| 2 | Admin/QA bypass skipped deduct? | **Yes** |
| 3 | API returned `creditsUsed=5` without real charge? | **Yes** (fixed to `0` + `creditExempt: true`) |
| 4 | `deduct_credits` RPC called? | **No** |
| 5 | `credit_transactions` row? | **No** |
| 6 | Refunded after success? | **No** |
| 7 | Smoke script wrong balance read? | **No** — balance truly unchanged |
| 8 | Need non-admin paid user for billing smoke? | **Yes** |

---

## Next provider smoke (G.10-I) — billing proof

### Recommended test user (staging, ready as of G.10-H)

| Field | Value |
|-------|-------|
| Email | **`billingtest@influexai.test`** |
| Not in `ADMIN_EMAIL_ALLOWLIST` | ✅ |
| `credit_exempt` | **false** |
| Plan | `starter` |
| Credits | **75** (topped up via `add_credits` RPC during G.10-H prep) |
| Expected after 1× image gen | **70** |

Verify (no provider):

```bash
TEST_USER_EMAIL=billingtest@influexai.test npm run smoke:generate-image:credit-check
```

Alternative user: `billing-smoke@influexai.test` via `npm run staging:ensure-billing-user`.

### Env during supervised window only

| Variable | Smoke window | After smoke |
|----------|--------------|-------------|
| `PROVIDERS_DISABLED` | `false` | **`true`** |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` | `true` | **`false`** |
| `FAL_API_KEY` / `FAL_KEY` | required locally | keep local only |
| Stripe | test mode only | unchanged |
| Supabase | staging ref only | unchanged |

### Run sequence (human-supervised)

1. `npm run smoke:generate-image:verify-db` → `ok: true`
2. `npm run smoke:generate-image:credit-check` → `billing_smoke_ready: true`
3. Open smoke window in `.env.local`, restart dev server
4. **Single run:** `npm run smoke:generate-image:run-safe`
5. Close window, restart, `npm run smoke:generate-image:guard-probe` → 503
6. Expect: `billing_pass: true`, credits **75 → 70**, transaction row present

**Do not run another provider call until G.10-I window is explicitly opened.**

---

## Stop rules (always)

- Never set `PROVIDERS_DISABLED=false` without human-supervised smoke window.
- Never set `ALLOW_SAFE_DEV_PROVIDER_SMOKE=true` outside that window.
- Never use production Supabase or Stripe live keys.
- After any provider smoke: close window → restart dev → `npm run smoke:generate-image:guard-probe` → expect **503**.

---

## Open risks

| Risk | Mitigation |
|------|------------|
| QA user in allowlist masks billing | Use `billingtest@influexai.test` for G.10-I |
| Staging `profiles` direct upsert may 42501 | Ensure script falls back to `add_credits` RPC + linked db query |
| `creditsUsed` on old smoke artifact shows 5 | Pre-G.10-H API behavior; new smokes return `creditExempt` + `creditsUsed: 0` when exempt |

---

## Go / No-Go — next provider smoke (G.10-I)

| Gate | Status |
|------|--------|
| Root cause understood | **Go** |
| Migration 068 on staging | **Go** (applied) |
| DB verify grants | **Go** (profiles/generations/credit_transactions ok) |
| Billing user ready (`billingtest@influexai.test`) | **Go** — `billing_smoke_ready: true`, credits 75, not exempt |
| Provider window closed now | **Go** (correct safe state) |
| **Execute G.10-I in this phase** | **No-Go** — human must open window first |

**Provider smoke now freigegeben:** **No** — prepare only; execute in G.10-I after explicit env window.

---

## Sign-off

| Item | Status |
|------|--------|
| Cause identified | ✅ Credit-exempt allowlist user |
| Provider re-run in G.10-H | ❌ None |
| Further provider smoke needed | ✅ Yes — billing user |
| `PROVIDERS_DISABLED` after G.10-H | ✅ `true` |
| `ALLOW_SAFE_DEV_PROVIDER_SMOKE` after G.10-H | ✅ `false` |

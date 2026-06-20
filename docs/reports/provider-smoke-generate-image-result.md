# Provider Smoke Result — generate-image (PHASE G.10-A)

**Date:** 2026-06-16  
**Branch:** `master`  
**HEAD at start:** `29e9666`  
**Status:** **BLOCKED** — provider smoke not executed

---

## Executive Summary

| Item | Result |
|------|--------|
| Provider smoke | **BLOCKED** — `FAL_KEY` / `FAL_API_KEY` not configured |
| Credits verified | N/A (no provider call) |
| Gallery verified | N/A |
| `PROVIDERS_DISABLED` restored | ✅ Still `true` (never toggled) |
| Guard probe (disabled) | ✅ HTTP 503 `PROVIDERS_DISABLED` |
| Unit/lint/build | ✅ Green (see §10) |

---

## 1. Smoke Plan (from reports)

| Item | Value |
|------|-------|
| Provider candidate | `POST /api/generate-image` (FAL Flux Dev) |
| Expected credits | **−5** standard (`IMAGE_GEN_CREDITS.standard`) |
| Gallery SSOT | `generations` table + `generated-assets` bucket → `/dashboard/gallery` |
| Abort criteria | Live Stripe, production Supabase, missing key, credit loss without asset, repeated retries |
| Required env (names only) | `PROVIDERS_DISABLED`, `FAL_KEY`/`FAL_API_KEY`, staging Supabase, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_MODE=test` |

---

## 2. Start Audit

| Check | Result |
|-------|--------|
| Branch | `master` ✅ |
| `public/images/lora-training/` | Untracked only ✅ |
| `.env.local` staged | No ✅ |
| Secrets staged | No ✅ |
| Lint | 0 errors, 62 warnings ✅ |
| Unit tests | 197/197 ✅ |
| Typecheck | ✅ |
| Build | ✅ |

---

## 3. Env-Safety (no secrets printed)

| Check | Result |
|-------|--------|
| Supabase ref | `jvjmqtxlqfqaoyjklpxh` ✅ staging |
| Production Supabase ref | ❌ Not detected |
| `PROVIDERS_DISABLED` | **`true`** ✅ |
| `STRIPE_MODE` | `test` ✅ |
| Stripe live keys | ❌ None (`sk_test_…` prefix only) |
| `FAL_KEY` | **unset** ❌ |
| `FAL_API_KEY` | **unset** ❌ |
| `FAL_WEBHOOK_SECRET` | unset (not required for T2I smoke) |
| Provider key test/sandbox | **Cannot assess — key missing** |

**Decision:** Do not open test window. Do not set `PROVIDERS_DISABLED=false`.

---

## 4. Staging Test User Baseline

| Field | Value |
|-------|-------|
| Email | `test@influexai.test` |
| User ID | `13346d5c-f673-41ba-853d-4635b0fccb8b` |
| Plan | `starter` |
| Credits (before) | **75** |
| Generations count (before) | **0** |
| `PROVIDERS_DISABLED` (before) | `true` |
| Onboarding | completed |

Credits sufficient (≥10). User exists and is sign-in capable via anon key.

---

## 5. Test Window

**Not opened.** Blocked by missing FAL provider key.

Planned payload (for next attempt):

```json
{
  "prompt": "Minimal cinematic product-style test image, abstract lime-green glass cube on soft ivory background, no text, no logo",
  "category": "creator",
  "skipPromptEnhancement": true,
  "falPrompt": "abstract lime-green glass cube on soft ivory background, studio lighting, minimal product style, no text, no logo, no watermark"
}
```

---

## 6. Provider Call Result

**Not executed.**

---

## 7. Error / Refund

N/A — no deduct, no refund needed.

---

## 8. Test Window Close

| Item | Result |
|------|--------|
| `PROVIDERS_DISABLED` after | **`true`** (unchanged) |
| Guard re-check | ✅ See §9 |

---

## 9. Guard Probe (providers disabled)

Unauthenticated probe against running dev server (`http://localhost:3000`):

| Field | Value |
|-------|-------|
| HTTP status | **503** |
| `code` | `PROVIDERS_DISABLED` |
| Provider invoked | **No** |

---

## 10. Post-Run Checks

| Check | Result |
|-------|--------|
| Lint | ✅ 0 errors |
| Unit tests | ✅ 197/197 |
| Typecheck | ✅ |
| Build | ✅ |

---

## 11. Logs / Security

- No secrets logged in this report or smoke script output
- `.env.local` not modified, not committed
- No provider outbound calls made
- `listUsers` admin API returned transient DB error; baseline obtained via `signInWithPassword` fallback

---

## 12. Open Risks

| Risk | Notes |
|------|-------|
| Missing FAL key | Blocks all image provider smokes locally |
| Admin redirect for QA user | `test@influexai.test` lands on `/admin` — smoke script login updated to accept `/admin` |
| `gallery_assets` legacy | Studio sidebar may stay empty; SSOT remains `generations` |

---

## 13. Recommendation — Next Sprint (G.10-B)

1. Add **FAL sandbox/staging key** to local `.env.local` only (`FAL_KEY=…` or `FAL_API_KEY=…`) — do not commit.
2. Re-run env audit: `node scripts/supervised-generate-image-smoke.mjs audit`
3. Confirm baseline credits ≥10: `node scripts/supervised-generate-image-smoke.mjs baseline`
4. **Supervised window:** set `PROVIDERS_DISABLED=false`, restart `npm run dev`
5. Single run: `node scripts/supervised-generate-image-smoke.mjs run`
6. Verify −5 credits, `generations` row, image URL, gallery UI
7. Immediately set `PROVIDERS_DISABLED=true` and restart dev server
8. Guard probe → expect 503 again
9. Update this report with PASS/FAIL outcome

---

## Artifacts

| File | Purpose |
|------|---------|
| `scripts/supervised-generate-image-smoke.mjs` | Audit / baseline / single-shot smoke helper (added in G.10-A) |

---

## Sign-off

| Question | Answer |
|----------|--------|
| Provider-Smoke | **BLOCKED** |
| Credits korrekt | **n/a** |
| Gallery korrekt | **n/a** |
| `PROVIDERS_DISABLED` wieder true | **ja** (never disabled) |
| Tests grün | **ja** |

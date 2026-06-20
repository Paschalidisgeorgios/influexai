# Provider Smoke Result — generate-image (PHASE G.10-A / G.10-B)

**Last updated:** 2026-06-16  
**Branch:** `master`  
**HEAD at G.10-B:** `8a68338`  
**Status:** **BLOCKED** — provider smoke not executed (missing FAL key)

---

## Executive Summary (G.10-B)

| Item | Result |
|------|--------|
| Provider smoke | **BLOCKED** — `FAL_KEY` / `FAL_API_KEY` still not in `.env.local` |
| Credits verified | N/A (no provider call) |
| Gallery / generations verified | N/A |
| `PROVIDERS_DISABLED` after | ✅ Still **`true`** (never toggled) |
| Guard probe (G.10-B) | ⚠️ Dev server not running — guard unchanged from G.10-A (503 when server up) |
| Unit/lint/build | ✅ Green |

---

## G.10-B — Supervised Smoke Attempt

### Aufgabe 1 — Start Audit

| Check | Result |
|-------|--------|
| Branch | `master` ✅ |
| `public/images/lora-training/` | Untracked only ✅ |
| `.env.local` staged | No ✅ |
| Secrets staged | No ✅ |
| Lint | 0 errors, 65 warnings ✅ |
| Unit tests | 197/197 ✅ |
| Typecheck | ✅ |
| Build | ✅ |

### Aufgabe 2 — Smoke Audit

```bash
node scripts/supervised-generate-image-smoke.mjs audit
```

| Check | Result |
|-------|--------|
| Supabase ref | `jvjmqtxlqfqaoyjklpxh` ✅ |
| `PROVIDERS_DISABLED` | **`true`** ✅ |
| `STRIPE_MODE` | `test` ✅ |
| Stripe live | ❌ Not detected |
| Production Supabase ref | ❌ Not detected |
| `FAL_KEY` | **unset** ❌ |
| `FAL_API_KEY` | **unset** ❌ |
| `safe_to_proceed` | **`false`** ❌ |

**Decision:** Do not open test window. Do not set `PROVIDERS_DISABLED=false`. Do not run provider smoke.

### Aufgabe 3 — Baseline (documented)

| Field | Value |
|-------|-------|
| Email | `test@influexai.test` |
| User ID | `13346d5c-f673-41ba-853d-4635b0fccb8b` |
| Plan | `starter` |
| Credits (before) | **75** |
| Generations count (before) | **0** |
| `PROVIDERS_DISABLED` (before) | **`true`** |
| Expected credit delta | **−5** on success |
| Expected gallery SSOT | `generations` + `generated-assets` |

### Aufgaben 4–7 — Test Window / Run / Result / Refund

| Step | Result |
|------|--------|
| Test window opened | **No** — blocked by audit |
| `node … run` executed | **No** |
| Provider calls | **0** |
| Refund | N/A |

### Aufgabe 8 — Test Window Close

| Item | Result |
|------|--------|
| `PROVIDERS_DISABLED` in `.env.local` | **`true`** (unchanged) |
| Dev server restart | Not required (window never opened) |
| Guard probe post-test | N/A — server down; G.10-A confirmed 503 when server was up |

---

## G.10-A — Prior Attempt (reference)

**Date:** 2026-06-16  
**HEAD:** `29e9666`  
**Status:** **BLOCKED** — same root cause (missing FAL key)

| Item | Result |
|------|--------|
| Provider smoke | **BLOCKED** |
| Guard probe (disabled) | ✅ HTTP 503 `PROVIDERS_DISABLED` |
| `PROVIDERS_DISABLED` | Never toggled ✅ |

---

## Smoke Plan (from reports)

| Item | Value |
|------|-------|
| Provider candidate | `POST /api/generate-image` (FAL Flux Dev) |
| Expected credits | **−5** standard |
| Gallery SSOT | `generations` → `/dashboard/gallery` |
| Harmless prompt | Abstract lime-green glass cube, ivory background, no text/logo |

---

## Env-Safety (no secrets printed)

| Variable | G.10-B status |
|----------|---------------|
| Staging Supabase | ✅ `jvjmqtxlqfqaoyjklpxh` |
| `PROVIDERS_DISABLED` | ✅ `true` |
| `STRIPE_MODE` | ✅ `test` |
| Stripe live keys | ❌ None |
| FAL key | ❌ **Missing — blocker** |

---

## Open Risks

| Risk | Notes |
|------|-------|
| Missing FAL key | Blocks all supervised image smokes until set locally only |
| Dev server offline | Guard re-probe deferred until next run with server |
| `gallery_assets` legacy | Studio sidebar may stay empty; SSOT is `generations` |

---

## Recommendation — Next Step (G.10-C)

1. **Human:** Add `FAL_KEY=` or `FAL_API_KEY=` to `.env.local` only (fal.ai sandbox key) — **never commit**.
2. Verify: `node scripts/supervised-generate-image-smoke.mjs audit` → `safe_to_proceed: true`
3. Baseline: `node scripts/supervised-generate-image-smoke.mjs baseline` (credits ≥ 10)
4. Set `PROVIDERS_DISABLED=false` in `.env.local`, restart `npm run dev`
5. **Single run:** `node scripts/supervised-generate-image-smoke.mjs run`
6. Verify −5 credits, `generations` row, image URL
7. Set `PROVIDERS_DISABLED=true`, restart dev, guard probe → 503
8. Update this report → **PASS** / **FAIL** / **PARTIAL**

---

## Artifacts

| File | Purpose |
|------|---------|
| `scripts/supervised-generate-image-smoke.mjs` | Audit / baseline / single-shot smoke |

---

## Sign-off (G.10-B)

| Question | Answer |
|----------|--------|
| Provider-Smoke | **BLOCKED** |
| Credits korrekt | **n/a** |
| Gallery/generations korrekt | **n/a** |
| Refund korrekt | **n/a** |
| `PROVIDERS_DISABLED` wieder true | **ja** (never disabled) |
| Guard-Probe nach Test | **n/a** (no test window; server down) |
| Tests grün | **ja** |

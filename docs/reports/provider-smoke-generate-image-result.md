# Provider Smoke Result — generate-image (PHASE G.10-A / B / C)

**Last updated:** 2026-06-20  
**Branch:** `master`  
**HEAD at G.10-C:** `f45f3ea`  
**Status:** **FAIL** — dev write guard blocked provider call (no FAL invocation)

---

## Executive Summary (G.10-C)

| Item | Result |
|------|--------|
| Provider smoke | **FAIL** — HTTP 403 `DEV_WRITE_GUARD_BLOCKED` |
| FAL key configured | ✅ `FAL_API_KEY` present (not logged) |
| Audit `safe_to_proceed` | ✅ `true` (pre-run) |
| Provider outbound call | **No** — blocked before handler |
| Credits | **75 → 75** (unchanged) |
| Generations | **0 → 0** (unchanged) |
| Refund | N/A |
| `PROVIDERS_DISABLED` after | ✅ **`true`** (restored) |
| Guard probe after test | ✅ HTTP 503 `PROVIDERS_DISABLED` |
| Unit/lint/build | ✅ Green |

---

## G.10-C — Supervised Smoke With FAL Key

### Aufgabe 1 — FAL Key

| Env name (code) | Status |
|-----------------|--------|
| `FAL_API_KEY` | ✅ Set in `.env.local` (via `getFalKey()` in `fal-image.ts`) |
| `FAL_KEY` | unset |

Key not printed, not committed.

### Aufgabe 2 — Start Audit ✅

| Check | Result |
|-------|--------|
| Branch | `master` |
| `.env.local` staged | No |
| `public/images/lora-training/` | Untracked only |
| Lint | 0 errors, 65 warnings |
| Unit tests | 197/197 |
| Typecheck / Build | ✅ |

### Aufgabe 3 — Smoke Audit ✅

```
node scripts/supervised-generate-image-smoke.mjs audit
→ safe_to_proceed: true
→ supabase_ref: jvjmqtxlqfqaoyjklpxh
→ providers_disabled: true (before test window)
→ stripe_mode: test
→ fal_key_present: true
→ no live/production signals
```

### Aufgabe 4 — Baseline

| Field | Value |
|-------|-------|
| Email | `test@influexai.test` |
| User ID | `13346d5c-f673-41ba-853d-4635b0fccb8b` |
| Plan | `starter` |
| Credits (before) | **75** |
| Generations (before) | **0** |
| Expected credit delta | **−5** on success |
| `PROVIDERS_DISABLED` (before window) | **`true`** |

### Aufgabe 5 — Test Window

1. Set `PROVIDERS_DISABLED=false` in `.env.local` (duplicate lines normalized to `false`)
2. Dev server restarted (`npm run dev`)
3. Pre-run audit: `providers_disabled: false`, staging ref unchanged, FAL key present

**Note:** Initial run hit 503 `PROVIDERS_DISABLED` because `.env.local` contained duplicate keys (`false` then `true`); dotenv last-wins left `true`. Fixed before second run.

### Aufgabe 6 — Single Smoke Run

```bash
node scripts/supervised-generate-image-smoke.mjs run
```

| Field | Value |
|-------|-------|
| HTTP status | **403** |
| Code | `DEV_WRITE_GUARD_BLOCKED` |
| Duration | ~398 ms |
| Provider called | **No** |
| Prompt | Abstract lime-green glass cube (harmless product-style test) |

### Aufgabe 7 — Result Verification

| Check | Expected | Actual |
|-------|----------|--------|
| HTTP success | 200 | **403** |
| Credit delta | −5 | **0** |
| Output URL | present | **null** |
| `generations` row | present | **null** |
| Gallery | visible | **n/a** |
| Secrets in logs | none | ✅ |

**Root cause:** Local dev write guard (`developmentWriteGuardResponse`) blocks mutating routes when production-like signals are detected with `PROVIDERS_DISABLED=false` — notably `provider_keys_active` + `service_role_present` on staging Supabase in `next dev`.

### Aufgabe 8 — Test Window Closed ✅

1. `PROVIDERS_DISABLED=true` restored (both lines)
2. Dev server restarted
3. Guard probe:

```
POST /api/generate-image → HTTP 503, code: PROVIDERS_DISABLED
```

### Aufgabe 9 — Sign-off

| Question | Answer |
|----------|--------|
| Provider-Smoke | **FAIL** |
| Credits korrekt | **n/a** (unchanged) |
| generations korrekt | **n/a** (unchanged) |
| Gallery sichtbar | **no** |
| Refund korrekt | **n/a** |
| `PROVIDERS_DISABLED` wieder true | **yes** |
| Guard-Probe bestanden | **yes** (503 after restore) |
| Tests grün | **yes** |

---

## Prior Attempts (reference)

| Phase | Status | Reason |
|-------|--------|--------|
| G.10-A | BLOCKED | Missing FAL key |
| G.10-B | BLOCKED | Missing FAL key |
| G.10-C | **FAIL** | Dev write guard with providers enabled locally |

---

## Open Risks

| Risk | Notes |
|------|-------|
| Local smoke catch-22 | `PROVIDERS_DISABLED=true` → provider guard 503; `false` → dev write guard 403 with active FAL + service role |
| Duplicate env keys | `.env.local` had two `PROVIDERS_DISABLED` lines — ensure single source of truth |
| Audit script gap | `safe_to_proceed` does not evaluate dev write guard when providers enabled |

---

## Recommendation — Next Step (G.10-D)

Choose **one** supervised path (human approval required):

1. **Vercel Preview smoke** — deploy branch with staging env, `PROVIDERS_DISABLED=false`, no local dev guard; single `run` against preview URL.
2. **Local override window** — temporarily set `ALLOW_PRODUCTION_DEV_WRITES=true` + `I_UNDERSTAND_PRODUCTION_WRITES=true` with staging ref + test Stripe only; document in smoke plan; revert immediately after.
3. **Fix audit script** — extend `safe_to_proceed` to fail when dev write guard would block with providers enabled locally.

Do **not** retry provider call until path is agreed.

---

## Artifacts

| File | Purpose |
|------|---------|
| `scripts/supervised-generate-image-smoke.mjs` | Audit / baseline / run |
| `scripts/supervised-smoke-result.json` | Last run output (G.10-C) |

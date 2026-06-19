# Provider Staging Smoke Plan — Go/No-Go

**Date:** 2026-06-16  
**Branch:** `launch-train/overnight-safe-completion`  
**Phase:** 4G.9-A — preparation only (no execution in this prompt)  
**Prerequisite:** `launch-branch-merge-candidate-report.md` recommends **FULL MERGE** ✅

---

## Executive Summary

| Item | Decision |
|------|----------|
| First smoke candidate | **`POST /api/generate-image`** (Bild Generator / `image-gen`) |
| Provider | **FAL** (`FAL_API_KEY` or `FAL_KEY`) |
| Staging Supabase ref | `jvjmqtxlqfqaoyjklpxh` |
| Default safety | `PROVIDERS_DISABLED=true` until human explicitly enables |
| Execution in 4G.9-A | **None** — plan only |

---

## 1. First Provider Candidate

### Route

- **Endpoint:** `POST /api/generate-image`
- **Dashboard tool:** `image-gen` (`/dashboard/image-gen`)
- **Guard:** `providerRouteGuardResponse()` at handler start (503 when disabled)

### Why This Candidate

| Criterion | Assessment |
|-----------|------------|
| Single outbound provider | FAL only — no Akool/RunPod/ElevenLabs chain |
| No user uploads | Text prompt in → image out |
| Not LoRA / Face Swap / Live Creator | Excluded per launch policy |
| Credit model documented | 5 credits standard (`IMAGE_GEN_CREDITS.standard` = `FAL_CREDITS.fluxDev`) |
| Refund on failure | `addCredits` in catch block after failed generation |
| Gallery persistence | Writes to `generations` + `generated-assets` bucket via `generation-assets.ts` |
| Guard coverage | Covered by provider sweep (85 routes) |
| UI copy aligned | `GALLERY_PERSISTED_TOOL_IDS` includes `image-gen` |

**Alternatives deferred:** `seedance`, `akool/*`, `lora/*`, `faceswap`, `live-creator/*`, `ki-influencer/*` — higher cost, upload, or multi-step risk.

---

## 2. Required Environment (names only — no secrets)

| Variable | Purpose | Staging expectation |
|----------|---------|---------------------|
| `PROVIDERS_DISABLED` | Kill switch | **`false`** only during supervised smoke window |
| `FAL_API_KEY` or `FAL_KEY` | FAL auth | Test/staging key present in Vercel Preview or local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + DB | Staging ref `jvjmqtxlqfqaoyjklpxh` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth | Staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage ingest | Required for `generated-assets` upload (server-only) |
| `STRIPE_MODE` | Billing safety | `test` (unchanged) |
| `STRIPE_SECRET_KEY` | Billing safety | `sk_test_*` only |

**Must remain unset or safe during smoke:**

- No `sk_live_` / `pk_live_` Stripe keys
- No production Supabase ref (`hszjafdelcydnppyolkm`)
- No `ALLOW_PRODUCTION_DEV_WRITES` unless dev-write guard blocks are understood

---

## 3. Staging User Requirements

| Requirement | Detail |
|-------------|--------|
| Account | Dedicated staging test user (not production admin) |
| Auth | Email/password or magic link on staging Supabase |
| Credits | **≥ 10 credits** before smoke (standard run = 5; reserve for retry) |
| Plan | Active KI tool access (`assertKiToolAccess` must pass) |
| Credit exempt | Avoid credit-exempt test accounts for first smoke (need visible deduction) |

**Pre-smoke baseline record:**

```sql
-- Run in Supabase SQL editor (staging) before smoke
select id, credits from profiles where id = '<staging-user-uuid>';
select count(*) from generations where user_id = '<staging-user-uuid>';
```

---

## 4. Expected Credit Behavior

| Scenario | Credits | Transaction label |
|----------|---------|-------------------|
| Standard generation (Flux Dev) | **−5** | `Bild Generator — Standard (Flux)` |
| High-res (`highRes: true`) | **−8** | `Bild Generator — High-Res (Flux)` |
| Variation | **−5** | `Bild Generator — Variation (Flux)` |
| Insufficient credits | **0** (402) | No provider call |
| Provider failure after deduct | **+5 refund** | `Bild Generator — Standard (Flux) — Refund` |
| Credit-exempt user | 0 deduct/refund | Skip for first smoke |

**Smoke payload (minimal):**

```json
{
  "prompt": "Minimal staging smoke: single product on white background, no text",
  "category": "creator",
  "skipPromptEnhancement": true,
  "falPrompt": "product photo, white background, studio lighting, no text, no watermark"
}
```

---

## 5. Refund Behavior

1. Handler calls `deductCredits` **before** FAL invocation.
2. On any error in the generation `try` block, catch calls `addCredits(supabase, userId, creditCost, … — Refund)` unless user is credit-exempt.
3. **Verify:** Force a failure (invalid FAL key mid-test or abort) and confirm credits return to baseline ±0 net.

---

## 6. Expected Gallery Entry

| Field | Expected |
|-------|----------|
| Table | `generations` |
| `type` | `image` |
| `prompt` | Truncated user prompt (≤500 chars) |
| `result` | JSON with `previewPath`, `sourcePath`, `assetKind: "image"`, `mode: "preview"` |
| Storage | Bucket `generated-assets`, paths `{userId}/{generationId}/preview.jpg` |
| UI | Visible at `/dashboard/gallery` filter **Bild** within ~30s |
| Protected URL | `/api/generated-image/{generationId}?variant=preview` |

**Not expected:** Row in legacy `gallery_assets` (Studio sidebar may stay empty — see `gallery-persistence-decision.md`).

---

## 7. Expected Logs

| Source | Pattern / meaning |
|--------|-------------------|
| Route | No `[dev-write-guard]` block when staging ref + no prod signals |
| FAL | Successful model id in response `model` field |
| Storage | No `DB INSERT FEHLER` from `generation-assets.ts` |
| Credits | Deduction then stable balance; refund log only on failure path |
| Guard (pre-enable) | HTTP 503, `code: "PROVIDERS_DISABLED"` |

---

## 8. Abort Criteria (No-Go)

Stop immediately if any occur:

- Stripe live keys detected (`sk_live_`, `pk_live_`)
- Supabase URL points to production ref
- Credits deducted but no `generations` row and no refund within 60s
- Unexpected credit loss > 10 without successful asset
- Provider returns content with faces of real identifiable persons (policy review)
- Dev-write guard fires unexpectedly on staging ref
- Any webhook or billing side-effect beyond test mode

---

## 9. Rollback Steps

1. Set `PROVIDERS_DISABLED=true` in staging/preview env (immediate kill switch).
2. Redeploy or restart local dev server if env was local.
3. Verify `POST /api/generate-image` returns 503 with `PROVIDERS_DISABLED`.
4. Document final credit balance vs baseline in smoke log.
5. Optional: delete test generation row + storage objects if policy requires cleanup.
6. **Do not** revert migrations or merge branches as part of smoke rollback.

---

## 10. Browser Smoke Steps (human-supervised)

**Preconditions:** `PROVIDERS_DISABLED=false`, FAL key set, staging user logged in, ≥10 credits.

1. Open `/dashboard/image-gen`.
2. Confirm setup copy mentions gallery persistence.
3. Enter minimal prompt (see §4 payload equivalent in UI).
4. Confirm credit cost display shows **5 Credits** (standard).
5. Submit generation; wait for preview (≤120s).
6. Verify preview renders; note `generationId` in network tab.
7. Navigate to `/dashboard/gallery` → filter **Bild** → new entry visible.
8. Open entry; confirm protected image URL loads.
9. Check profile credits decreased by 5.

**Post-smoke:** Re-enable `PROVIDERS_DISABLED=true`.

---

## 11. API Smoke Steps (curl / REST client)

**A — Guard check (providers disabled):**

```http
POST /api/generate-image
Cookie: <staging session cookie>
Content-Type: application/json

{"prompt":"guard test","category":"creator"}
```

Expected: `503`, `code: "PROVIDERS_DISABLED"`.

**B — Happy path (providers enabled, supervised):**

Same request with valid session + minimal prompt. Expected: `200`, `success: true`, `generationId`, `imageUrl`, `creditsUsed: 5`.

**C — Gallery read:**

Server action `getGallery('image')` or UI gallery page — new row with matching `generationId`.

**D — Failure refund (optional second session):**

Simulate failure after deduct; expect refund transaction and restored balance.

---

## 12. Explicitly NOT Done in This Phase

| Excluded | Reason |
|----------|--------|
| Provider execution in 4G.9-A | Preparation prompt only |
| Merge/push to `master` | Launch branch policy |
| Stripe Live / production billing | Safety gate |
| LoRA train/generate | Upload + training risk |
| Face Swap, Live Creator, Live Avatar | High complexity |
| Ki-Influencer upload/train flows | Upload-heavy |
| Enabling providers on production | Staging smoke only |
| Committing secrets or `.env.local` | Security |
| Migration changes | Out of scope |
| Automatic CI provider smoke | Requires explicit human Go |

---

## 13. Human Go/No-Go Checklist

- [ ] Merge candidate report reviewed (FULL MERGE)
- [ ] Staging env vars verified (names above, values in secure store)
- [ ] Staging user credits baseline recorded
- [ ] `PROVIDERS_DISABLED` flip procedure agreed
- [ ] Observer assigned for credit + gallery verification
- [ ] Rollback owner identified
- [ ] **Go** — run Browser + API smoke (§10–11)
- [ ] **No-Go** — leave `PROVIDERS_DISABLED=true`; file follow-up in next launch block

---

## References

- Guard implementation: `src/lib/environment-safety.server.ts`
- Route handler: `src/app/api/generate-image/route.ts`
- Credits: `src/lib/image-generator-credits.ts`, `src/lib/fal-credits.ts`
- Gallery: `src/app/actions/get-gallery.ts`
- Prior audit: `docs/reports/final-self-review-safety-gate.md`

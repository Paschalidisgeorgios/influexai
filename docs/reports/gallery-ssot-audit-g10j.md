# Gallery SSOT Audit (G.10-J)

**Date:** 2026-06-20  
**Branch:** `master`  
**Staging ref:** `jvjmqtxlqfqaoyjklpxh`

---

## Summary

`/dashboard/gallery` uses **`generations` as SSOT** via `getGallery()` in `src/app/actions/get-gallery.ts`. Legacy `gallery_assets` is **not** used on the main gallery page. Studio sidebar (`GET /api/dashboard/init`) now **falls back to `generations`** when `gallery_assets` is empty or missing (staging).

Reference generation from G.10-I billing smoke: **`d65ae809-2e33-484b-8afb-9705868a1757`** — compatible with gallery query and preview route.

---

## Code audit answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Gallery source | `generations` (+ text tables for scripts/niche/etc.) |
| 2 | `gallery_assets` in main gallery | **No** — legacy only (`init`, `POST /api/dashboard/asset`) |
| 3 | G.10-I generation displayable | **Yes** — `type=image`, `previewPath`, `/api/generated-image/:id?variant=preview` |
| 4 | Preview URL compatible | **Yes** — `resolveGenerationMediaUrls` supports `/api/` paths |
| 5 | User scope | **Yes** — `.eq("user_id", user.id)` on all queries |
| 6 | Metadata mapped | **Yes** (after G.10-J fix): prompt, model, credits_used, category |
| 7 | False “not saved” claims | **None** on gallery page; empty state says assets appear after production |
| 8 | Wrong labels | **Fixed** — image rows labeled “Bild Generator”, not “KI-Ich” |
| 9 | Provider-disabled blocks gallery | **No** — gallery is DB read-only |
| 10 | Mobile 390px | **Fixed** — responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `overflow-x-hidden` |

---

## Staging DB (G.10-I generation)

| Field | Value |
|-------|-------|
| `id` | `d65ae809-2e33-484b-8afb-9705868a1757` |
| `type` | `image` |
| `credits_used` | `5` |
| `model` (in `result`) | `krea/v2/large/text-to-image` |
| `previewPath` | `{userId}/d65ae809-…/preview.jpg` |
| `credit_transactions` | `−5` — `Bild Generator — Standard (Krea AI)` |
| Refund | none |
| Gallery query | Would match: user-scoped `generations` + `isImageGenerationType("image")` |

---

## Fixes applied (G.10-J)

| Change | File |
|--------|------|
| Map `credits_used`, model, category, provider | `get-gallery.ts`, `gallery-types.ts` |
| Correct image badge + regenerate link | `gallery-card.tsx`, `gallery-generation-label.ts` |
| Responsive grid on loaded state | `gallery/page.tsx` |
| Studio init fallback to `generations` | `dashboard/init/route.ts` |
| credit-check uses `description` column | `supervised-generate-image-smoke.mjs` |
| Unit tests for labels | `gallery-generation-label.test.ts` |

---

## Next blocks

1. Generate Image UX polish
2. Stripe test webhook smoke
3. Production readiness checklist

**No further provider smoke required for gallery SSOT.**

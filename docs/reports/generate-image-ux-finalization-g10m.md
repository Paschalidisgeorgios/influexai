# Generate Image UX Finalization — G.10-M

**Date:** 2026-06-16  
**Branch:** `master`  
**Staging Supabase ref:** `jvjmqtxlqfqaoyjklpxh`

---

## 1. Safety

| Check | Result |
|-------|--------|
| PROVIDERS_DISABLED | `true` |
| ALLOW_SAFE_DEV_PROVIDER_SMOKE | `false` |
| Provider smoke executed | **no** |
| Stripe smokes | **not run** (out of scope) |
| Production / Live | **not used** |

---

## 2. Route / Navigation

| Item | Result |
|------|--------|
| **Canonical route** | `/dashboard/image-generator` |
| **Alias redirect** | `/dashboard/image-gen` → `/dashboard/image-generator` (301) |
| **Dashboard query** | `?tool=image-gen` → SPA setup (production-tool-routes) |
| **Tools Hub / Mobile Nav** | Links to `/dashboard/image-generator` ✅ |
| **Gallery regenerate** | `galleryImageRegenerateHref()` → `/dashboard/image-generator` ✅ |
| **API** | `POST /api/generate-image` |
| **Preview** | `/api/generated-image/:id?variant=preview` ✅ |
| **Broken links fixed** | `/dashboard/image-gen` redirect added |

---

## 3. UX Improvements

### Prompt & CTA

- Placeholder and label unchanged (clear DE copy)
- CTA disabled when prompt empty, busy, or provider blocked
- Inline hint when prompt missing

### Credit hint

- Visible: **5 Credits pro Bild (Standard)** + link to `/dashboard/credits`
- Button labels: „Generieren — 5 Credits“ / „High-Res — 8 Credits“ (i18n)
- Success shows `creditsUsed` + `creditsLeft` when not credit-exempt

### Model / quality hint

- Neutral: „Premium-Bildmodell · optimiert für Kampagnenvisuals“
- Removed misleading „Acid Noir“ subtitle claim

### Provider-disabled state

- Banner when `NEXT_PUBLIC_PROVIDERS_DISABLED=true` (mirrors server flag)
- API 503 `PROVIDERS_DISABLED` maps to same message
- CTA disabled when blocked — no repeated provider calls

### Loading / Success / Error

- Loading: existing skeleton + disabled buttons (double-submit guard)
- Success: preview + credits info + **„In Galerie öffnen“** → `/dashboard/gallery`
- Error: mapped messages + refund hint on server failures

### Refund / non-deduction hint

> Wenn die Generierung nicht erfolgreich abgeschlossen wird, werden Credits nicht endgültig belastet bzw. automatisch korrigiert.

Shown on 5xx errors (not on provider-disabled or credit errors).

### Mobile 390px

- `overflow-x-hidden` on page root
- Full-width CTAs on small screens (`w-full sm:flex-1`)
- Responsive title clamp
- Grid stacks single column (existing)

---

## 4. Data / State Mapping

| Field | UI |
|-------|-----|
| `creditsUsed` | Success meta (non-exempt) |
| `creditsLeft` | Success meta + `notifyGenerationComplete` |
| `creditExempt` | Hidden from customer-facing credit labels |
| `imageUrl` | Preview via ProtectedGeneratedImage |
| `generationId` | Internal; gallery link uses `/dashboard/gallery` |
| 503 PROVIDERS_DISABLED | Banner + disabled CTA |
| 402 insufficient credits | Existing modal via `handleApiInsufficientCredits` |

---

## 5. Code Changes

| File | Change |
|------|--------|
| `src/lib/generate-image-ux.ts` | Client-safe UX helpers + error mapping |
| `src/app/dashboard/image-generator/page.tsx` | Revenue MVP UX panels |
| `next.config.ts` | Redirect + `NEXT_PUBLIC_PROVIDERS_DISABLED` |
| `messages/de.json` | Neutral subtitle |
| `tests/unit/lib/generate-image-ux.test.ts` | Unit tests |

---

## 6. Umsatz-MVP UX Assessment

**Sufficient for MVP:** yes — clear credits, provider-disabled messaging, success gallery path, error/refund copy, canonical routing.

**Open blockers:** none for staging QA with providers enabled in controlled smoke window.

**Nice-to-haves:** Playwright visual regression at 390px; EN subtitle alignment.

---

## 7. Next Phase

**G.10-N2 runtime alignment (2026-06-16):** SPA credit pill → „5 Credits pro Bild“, CTA shows selected cost (5/8). See `docs/reports/generate-image-runtime-ux-alignment-g10n2.md`.

**Launch gate / staging deploy verification** — enable provider window only for controlled billing+generation proof, then re-disable.

---

## 8. Env (no secrets)

**Local:** `PROVIDERS_DISABLED=true`, staging Supabase, test Stripe keys  
**Expose to client:** `NEXT_PUBLIC_PROVIDERS_DISABLED` auto-set from `PROVIDERS_DISABLED` at build/dev  
**Production deploy:** set `PROVIDERS_DISABLED=false` when ready for live generation

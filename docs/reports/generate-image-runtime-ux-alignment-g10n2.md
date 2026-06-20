# Generate Image Runtime UX Alignment — G.10-N2

**Date:** 2026-06-16  
**Branch:** `master`  
**Staging Supabase ref:** `jvjmqtxlqfqaoyjklpxh`

---

## 1. Safety

| Check | Result |
|-------|--------|
| PROVIDERS_DISABLED | `true` |
| ALLOW_SAFE_DEV_PROVIDER_SMOKE | `false` |
| STRIPE_MODE | `test` |
| Supabase ref | staging `jvjmqtxlqfqaoyjklpxh` |
| Provider smoke / submit | **not executed** |
| Stripe smoke | **not executed** |
| Production / Live | **not used** |
| `.env.local` staged | **no** |
| `public/images/lora-training/` staged | **no** |

---

## 2. Runtime component audit

| Question | Answer |
|----------|--------|
| What renders at `/dashboard/image-generator`? | `DashboardShell` → `LegacyToolRedirect` → `DashboardLayout` + `ProductionToolSetup` + `ProductionToolSetupBody` (`ImageGenSetup`) |
| Dedicated `page.tsx` status | Exists (G.10-M revenue UX) but **not mounted** at runtime — children replaced by `LegacyToolRedirect` |
| SPA shell status | **Active runtime UX** — canonical user experience |
| Canonical URL | `/dashboard/image-generator` (links, gallery, mobile nav) |
| Alias | `/dashboard/image-gen` → 308 redirect to canonical |
| Query route | `/dashboard?tool=image-gen` — same SPA shell after client redirect |
| Tests target runtime | ✅ Playwright asserts SPA shell (`image-gen-prompt`, credit pill, provider notice) |

---

## 3. Credit copy — before / after

| Surface | Before (G.10-N) | After (G.10-N2) |
|---------|-----------------|-----------------|
| Credit pill (context) | „5–8 Credits“ | **„5 Credits pro Bild“** |
| Quality hint | — | **„Standardqualität · kampagnenbereit“** |
| CTA (default model) | „Bild generieren“ | **„Bild generieren — 5 Credits“** |
| CTA (Premium model) | „Bild generieren“ | **„Bild generieren — 8 Credits“** |
| Model dropdown | „Influex Fast · 5 Credits“ / „Influex Premium · 8 Credits“ | unchanged (per-option clarity) |
| `credit-display` SSOT | „5–8 Credits“ range | **„5 Credits pro Bild“** / **„8 Credits pro Bild“** with `highRes` |

Standard Generate Image cost remains **5 Credits** (`IMAGE_GEN_CREDITS.standard`). Premium selection remains **8 Credits** — shown explicitly in CTA and model row, not as ambiguous range in the main pill.

---

## 4. Provider-disabled state

Unchanged and verified:

- `ToolExecutionDisabledNotice` visible in model shell
- CTA disabled when prompt empty or `providerShell`
- API returns 503 `PROVIDERS_DISABLED`
- No provider execution, no credit deduction

---

## 5. Desktop / Mobile QA

| Check | Result |
|-------|--------|
| Desktop credit pill | „5 Credits pro Bild“ |
| Desktop CTA | „Bild generieren — 5 Credits“, disabled |
| Mobile 390px credit pill | „5 Credits pro Bild“ |
| Horizontal scroll | none |
| Gallery hint | visible |
| Provider banner | visible |

Playwright (read-only): **5/5 pass**

---

## 6. Code changes

| File | Change |
|------|--------|
| `src/lib/generate-image-ux.ts` | Credit pill/CTA helpers, quality hint constant |
| `src/lib/tools/credit-display.ts` | SSOT: „5 Credits pro Bild“ instead of range |
| `src/components/dashboard/core/ProductionToolSetup.tsx` | Fixed pill + quality hint for `image-gen` |
| `src/components/dashboard/core/ProductionToolSetupBody.tsx` | Dynamic CTA cost label |
| `src/lib/tools/agent-tool-capability-map.ts` | Agent credit estimate aligned |
| `tests/unit/lib/generate-image-ux.test.ts` | Unit tests for credit copy |
| `tests/e2e/flows/generate-image-visual-qa.test.ts` | Assert „5 Credits pro Bild“ + CTA cost |

Dedicated `page.tsx` **not refactored** — documented as future-unification path when `openMode` switches to dedicated.

---

## 7. Tests

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors |
| `npm run test:unit -- --run` | ✅ pass (incl. `generate-image-ux.test.ts`) |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |
| Playwright visual QA | ✅ 5/5 |

---

## 8. Provider-UI-Smoke freigabe?

**Runtime UX staging-ready:** **YES** — credit copy aligned with G.10-I proof (5 Credits standard).

**Controlled provider smoke sensible next:** **YES** — after staging deploy, supervised window only, baseline credits for `billingtest@`, then re-disable providers.

---

## 9. Env (no secrets)

**Local now:** `PROVIDERS_DISABLED=true`, `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`, `STRIPE_MODE=test`, staging Supabase

**Outside:** Do not enable providers without supervised smoke; no Stripe live; no production Supabase

# Generate Image Visual QA — G.10-N

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
| Supabase ref | `jvjmqtxlqfqaoyjklpxh` (staging) |
| Production Supabase | **not used** |
| Stripe Live | **not used** |
| Provider smoke / submit | **not executed** |
| `.env.local` staged | **no** |
| `scripts/supervised-smoke-result.json` staged | **no** |
| `public/images/lora-training/` staged | **no** |
| Provider-Call ausgeführt | **no** |

`NEXT_PUBLIC_PROVIDERS_DISABLED` is injected from `PROVIDERS_DISABLED` via `next.config.ts` (value: `true` locally). Runtime Bildgenerator UI uses additionally `studio-tool-registry` `providerExecution: "disabled"` for the SPA shell.

---

## 2. Architecture note (runtime UX)

`/dashboard/image-generator` is intercepted by `DashboardShell` → `LegacyToolRedirect` → `DashboardLayout` + `ProductionToolSetup` (`?tool=image-gen` SPA shell).

The dedicated page `src/app/dashboard/image-generator/page.tsx` (G.10-M revenue UX) is **not rendered** on this route today. Visual QA therefore targets the **SPA shell** (`ProductionToolSetupBody` → `ImageGenSetup`), which is what staging users see.

---

## 3. Geprüfte Routen

| Route / Link | Result |
|--------------|--------|
| `/dashboard/image-generator` | Loads SPA Bildgenerator setup (redirects client-side to `/dashboard?tool=image-gen`) |
| `/dashboard/image-gen` | **308** → `/dashboard/image-generator` |
| `/dashboard?tool=image-gen` | Same SPA shell as above |
| Tools Hub → Bildgenerator | Links to `/dashboard/image-generator` |
| Gallery „Neu generieren“ | `href` → `/dashboard/image-generator` |
| Broken links | **none found** |

---

## 4. Desktop Visual QA

| Item | Result |
|------|--------|
| Tool loads without crash | ✅ |
| Prompt field („Bildbeschreibung“) | ✅ visible, editable |
| CTA „Bild generieren“ | ✅ visible, disabled when prompt empty |
| CTA with prompt + provider disabled | ✅ stays disabled |
| Credit hint | ✅ pill **5–8 Credits** + model options show per-model estimates |
| Model / quality context | ✅ model select + helper copy |
| Provider-disabled banner | ✅ `tool-execution-disabled-notice` — „Provider-Ausführung ist in dieser Umgebung deaktiviert.“ |
| Gallery hint | ✅ copy references `/dashboard/gallery` |
| Horizontal scroll | ✅ none (document scrollWidth ≤ clientWidth) |
| Debug / admin text | ✅ none visible |
| Endkunden-tauglich | ✅ yes (light studio shell, clear DE copy) |

---

## 5. Mobile 390px QA

| Item | Result |
|------|--------|
| Horizontal scroll | ✅ none |
| Prompt field width | ✅ >280px usable |
| CTA | ✅ full-width sticky action bar on mobile |
| Provider banner | ✅ readable, not clipped |
| Credit hint | ✅ visible |
| Bottom nav overlap | ✅ sticky CTA above bottom nav (`bottom-[4.75rem]`) |
| Layout stacking | ✅ single-column |
| Endkunden-tauglich | ✅ yes |

---

## 6. Provider-disabled UX

| Item | Result |
|------|--------|
| User understands generation off | ✅ banner + disabled CTA |
| CTA disabled (no bypass) | ✅ `primaryDisabled={!prompt.trim() \|\| providerShell}` |
| No endless loading | ✅ no fetch on mount in SPA shell |
| No credits deducted | ✅ no successful API call |
| No provider call | ✅ client blocks before fetch when `providerShell` |
| API `POST /api/generate-image {}` | **503** `PROVIDERS_DISABLED` |
| Retry loop | ✅ none |
| Double submit | ✅ disabled while loading (not triggered in disabled state) |
| Message quality | ✅ end-customer DE copy (not raw stack traces) |

---

## 7. Gallery link

- Setup context shows gallery persistence note for `image-gen`.
- Gallery regenerate links target `/dashboard/image-generator` (canonical).
- Playwright confirms link `href` matches `image-generator`.

---

## 8. Redirects / aliases

- `next.config.ts`: `/dashboard/image-gen` → `/dashboard/image-generator` (308 verified).
- Client: `LegacyToolRedirect` replaces URL with `/dashboard?tool=image-gen` while keeping tool context.

---

## 9. Gefundene Probleme

1. **Test/UI layer mismatch (G.10-M):** Playwright initially targeted dedicated-page `data-testid`s that are not mounted at `/dashboard/image-generator` because of `LegacyToolRedirect`.
2. **Cookie banner blocked login** in E2E until „Akzeptieren“ was clicked before submit.
3. **Credit copy delta:** SPA pill shows **5–8 Credits** (range); dedicated page G.10-M shows **5 Credits pro Bild (Standard)** — both accurate, SPA is range-first.

---

## 10. Behobene Probleme

| Fix | File |
|-----|------|
| SPA-aligned Playwright visual QA (desktop + 390px) | `tests/e2e/flows/generate-image-visual-qa.test.ts` |
| Reuse-server Playwright config (no extra webServer) | `playwright.reuse-server.config.ts` |
| `data-testid` on SPA prompt + credit pill | `ProductionToolSetupBody.tsx`, `ProductionToolSetup.tsx`, `StudioCreditPill.tsx` |
| `toolId` passed to model shell for agent-disabled message | `ProductionToolSetupBody.tsx` |
| Dedicated-page testids + 503 probe fallback (future dedicated open) | `image-generator/page.tsx` |
| Cookie-safe login flow in E2E | `generate-image-visual-qa.test.ts` |

---

## 11. Offene Punkte

| Priority | Item |
|----------|------|
| Nice-to-have | Unify dedicated `page.tsx` G.10-M UX with SPA shell OR open dedicated route when `openMode: "dedicated"` |
| Nice-to-have | Align credit pill copy to „5 Credits pro Bild“ in SPA for parity with dedicated page |
| Next gate | Controlled provider-enabled smoke (G.10-I window) with billing proof |
| Manual | Full browser pass on staging deploy URL (this QA used local dev) |

---

## 12. Staging-ready?

**Generate Image (provider-disabled staging):** **YES** — routing, gallery links, provider-disabled UX, mobile layout, and API guard are staging-ready.

**Generate Image (live generation):** **NOT YET** — requires controlled provider window + post-smoke credit verification (G.10-I follow-up).

**Nächster kontrollierter Provider-UI-Smoke sinnvoll?** **Ja** — after staging deploy, with `PROVIDERS_DISABLED=false` only in a supervised window, `billingtest@` credits baseline recorded, no Stripe live.

---

## 13. Tests

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors |
| `npm run test:unit -- --run` | ✅ 227 passed |
| `npm run typecheck` | ✅ pass |
| `npm run build` | ✅ pass |
| Playwright `generate-image-visual-qa.test.ts` | ✅ 5/5 (redirect, desktop, mobile 390px, gallery link, 503 probe) |

---

## 14. Env (no secrets)

**Local now**

- `PROVIDERS_DISABLED=true`
- `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`
- `STRIPE_MODE=test`
- Supabase staging ref `jvjmqtxlqfqaoyjklpxh`
- Stripe keys: `sk_test_*` pattern

**Outside / deploy**

- Do **not** set `PROVIDERS_DISABLED=false` until controlled smoke window
- Do **not** enable `ALLOW_SAFE_DEV_PROVIDER_SMOKE`
- No Stripe live keys on staging
- Never commit `.env.local`

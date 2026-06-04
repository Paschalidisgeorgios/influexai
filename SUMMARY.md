# E2E Smoke Test — influexaicreator.com

**Datum:** 2026-06-03  
**Stack:** Next.js 16, Supabase, Anthropic, FAL, ElevenLabs, Akool, Stripe, Resend  
**Production:** https://influexaicreator.com (Deploy `dpl_HEro89sXiZMPTZMQpYxnkuDsYads`)

Automatisiert: `node scripts/smoke-test-all.mjs`, `npm run test:unit:run` (58/58), Playwright (`npm run test:e2e` mit `.env.test`).

---

## AUTHENTICATION

| Test | Status | Details |
|------|--------|---------|
| Sign Up (neue Email) | ⚠️ Teilweise | Formular + Validierung OK (Playwright). Redirect nach Signup: Supabase lehnt `*@influexai.test` als „invalid email“ ab → Test übersprungen. Mit echter Domain + bestätigter Mail manuell prüfen. |
| Sign In | ✅ | Playwright: Login → `/dashboard` |
| Sign Out | ⏭️ | Nicht in diesem Lauf (Projekt `logout` separat) |
| Password Reset | ✅ Route / ⚠️ Mail | **`/forgot-password`** neu, Prod **200** nach Deploy. Resend: `RESEND_API_KEY` fehlt lokal; Zustellung nur manuell in Inbox prüfbar. |

**Fixes:** `src/app/(auth)/forgot-password/page.tsx`, i18n `forgot_*` in allen 8 Locales.

---

## CORE FEATURES

| Test | Status | Details |
|------|--------|---------|
| Niche Analyzer („YouTube Shorts DE“) | ✅ | Playwright: 5 Ideen, Metriken (E2E-Mock + DB `niche_saves`). |
| Script Generator + DB-Save | ✅ | Playwright: Generierung, Copy, Save-Button; Migration 028 `saved_scripts` INSERT OK. |
| Thumbnail Konzept | ⚠️ | Kein dedizierter Playwright-Flow; DB-Tabelle `thumbnail_concepts` OK; UI manuell / Claude-Action. |
| Outlier Detector | ⚠️ | Infra + DB `outlier_results` OK; kein Browser-E2E (Mock in Actions). API: `POST /api/outlier-detector`. |
| Stimme & Musik (ElevenLabs) | ❌ lokal | `api:elevenlabs-voices` → **401** mit lokalem Key; Vercel-Key vermutlich gültig — `npm run` Route `/api/test-elevenlabs` auf Prod testen. |
| Video Remix | ⚠️ | **Claude-Konzepte**, kein fal-Video-Job. DB `remix_results` OK. Playwright fehlt. |
| Mein KI-Ich / Avatar | ⚠️ | FAL `flux-pulid` via `/api/ki-ich`; Avatar-Video über Live Creator / Akool — nicht automatisiert (Laufzeit + Kosten). |
| Produkt-Werbung | ⚠️ | Claude via `/api/produkt-werbung` — nicht automatisiert. |
| Face Swap (Akool) | ⚠️ | `/api/faceswap`, `/api/akool` — Env OK; End-to-End nicht automatisiert. |

**Hinweis Video Remix:** Erwartetes fal.ai-Webhook-Rendering existiert im Produkt nicht; Remix = Remix-Ideen (JSON) + optional YouTube-Metadaten.

---

## CREDITS & BILLING

| Test | Status | Details |
|------|--------|---------|
| Credit Balance angezeigt | ✅ | Dashboard + Credits-Seite (Playwright). |
| Credits nach Feature-Call | ✅ | Script Generator: Abzug 2 Credits (Playwright + Mock). Block bei 0 Credits: Upgrade-Dialog (Fix: Client-Check in `script-generator/page.tsx`). |
| Stripe Checkout | ✅ | Playwright: Klick „Kaufen“ → API `/api/stripe/checkout` (Mock-Session). |

---

## GALLERY

| Test | Status | Details |
|------|--------|---------|
| Ergebnisse in Gallery | ⚠️ | Route `/dashboard/gallery` (Auth 307); Merge-Logik + Pagination 20 — kein Playwright, Build-Fix deployt. |
| Gallery `/de` und `/en` | ✅ Redirect | App nutzt **Cookie-Locale**, keine `[locale]`-Routes: `/de` → 307, Inhalt unter `/dashboard/gallery` + `LanguageSwitcher`. |

**Deploy-Fixes:** `GALLERY_PAGE_SIZE` nach `lib/gallery-types.ts`; Type-Re-Exports aus `"use server"` entfernt (Build-Fehler).

---

## i18n

| Test | Status | Details |
|------|--------|---------|
| Sprachwechsel DE → EN → +2 | ⚠️ | `npm run i18n:check` — 172 Keys × 8 Sprachen OK. Playwright für Switcher nicht ausgeführt; manuell Cookie `locale` + Switcher. |

---

## Automatisierte Läufe (Kurz)

| Suite | Ergebnis |
|-------|----------|
| Unit (Vitest) | **58/58** ✅ |
| Infra Smoke | **24 pass / 2 fail** — siehe unten |
| Playwright (setup + chromium + flows) | **36 pass / 1 skip / 0 fail** (nach Test-Fixes) |

### Infra Smoke — Fehler

- ❌ `env:RESEND_API_KEY` — nicht in `.env.local`
- ❌ `api:elevenlabs-voices` — **401** (lokaler Key ungültig/abgelaufen)

### Playwright-Fixes (diese Session)

- Signup-Button: `Create account` (EN) im Selector
- Dashboard-Greeting: zeitbasierte Begrüßung statt „Hey/Hallo“
- Script Generator: Overlay schließen + Credit-Dialog bei 0 Credits
- Signup E2E-Email ohne Punkt im Local-Part (`e2e${timestamp}@…`)

---

## ✅ Bestandene Tests (Zusammenfassung)

- Prod-Routen: `/`, `/login`, `/signup`, **`/forgot-password`**, `/dashboard/gallery`, `/de`, `/en`
- Supabase Migration 028: alle 5 Flow-Tabellen beschreibbar
- APIs: Anthropic, FAL Queue
- Env (lokal): Supabase, Stripe, FAL, Akool, Anthropic
- Auth UI: Login, Signup-Validierung, geschützte Routen
- Dashboard: Greeting, Credits, Flow-Karten, Mobile-Nav, Low-Credit-Banner
- Flows: Niche Analyzer, Script Generator (inkl. No-Credits), Credits/Stripe
- Production Build + Vercel Deploy

---

## ❌ Fehlgeschlagene / offene manuelle Tests

- Resend Password-Reset-E-Mail (Key + Inbox)
- ElevenLabs lokal (401) — Prod separat verifizieren
- Sign Up mit neuer echter E-Mail bis Dashboard (Supabase E-Mail-Policy)
- Thumbnail, Outlier/Remix UI, Voice, KI-Ich, Produkt, Face Swap, Gallery-Inhalt, i18n-Switcher (4+ Sprachen) — **manuell** oder zusätzliche Playwright-Specs
- Sign Out (Logout-Projekt nicht ausgeführt)
- Niche „Speichern“ (1 Playwright-Test skipped in Serial-Suite)

---

## Offene TODOs

1. **`RESEND_API_KEY`** in `.env.local` und ggf. Vercel prüfen; Reset-Mail an echte Adresse senden.
2. **ElevenLabs:** lokalen Key rotieren oder mit Vercel-Prod-Key angleichen; Stimme & Musik auf `/dashboard/voice` testen.
3. **Playwright erweitern:** Thumbnail, Outlier, Remix, Gallery, LanguageSwitcher, Logout.
4. **`YOUTUBE_API_KEY`** optional auf Vercel für Remix-URL-Metadaten.
5. **Sign Up E2E:** Supabase erlaubte Test-Domain konfigurieren oder Service-Role-Fixture nutzen.
6. **Dokumentation:** Video Remix ≠ fal-Video-Rendering (nur Konzepte).

---

## Angewendete Fixes (Smoke-Lauf)

| Problem | Fix |
|---------|-----|
| Prod `/forgot-password` 404 | Neue Page + i18n + Deploy |
| Vercel Build: `GALLERY_PAGE_SIZE` in `"use server"` | Konstante nach `lib/gallery-types.ts` |
| Build: `RemixConcept` / `OutlierConcept` Runtime | Type-Re-Export aus Actions entfernt; Import aus `lib/*-analysis.ts` |
| Playwright Signup/Dashboard/Script | Test-Selektoren + `dismissOverlays` + Client Credit-Guard |
| Playwright Signup-Button Timeout | EN-Label `Create account` im Regex |

---

*Erzeugt nach vollständigem Smoke-Lauf. Rohdaten: `scripts/smoke-results.json`, Playwright-Report: `playwright-report/`.*

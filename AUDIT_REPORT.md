# InfluexAI System-Audit

**Datum:** Juni 2026  
**Methode:** Read-only Code-Review (keine Änderungen am Produktcode, kein Build, kein Commit)  
**Hinweis:** Dies ist keine Rechtsberatung. Rechtliche Bewertungen sind als technische Compliance-Hinweise markiert.

---

## 🔴 KRITISCH (sofort fixen — blockiert Geld / Login / Sicherheit)

| Bereich | Datei:Zeile | Problem | Fix nötig |
|---------|-------------|---------|-----------|
| Stripe Webhook | `src/app/api/stripe/webhook/route.ts:308-313` | **Keine Idempotenz** vor `addCredits()`. Stripe kann `checkout.session.completed` erneut senden → Credits mehrfach gutgeschrieben. `stripe_payments`-Upsert erfolgt **nach** Gutschrift, prüft nicht ob Session bereits verarbeitet. | Vor Gutschrift prüfen ob `stripe_session_id` bereits existiert; `event.id` persistieren. |
| Stripe Webhook | `src/app/api/stripe/webhook/route.ts:144-152` | Abo-Checkout (`handlePlatformSubscription`) addiert monatliche Credits bei jedem erneuten Event ohne Duplikat-Check. | Idempotenz pro `session.id` / `subscription.id`. |
| Profil-Anlage | `supabase/migrations/024_paid_only_new_users.sql:3-19` | `handle_new_user()` existiert, aber **kein `CREATE TRIGGER … ON auth.users`** in Repo-Migrationen. Profil-Row evtl. nicht automatisch angelegt. | Trigger in Migration + Supabase-Prod verifizieren. |
| Aufladen UI | `src/components/credits/BuyCreditsProvider.tsx:222` | `showModal = modalOpen && hasPlan` — Free-User sehen beim Klick auf Credits-Badge/Sidebar **kein Modal** (stilles No-Op). | Modal öffnen oder Redirect `/pricing` / `/dashboard/credits`. |
| Avatar Render | `src/app/api/avatar/start-render/route.ts:44-49` | Credits werden **vor** Render abgezogen (manueller Update, nicht `deductCredits`). RunPod nicht angebunden (Z. 59–63); bei Fehler **keine Erstattung**. | Abbuchung nach Erfolg oder Refund bei Fehler. |
| Recht / Signup | `src/app/(auth)/signup/page.tsx:400` | Link `href="/terms"` — Route **existiert nicht** (AGB liegt unter `/agb`). | Link auf `/agb` (+ Datenschutz-Link). |
| Recht | — | **`/widerruf` fehlt komplett** — bei digitalen Abos (7,99 € Starter-Abo) in DE üblicherweise erforderlich. | Widerrufsseite + Verlinkung in AGB/Checkout. |
| Analytics | `src/app/layout.tsx:170-171` + `GoogleAnalytics.tsx:5-20` | Google Analytics wird **immer** geladen, unabhängig vom Cookie-Banner-Consent. | GA erst nach Consent laden. |
| Credit-Race | `src/lib/credits.ts:124-152` | `deductCredits` = Read-Modify-Write ohne DB-Transaktion/Lock → parallele Requests können Credits **unter 0** drücken oder doppelt abbuchen. | Atomare RPC oder `SELECT … FOR UPDATE`. |

---

## 🟡 MITTEL (wichtig, nicht sofort blockierend)

| Bereich | Datei:Zeile | Problem | Fix nötig |
|---------|-------------|---------|-----------|
| Auth Admin-API | `src/app/api/admin/ab-stats/route.ts:23` | Prüft nur `profile.is_admin`, **nicht** `isPlatformAdminServer` / Email-Allowlist. Allowlist-Admin ohne DB-Flag → 403. | Einheitlich `requireAdmin()` / `isPlatformAdminServer`. |
| Auth Admin-API | `src/app/api/admin/ab-reset/route.ts:22` | Gleiches Problem (`is_admin` only). | Wie oben. |
| Signup Legal | `src/app/(auth)/signup/page.tsx:397-405` | **Keine Checkbox**; nur Fließtext „stimmst du AGB zu“. Kein Datenschutz-Link. | Checkbox + Links `/agb` + `/datenschutz`. |
| Legacy Auth | `src/app/auth/page.tsx` | Parallele Auth-UI neben `/auth/sign-in`; Signup ohne Email-Redirect-Konfiguration wie neue Seite. | Deprecaten oder angleichen. |
| Email-Bestätigung | `signup/page.tsx:128-138` | Code setzt `emailRedirectTo`, aber ob Supabase **Confirm email = ON** ist, steht nur im Dashboard (nicht im Repo). | In Supabase Prod verifizieren. |
| Plan-Gating | `src/middleware.ts:259-261` | Setzt nur Header `x-plan-upgrade-required`, **blockiert Route nicht**. Schutz clientseitig via `PlanGateProvider`. | Serverseitig redirect oder API härter absichern (teilweise via `assertGatedFeature`). |
| Plan-Gating Client | `PlanGateProvider.tsx:56` | `hasActivePlan` ohne Email an Admin-Allowlist → Admin-Allowlist-Email evtl. als Free behandelt bis Profil geladen. | Email in Client-Check mitschicken. |
| Produkt-Script | `src/app/api/product-ad/script/route.ts:82-101` | Auth + Plan-Gate, aber **keine Credit-Abbuchung** — Claude-Script gratis nach Plan-Kauf. | Credits definieren oder bewusst dokumentieren. |
| Voice Preview | `src/app/api/elevenlabs/voice-preview/route.ts:37-49` | Auth ja, **keine Credits** — ElevenLabs-Kosten pro Preview. | Rate-Limit oder Credit-Kosten. |
| Agent Execute | `src/app/api/agent/execute/route.ts:6` | Nutzt `mockExecutor` — Credits werden abgebucht, Ergebnis teils Mock. | Produktions-Executor oder Kennzeichnung. |
| Agent Campaign | `src/app/api/agent/campaign/route.ts:6` | `buildCampaignResult` aus Mock; Credits bei Erfolg abgebucht. | Erwartung vs. Realität klären. |
| Webhook | `src/app/api/stripe/webhook/route.ts` | **`export const dynamic` fehlt** (andere Stripe-Routen haben `force-dynamic`). | Konsistenz / Caching vermeiden. |
| RLS profiles | Repo-Migrationen | Kein explizites `enable row level security` auf `profiles` in gefundenen Migrationen (Tabelle vermutlich extern angelegt). | RLS-Status in Supabase prüfen. |
| AGB | `src/app/agb/page.tsx` | Kein Widerrufs-/Kündigungsabschnitt für Verbraucher-Abos. | Rechtstext ergänzen (mit Anwalt). |
| Checkout UX DE | Stripe Checkout | Kein eigener „zahlungspflichtig bestellen“-Text im Code (Stripe-Standard). | Stripe Custom Text / AGB-Links prüfen. |
| Doppel-Checkout-API | `src/app/api/credits/checkout` + `src/app/api/stripe/credits-checkout` | Zwei Pfade für Credit-Packs; unterschiedliche Clients. | Vereinheitlichen. |
| Admin UI | `DashboardSidebar.tsx:431-448` | Admin-Nav nur wenn `isAdminUser()` (Client). URL `/dashboard/admin/*` dennoch erreichbar → Layout blockiert serverseitig. | OK, aber Client-Check nicht alleinige Sicherheit (Layout ok). |
| Start-Credits Anzeige | `subscription-plans.ts:122` | `getPlanMonthlyCredits("free")` returns **50** für UI-Kapazität, obwohl Signup **0** Credits setzt. | Verwirrende Sidebar-Max-Anzeige. |

---

## 🟢 KOSMETISCH (nice to have)

| Bereich | Datei:Zeile | Problem |
|---------|-------------|---------|
| Tote Komponente | `src/components/credits/BuyCreditsModal.tsx` | Wird nirgends importiert; `BuyCreditsProvider` nutzt `NoCreditsModal`. |
| Auth Marketing | `src/app/auth/page.tsx:389` | „DSGVO-konform“-Claim ohne rechtliche Absicherung im Text. |
| Legacy URLs | `middleware.ts:41-45` | `/login`, `/signup` → Redirect (funktioniert). |
| forgot-password | `forgot-password/page.tsx:89` | Link `/login` statt `/auth/sign-in` (Redirect ok). |
| TS | `npx tsc --noEmit` | **Keine TypeScript-Fehler** (Juni 2026 Audit-Lauf). |
| Env-Doku | `docs/auth/ENV_REQUIRED.md` | Gut dokumentiert inkl. `ADMIN_EMAIL_ALLOWLIST`; Stripe Credit-Env vorhanden. |
| .gitignore | `.gitignore:37` | `.env*` ignoriert ✓ |

---

## 📊 STATUS-MATRIX

| Bereich | Status | Details |
|---------|--------|---------|
| **Auth Login** | ⚠️ Teilweise | `signInWithPassword` + Fehler-UI (`login/page.tsx:34-40`). Redirect via `resolvePostAuthRedirect`. |
| **Auth Signup** | ⚠️ Teilweise | Funktional; Email-Verify-Screen; `/terms`-Link kaputt; keine Legal-Checkbox. |
| **Email-Bestätigung** | ⚠️ Unklar | Code unterstützt es; Supabase-Dashboard-Einstellung nicht im Repo verifizierbar. |
| **Passwort-Reset** | ✅ | `/forgot-password` + `resetPasswordForEmail` (`forgot-password/page.tsx:30-32`). |
| **Session / Middleware** | ✅ | `middleware.ts:146-151` blockiert `/dashboard` ohne User. Admin-Guard Z. 160-181. |
| **Profil-Anlage** | 🔴 Risiko | Trigger-Funktion ja, Trigger-Create im Repo **nein**. 0 Start-Credits (`024_paid_only_new_users.sql:14`). |
| **Stripe Checkout** | ✅ | Sessions via `create-credits-checkout.ts`, `subscribe/route.ts`. Success URLs gesetzt. |
| **Stripe Webhook** | 🔴 | Signatur-Check ja (`webhook/route.ts:337-350`). **Idempotenz nein.** Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`. |
| **Aufladen-Button** | 🔴 Free-User | onClick vorhanden; Stripe nur mit Plan-Modal oder direkt `/dashboard/credits`. |
| **Credit-Verbrauch Tools** | ⚠️ Gemischt | Meiste Kern-APIs: Auth + Check + Abbuchung nach Erfolg. Ausnahmen siehe Tabelle unten. |
| **Navigation** | ✅ | Sidebar-Hrefs haben `page.tsx` (siehe Nav-Tabelle). Tot: `/terms` (Signup). |
| **Admin-Schutz** | ⚠️ | Server: Layouts + `requireAdmin`/`isPlatformAdminServer`. Inkonsistenz bei `ab-stats`/`ab-reset`. |
| **Rechtliches (DE)** | 🔴 | Impressum/Datenschutz/AGB/Cookies ✓. **Widerruf ✗.** GA ohne Consent. |
| **Sicherheit** | ⚠️ | Secrets serverseitig; `.env*` gitignored. Credit-Race + Webhook-Idempotenz schwach. |
| **TypeScript** | ✅ | `npx tsc --noEmit` exit 0. |

---

## TEIL A — AUTH & REGISTRIERUNG (Detail)

### Auth-Dateien

| Pfad | Rolle |
|------|-------|
| `src/app/(auth)/login/page.tsx` | Haupt-Login |
| `src/app/(auth)/signup/page.tsx` | Haupt-Signup |
| `src/app/(auth)/forgot-password/page.tsx` | Passwort-Reset |
| `src/app/auth/sign-in/page.tsx` | Re-Export Login |
| `src/app/auth/sign-up/page.tsx` | Re-Export Signup |
| `src/app/auth/callback/route.ts` | OAuth/Email-Callback |
| `src/app/auth/page.tsx` | Legacy kombinierte Auth |
| `src/middleware.ts` | Session + Redirects + Guards |

### Befunde

1. **Login:** ✅ Funktioniert grundsätzlich. Fehler → generische Meldung `bad_credentials` (kein Unterscheid unbestätigte Email vs. falsches Passwort).
2. **Registrierung:** ✅ `signUp` mit Metadata (Referral, Beta). Duplikat-Email-Handling via `isSignupEmailAlreadyRegistered`.
3. **Email-Bestätigung:** ⚠️ `emailRedirectTo` gesetzt; Erzwingung in Supabase nicht aus Code ableitbar.
4. **Passwort-Reset:** ✅ Vorhanden.
5. **AGB/Datenschutz-Checkbox:** ❌ Nur Text + kaputter `/terms`-Link.
6. **Redirect nach Registrierung:** Mit Session → `resolvePostAuthRedirect` (Admin → `/admin`, mit Plan → `/dashboard`, ohne Plan → `/pricing`). Ohne Session → Verify-Screen.
7. **Middleware:** ✅ Vorhanden; Supabase SSR Cookies.
8. **Geschützte Routen:** ✅ `/dashboard` ohne Auth → `/auth/sign-in?redirect=…` (`middleware.ts:146-151`).

---

## TEIL B — PROFIL & START-CREDITS (Detail)

1. **Automatisches profiles-Row:** ⚠️ Funktion `handle_new_user()` insert mit `credits: 0`. Trigger-Anlage **nicht im Repo** → **Unsicherheit**.
2. **Start-Credits:** **0** (`024_paid_only_new_users.sql:14`). Kein Signup-Bonus.
3. **Mechanismus:** DB-Trigger (Funktion), nicht App-Code. Kein `profiles.insert` in `src/`.
4. **Trigger fehlschlägt:** User existiert in `auth.users`, aber API/Dashboard erwartet `profiles` → `deductCredits` → „Profil nicht gefunden“ (`credits.ts:130-135`).
5. **RLS profiles:** Policies in `043_user_role.sql`, `021_push_notifications.sql` etc. Explizites RLS-Enable auf `profiles` in Repo **nicht gefunden** → manuell prüfen.

---

## TEIL C — STRIPE / BEZAHLLOGIK (Detail)

### Stripe-Routen

```
src/app/api/stripe/checkout/route.ts          — Credit-Packs (legacy)
src/app/api/stripe/credits-checkout/route.ts  — Credit-Packs (priceId)
src/app/api/stripe/subscribe/route.ts         — Plattform-Abo
src/app/api/stripe/agency-checkout/route.ts   — Agency-Abo
src/app/api/stripe/agency-credits/route.ts    — Agency Credits
src/app/api/stripe/session/route.ts           — Post-Checkout Poll
src/app/api/stripe/webhook/route.ts           — Webhook
src/app/api/webhooks/stripe/route.ts          — Alias Re-Export
src/app/api/credits/checkout/route.ts         — Dashboard Credits-Seite
```

**Kein** `src/app/api/checkout/`.

### Aufladen-Button

| UI | onClick | Stripe |
|----|---------|--------|
| Header Credits | `openBuyCredits()` | Nur wenn `hasPlan` → `NoCreditsModal` → `/api/stripe/credits-checkout` |
| Sidebar „Aufladen“ | `openBuyCreditsModal()` | Gleich |
| `/dashboard/credits` | `handleCheckout` → `/api/credits/checkout` | ✅ Funktioniert (auch Free-User mit Login) |

### Preise

| Typ | Definition | Stripe |
|-----|------------|--------|
| **Starter 7,99 €** | `subscription-plans.ts:28-35` | Abo `mode: subscription`, Env `NEXT_PUBLIC_STRIPE_STARTER_*` |
| **Credit-Packs** | `credit-packages.ts:20-58` | Einmalkauf `mode: payment`, Env `STRIPE_CREDITS_*` |
| **7,99 € Credits/Monat** | Starter: **50 Credits/Monat** bei Abo-Aktivierung (`webhook/route.ts:134-148`) |

### Env-Vars (vom Code benötigt)

- `STRIPE_SECRET_KEY` — Pflicht (`stripe.ts:4-7`)
- `STRIPE_WEBHOOK_SECRET` — Pflicht für Webhook (`webhook/route.ts:337`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Client/Stripe.js
- `NEXT_PUBLIC_STRIPE_{PLAN}_{MONTHLY|YEARLY}` — Abo Price IDs
- `STRIPE_CREDITS_100/300/700/1500` — Credit-Packs
- `STRIPE_AGENCY_*` — Agency
- `NEXT_PUBLIC_APP_URL` — Redirect URLs

Ob in `.env.local`/Vercel gesetzt: **nicht aus Repo verifizierbar** (Secrets nicht committed — korrekt).

### force-dynamic

✅ Auf: `checkout`, `credits-checkout`, `subscribe`, `agency-checkout`, `agency-credits`, `session`, `credits/checkout`  
❌ Fehlt auf: `webhook/route.ts`

---

## TEIL D — CREDIT-VERBRAUCH IN TOOLS

**Legende:** Auth = Session-Check; Credit = hasEnough/deduct; Mock = Mock/Stub/TODO

| API-Route | Auth? | Credit-Check? | Abbuchung? | Mock? | Status |
|-----------|-------|---------------|------------|-------|--------|
| `/api/viral-hook` | ✅ | ✅ | ✅ nach Erfolg | — | ✅ |
| `/api/content-kalender` | ✅ | ✅ | ✅ nach Erfolg | — | ✅ |
| `/api/trend-script` | ✅ | ✅ | ✅ + Refund bei Fehler | — | ✅ |
| `/api/product-ad/generate` | ✅ | ✅ | ✅ nach Erfolg | — | ✅ |
| `/api/product-ad/script` | ✅ | Plan-Gate | ❌ | — | 🟡 Gratis Script |
| `/api/ki-agent` | ✅ | ✅ | ✅ nach Claude OK | — | ✅ |
| `/api/agent/execute` | ✅ | ✅ | ✅ | 🟡 mockExecutor | 🟡 |
| `/api/agent/campaign` | ✅ | ✅ | ✅ nach Erfolg/Job | 🟡 mockExecutor | 🟡 |
| `/api/motion-transfer` | ✅ | ✅ | ✅ (lib) | — | ✅ |
| `/api/live-portrait` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/avatar/create-job` | ✅ | ✅ Check only | ❌ (bei start-render) | — | ⚠️ |
| `/api/avatar/start-render` | ✅ | ✅ | 🔴 **vor** Render | 🔴 RunPod TODO | 🔴 |
| `/api/avatar/job/[id]` | ✅ | — | — | — | ✅ Read own job |
| `/api/ugc-video` | ✅ | ✅ | ✅ bei Complete (GET) | — | ✅ |
| `/api/faceswap` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/stimme/clone` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/stimme/speak` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/elevenlabs/voice-preview` | ✅ | ❌ | ❌ | — | 🟡 Kostenrisiko |
| `/api/generate-image` | ✅ | ✅ | ✅ nach Erfolg | — | ✅ |
| `/api/lora/train` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/lora/generate` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/upscale` | ✅ | ✅ (lib) | ✅ (lib) | — | ✅ |
| `/api/live-creator` | ✅ | ✅ | ✅ bei Video ready | — | ✅ |
| `/api/seedance` | ✅ | ✅ | ✅ (lib) | — | ✅ |
| `/api/competitor` | ✅ | ✅ (lib) | ✅ (lib) | — | ✅ |
| `/api/outlier-detector` | Server Action | ✅ | ✅ in Action | — | ✅ |
| `/api/video-remix` | Plan-Gate | ✅ in Action | ✅ in Action | — | ✅ |
| `/api/viral-score` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/ki-ich` | ✅ | ✅ | ✅ | — | ✅ |
| `/api/melodia` | ✅ | ✅ | ✅ Stream | — | ✅ |
| `/api/fal/realtime-token` | ✅ | ❌ | ❌ | — | 🟡 Token-Exposure |
| `/api/scrape-product` | ✅ | ❌ | ❌ | — | 🟡 |
| `/api/test/set-credits` | ✅ | — | — | — | ✅ Nur E2E-Flag |

**Race Condition:** Alle Routen mit `deductCredits` ohne Transaktion (`credits.ts`) — siehe 🔴.

---

## TEIL E — NAVIGATION & TOTE LINKS

| Nav-Label | href | page.tsx? | 404-Risiko? |
|-----------|------|-----------|-------------|
| KI Agent | `/dashboard/ki-agent` | ✅ | Nein |
| Campaign Autopilot | `/dashboard/campaign-autopilot` | ✅ | Nein |
| Script Generator | `/dashboard/script-generator` | ✅ | Nein |
| Produkt-Werbung | `/dashboard/produkt` | ✅ | Nein |
| Thumbnail Konzept | `/dashboard/thumbnail-concept` | ✅ | Nein |
| Viral Hook | `/dashboard/viral-hook` | ✅ | Nein |
| UGC Video | `/dashboard/ugc-video` | ✅ | Nein |
| Live Portrait | `/dashboard/live-portrait` | ✅ | Nein |
| Avatar Studio | `/dashboard/avatar-studio` | ✅ | Nein |
| Motion Transfer | `/dashboard/motion-transfer` | ✅ | Nein |
| Bild zu Video | `/dashboard/seedance` | ✅ | Nein |
| Live Creator | `/dashboard/live-creator` | ✅ | Nein |
| Mein KI-Ich | `/dashboard/ki-ich` | ✅ | Nein |
| Bild Generator | `/dashboard/image-generator` | ✅ | Nein |
| HD Upscaler | `/dashboard/upscaler` | ✅ | Nein |
| LoRA Training | `/dashboard/lora-training` | ✅ | Nein |
| Galerie | `/dashboard/gallery` | ✅ | Nein |
| Niche Analyzer | `/dashboard/niche-analyzer` | ✅ | Nein |
| Outlier Detector | `/dashboard/outlier-detector` | ✅ | Nein |
| Content Kalender | `/dashboard/content-kalender` | ✅ | Nein |
| Trend → Script | `/dashboard/trend-to-script` | ✅ | Nein |
| Konkurrenz | `/dashboard/competitor` | ✅ | Nein |
| Viral Score | `/dashboard/viral-score` | ✅ | Nein |
| Video Remix | `/dashboard/video-remix` | ✅ | Nein |
| Face Swap | `/dashboard/live-creator-new` | ✅ | Nein |
| Stimme & Musik | `/dashboard/voice` | ✅ | Nein |
| Statistiken | `/dashboard/analytics` | ✅ | Nein |
| Community | `/community` | ✅ | Nein |
| Developer API | `/dashboard/api` | ✅ | Nein |
| Freunde einladen | `/dashboard/referral` | ✅ | Nein |
| Einstellungen | `/dashboard/settings` | ✅ | Nein |
| Credits & Plan | `/dashboard/credits` | ✅ | Nein |
| Business Analytics | `/dashboard/admin/analytics` | ✅ | Nein (Admin-Layout) |
| Product Hunt | `/dashboard/admin/producthunt` | ✅ | Nein |
| App Store Kit | `/dashboard/admin/app-store` | ✅ | Nein |
| SEO Content | `/dashboard/admin/content` | ✅ | Nein |
| Admin Panel | `/admin` | ✅ | Nein |
| Mobile Quick Agent | `/dashboard/agent` | ✅ | Nein |

### Tote / fehlerhafte Links (außerhalb Sidebar)

| Link | Quelle | Problem |
|------|--------|---------|
| `/terms` | `signup/page.tsx:400` | **404** — kein `src/app/terms/` |
| `/login` | `forgot-password/page.tsx:89` | Redirect via Middleware → OK |

---

## TEIL F — ADMIN-ZUGRIFF (Detail)

1. **Erkennung:** `isPlatformAdminServer()` — `is_admin` OR `role === admin` OR `ADMIN_EMAIL_ALLOWLIST` (`platform-admin.server.ts`, `admin-allowlist.server.ts`). Client: `isAdminUser()` mit Default-Allowlist (UI only).
2. **Rote Sidebar-Einträge:** Nur wenn `isAdmin === true` (`DashboardSidebar.tsx:431-448`). Normale User sehen sie **nicht** in UI.
3. **Server-Schutz:** ✅ `/admin/layout.tsx`, `/dashboard/admin/layout.tsx`, `middleware.ts:160-181`, `requireAdmin()` in Actions/APIs. ⚠️ Ausnahme: `ab-stats`, `ab-reset` nur `is_admin`.
4. **Admin Credit-Bypass:** ✅ `isCreditExemptUser` / `isCreditExemptEmail` in `credits.ts:101-122`.

---

## TEIL G — DATENSCHUTZ & RECHTLICHES (Detail)

| Seite | Existiert |
|-------|-----------|
| `/impressum` | ✅ |
| `/datenschutz` | ✅ (Resend, fal.ai, ElevenLabs, Akool, Stripe, Supabase, Vercel, Sentry; GA in Cookies-Abschnitt) |
| `/agb` | ✅ |
| `/cookies` | ✅ |
| `/widerruf` | ❌ |

1. **Cookie-Banner:** ✅ `CookieBanner.tsx` — localStorage `influexai_cookie_consent`. **Aber:** GA ignoriert Consent (siehe 🔴).
2. **Registrierung Legal:** ❌ Keine Checkbox; kaputter Terms-Link.
3. **Bezahl-Button DE:** Stripe Hosted Checkout — kein expliziter „zahlungspflichtig bestellen“-Custom-Text im Code (`create-credits-checkout.ts:60-63` nur Marketing-Text).
4. **Widerruf:** ❌ Fehlt.
5. **GA nach Consent:** ❌ `GoogleAnalytics` in Root-Layout immer aktiv.
6. **Datenschutz-Anbieter:** ✅ Supabase, Stripe, Vercel, fal.ai, ElevenLabs, Akool, Resend, Sentry; GA via Cookie-Richtlinie referenziert.

---

## TEIL H — SICHERHEIT (Detail)

1. **Secrets serverseitig:** ✅ Stripe Secret, Service Role, Anthropic, fal, etc. in API Routes / `server-only` Modulen. Kein `NEXT_PUBLIC_*` für Secrets gefunden.
2. **NEXT_PUBLIC Keys:** Nur Supabase Anon, Stripe Publishable, Price IDs, App URL, GA ID — erwartbar.
3. **`.env.local` in .gitignore:** ✅ Zeile 37 `.env*`
4. **Input-Validierung:** Teilweise (z. B. `credits-checkout` whitelist Price IDs). Nicht überall einheitlich.
5. **RLS:** Auf vielen Tabellen aktiv (generations, credit_transactions, agent_jobs, …). **profiles:** Status unklar im Repo.
6. **Fremde Jobs:** ✅ `avatar/job/[id]` filtert `.eq("user_id", user.id)` (Z. 24-25). Stripe session prüft `metaUser === user.id` (`session/route.ts:26-27`).

---

## TEIL I — BUILD & TYPESCRIPT

1. **TypeScript:** `npx tsc --noEmit` → **Exit 0**, keine Fehler gemeldet.
2. **Tote Dateien:** `BuyCreditsModal.tsx` (ungenutzt); Legacy `auth/page.tsx`.
3. **Env-Doku:** `docs/auth/ENV_REQUIRED.md` vorhanden und aktuell (Admin-Allowlist, Stripe, Supabase).

---

## ✅ EMPFOHLENE FIX-REIHENFOLGE

1. **Stripe Webhook Idempotenz** — Doppelte Credit-Gutschrift verhindern (`webhook/route.ts`).
2. **Supabase `handle_new_user` Trigger** — Migration + Prod verifizieren; sonst keine Profile/Credits.
3. **Aufladen-Flow für Free-User** — `BuyCreditsProvider.tsx` / Redirect zu `/dashboard/credits` oder `/pricing`.
4. **`/widerruf` + Signup-Legal** — `/terms` → `/agb`, Datenschutz-Link, Checkbox; Widerrufsseite.
5. **Google Analytics Consent-Gating** — erst nach Cookie-Banner-Akzeptanz laden.
6. **Avatar `start-render`** — Credits erst bei Erfolg oder Refund-Logik.
7. **Admin-API vereinheitlichen** — `ab-stats`/`ab-reset` auf `requireAdmin()`.
8. **`deductCredits` atomar machen** — Race Conditions beheben.
9. **Produkt-ad/script & Voice-Preview** — Credit-/Rate-Limits definieren.
10. **Agent Mock → Production** — oder UI klar als Beta kennzeichnen.

---

*Ende des Audits. Keine Code-Änderungen vorgenommen (außer dieser Report-Datei).*

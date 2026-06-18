# InfluexAI — Manuelle Smoke-Test-Checkliste (Staging/Production)

**Ziel:** Kontrollierte Abnahme mit echten Test-Accounts und Stripe (Testmode auf Staging, Live nur bewusst und minimal).

**Empfohlen:** Staging zuerst. Production nur mit dedizierten Test-Accounts und kleinen Beträgen.

**Environment-Runbook:** `docs/environment-safety.md`  
**Env-Validator (keine Secrets):** `node scripts/check-env-safety.mjs --file .env.local`

---

## 0. Safe Dev & Staging (vor allen mutierenden Tests)

**Regel:** Keine Production-mutating Smoke Tests. Production nur read-only (Pages, GET APIs, Webhook-Negative).

### 0.1 Local Safe Dev (read-only)

| Check | Aktion | Erwartung | Status |
|-------|--------|-----------|--------|
| **S0.1 — Env Validator** | `node scripts/check-env-safety.mjs --file .env.local` | Exit **0**, keine `production_supabase_ref` / `stripe_live_*` | ☐ |
| **S0.2 — Templates** | `node scripts/check-env-safety.mjs --example .env.local.example` | Exit **0** | ☐ |
| **S0.3 — Staging Template** | `node scripts/check-env-safety.mjs --example .env.staging.example` | Exit **0** | ☐ |
| **S0.4 — Read-only Pages** | `/`, `/pricing`, `/auth/sign-in` | 200, kein 500 | ☐ |
| **S0.5 — Read-only APIs** | `GET /api/ai-creator/characters` etc. | 401, **kein** `DEV_WRITE_GUARD_BLOCKED` auf read-only | ☐ |
| **S0.6 — Guard Smoke** | `POST /api/generate` `{}` bei prod-like `.env.local` | 403 `DEV_WRITE_GUARD_BLOCKED` | ☐ |

**Bei prod-like `.env.local`:** Mutierende Tests **stoppen** — erst Staging-Env einrichten (`.env.staging.example`).

### 0.2 Staging (authenticated E2E — mutierend erlaubt)

Voraussetzungen:

- Dediziertes Supabase **Staging**-Projekt (nicht Production)
- Stripe **Test Mode** (`sk_test_` / `pk_test_` / `price_test_...`)
- `PROVIDERS_DISABLED=true` bis Provider-QA geplant
- Test-Accounts nur in Staging-DB

| Check | Aktion | Erwartung | Status |
|-------|--------|-----------|--------|
| **S1.1 — Staging Login** | Test-User auf Staging einloggen | Dashboard erreichbar | ☐ |
| **S1.2 — Stripe Test Checkout** | Credit-Pack oder Abo (Testkarte 4242…) | Credits/Plan in **Staging-DB** | ☐ |
| **S1.3 — Credit Deduction** | 1× KI-Tool auf Staging | Credits −X, kein Doppelabzug | ☐ |
| **S1.4 — Webhook Dedup** | Stripe CLI → Staging-Webhook, Replay | Kein doppelter Credit-Zuwachs | ☐ |
| **S1.5 — AI Creator Draft** | Draft anlegen/löschen auf Staging | POST/DELETE OK, kein Guard-403 | ☐ |
| **S1.6 — Upload/Training** | — | **Erst nach Consent-Persistenz (Phase 4G.4Q)** | ☐ |
| **S1.7 — Provider Tools** | Nur wenn `PROVIDERS_DISABLED=false` + Sandbox | Generation in Staging-Galerie | ☐ |

### 0.3 Production (read-only Smoke only)

| Erlaubt | Verboten |
|---------|----------|
| Page Smoke (`/`, `/pricing`, Legal) | Mutierende POST/DELETE gegen Prod |
| GET APIs ohne Side Effects | Echte Uploads/Trainings |
| Webhook-Negative (400/401 ohne Signatur) | Stripe Checkout ohne Kontrolle |
| Mobile Layout Smoke | Guard-Smoke auf Prod (Guard ist dort inaktiv) |

---

**Vor Start notieren:**

- Ausgangswerte: `profiles.credits`, `profiles.plan`, `tenants.credits_pool`
- Stripe Dashboard offen (Events + Checkout Sessions)
- Supabase SQL Editor offen

---

## 1. Test-Accounts vorbereiten

| Account | E-Mail-Vorschlag | `profiles.plan` | `profiles.credits` | `profiles.agency_plan` | `profiles.role` / `is_admin` | Tenant |
|---------|------------------|-----------------|--------------------|-------------------------|------------------------------|--------|
| **A — Gast** | — | — | — | — | — | — |
| **B — User ohne Plan** | `test-free@…` | `free` | `0` | `null` | `user` / `false` | kein Tenant |
| **C — Plan, 0 Credits** | `test-plan0@…` | `starter` (oder `creator`) | `0` | `null` | `user` / `false` | kein Tenant |
| **D — Plan + Credits** | `test-plan100@…` | `starter` | `100` | `null` | `user` / `false` | kein Tenant |
| **E — Platform Admin** | Admin-Allowlist-E-Mail | `free` | `0` | `null` | `admin` oder `is_admin=true` | kein Tenant |
| **F — Agency ohne Platform-Plan** | `test-agency@…` | `free` | `0` | `starter` | `user` / `false` | **kein** Tenant (nur `agency_plan`) |
| **G — Agency mit Tenant** | `test-agency-tenant@…` | `free` | `0` | `starter` | `user` / `false` | Tenant mit `owner_id = user.id`, `is_active=true` |

### SQL-Hilfe (Supabase)

```sql
-- User ohne Plan
UPDATE profiles SET plan = 'free', credits = 0, agency_plan = NULL
WHERE id = '<user_id>';

-- User mit Plan, 0 Credits
UPDATE profiles SET plan = 'starter', credits = 0 WHERE id = '<user_id>';

-- Agency-only (ohne Tenant)
UPDATE profiles SET plan = 'free', credits = 0, agency_plan = 'starter',
  tenant_id = NULL, tenant_role = NULL
WHERE id = '<user_id>';

-- Agency mit Tenant (Tenant muss existieren)
SELECT id, owner_id, credits_pool, is_active FROM tenants WHERE owner_id = '<user_id>';
UPDATE profiles SET plan = 'free', agency_plan = 'starter',
  tenant_id = '<tenant_id>', tenant_role = 'owner'
WHERE id = '<user_id>';
```

**Stripe Testmode:** Staging/Test-Keys in `.env` / Vercel Preview. Live-Keys nur auf Production — dort nur 1–2 Mini-Käufe.

**Stripe Testkarte:** `4242 4242 4242 4242`, beliebiges Datum/CVC.

---

## 2. Account-Tests (Routing & Gating)

| Test | Vorbereitung | Aktion | Erwartung | Status |
|------|--------------|--------|-----------|--------|
| **A1 — Startseite Gast** | Ausgeloggt | `/` öffnen | 200, Landing, kein Dashboard | ☐ |
| **A2 — Pricing öffentlich** | Ausgeloggt | `/pricing` | Preise sichtbar, kein Login-Zwang | ☐ |
| **A3 — Legacy-Redirects** | Ausgeloggt | `/preise`, `/login`, `/signup`, `/auth` | Redirect zu `/pricing` bzw. `/auth/sign-in` / `sign-up` | ☐ |
| **B1 — Gast Dashboard** | Ausgeloggt | `/dashboard` | Redirect `/auth/sign-in?redirect=/dashboard` | ☐ |
| **B2 — Login ohne Plan** | Account B | Einloggen | Redirect **`/pricing`**, kein Tool-Dashboard | ☐ |
| **B3 — Free → Credits-Seite** | Account B | `/dashboard/credits` | Redirect **`/pricing`** | ☐ |
| **B4 — Free → Tool** | Account B | `/dashboard/script-generator` | Redirect **`/pricing`** | ☐ |
| **B5 — Free → Credit-Kauf** | Account B | Credit-Pack auf `/pricing` oder Modal | **403** / Meldung Plan nötig (`PLAN_REQUIRED_FOR_CREDITS`) | ☐ |
| **C1 — Plan, 0 Credits Dashboard** | Account C | `/dashboard` | Dashboard sichtbar | ☐ |
| **C2 — Plan, 0 Credits KI-Tool** | Account C | Tool ausführen (z. B. Viral Hook) | **402** / „Nicht genug Credits“ | ☐ |
| **C3 — NoCreditsModal** | Account C | „Credits aufladen“ | Modal → Stripe Checkout startet | ☐ |
| **D1 — Plan + Credits Tool** | Account D, Credits notieren | 1× KI-Tool | Erfolg, Credits **−1** (nicht doppelt) | ☐ |
| **D2 — Credit-Kauf** | Account D | Credit-Pack kaufen (Stripe Test) | Checkout → Webhook → Credits **+Paketgröße** | ☐ |
| **E1 — Admin ohne Plan** | Account E | `/dashboard`, `/admin` | Beides erreichbar | ☐ |
| **E2 — Admin KI ohne Credits** | Account E, credits=0 | KI-Tool | Erfolg, **keine** Credit-Abzüge | ☐ |
| **F1 — Agency ohne Tenant** | Account F | `/dashboard` | Redirect **`/dashboard/white-label`** | ☐ |
| **F2 — Agency Tool blockiert** | Account F | `/dashboard/script-generator` | Redirect Agency-Bereich, **kein** Tool | ☐ |
| **F3 — Agency Credit-Kauf Platform** | Account F | Platform Credit-Pack | **403** (Agency-Plan zählt nicht) | ☐ |
| **F4 — White-Label Checkout** | Account F | `/dashboard/white-label` → Agency-Abo | Stripe Checkout, Metadata `agency_subscription` | ☐ |
| **G1 — Agency mit Tenant** | Account G | `/dashboard` | Redirect **`/dashboard/agency`** | ☐ |
| **G2 — Agency Dashboard** | Account G | `/dashboard/agency` | Agency-Dashboard sichtbar | ☐ |
| **G3 — Agency-Credits** | Account G, Pool notieren | Agency-Credits kaufen | Checkout → Pool **+Paket** | ☐ |
| **H1 — Nicht-Admin /admin** | Account B oder D | `/admin` | Redirect **`/dashboard`** (kein Admin-Zugang) | ☐ |

---

## 3. Payment-Tests (Stripe)

**Vor jedem Test:** Credits/Plan/Pool notieren. Nach Webhook (~5–30 s) erneut prüfen.

| Test | Vorbereitung | Aktion | Erwartung | Status |
|------|--------------|--------|-----------|--------|
| **P1 — Credit-Pack** | Account D, Plan aktiv | `/pricing` oder `/dashboard/credits` → Paket kaufen | API: `/api/credits/checkout` → Stripe → Success; Credits +X; `stripe_payments` 1 Zeile | ☐ |
| **P2 — Credit ohne Plan** | Account B | Credit-Kauf versuchen | **403** `PLAN_REQUIRED_FOR_CREDITS` | ☐ |
| **P3 — Platform-Abo** | Account B (free) | `/pricing` → Abo (z. B. Starter) | Checkout → `/checkout/success` → Polling → `/dashboard`; `profiles.plan=starter`; initiale Credits +X | ☐ |
| **P4 — Abo Cancel** | Account B | Abo-Checkout abbrechen | Redirect `/pricing?checkout=cancelled` | ☐ |
| **P5 — Abo Success Timeout** | Account B | Abo kaufen, Webhook absichtlich verzögern (optional) | Success-Seite: „Zahlung wird bestätigt…“, dann Redirect oder Timeout + Retry | ☐ |
| **P6 — Agency-Abo** | Account F oder Gast→Login | `/agency` oder White-Label → Agency-Abo | API: `/api/agency/checkout`; Success `/dashboard/agency?success=true`; `agency_plan` gesetzt; Tenant erstellt/aktualisiert | ☐ |
| **P7 — Agency-Credits** | Account G | Agency-Dashboard → Credits kaufen | API: `/api/stripe/agency-credits`; `tenants.credits_pool` +X | ☐ |
| **P8 — Legacy Credit-Route** | Account D | `POST /api/stripe/credits-checkout` `{packageId}` (Browser DevTools/curl) | Gleiches Ergebnis wie canonical; Header **`X-Deprecated-Route: /api/credits/checkout`** | ☐ |
| **P9 — Legacy Agency-Route** | Account F | `POST /api/stripe/agency-checkout` | Proxy OK; Header **`X-Deprecated-Route: /api/agency/checkout`** | ☐ |
| **P10 — Legacy stripe/checkout** | Account D | `{priceId, mode:"payment"}` oder `{packageId}` | Checkout oder **400** bei unbekannter priceId | ☐ |

---

## 4. Webhook-Dedup-Tests

### Vorbereitung (Stripe CLI)

```bash
stripe login
stripe listen --forward-to https://<deine-domain>/api/stripe/webhook
# Whsec aus Output in STRIPE_WEBHOOK_SECRET (Staging)
```

### Baseline SQL nach jedem Kauf

```sql
SELECT credits, plan, agency_plan, stripe_subscription_id
FROM profiles WHERE id = '<user_id>';

SELECT credits_pool FROM tenants WHERE owner_id = '<user_id>';

SELECT * FROM processed_checkout_sessions
WHERE stripe_session_id = 'cs_...';

SELECT * FROM processed_stripe_invoices
WHERE stripe_invoice_id = 'in_...';

SELECT id, type FROM stripe_events
ORDER BY processed_at DESC LIMIT 10;
```

### Replay (Dedup prüfen)

1. Kauf einmal durchführen → Werte notieren
2. Im Stripe Dashboard: Event `checkout.session.completed` oder `invoice.paid` → **Resend**
   Oder: `stripe events resend evt_...`
3. Optional: `stripe_events`-Zeile für dieses Event löschen, dann Resend (simuliert Retry vor Event-Insert)

| Test | Vorbereitung | Aktion | Erwartung | Status |
|------|--------------|--------|-----------|--------|
| **W1 — Tabellen existieren** | SQL Editor | `select to_regclass('public.processed_checkout_sessions')` etc. | Beide Tabellen ≠ null | ☐ |
| **W2 — Credit-Pack Replay** | P1 abgeschlossen | Gleiche Session/Event erneut senden | Credits **unverändert**; 1 Zeile in `processed_checkout_sessions`; Log: „checkout session bereits verarbeitet“ | ☐ |
| **W3 — Platform-Abo Replay** | P3 abgeschlossen | `checkout.session.completed` Replay | Initiale Credits **nicht** doppelt; Plan unverändert | ☐ |
| **W4 — Renewal Replay** | Warten auf `invoice.paid` oder Test Clock | `invoice.paid` Replay | Monatliche Credits **+1×**, nicht 2×; 1 Zeile in `processed_stripe_invoices` | ☐ |
| **W5 — Agency-Credits Replay** | P7 abgeschlossen | Session-Event Replay | `credits_pool` **+1×** | ☐ |
| **W6 — Webhook 200 bei Duplikat** | — | Replay senden | HTTP **200**, kein Endlos-Retry in Stripe | ☐ |

**Dürfen sich NICHT doppelt erhöhen:**

- `profiles.credits` (Credit-Pack, Abo-Initial, Renewal)
- `tenants.credits_pool` (Agency-Credits)
- Anzahl passender `credit_transactions` mit gleicher Beschreibung

---

## 5. Auth-Tests

| Test | Vorbereitung | Aktion | Erwartung | Status |
|------|--------------|--------|-----------|--------|
| **AU1 — Login Plan-User** | Account D ausgeloggt | `/auth/sign-in` → Login | Redirect **`/dashboard`** | ☐ |
| **AU2 — Login Free-User** | Account B | Login | Redirect **`/pricing`** | ☐ |
| **AU3 — redirect=/dashboard (Free)** | Account B | `/auth/sign-in?redirect=/dashboard` | Nach Login → **`/pricing`**, nicht Dashboard | ☐ |
| **AU4 — redirect=/dashboard/agency (Agency)** | Account G | Login mit redirect | **`/dashboard/agency`** (oder white-label) | ☐ |
| **AU5 — redirect Tool (Agency-only)** | Account F | `?redirect=/dashboard/script-generator` | **Kein** Tool → Agency-Bereich oder `/pricing` | ☐ |
| **AU6 — Logout** | Account D eingeloggt | Logout (User-Menü) | Redirect **`/`**; Session weg | ☐ |
| **AU7 — Browser-Zurück nach Logout** | Nach AU6 | Browser „Zurück“ | **Kein** Dashboard ohne erneuten Login (ggf. Cache-Hinweis — hard reload testen) | ☐ |
| **AU8 — Gast nach Logout /dashboard** | Nach AU6 | `/dashboard` aufrufen | Redirect Sign-in | ☐ |
| **AU9 — checkout/success redirect** | — | `/checkout/success` in redirect erlaubt | Nach Abo-Success erreichbar; andere `/checkout/*` blockiert | ☐ |

---

## 6. Abschlusskriterien

### Smoke-Test bestanden, wenn:

| Kriterium | Pflicht |
|-----------|---------|
| Alle **A1–A3, B1–B5** (Public + Free-User-Gating) | ✅ |
| **D1, P1, P3** (1× Tool, 1× Credit-Kauf, 1× Abo) erfolgreich | ✅ |
| **F1/F4 oder G1/G2 + P6/P7** (Agency-Flow) erfolgreich | ✅ |
| **W1 + mindestens W2 + W3** (Dedup) bestanden | ✅ |
| **AU1, AU2, AU3, AU6, AU7** (Auth) bestanden | ✅ |
| Kein **doppelter** Credit-/Pool-Zuwachs bei Replay | ✅ |
| Vercel Production auf aktuellem `master`-Commit deployed | ✅ |
| Migration **058** Tabellen auf Prod-DB vorhanden | ✅ |

### Blocker (Test stoppen / Fix vor Launch):

| Blocker | Beschreibung |
|---------|--------------|
| **B-1** | Webhook-Replay erhöht Credits/Pool **doppelt** |
| **B-2** | Free-User erreicht Dashboard-Tools oder kauft Credits ohne Plan |
| **B-3** | Abo-Kauf setzt `plan` nicht oder Success-Polling leitet nie weiter |
| **B-4** | Agency-Owner ohne Platform-Plan **komplett** ausgesperrt (kein WL/Agency) |
| **B-5** | Claim-Insert schlägt fehl → Webhook **500**-Schleife in Stripe |
| **B-6** | Production deployt **nicht** auf aktuellen `master`-Commit |
| **B-7** | Live-Zahlung erfolgreich, Webhook schreibt **keine** Credits/Plan |

### Nicht blocker, aber nachziehen:

- E2E-Tests veraltet (Logout erwartet `/login`, Code nutzt `/`)
- Lint-Errors im Repo
- Legacy-Route liefert 500 bei kaputtem JSON

---

## Empfohlener Ablauf (ca. 90 Min)

```
1. Accounts anlegen + SQL-Setup (15 Min)
2. Public + Auth ohne Payment (15 Min)     → Abschnitt 2 + 5
3. Payment P1, P3, P6 oder P7 (30 Min)     → Abschnitt 3
4. Webhook Replay W2–W5 (20 Min)           → Abschnitt 4
5. Abschlusskriterien durchgehen (10 Min) → Abschnitt 6
```

**Pro Test notieren:** User-ID, Session-ID (`cs_…`), Event-ID (`evt_…`), Credits vorher/nachher, Screenshot bei Fehler.

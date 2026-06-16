# Legacy Cleanup Audit — Phase 3A.0.6

**Date:** 2026-06-16 (updated)  
**HEAD:** `8f39205` + Settings Credits cleanup  
**Scope:** Dashboard legacy UI, dead components, upgrade/pricing path review, Settings/Credits Studio migration. No API/auth/credit/billing/migration changes.

---

## Settings Credits Legacy Cleanup (Phase 3A.0.6b)

### Alte Credits-Komponente

| Datei | Rolle |
|-------|-------|
| `src/app/dashboard/credits/page.tsx` | Dark glass UI (`GLASS_CARD`, `#ccff00`, dot-grid) — **ersetzt** |
| `src/components/credit-calculator.tsx` | Slider „Credit Rechner“, „DEIN FAVORIT“, neon bars — **gelöscht** |

**Import-Kette:** Settings „Billing & Credits“ verlinkte auf `/dashboard/credits` → Legacy-Seite. Nutzer sahen Legacy-UI beim Klick oder direkt auf `/dashboard/credits`.

### Neue Studio-Komponente

| Datei | Rolle |
|-------|-------|
| `src/components/dashboard/core/StudioCreditsSection.tsx` | Ivory `StudioPanel`-basierte Credits-UI |

**Verwendung:**
- `/dashboard/settings` → Tab „Billing & Credits“ (`showPackages={false}`)
- `/dashboard/credits` → volle Seite mit Paket-Grid + API

### FIRST20 / Rabatt

- **UI-Banner entfernt** („Erster Kauf? FIRST20 …“) — kein Marketing-Schrei in Settings/Credits
- **Stripe-Logik unverändert:** `src/lib/first-purchase-stripe.ts` bleibt; Promo kann weiterhin serverseitig im Checkout greifen, wenn konfiguriert
- Keine falschen Rabatt-Anzeigen in der Studio-UI

### Upgrade-Pfad (bestätigt)

| Ziel | Pfad |
|------|------|
| Abo / Pläne (öffentlich) | `/pricing` |
| Credit-Top-up (eingeloggt) | `/dashboard/credits` → `/api/credits/checkout` |
| Settings Billing | Inline `StudioCreditsSection` + Link „Pläne & Abo“ → `/pricing` |
| Alte Aliase | `/preise` → `/pricing` (middleware) |

---

## Arbeitsbaum vor Start

- **Status:** clean (`main`, ahead 34)
- **Clip fix:** bereits in `667dfbc` — Tool-Setup einspaltig bis 1536px, Stage-Padding reduziert, `overflow-x-hidden` aus Setup-Kette entfernt
- **Credits label:** bereits Sentence Case in `DashboardLayout` LeftSidebar

---

## Geprüfte Bereiche

| Bereich | Ergebnis |
|---------|----------|
| `src/components/dashboard/` | 33 Legacy-Dateien entfernt (siehe unten) |
| `src/components/dashboard/design-preview/` | **Behalten** — isoliert unter `/dashboard/design-preview` |
| `src/app/dashboard/*` | Dedicated tool routes aktiv via `DashboardShell` + `LegacyToolRedirect` |
| `src/app/pricing/` | **Aktuell** — `PricingPlans` + `CreditPacksSection` |
| `src/app/preise/` | Kein Ordner — Redirect in `middleware.ts` → `/pricing` |
| `src/app/login/`, `src/app/signup/` | Kein Ordner — Redirect → `/auth/sign-in`, `/auth/sign-up` |
| `src/app/dashboard/settings/` | Production settings page; „späteren Phase“-Text entfernt |
| `src/app/dashboard/credits/` | **Studio UI** — `StudioCreditsSection` (Ivory, kein Dark Glass) |
| `src/lib/tools/` | Audit-Registries behalten (Credit-Dokumentation, AgentBox-Referenzen) |
| `src/components/agent/` | Nicht angefasst — Agent-Runtime aktiv |
| `src/components/pricing/` | Nicht angefasst — Landing-Pricing aktiv |

---

## Gelöschte Dateien (34)

### Credits Legacy

- `src/components/credit-calculator.tsx` — Dark slider widget, nur von alter credits page genutzt

### Canvas-Board-Subtree (nie gemountet)

- `core/DashboardBoard.tsx`
- `core/DashboardIntelligenceBridge.tsx`
- `core/DashboardPanelStrip.tsx`
- `core/DashboardShortcutsHelp.tsx`
- `core/DashboardNodeErrorBoundary.tsx`
- `core/PipelineProvider.tsx`
- `DashboardRegistry.ts`
- `tools/KreaImageTool.tsx`
- `tools/UgcVideoTool.tsx`
- `tools/BaseTool.tsx`
- `tools/ToolControlPanel.tsx`
- `tools/ParamFields.tsx`
- `tools/shared.tsx`
- `tools/types.ts` (dashboard-local; **nicht** `lib/tools/types.ts`)
- `viewer/AssetNode.tsx`
- `viewer/BrollRecommendViewer.tsx`
- `viewer/AssetReveal.tsx`
- `viewer/AssetErrorState.tsx`
- `viewer/AssetSharePanel.tsx`

### Superseded / nie verdrahtet

- `core/StudioCommandCenter.tsx` → ersetzt durch `StudioCockpit`
- `core/DashboardSidebar.tsx`
- `core/DashboardSidebarContent.tsx`
- `core/DashboardHeader.tsx`
- `core/SettingsView.tsx` → Settings nur noch `/dashboard/settings`
- `core/TopUpOverlay.tsx`
- `core/onboarding/OnboardingAgentShell.tsx`
- `core/onboarding/OnboardingChatOverlay.tsx`

### Ungenutzte UI-Primitives

- `ui/index.ts`, `ui/DashboardBadge.tsx`, `ui/DashboardButton.tsx`, `ui/DashboardCard.tsx`, `ui/DashboardSectionHeader.tsx`
- `studio-ui/StudioUploadZone.tsx` (Export aus `studio-ui/index.ts` entfernt)

---

## Ersetzte Imports / Texte

| Datei | Änderung |
|-------|----------|
| `DashboardLayout.tsx` | Ungenutzte Imports `AgentBox`, `SettingsView` entfernt |
| `studio-ui/index.ts` | `StudioUploadZone`-Export entfernt |
| `settings/page.tsx` | „späteren Phase“-Platzhaltertext durch produktionsreifen Copy ersetzt |

---

## Redirects (unverändert, aktiv)

| Pfad | Ziel |
|------|------|
| `/preise` | `/pricing` (308, middleware) |
| `/login`, `/anmelden` | `/auth/sign-in` |
| `/signup`, `/registrierung` | `/auth/sign-up` |
| `/dashboard/tools` | `/dashboard?tool=tools` (308) |
| `/dashboard/agent` | `/dashboard/ki-agent` |
| Legacy tool paths | `LegacyToolRedirect` → `?tool=` SPA |
| `?tool=settings` | `router.replace('/dashboard/settings')` |
| `?tool=gallery` | `router.replace('/dashboard/gallery')` |

---

## Bewusst behalten (mit Grund)

| Datei | Grund |
|-------|-------|
| `core/AgentBox.tsx` | ~1.4k LOC; referenziert in `lib/tools/credit-display.ts`, `dashboard-tool-registry.ts`; nicht mehr in SPA gerendert, aber Credit-/Agent-Dokumentation und potenzielle Reaktivierung |
| `core/SettingsPanel.tsx` | Unreachable UI (Panel nie geöffnet), aber `toolSettingsRef` in `handleActionExecute` |
| `DashboardProvider.tsx` | Wrap in `DashboardShell`; `useDashboard()` ohne Caller, aber Canvas-Store-Bridge |
| `DynamicDashboardEngine.tsx` | Aktiv: `image-generator`, `story-creator`, `szenen-generator` |
| `CampaignAutopilot.tsx` | Route `/dashboard/campaign-autopilot` |
| `design-preview/*` | Explizit gewünscht; isoliert |
| `LegacyToolRedirect.tsx` | Push-safe Redirects für alte Tool-URLs |
| `lib/tools/canonical-tools-data.ts` | Interne Audit-Docs (Kommentare mit Legacy-Namen) |
| `hooks/useCanvasIntelligence.ts` | Kein Importer; Canvas-Hook für spätere Agent-Board-Integration |
| `viewer/AssetLoadingShader.tsx` | Landing (`HeroSection`, `LandingLiveDemoPlayground`) |

---

## Später prüfen

1. **`AgentBox.tsx`** — vollständig deprecaten oder in dedizierte Tool-Routes migrieren; danach Credit-Registry-Kommentare bereinigen
2. **`SettingsPanel` + rechtes Panel in `DashboardLayout`** — `isRightPanelOpen` wird nie `true`; `handleActionExecute` + Panel-Code vereinfachen
3. **`DashboardProvider` + `useCanvasIntelligence` + `canvas-store`** — tot wenn Board endgültig entfernt wird
4. **`/dashboard/credits`** — dunkles Legacy-Styling vs. Studio-Ivory; funktional OK, visuell nicht vereinheitlicht
5. **Hydration flash** auf `/dashboard/tools` — Middleware 308 OK; Client-Hydration kurz Studio-Home
6. **`lib/tools/canonical-tools-data.ts`** — Kommentare mit `StudioCommandCenter`/`SettingsView` aktualisieren (nicht blockierend)

---

## Upgrade / Pricing Pfad

| Rolle | Pfad / Komponente |
|-------|-------------------|
| **Hauptseite (öffentlich)** | `/pricing` → `PricingPlans`, `CreditPacksSection`, `useSubscriptionCheckout` |
| **Credit-Kauf (eingeloggt)** | `/dashboard/credits` → Stripe Credit-Packs |
| **Settings Billing-Link** | `/dashboard/credits` (Studio settings page) |
| **Alte Pfade** | Nur Redirects (`/preise`, Auth-Aliase) |

**Doppelte Upgrade-Flows entfernt:** Keine — es gibt bewusst zwei Ebenen (öffentliches Abo-Pricing vs. eingeloggter Credit-Top-up). Keine alten Pricing-Komponenten im Dashboard-SPA gefunden.

**Sichtbare Legacy-Texte entfernt:** Settings „späteren Phase“; Sidebar „Credits“ bereits Sentence Case (vorheriger Commit).

---

## Desktop Tool Setup Clip

**Status:** Behoben in `667dfbc` (vor diesem Cleanup-Commit)

- Einspaltig unter 1536px Viewport
- Reduziertes Stage-Padding für MVP-Setup-Tools
- Kein `overflow-x-hidden` in Setup-Spalte
- ActionBar/Panel `min-w-0 max-w-full`

**Geprüfte Routen:** `viral-hook`, `img-to-video`, `image-gen`, `text-to-video`

---

## Tests

| Check | Ergebnis |
|-------|----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (siehe Commit) |
| `npm run lint` | Pre-existing 17 errors (unverändert) |

---

## Offene Risiken

- **Niedrig:** Gelöschte Board-Dateien hatten zero Production-Imports; Build bestätigt.
- **Mittel:** `AgentBox`/`SettingsPanel`/`DashboardProvider` bleiben als technische Schuld — keine sichtbare Regression, aber Code-Volumen.
- **Niedrig:** Dedicated tool pages (`/dashboard/viral-hook` etc.) leben parallel zur SPA — beabsichtigt via Redirect/Launch.

# PRODUCTION DASHBOARD VISUAL FREEZE — Phase 2B

**Date:** 2026-06-16  
**Scope:** Align production dashboard routes with design-preview surface language. Layout/surface/spacing only — no billing, credits logic, provider routes, or mock data in production.

---

## Angepasste produktive Routen

| Route | Shell | Stage | Status |
|-------|-------|-------|--------|
| `/dashboard` | `DashboardLayout` + Left Sidebar | `DashboardStage` um Studio Cockpit | **Geändert** |
| `/dashboard/ki-agent` | `DashboardStandaloneChrome` | `DashboardStage` (Chrome) + breiter Agent | **Geändert** |
| `/dashboard/settings` | `DashboardStandaloneChrome` | Ivory Stage, echte Profil-Daten | **Geändert** |
| `/dashboard/gallery` | `DashboardStandaloneChrome` | Ivory Stage, echte Gallery API | **Geändert** |
| `/dashboard/design-preview` | `PreviewShell` (isoliert) | Unverändert | **Nicht angefasst** |

---

## Eingeführte Shell/Surface-Komponenten

**Datei:** `src/components/dashboard/core/DashboardSurface.tsx`

| Komponente | Zweck |
|------------|--------|
| `DashboardStage` | Warme Ivory/Stone-Arbeitsfläche auf Dark Shell (max ~96rem) |
| `DashboardPageHeader` | Kicker, Titel, Untertitel, optionale Action |
| `DashboardKicker` | Mono-Overline |
| `DashboardPanel` | Cockpit-/Settings-Karte auf Stage |
| `DashboardSection` | Abschnitts-Wrapper |

**Tokens:** `DASHBOARD_SHELL_BG` (#050506), `DASHBOARD_STAGE_SURFACE`, `DASHBOARD_ACCENT`, `DASHBOARD_TEXT`, `DASHBOARD_MUTED`

**Weitere Shell-Updates:**
- `DashboardStandaloneChrome` — Stage-Wrapper, `h-dvh`, Shell #050506
- `DashboardLayout` — Studio in `DashboardStage`, Shell #050506
- `DashboardMobileNav` — Label „Mehr“ für Settings, Icons + kurze Labels

---

## Echte Daten vs Empty State

| Bereich | Quelle | Status |
|---------|--------|--------|
| Studio — Credits | `/api/dashboard/init` | **Echt** |
| Studio — Letzte Assets | `gallery_assets` via init | **Echt** (kann leer) |
| Studio — Aktive Produktionen | `toolsGenerating` | **Echt** |
| Studio — Brand Kit / Workspace / Exporte / Failed Jobs | Kein Aggregat | **Empty State** (dokumentiert) |
| Agent — Profil-Chip | `useCreatorProfile` / Supabase | **Echt** (optional leer) |
| Agent — Prompt / Generate | Chat-Route | **Echt** (keine Mock-Daten) |
| Settings — Name, E-Mail, Creator Memory | Supabase `profiles` / `creator_profiles` | **Echt** |
| Settings — Billing/API/Workspace/Brand Defaults (voll) | Nicht implementiert | **Nicht als Fake ausgegeben** — nur vorhandene Sektionen |
| Gallery — Assets | `getGallery()` → `generations` | **Echt** (Empty State wenn leer) |

---

## Bewusst nicht aus Preview übernommen

- Mock-Credits (240), Beispiel-Assets, Fake-Transaktionen
- Preview-Banner („Design Preview — nicht das Produktions-Dashboard“)
- `PreviewSettings` Fake-Felder (Max Mustermann, Fake API Key)
- Preview-only Nav-Texte / „Preview Mode“
- Terminal-/System-Line-Kopie
- Inline Tool-Views in `DashboardLayout` (schmales Dark-Layout) — **Phase 2B Fokus: Studio + Standalone-Routen**

---

## Mobile (390px)

- Bottom Nav: Icons + kurze Labels (Studio, Agent, Tools, Galerie, **Mehr**)
- `pb-[4.5rem]` auf Main — Content nicht unter Bottom Nav
- Stage: volle Breite minus 12–16px Padding, `overflow-x-hidden`
- Agent: flex-wrap Steps, 2-col Quick Tools Grid
- Keine horizontalen Scrollbars auf angepassten Routen (Ziel)

---

## Offene Risiken

- Tool-Views innerhalb `/dashboard?tool=…` (`DashboardLayout` non-studio) behalten älteres schmales Dark-Layout — bewusst außerhalb 2B-Scope
- Settings-Seite: Passwort-/Danger-Cards nutzen teils legacy CSS (`settings-glass-*`) — funktional, visuell gemischt
- Gallery-Cards (`GalleryCard`) behalten eigene Card-Optik innerhalb Ivory Stage
- Zwei Galerie-Quellen (`gallery_assets` vs `generations`) unverändert
- Lint: weiterhin ~17 bestehende Errors erwartet

---

## Geänderte Dateien (Phase 2B)

- `DashboardSurface.tsx` (neu)
- `DashboardStandaloneChrome.tsx`
- `DashboardLayout.tsx`
- `DashboardMobileNav.tsx`
- `StudioCockpit.tsx`
- `AgentAutopilotV2.tsx`
- `src/app/dashboard/ki-agent/page.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/app/dashboard/gallery/page.tsx`
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md` (neu)

---

## Phase 2B.1 Visual Polish

**Date:** 2026-06-16  
**Scope:** Layout bugfixes and contrast polish on production routes — no new design direction.

### Stage-Breite

| | Vorher (2B) | Nachher (2B.1) |
|---|-------------|----------------|
| Outer Padding Desktop | `md:px-[5%] lg:px-[4%]` (~90% nutzbar) | `md:px-3 lg:px-4` (~12–16px Rand) |
| Stage max-width | `96rem` | `96rem` (unverändert, füllt Main fast voll) |
| Inner Padding | `md:px-10 lg:px-14` | `md:px-8 lg:px-12 xl:px-14` |

Stage wirkt auf Desktop breiter; Mobile behält `px-3` (12px).

### Credit-/Plan-Badge Fix

- Kaputte Header-Badge (vertikal abgeschnitten, doppelte Credit-Anzeige) **entfernt** aus `StudioCockpit`
- Credits nur noch in Cockpit-Karte **„Credits & Plan“**
- `DashboardPageHeader`: optionales `action` auf Mobile standardmäßig ausgeblendet (`hidden sm:block`)

### Sidebar Tools-Duplizierung

- Zweiter globaler **„Tools“**-Accordion unter Primary Nav **entfernt**
- Tool-Kategorien erscheinen nur noch, wenn ein Tool aktiv ist (`isActiveTool`)
- Primary Nav „Tools“ bleibt einmalig; Active-State berücksichtigt `?tool=` Query

### Surface-Kontrast

- Stage: warmes Ivory `#FAF6EE → #EBE2D2` (kein grauer Transluzenz-Schleier)
- Panels: `#FFFCF7` mit klarer Border/Schatten
- `DASHBOARD_MUTED`: `rgba(8,8,8,0.58)` für bessere Lesbarkeit

### Mobile-Fixes

- Main `pb-[5rem]` (Studio + Standalone) — mehr Abstand zur Bottom Nav
- Studio: keine Header-Credit-Pill mehr
- Gallery: Filter als horizontal scrollbare Chip-Leiste (`shrink-0`, Scrollbar hidden)

### Agent Command Center

- Breite: `max-w-6xl`
- Eingabe + CTA in `DashboardPanel`, größeres Textarea (`min-h-[140px]`)
- Status-Steps als Pills; Quick Tools mit `#FFFCF7`-Cards
- Technische Vorschau dezent (`opacity-90`, weiterhin collapsed default)

### Offene Risiken

- Tool-Views in `DashboardLayout` (non-studio) weiterhin schmales Dark-Layout
- Settings Passwort/Danger nutzen teils legacy CSS-Klassen
- Gallery `GalleryCard`-Optik innerhalb Stage unverändert

### Geänderte Dateien (2B.1)

- `DashboardSurface.tsx`
- `DashboardStandaloneChrome.tsx`
- `DashboardLayout.tsx`
- `DashboardPrimaryNav.tsx`
- `StudioCockpit.tsx`
- `AgentAutopilotV2.tsx`
- `src/app/dashboard/gallery/page.tsx`
- `src/app/dashboard/settings/page.tsx` (Panel-Tokens)
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md`

---

## Phase 2B.2 Legacy Production View Cleanup

**Date:** 2026-06-16  
**Scope:** Clean up legacy production views — primarily `/dashboard/settings`, mobile nav, gallery copy. No billing/credit logic changes.

### Gefundene Legacy-Komponenten

| Komponente / Text | Route | Status |
|-------------------|-------|--------|
| `settings/page.tsx` schmale `max-w-2xl`-Spalte | `/dashboard/settings` | **Ersetzt** durch Section-Layout |
| „Creator Growth Agent“ Headline | Settings | **Entfernt** → „Benachrichtigungen“ |
| „Was dein Studio über dich weiß“ | Settings | **Umbenannt** → „Brand Defaults“ |
| „GEFAHRENZONE“ roter Dark-Block | Settings | **Ersetzt** → „Konto löschen“ Panel (light) |
| `settings-glass.css` / inline Dark-Styles | Settings | **Entfernt** aus Settings-Route |
| `SettingsView.tsx` | `/dashboard?tool=settings` (inline) | **Legacy** — weiterhin in `DashboardLayout` |
| Tool-Views schmales Dark-Layout | `/dashboard?tool=…` | **Legacy dokumentiert** |
| Gallery „Meine Gallery“ / „Verlauf“ i18n | `/dashboard/gallery` | **Header lokalisiert** → Asset Library / Galerie |
| Mobile Nav: Tools vs Studio bei `?tool=` | Alle Mobile-Routen | **Korrigiert** |

### Settings vorher / nachher

| | Vorher | Nachher |
|---|--------|---------|
| Breite | `max-w-2xl` schmale Spalte | `max-w-5xl`, Nav + Content |
| Struktur | Gestapelte alte Cards | 6 Sections: Account, Billing, Brand, Generation, Privacy, API |
| Credits | nicht auf Settings-Seite | echte `profiles.credits` + Link `/dashboard/credits` |
| Generation Defaults | nicht vorhanden | Empty State (kein Fake) |
| Gefahrenzone | roter Legacy-Block | sauberes Panel in Datenschutz-Section |
| Mock/Fake | keine Fake-Daten | weiterhin nur Supabase-Echtdata |

### Gallery Status

- **Geprüft + minimal geändert**
- Echte Daten via `getGallery()` unverändert
- Header: „Asset Library“ / „Galerie“ statt i18n „Meine Gallery“ / „Verlauf“
- Empty State Copy verbessert (kein Preview-Sprache)
- Filter: horizontal scroll (2B.1) — unverändert funktional

### Tool-View Legacy Status

**Noch Legacy (bewusst nicht umgebaut in 2B.2):**

- `/dashboard?tool=*` — schmales Dark-Layout, `max-w-xl`, Floating AgentBox
- Inline `SettingsView` bei `activeTool === "settings"` in `DashboardLayout`
- Inline Gallery bei `activeTool === "gallery"` in `DashboardLayout`

**Priorität für nächste Phase:**

1. Tool-Views in `DashboardStage` einbetten (globaler Shell-Fix)
2. Inline Settings/Gallery aus `DashboardLayout` entfernen (nur Routen nutzen)
3. `SettingsView.tsx` deprecaten zugunsten `/dashboard/settings`

**Credit-Labels:** Tool-Views nutzen weiterhin `calculateExactCredits` / Registry aus Phase 1C/1D — unverändert.

### Mobile Nav Status

- **Korrigiert:** Studio aktiv nur ohne `?tool=` Query
- **Korrigiert:** Tools aktiv bei `?tool=viral-hook` etc.
- **Korrigiert:** „Mehr“ aktiv für `/dashboard/settings`, `/dashboard/credits`, `/dashboard/api`, `/dashboard/profile`
- Agent / Galerie: pathname-basiert — OK

### Offene Risiken

- Zwei Settings-Einstiege: Route vs. inline `SettingsView` in `DashboardLayout`
- Zwei Galerie-Quellen (`gallery_assets` vs `generations`) unverändert
- `SettingsView.tsx` weiterhin Legacy-Krea-Style für inline Tool-Settings
- Gallery-Cards behalten eigene Card-Optik

### Geänderte Dateien (2B.2)

- `src/app/dashboard/settings/page.tsx`
- `src/components/dashboard/core/DashboardMobileNav.tsx`
- `src/app/dashboard/gallery/page.tsx`
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md`

---

## Phase 2B.3 Tool Query View Fix

**Date:** 2026-06-16  
**Scope:** Fix black/empty legacy tool query views (`/dashboard?tool=…`). No billing/credit logic, provider routes, registry, or landing page changes.

### Ursache schwarzer Tool-Screen

1. **`DashboardShell`** renderte für alle Nicht-Standalone-Routen nur `<DashboardLayout />` und **ignorierte `children`** — dedizierte Tool-Seiten wie `/dashboard/viral-hook` kamen nie zum Zug.
2. **`DashboardLayout`** bei `?tool=*`: kein `DashboardStage`, schwarzer Shell-Hintergrund, schmale `max-w-xl`-Spalte, **`AgentBox` mit `fixed left-1/2 top-16`** — auf Mobile unsichtbar/leer, horizontal verschoben.
3. **`handleToolSelect`** leitete `viral-hook`, `content-calendar`, `trend-script`, `image-gen` nicht auf dedizierte Routen um → Fallback auf kaputten AgentBox-Pfad.
4. **Tools-Nav** verlinkte direkt auf `/dashboard?tool=viral-hook` statt auf eine Übersicht.

### Angepasste Tool-Query-Views / Komponenten

| Bereich | Änderung |
|---------|----------|
| `DashboardShell.tsx` | Nur exakt `/dashboard` → SPA `DashboardLayout`; alle `/dashboard/*`-Unterrouten → `DashboardStandaloneChrome` + Seiten-`children` |
| `DashboardLayout.tsx` | `tool=tools` + `ProductionToolsOverview`; sonst `ProductionToolLaunch` in `DashboardStage`; Query-Redirect zu dedizierten Routen; AgentBox-Branch entfernt |
| `production-tool-routes.ts` | Zentralisierte `TOOL_DEDICATED_ROUTES`, Kategorien, `resolveToolRoute`, `isDedicatedToolPath` |
| `ProductionToolsOverview.tsx` | Kategorien: Foto, Video, Avatar & Voice, Text & Kampagne, Brand/Assets — Credit-Labels aus `credit-display.ts` |
| `ProductionToolLaunch.tsx` | Tool-Header, Beschreibung, Credits, „Tool öffnen“ / „Im Agent starten“ |
| `DashboardPrimaryNav.tsx` | Tools → `/dashboard?tool=tools`; Active-State via Query + dedizierte Pfade |
| `DashboardMobileNav.tsx` | Tools → `/dashboard?tool=tools`; Active-State erweitert |

### Tool-Anzeige jetzt

- **`/dashboard?tool=tools`** — saubere Tools-Übersicht in ivory `DashboardStage`
- **`/dashboard?tool=viral-hook`** (und andere mit dedizierter Route) — **Redirect** zu `/dashboard/viral-hook` etc., Seite in `DashboardStandaloneChrome` + `DashboardStage`
- **Tools ohne dedizierte Route** (z. B. `img-to-img`) — `ProductionToolLaunch` in Stage (kein schwarzer Fullscreen)
- **Quick Start** (`StudioCockpit`) — `handleToolSelect` → dedizierte Routen oder Launch-View

### Echte Tool-Seiten — später noch redesignen

Diese Seiten **funktionieren** jetzt (Shell rendert `children`), behalten aber **eigenes Dark/Legacy-UI innerhalb der Stage**:

- `/dashboard/viral-hook` — dunkle Inline-Cards
- `/dashboard/content-kalender`, `/dashboard/trend-to-script`
- `/dashboard/image-generator`, `/dashboard/szenen-generator` (DynamicDashboardEngine)
- Avatar/Voice-Routen (`avatar-studio`, `melodia`, `live-portrait`, …)
- Weitere `/dashboard/*`-Tool-Pages mit Legacy-Styling

**Inline Legacy in `DashboardLayout` (noch vorhanden, ungenutzt im Main-Render):**

- `SettingsView`, `GalleryFilterBar`, `AgentBox`-Import, `handleActionExecute` — nicht mehr im Haupt-UI-Pfad; Deprecation in späterer Phase

### Offene Risiken

- Dedizierte Tool-Pages: Dark-UI in heller Stage kann visuell gemischt wirken (push-safe, kein Blocker)
- Zwei Settings-/Galerie-Einstiege in `DashboardLayout`-Code (toter Pfad) vs. Routen
- `img-to-img` und ähnliche ohne dedizierte Route: nur Launch-View, kein Voll-Tool bis Anbindung
- `SettingsPanel` / rechtes Panel deaktiviert in SPA (kein AgentBox mehr)

### Geänderte Dateien (2B.3)

- `src/components/dashboard/core/DashboardShell.tsx`
- `src/components/dashboard/core/DashboardLayout.tsx`
- `src/components/dashboard/core/DashboardPrimaryNav.tsx`
- `src/components/dashboard/core/DashboardMobileNav.tsx`
- `src/components/dashboard/core/production-tool-routes.ts` (neu)
- `src/components/dashboard/core/ProductionToolsOverview.tsx` (neu)
- `src/components/dashboard/core/ProductionToolLaunch.tsx` (neu)
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md`

---

## Phase 2B.4 Tool Legacy Push-Safe Lockdown

**Date:** 2026-06-16  
**Scope:** Lock all Tools entrypoints to launch/overview views. No auto-open of legacy dark tool pages. Fix stale 1100-credit UI fallback.

### Tool-Routen → Launch-View (push-safe)

| Query / Einstieg | Verhalten |
|------------------|-----------|
| `/dashboard?tool=tools` | `ProductionToolsOverview` |
| `/dashboard?tool=viral-hook` | `ProductionToolLaunch` (kein Redirect zu `/dashboard/viral-hook`) |
| `/dashboard?tool=image-generator` / `image-gen` | Launch-View, Credits aus `credit-display.ts` |
| `/dashboard?tool=video-generator` / `img-to-video` | Launch-View, „Dynamisch nach Modell & Dauer“ |
| Quick Start (Studio) | Launch-View oder Agent (`content-calendar` → Agent) |
| Legacy-Pfade (`/dashboard/viral-hook`, `/dashboard/szenen-generator`, …) | `LegacyToolRedirect` → `/dashboard?tool=…` |

**`isToolPushSafeToOpen`:** derzeit `false` für alle Tools — Button „Tool öffnen“ ausgeblendet bis Redesign.

### Dedizierte Tool-Seiten — später redesignen

Seiten existieren weiterhin im Repo, werden aber **nicht** mehr aus Nav/Quick-Start/Query geöffnet:

- `/dashboard/viral-hook`, `/dashboard/content-kalender`, `/dashboard/trend-to-script`
- `/dashboard/image-generator` (DynamicDashboardEngine + Registry-Panel)
- `/dashboard/szenen-generator` (Video Generator / SzenenGeneratorStudio)
- Avatar/Voice/Video-Unterrouten aus `TOOL_DEDICATED_ROUTES`

### 1100 Credits

- **Gefunden:** `src/lib/szenen-generator-models.ts` — Katalog-Fallback `~1100 Credits` / `~900 Credits` wenn kein Akool-API-Modell gematcht
- **Entfernt/ersetzt:** `formatCreditEstimate()` ohne API-Modell → `"Dynamisch nach Modell & Dauer"` (keine feste falsche Zahl)
- Launch-View nutzt weiterhin `getCreditDisplayLabel()` aus `credit-display.ts` (Registry unverändert)

### Issue Badge (unten links)

- **Ursache:** Next.js Dev-Overlay (`Issues`-Badge bei Hydration-/Console-Warnungen im Dev-Modus), nicht Production-UI
- Kein neuer React-Render-Fehler durch 2B.4-Änderungen in tsc/build reproduzierbar

### Geänderte Dateien (2B.4)

- `src/components/dashboard/core/production-tool-routes.ts`
- `src/components/dashboard/core/LegacyToolRedirect.tsx` (neu)
- `src/components/dashboard/core/ProductionToolLaunch.tsx`
- `src/components/dashboard/core/DashboardShell.tsx`
- `src/components/dashboard/core/DashboardLayout.tsx`
- `src/lib/szenen-generator-models.ts`
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md`

---

## Fast Phase 2B.5 Remove Legacy Agent Run UI

**Date:** 2026-06-16  
**Scope:** Remove black Agent run/chat UI after „Erstellen“. No Agent API or billing changes.

### Ursache schwarzer Run-State

1. **`AgentAutopilotV2`** leitete nach Submit auf `/dashboard/ki-agent/chat` weiter (`router.push`).
2. **`ki-agent/chat/page.tsx`** nutzte `bg-[#08080a]`-Wrapper.
3. **`AgentAutopilotChat.tsx`** renderte dunklen Chat: `AGENT AUTOPILOT`-Header, `bg-[#0d0d0f]`-Bubbles, sticky `bg-[#060608]`-Input, „Agent Autopilot denkt…“.

### Entfernt / ersetzt

| Legacy | Ersetzung |
|--------|-----------|
| Redirect zu `/ki-agent/chat` | Inline-Run in `AgentAutopilotV2` via `useAgentAutopilotChat` |
| Dunkler `AgentAutopilotChat` Run-Layout | `AgentRunMessages` + helle `DashboardPanel`-Cards |
| Schwarzer Chat-Canvas | Ivory Cards, dunkler Text, Lime-tinted User-Briefing |
| `/ki-agent/chat` Dark Page | Redirect → `/dashboard/ki-agent?prompt=…` |

### Agent-Zustände (hell)

- **Initial:** `AgentAutopilotV2` — Tabs, Header, helle Prompt-Card (unverändert)
- **Loading:** Status in `AgentRunMessages` — „Briefing wird analysiert“ / „Tool wird gewählt“
- **Messages/Result:** User lime-card + Agent `DashboardPanel` + `AgentMarkdown variant="light"`
- **Campaign:** gleicher heller Flow; Subtitle „Kampagnen-Autopilot wird über den Agent vorbereitet.“
- **Error:** helle Hinweis-Card + „Erneut versuchen“

### Offene Risiken

- `AgentResultCard`, `AgentStructuredResults`, `AgentRedirectCards` — noch dark-themed, derzeit nicht im Haupt-Agent-Pfad
- Alte Bookmarks `/dashboard/ki-agent/chat` → Redirect mit Auto-Run via `?prompt=`
- Quick-Tool-Links in Agent zeigen noch auf Legacy-Routen (separates Thema)

### Geänderte Dateien (2B.5)

- `src/hooks/useAgentAutopilotChat.ts` (neu)
- `src/components/agent/AgentRunMessages.tsx` (neu)
- `src/components/agent/AgentAutopilotV2.tsx`
- `src/components/agent/AgentAutopilotChat.tsx`
- `src/components/agent/AgentMarkdown.tsx`
- `src/components/agent/AgentTypingIndicator.tsx`
- `src/components/agent/AgentWorkingStatus.tsx`
- `src/components/ui/AiOutputDisclaimer.tsx`
- `src/app/dashboard/ki-agent/page.tsx`
- `src/app/dashboard/ki-agent/chat/page.tsx`
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md`

---

## Phase 3A Real Tool Setup MVP

**Date:** 2026-06-16  
**Scope:** Tool cards → inline Setup (not agent redirect). Five MVP tools with direct generation where existing routes/actions exist. Copy cleanup only — no billing, credit registry, or provider route changes.

### Tool Setups (MVP)

| Tool | Route | Setup fields | Primary CTA |
|------|-------|--------------|-------------|
| Viral Hook | `?tool=viral-hook` | Thema/Link, Nische, Modus | Hook generieren |
| Content Kalender | `?tool=content-calendar` | Nische, Plattform, Zeitraum | Kalender generieren |
| Bildgenerator | `?tool=image-gen` (+ aliases) | Prompt, Format (PLATFORM_FORMATS) | Bild generieren |
| Bild zu Video | `?tool=img-to-video` (+ aliases) | Startbild-URL, Prompt, Modell | Video generieren |
| Text zu Video | `?tool=text-to-video` | Prompt, Modell, Dauer, Auflösung | Video generieren |

**Shell:** `ProductionToolSetup` + `ProductionToolSetupBody` on ivory `DashboardStage`. Secondary CTA on all: „Mit Agent vorbereiten“.

### Direkte Generierung

| Tool | Direkt | Backend |
|------|--------|---------|
| Viral Hook | **Ja** | `extractViralHook` server action |
| Content Kalender | **Ja** | `generateContentCalendar` server action |
| Bildgenerator | **Ja** | `POST /api/generate-image` |
| Bild zu Video | **Ja** | `POST /api/akool/image-to-video` + job poll |
| Text zu Video | **Ja** | `POST /api/akool/text-to-video` + job poll |

Non-MVP tools still use `ProductionToolLaunch` → „Mit Agent vorbereiten“ only (no „Tool öffnen“ — `isToolPushSafeToOpen` remains false).

### Agent-only / später

Tools without Setup MVP: trend-script, img-to-img, avatar, TTS, ecommerce-ads, ai-video-editor, etc. → `ProductionToolLaunch` + Agent CTA.

### Legacy Tool-Seiten (später redesign)

Dedicated pages remain locked (`LegacyToolRedirect` → `?tool=`): `/dashboard/viral-hook`, `/dashboard/content-kalender`, `/dashboard/image-generator`, `/dashboard/szenen-generator`, `/dashboard/text-to-video`, and other entries in `TOOL_DEDICATED_ROUTES`.

### Entfernte / gekürzte Copy

- „InfluexAI übernimmt Briefing…“ / „Im Agent starten“ als Hauptpfad für MVP-Tools
- „Tool öffnen“ auf Launch-Views
- Credit-Labels: `AgentBox`, `Dashboard`, `Fallback` → UI-sanitized (`2–5 Credits`, `Dynamisch · ab 50 Credits`, etc.)
- „Technische Vorschau“ JSON-Block im Agent
- „KI-Bilder für Content“ in Overview/Quick Tools
- Lange Agent-Subtitle („Briefing wird analysiert…“)
- „Production Tools“ / „dedizierte Seiten“ in Tools-Overview

### Geänderte / neue Dateien (3A)

- `src/components/dashboard/core/ProductionToolSetup.tsx` (neu)
- `src/components/dashboard/core/ProductionToolSetupBody.tsx` (neu)
- `src/components/dashboard/core/production-tool-setup-ui.ts` (neu)
- `src/components/dashboard/core/DashboardLayout.tsx`
- `src/components/dashboard/core/ProductionToolsOverview.tsx`
- `src/components/dashboard/core/ProductionToolLaunch.tsx`
- `src/components/dashboard/core/production-tool-routes.ts`
- `src/components/agent/AgentAutopilotV2.tsx`
- `PRODUCTION_DASHBOARD_VISUAL_FREEZE.md`

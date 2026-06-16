# DASHBOARD IA FREEZE — Phase 2A

**Date:** 2026-06-16  
**Scope:** Separate Studio (cockpit) from Agent (command center). Navigation fixes. No billing/provider/landing changes.

---

## Was ist Studio?

**Route:** `/dashboard` (SPA via `DashboardLayout`, `activeTool === "studio"`)

**Rolle:** Cockpit — Überblick, Status, Quick Start, Weiterarbeiten.

**Enthält:**
- Header „Studio“ + funktionaler Untertitel
- Grid: Aktive Produktionen, Letzte Assets, Credits & Plan, Schnell starten
- Weiterarbeiten → Agent oder Galerie
- System-Status (Brand Kit, Workspace, Exporte, Fehler) mit Empty States
- Tool-Shortcuts (kein Copilot-Chat)

**Enthält nicht:**
- Großes Promptfeld / Copilot als Hauptfläche
- Marketing-Bentos („AI Media Buyer“, „AD FLOW“)
- Agent-Produktionslogik

**Implementierung:** `src/components/dashboard/core/StudioCockpit.tsx`

---

## Was ist Agent?

**Route:** `/dashboard/ki-agent` (+ `/dashboard/ki-agent/chat`)

**Rolle:** Eingabe- und Steuerzentrale — Idee, Briefing, Tool-Routing, Generate.

**Enthält:**
- Großes Eingabefeld (`AgentAutopilotV2`)
- Quick Actions / Einzeltools
- Produktionspfad-Status (Briefing → Tool → Output)
- Generate → Chat/Orchestrator

**Enthält nicht:**
- Gallery-Ersatz
- Settings-Ersatz
- Studio-Cockpit-Grid

**Shell:** `DashboardStandaloneChrome` rendert Agent-Seiten mit Primary Nav.

---

## Entfernte / ersetzte generische Texte (Produktion)

| Vorher | Nachher |
|--------|---------|
| „AI Production Studio“ | „Studio“ |
| „AI MEDIA BUYER →“ / „Your copilot across every ad account“ | Entfernt (Bento-Grid) |
| „AD FLOW →“ / „Build ads on one visual canvas“ | Entfernt |
| „More ways to create“ / „Analyze & launch“ | Cockpit-Sektionen (DE) |
| „Recent outputs“ | „Letzte Assets“ (in Cockpit) |
| Copilot auf Studio-Home | Nur noch unter Agent-Route |

**Preview-only:** `design-preview/*` — isoliert, mit Preview-Banner; Studio/Agent getrennt wie Produktion (siehe Phase 2A.1).

---

## Phase 2A.1 Route & Navigation Check

**Date:** 2026-06-16  
**Scope:** Route reality check, unified nav, design-preview isolation, mock headline cleanup.

### Geprüfte Routen

| Route | Layout | Navigation | Ergebnis |
|-------|--------|------------|----------|
| `/dashboard` | `DashboardLayout` + `StudioCockpit` | Sidebar Primary Nav + Tools + Mobile 5-item | **OK** |
| `/dashboard/ki-agent` | `DashboardStandaloneChrome` + `AgentAutopilotV2` | Primary Nav + Mobile | **OK** |
| `/dashboard/agent` | Redirect | → `/dashboard/ki-agent` | **OK** (Middleware + page) |
| `/dashboard/settings` | `DashboardStandaloneChrome` + settings page | Primary Nav + Mobile „Einstellungen“ | **OK** |
| `/dashboard/gallery` | `DashboardStandaloneChrome` + gallery page | Primary Nav + Mobile | **OK** |
| `/dashboard/design-preview` | **Nur** `PreviewShell` fullscreen (kein Prod-Chrome) | Eigene Preview-Nav inkl. Settings | **Angeglichen + markiert** |

### Navigation Desktop (Produktion)

`DashboardPrimaryNav`: Studio · Agent · Tools (`?tool=viral-hook`) · Galerie · Einstellungen  
Credits: Footer in `DashboardLayout` + Links im Studio-Cockpit (nicht in Primary Nav).

### Navigation Mobile (Produktion)

`DashboardMobileNav`: Studio · Agent · Tools · Galerie · Einstellungen (5 Items, Icons + Labels).

### Settings

| Check | Status |
|-------|--------|
| Sichtbar in Desktop-Nav | **Ja** |
| Sichtbar in Mobile-Nav | **Ja** |
| Route erreichbar | **Ja** (`/dashboard/settings`) |
| Preview-Nav Settings | **Ja** (`PreviewSettings` view) |

### Design-Preview Status

**Entscheidung:** A + B kombiniert — angeglichen **und** klar markiert.

- Kein doppeltes Prod-Chrome (`design-preview` aus `STANDALONE_CHILD_ROUTES`, eigener `PREVIEW_ONLY_ROUTES` Pfad)
- Banner: „Design Preview — nicht das Produktions-Dashboard“ + Link zu `/dashboard`
- Settings in Preview-Navigation ergänzt
- Studio-Preview = Cockpit (kein eingebetteter Agent-Chat)
- Agent-Preview = Command Center (unveränderte Rolle)

### Entfernte Mock-Texte (sichtbar)

| Vorher | Nachher |
|--------|---------|
| `STUDIO-ARCHIV · MOCK` | `Studio-Archiv` |
| `Production Output · Mock` | `Asset Library` |
| `Kampagne · Mock` / `Campaign · Mock` | `Beispiel` / `Sample` |
| `Beauty Launch — Q3` (Studio headline area) | `Letztes Asset` / Cockpit-Headlines |
| `Creator Production OS` / `AI-native Production OS` | `Design Preview` / `Heute im Studio` |
| `Mock · Preview` (Gallery empty) | `Preview Mode` |
| Doppelte Prod-Sidebar auf Preview | Entfernt |

### Offene Risiken

- `?tool=` Query wird nur in `DashboardLayout` gelesen (kein Deep-Link für alle Tool-Routen)
- Preview nutzt weiter Mock-Daten (Asset-Karten, 240 Credits) — nur als Preview gekennzeichnet
- Zwei Galerie-Quellen (`gallery_assets` vs `generations`) unverändert
- Inline Settings in `DashboardLayout` technisch noch vorhanden

### Lint (Phase 2A.1)

Weiterhin **17 Errors** (bestehend) — keine neuen durch 2A.1 erwartet.

---

## Navigation korrigiert (Phase 2A)

| Eintrag | Ziel | Fix |
|---------|------|-----|
| Studio | `/dashboard` | `DashboardPrimaryNav` + Logo |
| Agent | `/dashboard/ki-agent` | War `toolTarget: gallery` → behoben |
| Galerie | `/dashboard/gallery` | Standalone-Route + Nav |
| Credits | `/dashboard/credits` | Cockpit + Sidebar-Footer (nicht Primary Nav) |
| Einstellungen | `/dashboard/settings` | Primary Nav + Mobile Nav |
| `/dashboard/agent` | `/dashboard/ki-agent` | Middleware + redirect page |

**Shared Nav:** `src/components/dashboard/core/DashboardPrimaryNav.tsx`  
**Standalone Shell:** `DashboardStandaloneChrome.tsx` für ki-agent, gallery, credits, settings, …

---

## Settings Status

| Punkt | Status |
|-------|--------|
| `/dashboard/settings` | Erreichbar (Standalone Chrome) |
| Inline `SettingsView` in `DashboardLayout` | Noch vorhanden bei `activeTool === "settings"`, Nav leitet zu Route |
| `/dashboard/settings/billing` | **Existiert nicht** — Link zeigt jetzt auf `/dashboard/credits` |
| `PreviewSettings` | Nur Design-Preview, nicht Produktion |
| Vollständiges Settings-System | **Offen** (Phase 2+) |

---

## Echte Daten vs Empty State

| Bereich | Quelle | Status |
|---------|--------|--------|
| Credits | `GET /api/dashboard/init` → `profiles.credits` | **Echt** |
| Letzte Assets (Studio) | `gallery_assets` via init | **Echt** (kann leer sein) |
| Aktive Produktionen | `toolsGenerating` in `DashboardLayout` | **Echt** (laufende Tool-UI) |
| Galerie (volle Seite) | `getGallery()` → `generations` | **Echt** (eigene Route) |
| Brand Kit | Kein dediziertes API | **Empty State** → Settings-Hinweis |
| Workspace Status | Nicht implementiert | **Empty State** (dokumentiert) |
| Exporte | Kein Dashboard-Aggregat | **Empty State** |
| Fehlgeschlagene Jobs | Kein List-Endpoint | **Empty State** (Hinweis) |
| Plan-Name im Studio | Nicht in init | Link zu Credits-Seite |

---

## Bewusst nicht angefasst

- Provider-Routen / Billing / Credit-Logik
- Landingpage
- `design-preview` — isoliert mit Preview-Banner (Phase 2A.1)
- Vollständige Gallery-SSOT-Vereinigung (`gallery_assets` vs `generations`)
- Agent-Job-Liste / Failed-Jobs-Dashboard
- Support-Tickets, API-Integrationen in Settings

---

## Lint (Phase 2A)

Erwartung: weiterhin ~17 bestehende Errors — keine Massen-Fixes in 2A.

---

## Dateien (Hauptänderungen)

- `StudioCockpit.tsx` (neu)
- `DashboardPrimaryNav.tsx` (neu)
- `DashboardStandaloneChrome.tsx` (neu)
- `DashboardLayout.tsx` — Cockpit, Nav
- `DashboardShell.tsx` — Standalone-Routen
- `AgentAutopilotV2.tsx` — funktionale Agent-Texte
- `SettingsView.tsx` — Billing-Link → Credits
- `middleware.ts` — `/dashboard/agent` → ki-agent

---

## Phase 2A.2 Preview Content Render Fix

**Date:** 2026-06-16  
**Scope:** Restore visible content in `/dashboard/design-preview` for all nav tabs (desktop + mobile). No billing/provider/landing changes.

### Ursache des leeren Contents

1. **Mobile-Layout:** `PreviewShell` nutzte `fixed inset-0 z-[100]` mit einer flex-Struktur, bei der der Stage-Bereich auf ~390px nicht sichtbar skalierte — schwarzer Main-Bereich unter dem Header, Bottom Nav teils außerhalb des sichtbaren Viewports.
2. **Fehlender zentraler Render-Switch:** View-Content war implizit/fragmentiert; kein einheitliches Mapping von `PreviewView` → Komponente.
3. **Settings-Kontrast:** `PreviewSettings` nutzte `text-white` auf hellem Ivory-Stage (`STAGE_SURFACE`) — Content war im DOM, aber unsichtbar.

### Korrigierte View-IDs

Einheitlich mit `PreviewLang.PreviewView` und `t.nav`:

| View ID | Nav-Label (DE) |
|---------|----------------|
| `studio` | Studio |
| `agent` | Agent |
| `tools` | Tools |
| `gallery` | Galerie |
| `settings` | Einstellungen |

Keine Duplikate (`galerie`/`gallery`, `einstellungen`/`settings`, `tool`/`tools`).

### Gerenderte Komponenten pro View

| View | Komponente |
|------|------------|
| `studio` | `PreviewStudioHome` |
| `agent` | `PreviewAgentView` (aus `PreviewStudioHome.tsx`) |
| `tools` | `PreviewToolsFlow` |
| `gallery` | `PreviewGallery` |
| `settings` | `PreviewSettings` |

Zentraler Switch: `PreviewViewContent.tsx`.

### Layout-Fixes

- `PreviewShell`: `h-dvh` Flex-Column statt `fixed inset-0`; Mobile Nav als `shrink-0` Footer innerhalb der Column (nicht fixed sibling).
- `design-preview/page.tsx`: Wrapper mit `h-dvh max-h-dvh overflow-hidden`.
- Main: `min-h-0 flex-1 overflow-y-auto`, Stage mit `minHeight: min(100%, 28rem)`.
- Kein `hidden md:block` auf View-Content.

### Mobile-Ergebnis

- Header, Content Stage und Bottom Nav sichtbar; kein Content hinter fixed Layers.
- Alle fünf Tabs rendern sichtbaren Preview-Content (Cockpit, Command Center, Tools, Gallery, Settings).
- Horizontales Scrollen vermieden (`overflow-x-hidden`, `max-w-full`).

### Offene Risiken

- Preview weiterhin Mock-Daten (240 Credits, Beispiel-Assets) — nur als „Design Preview“ / „Preview Mode“ gekennzeichnet.
- Settings-Sektionen Privacy/Notifications/API nutzen dunkle Karten auf hellem Stage — beabsichtigt, Kontrast geprüft.
- `?tool=` Deep-Link nur in Produktions-`DashboardLayout`, nicht in Preview.
- Lint: weiterhin ~17 bestehende Errors (nicht Teil von 2A.2).

### Geänderte Dateien (2A.2)

- `PreviewViewContent.tsx` (neu)
- `PreviewShell.tsx`
- `PreviewSettings.tsx`
- `src/app/dashboard/design-preview/page.tsx`
- `DASHBOARD_IA_FREEZE.md`

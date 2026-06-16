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

**Preview-only (unverändert, isoliert):** `design-preview/*` — „Creator Production OS“, „Beauty Launch“, etc.

---

## Navigation korrigiert

| Eintrag | Ziel | Fix |
|---------|------|-----|
| Studio | `/dashboard` | `DashboardPrimaryNav` + Logo |
| Agent | `/dashboard/ki-agent` | War `toolTarget: gallery` → behoben |
| Galerie | `/dashboard/gallery` | Standalone-Route + Nav |
| Credits | `/dashboard/credits` | Sidebar-Link + Cockpit |
| Einstellungen | `/dashboard/settings` | Primary Nav (nicht inline-only) |
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
- `design-preview` Inhalt (bleibt Mock)
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

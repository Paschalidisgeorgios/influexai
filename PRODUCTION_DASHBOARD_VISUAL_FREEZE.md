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

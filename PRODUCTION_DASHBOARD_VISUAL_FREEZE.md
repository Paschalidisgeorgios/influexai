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

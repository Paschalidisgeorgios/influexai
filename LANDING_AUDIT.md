# Landingpage Audit — Phase 4A

> Stand: nach Dashboard-/Studio-Verbesserungen (Phase 2A). Kein Umbau in 4A — nur Bestandsaufnahme und Risiken für Phase 4B+.

**Entry:** `src/app/page.tsx` → `LandingPageV2`  
**Styles:** `src/styles/landing-glass.css`, `pricing-glass.css`, `canvas.css` (Hero)  
**Copy-Quellen:** `src/lib/landing-copy-2026.ts`, `next-intl` keys unter `landingPage.*`

---

## Aktive Sektionen (LandingPageV2)

| # | Komponente | ID / Anker | Kurzbeschreibung |
|---|------------|------------|------------------|
| 1 | `LandingNavV2` | — | Fixed Nav, Links zu Sektionen / Auth |
| 2 | `HeroSection` | — | Kinetic Headline, **live Concierge** (`/api/generate/concierge`), Turnstile |
| 3 | `SentientInterface2026` | — | Bento-Features, `HeroPreview` Mock-HUD, `LandingLiveDemoPlayground` |
| 4 | `LandingUseCasesSection` | — | 3 Use-Case-Cards mit Demo-Videos |
| 5 | `LandingMediaSection` | — | Auto-Rotating Media-Carousel (4 Items) |
| 6 | `LandingCampaignPackSection` | `campaign-pack` | Campaign-Pack Output-Grid (6 Outputs) |
| 7 | `LandingAgentAutopilotSection` | — | Scriptierte Typewriter-Antwort + Feature-Bullets |
| 8 | `PricingSection` | `pricing` | `PricingPlans` + FAQ (in Glass-Wrapper) |
| 9 | `LandingFooter` | — | Footer, Language Switcher, Powered-by |

**Hintergrund:** `LandingSectionGlowBackground` + `useSectionGlow` — section-basierte Neon-Glows.

---

## Verwaiste / nicht gemountete Komponenten

Noch im Repo (`src/components/landing/`), aber **nicht** in `LandingPageV2`:

| Komponente | Problem |
|------------|---------|
| `LandingBentoToolsSection` | Alte Tool-Grid-Story |
| `LandingToolsGridSection` | Tool-Liste |
| `StackedDemoSection` | Multi-Step Fake-Demo |
| `InteractiveDemo` | „KI-Avatar Preview“, Content-Mockup |
| `AgentPreviewDemo` | Großes Agent-Mock-UI |
| `LandingHeroV2`, `LandingPageV1` (falls vorhanden) | Legacy Hero |
| `LandingProofSection`, `LandingValueSection`, `LandingShowcaseSection` | Ältere Marketing-Sektionen |
| `LandingFeatureExplorerSection` | Tab-Preview-Explorer |
| `HowItWorksSection`, `TrustBarSection` | In `Sections.tsx`, nicht in V2 Page |

→ Bei Umbau: entweder löschen oder bewusst re-integrieren — nicht still importieren.

---

## Was wirkt alt / nicht Studio-DNA

| Bereich | Befund |
|---------|--------|
| **Visuell** | `landing-neon` + Cyan/Violet-Glows (`landing-glass.css`, `LANDING_NEON`) statt Ivory-Glass-Stage |
| **Akzent** | `#ccff00` / Multi-Color-Neon vs. Studio `#B4FF00` Lime-Regel |
| **Hero HUD** | `SentientInterface2026` → `HeroPreview`: `APP_STUDIO`, `FPS: 60`, `NODES: 12` — Sci-Fi-Baukasten |
| **Tool-Chips** | `Claude Script`, `B-Roll Match`, `Seedance`, `Viral Score` — Provider-Toolliste |
| **Bento Cards** | 4 Säulen inkl. Avatar Studio, Viral-Predictor — teils Non-MVP |
| **Card-in-Card** | Glass-Nodes, verschachtelte Mockups in Hero/Bento/Agent |
| **Motion** | Framer + CSS drift animations — noch kein GSAP/Lenis; teils busy |
| **Background** | `#050505` statt DNA `#050506` (minor, aber inkonsistent zu `tokens.ts`) |

---

## Copy — zu generisch / falsch positioniert

| Quelle | Text / Muster | Issue |
|--------|---------------|-------|
| `LANDING_HERO_2026.kicker` | „App Studio · KI-Creator-Plattform 2026“ | Generisches SaaS + Jahr-Stamp |
| `headlineRotating` | KI-Avatare, KI-Visuals, … | Tool-Katalog-Rotation statt Production System |
| `LANDING_STUDIO_SECTION_2026` | „Claude Script Engine online“, „Viral-Predictor synchronisiert“ | Fake-Status / unbelegte Systeme |
| `viral-predictor` Card | „2026-Datenbank“, Viral-Score, Thumbnail-CTR | Potentiell **Fake-Claim** wenn nicht produktiv |
| `seedance-kling` Card | Seedance 2.0 & Kling als Hero-Feature | Provider-Marketing |
| `infinite-canvas` Card | „Laser-Edges“, „Claude-Premium-Skripten“ | Buzzword-lastig |
| Agent Section | Scriptierte 8-Zeilen-Antwort | **Fake-Demo** (kein echter Agent-Call) |
| `LandingLiveDemoPlayground` | Interaktive UI ohne echte Pipeline | Preview/Mock — klar kennzeichnen oder ersetzen |

**Positiv:** Hero-Concierge ist **echt** (API + Turnstile) — behalten, visuell in DNA einbetten.

---

## Assets

### Videos (aktiv genutzt)

| Asset | Quelle | Verwendung |
|-------|--------|------------|
| `ki-avatar.mp4` | Vercel Blob | Use Cases, Bento Avatar, Media |
| `ki-influencer.mp4` | Vercel Blob | Use Cases, Media |
| `lora-training.mp4` | Vercel Blob | Use Cases, Media |
| `seedance-2-0.mp4` | Vercel Blob | Bento, Media |
| `hero-creator-studio.mp4` | Vercel Blob | Definiert, Hero-Nutzung prüfen bei Umbau |

Definiert in: `src/lib/landing-video-urls.ts` → `landing-demo-videos.ts`

### Videos (lokal, git)

| Pfad | Status |
|------|--------|
| `public/videos/studio/studio-loop.webm` / `.mp4` | Studio-Loop + Poster — **Dashboard/Studio**, nicht Landing V2 |
| `public/videos/landing/` | Nur `.gitkeep` — **keine lokalen Landing-Videos** |

### Bilder (lokal)

| Pfad | Notiz |
|------|-------|
| `public/images/landing/hero.jpg`, `hero-2.jpg`, `hero-3.jpg`, `hero-poster.jpg` | Hero-Backgrounds |
| `public/images/landing/feature-1.png` … `feature-3.png` | Feature-Illustrationen (Legacy-Sektionen?) |
| `public/images/hero.jpg`, `hero-2.jpg`, `hero-3.jpg` | Root-Duplikate |
| `public/avatars/avatar-*.jpg/png` | Testimonials / Demos |

---

## Links zu Non-MVP / Legacy Dashboards

`landing-media.ts` verlinkt auf Routen, die im MVP-Hub **inaktiv** sind:

- `/dashboard/ki-influencer`
- `/dashboard/lora-training`
- `/dashboard/avatar-studio`
- `/dashboard/szenen-generator`

→ Landing verspricht mehr als der aktuelle Studio-Hub liefert. Umbau: nur MVP-Pfade (`image-gen`, `img-to-video`, `text-to-video`, `viral-hook`, `content-calendar`, Agent).

---

## Motion-Bestand

| Technik | Wo |
|---------|-----|
| `framer-motion` | `HeroSection`, `HeroKineticHeadline`, `LandingMediaSection`, `LandingLiveDemoPlayground`, … |
| `SpringReveal` | Campaign, Agent, Pricing, Use Cases |
| CSS `@keyframes` | `landing-glass.css` (glow drift) |
| `gsap` / `lenis` | **Installiert, 0 Imports in `src/`** |

---

## Größte Chancen (Phase 4B+)

1. **Eine Ivory-Glass-Hero-Stage** — Studio-Loop oder Blob-Hero, keine HUD-Mockup
2. **3 Produktionspfade** statt 4+ Tool-Säulen — Alignment mit `ProductionToolsOverview`
3. **Echter Agent + echter Concierge** als einzige „live“ Demos; Rest statisch/cinematic
4. **GSAP Scroll-Reveals** — Neon-Glow durch Lime-sparsame Motion ersetzen
5. **Lenis** nur auf `landing-root` — cinematic scroll ohne Dashboard-Risiko
6. **Media-Sektion** auf MVP-Tools und echte Outputs trimmen
7. **Pricing** — bereits `PricingPlans` / echte Preise; visuell an Ivory-Glass anpassen

---

## Risiken

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| Fake-Claims (Viral-Predictor, 2026-DB) | Trust / Legal | Copy entfernen oder durch echte Features ersetzen |
| Non-MVP Deep-Links | Frustration nach Signup | Links auf Hub / MVP-Tools |
| Framer + GSAP Doppelung | Performance, Jank | Pro Sektion eine Engine |
| Lenis + Concierge-Form | UX / Focus | Lenis außerhalb Form oder `prevent` on focus |
| Blob-Video-Ausfall | Leere Sektionen | Poster-Fallback lokal |
| 57 Landing-Dateien | Wartungslast | Toten Code löschen nach Umbau |
| `design-preview` | Scope-Creep | Nicht in Landing-Phase anfassen |
| i18n-Keys | Viele Strings in JSON | Copy-Update parallel DE/EN |

---

## Empfohlene Umbau-Reihenfolge (4B+, nicht 4A)

1. Shell + Nav (Dark `#050506`, Ivory-Glass Nav)
2. Hero (DNA-Typo, GSAP reveal, Concierge behalten)
3. Production Paths (ersetzt Bento Tool-Liste)
4. Media / Use Cases (MVP-only)
5. Agent (echt oder klar als „Beispiel“)
6. Campaign Pack (vereinfachen)
7. Pricing + Footer (Glass → Ivory)
8. Legacy-Komponenten entfernen

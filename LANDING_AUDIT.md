# Landingpage Audit & Architecture Plan — Phase 4A

> Stand: nach Dashboard-/Tool-/Agent-Push. **Kein Umbau in 4A** — Audit, Foundation, Ersetzungsplan.

**Entry:** `src/app/page.tsx` → `LandingPageV2`  
**Styles:** `landing-glass.css`, `pricing-glass.css`, `canvas.css`  
**Copy:** `landing-copy-2026.ts`, `next-intl` → `landingPage.*`  
**Studio-IA (Referenz):** `PRODUCTION_PATHS`, `ACTIVE_STUDIO_TOOLS` in `production-tool-routes.ts`

---

## 1. Aktuelle Landingpage-Struktur

| # | Komponente | Anker | Status |
|---|------------|-------|--------|
| 1 | `LandingNavV2` | — | **Ersetzen** — Neon-Shell, alte Nav-Links |
| 2 | `HeroSection` | — | **Ersetzen** — rotating Tool-Headlines, Concierge behalten (echt) |
| 3 | `SentientInterface2026` | — | **Löschen** — Bento, Fake-HUD, Provider-Chips |
| 4 | `LandingUseCasesSection` | — | **Ersetzen** — Non-MVP-Story, Blob-Videos |
| 5 | `LandingMediaSection` | — | **Ersetzen** — Links zu inaktiven Dashboards |
| 6 | `LandingCampaignPackSection` | `campaign-pack` | **Ersetzen** — alte Neon-Optik |
| 7 | `LandingAgentAutopilotSection` | — | **Löschen** — Fake Typewriter-Demo |
| 8 | `PricingSection` | `pricing` | **Behalten (Logik)** — UI an Ivory-Glass |
| 9 | `LandingFooter` | — | **Anpassen** — DNA-Shell |
| — | `LandingSectionGlowBackground` | — | **Löschen** — Neon-Glow-System |

---

## 2. Alte Landing-Komponenten (57 Dateien)

### Aktiv gemountet → vollständig ersetzen

`LandingPageV2.tsx`, `LandingNavV2`, `HeroSection`, `HeroKineticHeadline`, `HeroSection` deps (`LandingHeroBackground`, `canvas.css`), `SentientInterface2026`, `LandingLiveDemoPlayground`, `LandingUseCasesSection`, `LandingMediaSection`, `LandingCampaignPackSection`, `LandingAgentAutopilotSection`, `LandingSectionGlowBackground`, `useSectionGlow` coupling.

### Verwaist / Legacy — **nicht mehr importieren**, in 4B löschen

| Komponente | Grund |
|------------|-------|
| `LandingBentoToolsSection` | Tool-Liste |
| `LandingToolsGridSection` | Tool-Grid |
| `StackedDemoSection` | Fake Multi-Step Demo |
| `InteractiveDemo` | Fake Avatar Preview |
| `AgentPreviewDemo` | Fake Agent UI |
| `LandingHeroV2`, `Hero3DScene` | Legacy Hero / 3D |
| `LandingProofSection`, `LandingValueSection`, `LandingShowcaseSection` | Alte Marketing |
| `LandingFeatureExplorerSection` | Tab-Preview-Explorer |
| `LandingBentoShowcase` | Bento Showcase |
| `LandingStudioToolsSection` | Tool-Liste |
| `CampaignAutopilotSection`, `LandingCampaignHero`, `LandingCampaignMockup` | Alte Campaign-Story |
| `QualityIntelligenceSection`, `founding-creators-section` | Generische Social Proof |
| `AiContentStream`, `GridReveal`, `world-transition` | Alte Motion-Experimente |
| `LandingNeonAmbient`, `scroll-theme-provider` | Neon-Ambient |
| `LandingNav` (V1) | Legacy Nav |
| `HowItWorksSection`, `TrustBarSection`, `TickerStrip` | In `Sections.tsx`, nicht V2 |
| `AdSpot`, `AdSpotLazy`, `SmartCapsule` | Legacy Ads |
| `creator-brand-tabs-section`, `LandingAudienceSection` | Alte Zielgruppen-Tabs |
| `HeroWorkspaceDemo`, `HeroImageCarousel`, `HeroTitle` | Legacy Hero-Teile |
| `features/*` (MegaMenu etc.) | Altes Features-Menü |

### **Verbotene Re-Imports nach 4B**

Keine dieser Dateien darf in der neuen `LandingPage` (V3) wieder eingebunden werden, ohne vollständigen Rewrite unter DNA:

`SentientInterface2026`, `LandingAgentAutopilotSection`, `LandingBentoToolsSection`, `LandingToolsGridSection`, `StackedDemoSection`, `InteractiveDemo`, `AgentPreviewDemo`, `LandingLiveDemoPlayground`, `LandingSectionGlowBackground`, `landing-neon-theme` als primäres Styling.

---

## 3. Alte Copy & schwache Claims

| Quelle | Problem |
|--------|---------|
| `LANDING_HERO_2026.kicker` | „App Studio · KI-Creator-Plattform 2026“ — generisch |
| `headlineRotating` | KI-Avatare, KI-Visuals — Tool-Katalog |
| `LANDING_STUDIO_SECTION_2026.statusMessages` | „Claude Script Engine online“ — Fake-Status |
| `viral-predictor` Card | „2026-Datenbank“, Viral-Score — **riskant/falsch** wenn nicht live |
| `seedance-kling` Card | Provider-Marketing |
| `infinite-canvas` Card | „Laser-Edges“, Buzzwords |
| Agent Section | Scriptierte Antwort — **Fake-Demo** |
| `LandingLiveDemoPlayground` | Interaktiv ohne echte Pipeline |
| `landing-media.ts` | Titel/Links: KI Influencer, LoRA, Avatar Studio — Non-MVP |

**Behalten (echt):** Hero-Concierge (`/api/generate/concierge` + Turnstile) — optional in neuem Hero als Secondary, nicht als Hauptstory.

---

## 4. Vorhandene Assets

### `public/videos/landing/`

| Datei | Status |
|-------|--------|
| `.gitkeep` only | **Keine Landing-Videos lokal** |

### `public/videos/studio/` (Dashboard — nicht Landing)

| Datei | Größe-Nutzung |
|-------|---------------|
| `studio-loop.webm` / `.mp4` | Studio-Loop |
| `studio-poster.webp` | Poster |

### `public/images/landing/` (Legacy)

| Datei | Status |
|-------|--------|
| `hero.jpg`, `hero-2.jpg`, `hero-3.jpg` | JPG — alt, nicht DNA |
| `hero-poster.jpg` | JPG — ersetzen durch `.webp` |
| `feature-1.png` … `feature-3.png` | Legacy Feature-Illustrationen |

### Extern (Vercel Blob — `landing-video-urls.ts`)

`ki-avatar.mp4`, `ki-influencer.mp4`, `lora-training.mp4`, `seedance-2-0.mp4`, `hero-creator-studio.mp4` — teils Non-MVP-Story; in 4B nur noch neutral oder MVP-aligned nutzen.

---

## 5. Fehlende Assets (für 4B+)

### Videos

| Pfad | Zielgröße |
|------|-----------|
| `public/videos/landing/hero-loop.webm` | 3–8 MB |
| `public/videos/landing/hero-loop.mp4` | 5–12 MB |
| `public/videos/landing/output-video-loop-01.webm` | 3–8 MB |
| `public/videos/landing/output-video-loop-01.mp4` | 5–12 MB |

### Images

| Pfad | Zielgröße |
|------|-----------|
| `public/images/landing/hero-poster.webp` | 100–400 KB |
| `public/images/landing/product-studio.webp` | 200–700 KB (Studio Cockpit) |
| `public/images/landing/product-tools.webp` | 200–700 KB (Tools Hub) |
| `public/images/landing/product-agent.webp` | 200–700 KB (Agent Briefing) |
| `public/images/landing/product-gallery.webp` | 200–700 KB (Galerie) |
| `public/images/landing/output-image-01.webp` | 200–700 KB |
| `public/images/landing/output-video-poster-01.webp` | 100–400 KB |

**Hinweis:** Assets in 4A **nicht erfinden** — nur Bedarf dokumentieren. Screenshots aus echtem Studio exportieren.

---

## 6. Risiken beim Umbau

| Risiko | Mitigation |
|--------|------------|
| Fake-Claims / Fake-Demos | Nur echte Features + neutrale Beispiele |
| Non-MVP Deep-Links | Nur `PRODUCTION_PATHS` + `ACTIVE_STUDIO_TOOLS` |
| Framer + GSAP Doppelung | Pro Sektion eine Engine |
| Lenis + Formulare/Concierge | Lenis nur außerhalb Forms; `prevent` on focus |
| Fehlende lokale Assets | Poster-Fallback bis Export |
| i18n | Copy parallel DE/EN |
| `design-preview` | Nicht anfassen |
| SEO / `generateMetadata` | Headlines in SEO anpassen, nicht nur UI |
| 57 Legacy-Dateien | Nach V3-Launch löschen, nicht parallel pflegen |
| Pricing | `PricingPlans` unverändert — nur Shell-Styling |

---

## 7. Neue Landingpage-Architektur (Ziel V3)

Ersetzt `LandingPageV2` vollständig — **kein Überkleben**.

### 7.1 Hero

**Headline:**  
„Das Creator Production System für Kampagnen, Visuals und Motion.“

**Subline:**  
„Plane Hooks, erstelle Bilder und verwandle Ideen in kampagnenfähige Assets — in einem Studio statt in zehn einzelnen Tools.“

| CTA | Ziel |
|-----|------|
| Primary: „Studio starten“ | `/auth/sign-up` oder `/dashboard` |
| Secondary: „Preise ansehen“ | `#pricing` oder `/pricing` |

**Visual:** `hero-loop` Video + `hero-poster.webp` auf Dark Shell; GSAP Reveal.  
**Optional Secondary:** Concierge (echte API) — nicht als Fake-HUD.

**Ersetzt:** `HeroSection`, `HeroKineticHeadline`, `LANDING_HERO_2026` rotating headlines.

---

### 7.2 Scroll Story — „Vom Briefing zum Asset“

Pinned/scrubbed GSAP-Sequenz (Lenis-sync):

1. **Briefing** — Hook / Agent-Idee (Text + Lime-Status)
2. **Produktionspfad** — Pfad wählen
3. **Bild** — Image-Gen Output (`output-image-01.webp`)
4. **Motion** — Video-Loop (`output-video-loop-01`)
5. **Galerie** — Asset-Übersicht

**Ersetzt:** `SentientInterface2026`, `LandingCampaignPackSection`, `LandingMediaSection` (als separate Neon-Blöcke).

---

### 7.3 Production Paths

Aligned mit `PRODUCTION_PATHS`:

| Pfad | Studio-Label | Primary Tool |
|------|--------------|--------------|
| Bild erstellen | Bildgenerator | `image-gen` |
| Video erstellen | Bild/Text zu Video | `img-to-video`, `text-to-video` |
| Kampagne planen | Hook + Kalender | `viral-hook`, `content-calendar` |

3 große Ivory-Glass-Cards — keine Tool-Liste, keine Provider-Namen.

**Ersetzt:** `LandingUseCasesSection`, `LandingBentoToolsSection`, Bento in `SentientInterface2026`.

---

### 7.4 Studio Preview

4 Produkt-Screens (statisch oder leichtes Video) — **echte UI**, keine Mock-HUD:

| Screen | Asset | Quelle |
|--------|-------|--------|
| Studio Cockpit | `product-studio.webp` | Studio Home |
| Tools Hub | `product-tools.webp` | `ProductionToolsOverview` |
| Agent Briefing | `product-agent.webp` | `AgentAutopilotV2` |
| Galerie | `product-gallery.webp` | Gallery |

**Ersetzt:** `HeroPreview`, `LandingLiveDemoPlayground`, `LandingAgentAutopilotSection`.

---

### 7.5 Proof / Outputs

- Nur **echte oder neutral deklarierte** Beispiele („Beispiel-Output“)
- Keine Fake-Demos, keine scriptierten Agent-Antworten
- Optional: 1–2 Output-Assets (`output-image-01`, Video-Poster)
- Kein Viral-Predictor, keine „2026-Datenbank“

**Ersetzt:** `LandingProofSection` (falls reaktiviert), Fake Agent Section.

---

### 7.6 Pricing / Credits

- Bestehende `PricingSection` + `PricingPlans` — **keine Preiswerte erfinden**
- Visuell: Ivory-Glass-Stage statt `pricing-glass` Neon
- Klare Verbindung zu `/pricing`
- FAQ aus `LANDING_FAQ_ITEMS` behalten

---

### 7.7 Final CTA

**Copy:** „Starte dein Creator Studio.“  
**CTA:** „Studio starten“  
Dark Shell + Lime-Button — minimal, kein Glow-Overload.

---

## 8. Geplante Dateistruktur (4B+)

```
src/components/landing/
  LandingPage.tsx          # neu — ersetzt LandingPageV2
  LandingShell.tsx         # Dark shell + Lenis provider
  sections/
    LandingHero.tsx
    LandingScrollStory.tsx
    LandingProductionPaths.tsx
    LandingStudioPreview.tsx
    LandingProof.tsx
    LandingFinalCta.tsx
  LandingNav.tsx           # neu — DNA Nav
  LandingFooter.tsx        # aus Sections.tsx extrahieren
  pricing/                 # PricingSection wrapper (Styling only)
src/hooks/
  useLandingMotion.ts      # GSAP + reduced motion
src/styles/
  landing-dna.css          # ersetzt landing-glass neon
```

`src/app/page.tsx` → import `LandingPage` statt `LandingPageV2`.

---

## 9. Umbau-Reihenfolge (4B+)

1. `landing-dna.css` + Shell + Nav + Lenis/GSAP hooks
2. Hero (Copy + Assets)
3. Scroll Story (GSAP ScrollTrigger)
4. Production Paths
5. Studio Preview (Screenshots exportieren)
6. Proof (neutral)
7. Pricing shell (Logik unverändert)
8. Final CTA + Footer
9. `LandingPageV2` + Legacy-Ordner löschen
10. i18n + SEO metadata

---

## 10. Phase 4A Abgrenzung

**In 4A erledigt:** Libraries, DNA, Motion-System, Audit, Architekturplan, Legacy-Markierung.  
**Nicht in 4A:** Landing bauen, 3D-Scroll vollständig, Assets erfinden, Preise ändern, Dashboard ändern.

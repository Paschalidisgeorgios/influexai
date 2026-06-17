# InfluexAI — Motion System

> Phase 4A foundation. GSAP + Lenis für Landing/Public only. Dashboard bleibt nativ und schnell.

---

## Grundprinzip

| Surface | Motion |
|---------|--------|
| **Landing / Public** | Cinematic — ScrollTrigger, Lenis, Media-Reveals, Pinning |
| **Dashboard / Studio** | Minimal — keine Lenis, kein GSAP auf Tool-Formularen |

Motion ist **subtil, hochwertig, performant** — jede Bewegung muss eine **Verkaufsfunktion** haben (Fokus, Reihenfolge, Produktverständnis). Keine Effekte um der Effekte willen.

---

## Motion-Story (Landing)

Narrative Scroll-Sequenz — aligned mit Produkt-IA:

```
Briefing → Produktionspfad → Bild → Motion → Galerie
```

| Station | Inhalt | Motion |
|---------|--------|--------|
| Briefing | Agent / Hook-Idee | Text-Reveal, Lime-Statuspunkt |
| Produktionspfad | 3 Pfade wählen | Pin + Scrub oder staggered Cards |
| Bild | Image-Gen Output | Media-Reveal, Parallax |
| Motion | Video-Output | Video-Loop scrub oder fade-in |
| Galerie | Asset-Übersicht | Horizontal scroll oder final reveal |

Referenz-Niveau: Montfort-Qualität (Scroll-Dramaturgie, 3D-Tiefe) — **ohne** fremde Assets oder Layout zu kopieren.

---

## Libraries

| Package | Version | Scope |
|---------|---------|-------|
| `gsap` | 3.15.x | Landing only |
| `lenis` | 1.3.x | Landing / Public only |

**Nicht:** `@studio-freight/lenis` (deprecated).  
**Keine weiteren Motion-Libraries** ohne explizite Entscheidung.

**Legacy (bis Migration):** `framer-motion`, `SpringReveal`, CSS-Keyframes in `landing-glass.css` — pro Sektion **eine** Engine, nicht doppeln.

---

## GSAP + ScrollTrigger

**Nur** `src/app/page.tsx` und neue `src/components/landing/*` (Post-4B):

| Pattern | Einsatz |
|---------|---------|
| **Reveal** | Headline, Subline, CTA stagger (`once: true`) |
| **Pinning** | Scroll-Story — Stationen nacheinander fixieren |
| **Scrub** | Progress an Scroll koppeln (dezent, max. 1 pinned Block mobile) |
| **Media-Reveal** | Poster → Video, Produkt-Screen einblenden |
| **Parallax** | Hintergrund-Tiefe, 3D-Gefühl — sparsam |

**Nicht in GSAP:** Dashboard, Tool-Setup, Agent-Chat, Formulare, Credit/Billing, `design-preview`.

```ts
// Ziel-Pattern (4B+)
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// gsap.context() + ctx.revert() in useEffect cleanup
```

---

## Lenis

**Nur** Landing-Root und Public-Marketing-Seiten.

```tsx
// Ziel-Pattern (4B+) — Wrapper nur um landing-root
// <LandingLenisProvider>{children}</LandingLenisProvider>
```

**Kein Lenis im Dashboard** — Formulare, nested scroll, Focus und Drag würden leiden.

**Lenis + GSAP:** `lenis.on("scroll", ScrollTrigger.update)` — Standard-Integration in 4B.

---

## Performance & Accessibility

| Regel | Umsetzung |
|-------|-----------|
| **Mobile** | Pinning/Parallax reduzieren oder aus unter `md` |
| **Videos** | `prefers-reduced-motion` → Poster, kein Autoplay |
| **Bundle** | Nur `gsap/ScrollTrigger` importieren |
| **Transforms** | `opacity` + `transform` bevorzugen |
| **Reduced motion** | Kein Lenis, kein Scrub, Endzustand sofort |

```ts
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

Bestehend: `useReducedMotion()` in `LandingMediaSection` — in 4B zentralisieren.

---

## Verkaufsfunktion-Check

Vor jeder Animation fragen: *Hilft das dem Besucher, das Produkt zu verstehen oder zu konvertieren?*

| Erlaubt | Nicht |
|---------|-------|
| Scroll-Story zeigt Workflow | Blinkende KI-Grids |
| CTA-Reveal nach Value Prop | Endlose Glow-Loops |
| Produkt-Screen langsam ein | Fake-HUD mit Fake-Stats |

---

## Migrations-Risiken (4A → 4B)

1. Framer + GSAP auf derselben Sektion → Jank
2. Lenis + fixed `LandingNavV2` → transform-Parent prüfen
3. Hero-Concierge (Turnstile) → Lenis darf Focus nicht verschlucken
4. Blob-Video-Ausfall → lokale Poster-Fallbacks (`public/images/landing/`)
5. SSR → GSAP/Lenis nur client-side

---

## Phase 4A Status

- [x] `gsap` + `lenis` installiert (`package.json` / lockfile)
- [ ] Keine Integration in Komponenten (bewusst)
- [ ] Legacy Framer/CSS aktiv bis section-by-section Ersetzung

# InfluexAI — Motion System

> Phase 4A foundation document. Defines where motion lives, which libraries apply, and performance / accessibility guardrails.

---

## Grundprinzip

| Surface | Charakter |
|---------|-----------|
| **Landing / Public** | Darf cinematic und motional sein — Reveals, Parallax, Hero-Sequenzen |
| **Dashboard / Studio** | Ruhig, schnell, produktiv — keine scroll-jacking, keine schweren Timelines |

Motion soll **subtil, hochwertig und performant** wirken — nie „KI-Startup-Animation“ (blinkende Grids, übertriebene Partikel, endlose Loops).

---

## Libraries (installiert, Phase 4A)

| Package | Version (lock) | Scope |
|---------|----------------|-------|
| `gsap` | 3.15.x | Landing only |
| `lenis` | 1.3.x | Landing / Public only |

**Nicht verwenden:** `@studio-freight/lenis` (deprecated Paketname).

**Bereits im Projekt (Legacy Landing):** `framer-motion`, `SpringReveal`, CSS-Keyframes in `landing-glass.css`. Bei Umbau schrittweise durch GSAP/Lenis-Patterns ersetzen, nicht parallel alles verdoppeln.

**Keine weiteren Motion-Libraries** ohne explizite Entscheidung (kein AOS, Locomotive, Motion One zusätzlich).

---

## GSAP — Einsatz

**Nur Landingpage** (`src/app/page.tsx`, `src/components/landing/*`):

| Use Case | Beispiel |
|----------|----------|
| Hero-Reveals | Headline, Subline, CTA staggered fade-up |
| Section-Reveals | ScrollTrigger: Ivory-Stage einblenden |
| Parallax | Hintergrund-Tiefe, dezentes Media-Offset |
| Media-Reveals | Video-Poster → Play, Showcase-Sequenzen |

**Nicht in GSAP:**

- Dashboard-Layouts, Tool-Setup, Agent-Chat, Formulare
- Credit-Pills, Billing, Auth-Flows
- `design-preview`

**Patterns:**

- `gsap.context()` + Cleanup in `useEffect` return
- `ScrollTrigger` mit `once: true` wo möglich
- `will-change` sparsam; nach Animation entfernen
- Timelines kurz halten (typ. 0.4–0.9 s pro Beat)

---

## Lenis — Einsatz

**Nur** auf Landing und andere **Public**-Seiten (Marketing, Legal falls gewünscht).

```tsx
// Ziel-Pattern (Phase 4B+), noch nicht implementiert in 4A
// Wrapper nur um Landing-Root, nicht um Dashboard-Layout
```

**Kein Smooth-Scroll im Dashboard**, wenn es:

- Formulare, Textareas, Drag-Drop stört
- Nested Scroll-Container (Tool-Panels, Gallery) bricht
- Focus-Management / Keyboard-Navigation verzögert

Dashboard behält natives `overflow` / `scroll-behavior` — optional `scroll-behavior: auto` explizit im Studio-Shell.

---

## Performance

- **Mobile:** Parallax und blur-lastige Effekte reduzieren oder deaktivieren unter `md`
- **Videos:** `prefers-reduced-motion` → Poster/Static Frame statt Autoplay
- **Intersection:** Animationen erst starten wenn Sektion sichtbar (bereits teilweise via `IntersectionObserver` / Framer)
- **Keine Layout-Thrashing:** transform/opacity bevorzugen, keine width/height-Animationen auf großen Flächen
- **Bundle:** GSAP nur mit benötigten Plugins importieren (`gsap/ScrollTrigger` etc.)

---

## `prefers-reduced-motion`

Pflicht für alle neuen Motion-Pfade:

```ts
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

| reduceMotion | Verhalten |
|--------------|-----------|
| `true` | Keine Parallax, keine Lenis, sofortiger Endzustand, Videos pausiert/poster |
| `false` | Volle Landing-Motion gemäß obigen Regeln |

Bestehend: `useReducedMotion()` in `LandingMediaSection` — bei GSAP/Lenis-Integration konsolidieren.

---

## Migrations-Risiken (4A → 4B)

1. **Doppel-Motion:** Framer + GSAP gleichzeitig auf derselben Sektion → Jank
2. **Lenis + fixed Nav:** `LandingNavV2` — `position: fixed` mit transform-Parent prüfen
3. **Hero Concierge:** Live-API-Formular — Scroll-Smooth darf Focus nicht verschlucken
4. **Turnstile / Third-Party:** Lenis-Wrapper darf Captcha-Iframes nicht clipen
5. **SSR:** GSAP/Lenis nur client-side (`"use client"`, dynamic import oder `useEffect`)

---

## Phase 4A Status

- [x] `gsap` + `lenis` in `package.json` / lockfile
- [ ] Noch **keine** Integration in Komponenten (bewusst — Foundation first)
- [ ] Framer-Motion bleibt aktiv bis section-by-section Migration

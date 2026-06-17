# InfluexAI — Design DNA

> Phase 4A foundation. Governs public landing and aligns with Studio (`src/components/dashboard/studio-ui/tokens.ts`). Dashboard stays productive; landing may be cinematic.

---

## Produktpositionierung

**InfluexAI = AI-native Creator Studio / Creator Production System**

Ein kontrolliertes Produktionssystem: Briefing rein, kampagnenfähige Assets raus — in einem Studio, nicht in zehn lose gekoppelten Tools.

### Nicht

- KI-Toolliste („50 Tools in einer App“)
- Generisches SaaS (Hero + 3 Spalten + Pricing-Grid)
- Neon-KI-Baukasten (Glow-Overload, Sci-Fi-HUD, Provider-Stack als Hero-Story)

### Qualitätsreferenzen (Niveau only — nicht kopieren)

| Referenz | Was übernehmen | Was nicht |
|----------|----------------|-----------|
| **Terminal Industries** | AI-native Operating System-Gefühl; große ruhige Aussagen; klare Produktwelt | Layout, Copy, Markenoptik |
| **Montfort** | Hochwertige Scroll-Dramaturgie; 3D-Tiefe; starke UI-Präsenz | Fremde Texte, fremde Assets |

Ziel: Premium wie das neue Studio — eigene InfluexAI-Sprache.

---

## Zwei Oberflächen

| Surface | Charakter |
|---------|-----------|
| **Landing / Public** | Cinematic erlaubt — Scroll-Story, Media-Reveals, 3D-Gefühl, große Typo |
| **Dashboard / Studio** | Ruhig, schnell, produktiv — Ivory-Glass-Stage, keine Scroll-Jacking-Dramaturgie |

---

## Stilrichtung

| Prinzip | Umsetzung |
|--------|-----------|
| **Dark Shell** | `#050506` als äußere Bühne |
| **Warm Ivory / Glass** | Produktflächen als warme, leicht transluzente Stages |
| **Typografie** | Starke Headlines; kurze Subline; verkauft, erklärt nicht |
| **Whitespace** | Premium — Sektionen atmen |
| **Lime-Akzente** | Nur als Signal — nie Deko-Fläche |
| **Scroll-Dramaturgie** | Landing only — „Vom Briefing zum Asset“ als visuelle Erzählung |

---

## Farbpalette

| Token | Wert | Verwendung |
|-------|------|------------|
| Dark Shell | `#050506` | Seitenhintergrund |
| Obsidian Panel | `#0B0B0D` | Tiefe Panels, Nav-Shell |
| Warm Ivory | `#FAF6EE` | Primäre helle Flächen |
| Glass Ivory | `rgba(250, 246, 238, 0.82)` | Glass-Stages + Backdrop-Blur |
| Soft Stone | `#D8D1C5` | Sekundärflächen, Trennlinien |
| Muted Stone | `#A9A196` | Labels, Meta |
| Text Dark | `#080808` | Body auf Ivory |
| Text Muted | `rgba(8, 8, 8, 0.58)` | Subcopy auf Ivory |
| Text Light | `#F7F3EA` | Headlines auf Dark Shell |
| Accent Lime | `#B4FF00` | CTA, aktive Zustände |
| Lime Soft | `rgba(180, 255, 0, 0.18)` | Hover, dezente Highlights |
| Warning Amber | `#F5A524` | Warnungen |
| Danger Soft | `#EF4444` | Fehler, destruktiv |

**Legacy bereinigen:** `#ccff00`, `#050505`, Cyan/Violet-Neon (`landing-neon-theme`) → DNA-Tokens.

---

## Lime-Regel

Lime (`#B4FF00`) **nur** als Signal:

- Primäre CTAs („Studio starten“)
- Statuspunkte (online, aktiv, Schritt X)
- Aktive Zustände (Nav, Tab, Progress)
- Micro-Highlights (1–2 Wörter max.)

**Verboten:** zufällige grüne Linien, Section-Glows, Card-Ränder, Provider-Badges, Hintergrund-Gradients.

---

## Typografie & Copy

- **Weniger All-Caps** — kein HUD (`APP_STUDIO`, `FPS: 60`, `NODES: 12`)
- **Starke Headlines** — eine klare Aussage, max. 2 Zeilen
- **Kurze Subline** — ein Satz Nutzen, kein Feature-Essay
- **Keine langen KI-Erklärtexte** — verkaufen, nicht technisch erklären
- **Keine Fake-Claims** — nur MVP-taugliche, belegbare Capabilities
- **Kein KI-Schrott** — keine Buzzword-Wände („Laser-Edges“, „2026-Datenbank“)

| Vermeiden | Stattdessen |
|-----------|-------------|
| „KI macht alles“ | „Produktion kontrollieren“ |
| Provider-Stack als Story | Workflow und Output |
| Tool-Listen (10+) | 3 Produktionspfade |
| „KI-Creator-Plattform 2026“ | Creator Production System |

---

## UI-Regel

- Wenige große Flächen — eine Ivory-Glass-Stage pro Sektion
- **Keine Card-in-Card** — flache Produkt-Screens, keine verschachtelten Mock-HUDs
- **Keine zufälligen Borders** — nur strukturelle Ränder
- **Kein Neon-Glow-Overload** — `landing-glass-glow--*` reduzieren

Studio-Referenz: `STUDIO_RADIUS`, `STUDIO_SHADOW`, `STUDIO_SURFACE_GLASS` in `tokens.ts`.

---

## Scope (Phase 4A)

- DNA + Plan festlegen; **kein** vollständiger Landing-Umbau in 4A.
- **Nicht ändern:** Dashboard-, Tool-, Credit-, Billing-, Auth-, Provider-Logik; `design-preview`.
- Preise nur aus `PricingPlans` / `getStarterPriceParams` — nichts erfinden.

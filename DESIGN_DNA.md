# InfluexAI — Design DNA

> Phase 4A foundation document. Governs the public landing experience and aligns it with the Studio product shell. Dashboard internals follow `src/components/dashboard/studio-ui/tokens.ts`; this document is the cross-surface source of truth for positioning, palette, and rules.

---

## Produktpositionierung

**InfluexAI = AI-native Creator Studio / Creator Production System**

Ein kontrolliertes Produktionssystem für Creator und Marken: Briefing rein, Assets und Kampagnen raus — mit klaren Workflows, nicht mit einer lose gekoppelten Tool-Sammlung.

### Nicht

- KI-Toolliste („50 Tools in einer App“)
- Generisches SaaS-Template (Hero + 3 Spalten + Pricing-Grid)
- Neon-KI-Baukasten (überladene Glows, Sci-Fi-HUD, Provider-Name-Dropping als Hauptstory)

### Qualitätsreferenzen (nur Niveau, nicht kopieren)

- **Terminal Industries** — cinematic restraint, große Flächen, präzise Typografie
- **Mont-Fort** — warme Materialität, ruhige Premium-Whitespace, kontrollierte Akzente

Ziel: dieselbe Wahrnehmung von Qualität und Intent wie das neue Studio — nicht deren Layout oder Markenwelt übernehmen.

---

## Stilrichtung

| Prinzip | Umsetzung |
|--------|-----------|
| **Dark Shell** | Tiefer, fast schwarzer Hintergrund als Bühne |
| **Warme Ivory / Glass** | Produktflächen als warme, leicht transluzente Stages |
| **Typografie** | Große, ruhige Headlines; kurze Subline; wenig Shouting |
| **Whitespace** | Großzügig — Sektionen atmen, keine dichte Card-Wand |
| **Lime-Akzente** | Sparsam, gezielt — nie als Vollflächen-Deko |

---

## Farbpalette

| Token | Wert | Verwendung |
|-------|------|------------|
| Dark Shell | `#050506` | Seitenhintergrund, äußere Bühne |
| Obsidian Panel | `#0B0B0D` | Tiefe Panels, Nav-Shell |
| Warm Ivory | `#FAF6EE` | Primäre helle Flächen (Studio-Stage) |
| Glass Ivory | `rgba(250, 246, 238, 0.82)` | Glass-Stages mit Backdrop-Blur |
| Soft Stone | `#D8D1C5` | Sekundäre Flächen, Trennlinien |
| Muted Stone | `#A9A196` | Dezente Labels, Meta |
| Text Dark | `#080808` | Body auf Ivory |
| Text Muted | `rgba(8, 8, 8, 0.58)` | Subcopy auf Ivory |
| Text Light | `#F7F3EA` | Headlines auf Dark Shell |
| Accent Lime | `#B4FF00` | CTA, aktive Zustände |
| Lime Soft | `rgba(180, 255, 0, 0.18)` | Hover-Glow, dezente Highlights |
| Warning Amber | `#F5A524` | Warnungen, Aufmerksamkeit |
| Danger Soft | `#EF4444` | Fehler, destruktive Aktionen |

**Abweichungen bereinigen:** Landing nutzt teils `#ccff00`, `#050505`, Cyan/Violet-Neon (`landing-neon-theme`) — bei Umbau auf obige Tokens vereinheitlichen.

---

## Lime-Regel

Lime (`#B4FF00`) **nur** für:

- Primäre CTAs („Studio starten“, Checkout)
- Aktive / fokussierte Zustände (Nav, Tab, Progress)
- Statuspunkte und kleine Highlights (1–2 Wörter in Copy)

**Nicht** für: Section-Glows, Card-Ränder, Hintergrund-Gradients, Provider-Badges, dekorative Grids.

---

## Typografie-Regel

- **Weniger All-Caps** — keine HUD-Stats (`APP_STUDIO`, `FPS: 60`, `NODES: 12`)
- **Starke Headlines** — eine klare Aussage pro Sektion, max. 2 Zeilen
- **Kurze Subline** — ein Satz Kontext, kein Feature-Essay
- **Keine langen KI-Erklärtexte** — Produktionssprache statt Modell-Marketing

Schrift: bestehende Landing-Fonts beibehalten bis Umbau; Hierarchie über Größe und Weight, nicht über Neon-Farben.

---

## UI-Regel

- **Wenige große Flächen** — eine Ivory-Glass-Stage pro Sektion statt vieler kleiner Cards
- **Keine Card-in-Card-Struktur** — Mockups und Demos flach in der Stage, nicht verschachtelt
- **Keine zufälligen Borders** — Ränder nur wo sie Struktur geben (Stage-Rand, Input); keine dekorativen Neon-Rahmen
- **Kein Neon-Glow-Overload** — `landing-glass-glow--violet/cyan` auf das Nötige reduzieren

Studio-Referenz: `STUDIO_RADIUS`, `STUDIO_SHADOW`, `STUDIO_SURFACE_GLASS` in `tokens.ts`.

---

## Copy-Regel

| Vermeiden | Stattdessen |
|-----------|-------------|
| „KI macht alles“ | „Produktion kontrollieren“ |
| Provider-Stack als Hero-Story | Workflow und Output |
| Unbelegte Metriken („2026-Datenbank“, „Viral-Score“) | Echte, MVP-taugliche Capabilities |
| Tool-Listen mit 10+ Einträgen | 3 Produktionspfade + aktive Studio-Tools |
| „App Studio · KI-Creator-Plattform 2026“ | Creator Studio / Production System |

Ton: souverän, produktiv, ehrlich — wie das Dashboard nach Phase 2A.

---

## Scope (Phase 4A)

- Dieses Dokument legt DNA fest; **kein** vollständiger Landing-Umbau in 4A.
- **Nicht ändern:** Dashboard-, Tool-, Credit-, Billing-, Auth-Logik; Provider-Calls; `design-preview`.
- Preise nur aus bestehenden Pricing-Komponenten / `getStarterPriceParams` — nichts erfinden.

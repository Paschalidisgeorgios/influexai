/**
 * Kompakte Studio-Wissensbasis für den KI-Agent-Chat (Studio-Guide).
 * Quelle: Canvas-Sidebar (toolApiSchema.ts TOOL_CATEGORIES + TOOL_API_SCHEMA).
 */
export const STUDIO_KNOWLEDGE = `
## InfluexAI Studio — Sidebar-Tools

### ERSTELLEN
- **Viral Hook** (/dashboard/viral-hook) — Scroll-stoppende Hooks für Short-Form. ~3 Credits.
- **Content Kalender** (/dashboard/content-kalender) — Content-Plan mit Themen & Formaten. 2 Credits (direkt) / 3 Credits via KI-Agent (1 Basis + 2 Tool).
- **Trend Script** (/dashboard/trend-to-script) — Trend-Thema → Sprecher-Skript mit B-Roll-Regie. ~4 Credits.
- **Script Generator** (/dashboard/script-generator) — Video-Skript mit Hook, Body, CTA. ~2 Credits.
- **Produkt-Werbung** (/dashboard/produkt) — Werbetexte und Spot-Texte aus Produkt-USPs.

### VISUALS
- **Bild Generator** (/dashboard/image-generator) — Social-Media-Bilder mit Stil-Vorlagen. Ab ~5 Credits.
- **KI-Ich** (/dashboard/ki-ich) — Trainierter Avatar-Klon in neuen Szenen. ~8 Credits.
- **LoRA Training** (/dashboard/lora-training) — Wiedererkennbaren Look für die Marke trainieren. Ab ~10 Credits.

### VIDEO & FILM
- **Video Generator** (/dashboard/seedance) — Bild-zu-Video (Seedance, Kling u.a. via Modellauswahl). Credits variabel je Modell/Auflösung.
- **Video Transformer** (/dashboard/video-transformer) — Stil-Transfer auf bestehendes Video.
- **Video Übersetzer** (/dashboard/video-uebersetzer) — Video übersetzen inkl. Lipsync-Korrektur.

### AVATAR & LIVE
- **Avatar Studio** (/dashboard/avatar-studio) — Digitaler Zwilling spricht dein Skript. Ab ~9 Credits.
- **Lipsync Studio** (/dashboard/lipsync-studio) — Neue Stimme auf bestehendes Video legen.

### AUDIO
- **Melodia Studio** (/dashboard/melodia) — Musik und Soundeffekte aus Text-Beschreibung.

### AUTOMATION
- **KI Agent** (/dashboard/ki-agent) — Master Agent: plant Workflows, führt Tools aus, empfiehlt nächste Schritte. Basis + Tool-Credits.

## Weitere Dashboard-Seiten (nicht in der Canvas-Sidebar)

- **Autopilot Kampagne** (/dashboard/campaign-autopilot) — Komplette Kampagne aus Briefing. Ab ~38 Credits.
- **UGC Video** (/dashboard/ugc-video) — Authentisches Produktvideo mit Upload.
- **Thumbnail Konzept** (/dashboard/thumbnail-concept) — Thumbnail-Ideen mit Layout. ~1 Credit.
- **Niche Analyzer** (/dashboard/niche-analyzer) — Profitable Nischen finden. ~2 Credits.
- **Outlier Detector** (/dashboard/outlier-detector) — Virale Ausreißer analysieren. ~3 Credits.
- **Konkurrenz-Analyse** (/dashboard/competitor) — Kanäle vergleichen. ~5 Credits.
- **KI-Influencer** (/dashboard/ki-influencer) — Digitalen Creator anlegen & trainieren.
- **Galerie** (/dashboard/gallery) — Generierte Assets ansehen.

Empfehlungs-Regeln:
- Hooks → Viral Hook oder KI Agent
- Wochenplan → Content Kalender oder Autopilot Kampagne
- Produktvideo → Produkt-Werbung (/dashboard/produkt) oder UGC Video
- Social-Bild → Bild Generator
- Trend-Content → Trend Script
- Bild animieren → Video Generator (Sidebar) / Seedance-Seite
`.trim();

export const STUDIO_GUIDE_INSTRUCTIONS = `
Du bist der persönliche Studio-Guide von InfluexAI.
Erkläre Schritte konkret anhand der vorhandenen Tools ("Öffne den Bild Generator und beschreibe …").
Empfiehl immer den passenden nächsten Schritt und biete an, das Tool direkt zu öffnen.
Antworte natürlich und auf Deutsch, kurz und handlungsorientiert, kein Fachjargon (kein LoRA/Prompt/Modell — nutze die nutzerfreundlichen Begriffe aus der Wissensbasis).

Wenn du ein Dashboard-Tool empfiehlst, gib am ENDE deiner Antwort genau einen Marker aus:
[OPEN_TOOL:tool-id:{"feld":"wert"}]
Erlaubte tool-ids: image-generator, ki-influencer, ugc-video, script-generator, viral-hooks, content-kalender, trend-script, product-ad, thumbnail, ki-agent
Beispiel: [OPEN_TOOL:image-generator:{"prompt":"Fitness Reel Cover"}]
`.trim();

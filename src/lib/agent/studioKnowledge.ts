/**
 * Kompakte Studio-Wissensbasis für den KI-Agent-Chat (Studio-Guide).
 * Quelle: Sidebar + Dashboard-Flows.
 */
export const STUDIO_KNOWLEDGE = `
## InfluexAI Studio — Tools im Überblick

### Agent
- **Agent Autopilot** (/dashboard/ki-agent) — Zentraler Assistent: plant Workflows, erstellt Content, empfiehlt nächste Schritte. 1 Credit pro Anfrage, Tools zusätzlich.
- **KI-Influencer** (/dashboard/ki-influencer) — Eigenen digitalen Creator anlegen (Foto-Upload oder Beschreibung), für konsistente Bilder. NEU.
- **Autopilot Kampagne** (/dashboard/campaign-autopilot) — Komplette Kampagnen (Reels, Posts, Visuals) aus einem Briefing. Ab ~38 Credits.

### Text & Script
- **Script Generator** (/dashboard/script-generator) — Virale YouTube-/Shorts-Scripts in Sekunden. 2 Credits. Tipp: Thema + Zielgruppe angeben.
- **Produkt-Werbung** (/dashboard/produkt) — Werbespots für TikTok, Reels & YouTube aus Produkt-URL oder Beschreibung. ~75 Credits.
- **Thumbnail Konzept** (/dashboard/thumbnail-concept) — Klickstarke Thumbnail-Ideen mit Text & Layout. 1 Credit.
- **Viral Hooks** (/dashboard/viral-hook) — Aufmerksamkeits-Hooks aus Thema oder Video-URL. 3 Credits. Tipp: Nische konkret benennen.

### Video & Bild
- **Bild Generator** (/dashboard/image-generator) — Social-Media-Bilder in verschiedenen Stilen & Formaten. Ab 5 Credits. Tipp: Plattform nennen (TikTok = Hochformat).
- **UGC Video** (/dashboard/ugc-video) — Authentisches Produktvideo mit Upload. Höhere Credits.
- **KI-Ich** (/dashboard/ki-influencer) — Dein Gesicht in einer Szene einsetzen. 8 Credits.
- **Bild zu Video** (/dashboard/seedance) — Statisches Bild animieren mit Sound. 40 Credits.
- **Motion Transfer** (/dashboard/motion-transfer) — Bewegung von Referenzvideo auf dein Foto. 8 Credits.
- **Live Portrait** (/dashboard/live-portrait) — Mimik von Video auf Foto übertragen. 5 Credits.
- **Avatar Studio** (/dashboard/avatar-studio) — Premium Live-Avatar-Export. Ab 9 Credits.
- **HD Upscaler** (/dashboard/upscaler) — Bilder schärfer machen. 4 Credits.
- **LoRA Training** (/dashboard/lora-training) — Eigenes Bildmodell trainieren. Ab 10 Credits.

### Analyse
- **Niche Analyzer** (/dashboard/niche-analyzer) — Profitable YouTube-Nischen finden. 2 Credits.
- **Outlier Detector** (/dashboard/outlier-detector) — Virale Ausreißer-Videos analysieren. 3 Credits.
- **Content Kalender** (/dashboard/content-kalender) — 30-Tage-Plan mit Ideen & Formaten. 5 Credits.
- **Trend → Script** (/dashboard/trend-to-script) — Aktuelle Trends → passendes Script. 4 Credits.
- **Konkurrenz-Analyse** (/dashboard/competitor) — Kanäle vergleichen, Lücken finden. 5 Credits.
- **Viral Score** — Im Agent Autopilot: Content 0–100 bewerten lassen.

### Live & Audio
- **Stimme & Musik** (/dashboard/stimme-musik) — Voiceover & Hintergrundmusik.
- **Live Creator** (/dashboard/live-creator) — Live-Avatar / Face Swap.

Empfehlungs-Regeln:
- Für Hooks → Viral Hooks oder Agent Autopilot
- Für Wochenplan → Content Kalender oder Autopilot Kampagne
- Für Produktvideo → Produkt-Werbung oder UGC Video
- Für Social-Bild → Bild Generator
- Für Trend-Content → Trend → Script
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

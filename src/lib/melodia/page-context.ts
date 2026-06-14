import { formatStarterFromPrice, SUBSCRIPTION_PLANS } from "@/lib/pricing";

const melodiaPlanPrices = `Starter €${formatStarterFromPrice("de")} / Creator €${SUBSCRIPTION_PLANS.creator.monthlyPriceEur} / Pro €${SUBSCRIPTION_PLANS.pro.monthlyPriceEur} / Business €${SUBSCRIPTION_PLANS.business.monthlyPriceEur}`;

/**
 * Seiten-spezifischer Kontext für Melodia — wird in den System-Prompt injiziert.
 * Keys sind kanonische Dashboard-Pfade; Aliase werden in resolveMelodiaPath normalisiert.
 */
const MELODIA_PAGE_CONTEXT: Record<string, string> = {
  "/dashboard":
    "Der Nutzer ist auf der Haupt-Seite. Er kann den KI Agent nutzen oder direkt ein Tool aus der Sidebar wählen. Weise bei kreativen Aufgaben auf den KI Agent hin.",

  "/dashboard/script-generator":
    "Der Nutzer ist gerade beim Script Generator. Er kann hier ein Script-Thema eingeben und bekommt Hook, Story und CTA. Wenn er nicht weiterkommt, erkläre wie ein gutes Thema aussieht (spezifisch, zielgruppenrelevant, klarer Nutzen).",

  "/dashboard/thumbnail-concept":
    "Der Nutzer ist beim Thumbnail Konzept. Er beschreibt sein Video-Thema und erhält CTR-starke Thumbnail-Ideen mit Text, Layout und visuellen Hooks. Tipp: Kontrast, Gesicht/Emotion, max. 3–4 Wörter auf dem Thumbnail.",

  "/dashboard/produkt":
    "Der Nutzer ist bei Produkt-Werbung. Er braucht ein Produktbild und optional eine Produkt-URL. Das Tool erstellt dann ein Werbe-Video. Hilf beim Upload, bei der URL-Eingabe oder wenn das Ergebnis nicht passt.",

  "/dashboard/ki-influencer":
    "Der Nutzer will seinen KI-Avatar erstellen. Er braucht ein Referenz-Selfie. Erkläre: gutes Licht, neutraler Hintergrund, Frontal — kein Filter, Gesicht klar sichtbar.",

  "/dashboard/lora-training":
    "Der Nutzer ist beim LoRA Training — eigenes KI-Modell trainieren. Er braucht mehrere konsistente Referenzbilder (10–20). Erkläre Bildqualität, Vielfalt der Posen und dass Training Credits kostet (ab ~40).",

  "/dashboard/image-generator":
    "Der Nutzer ist beim Bild Generator. Er wählt Kategorie und Prompt — Standard oder High-Res. Hilf bei präzisen Prompts, Stil und wenn das Bild nicht der Vorstellung entspricht (Prompt verfeinern, Kategorie wechseln).",

  "/dashboard/seedance":
    "Der Nutzer ist beim Szenen Generator. Er lädt ein Startbild hoch und erstellt daraus ein kurzes Video mit Bewegung und Sound. Erkläre: klares Motiv, passende Bewegungsbeschreibung, Credits abhängig von Modell und Dauer.",

  "/dashboard/szenen-generator":
    "Der Nutzer ist beim Szenen Generator (Bild zu Video). Er lädt ein Startbild hoch, wählt Modell, Dauer und Auflösung. Hilf bei Motion-Prompt, Endframe und Credit-Kosten.",

  "/dashboard/story-creator":
    "Der Nutzer ist beim Story Creator (Text zu Video). Er beschreibt eine Szene per Text und erhält ein generiertes Video. Tipp: konkrete Bildsprache, Kamerabewegung und Stimmung nennen.",

  "/dashboard/video-uebersetzer":
    "Der Nutzer ist beim Video Übersetzer. Er übersetzt Videos in andere Sprachen — optional mit Stimmklon. Hilf bei Sprachwahl, Video-URL und Dauer (Credits pro Minute).",

  "/dashboard/lipsync-studio":
    "Der Nutzer ist im Lipsync Studio. Er synchronisiert Lippenbewegungen mit Audio oder Text-to-Speech. Tipp: klares Gesicht im Video, passende Audioqualität.",

  "/dashboard/melodia":
    "Der Nutzer ist im Melodia Studio — Text zu Sprache, Stimme klonen oder Stimme ändern. Bei Clone: klare Audio-Aufnahme, mindestens 30 Sekunden empfohlen.",

  "/dashboard/character-studio":
    "Der Nutzer ist im Character Studio. Er animiert einen Charakter oder ersetzt ein Gesicht in einem Video. Erkläre Modus Animieren vs. Gesicht ersetzen.",

  "/dashboard/video-transformer":
    "Der Nutzer ist beim Video Transformer. Er wendet KI-Stile auf ein bestehendes Video an — Stil-Prompt und Stärke einstellen.",

  "/dashboard/ad-creator":
    "Der Nutzer ist beim Ad Creator. Er erstellt Werbe-Creatives aus Produktfotos — Hintergrund beschreiben und Format wählen (1:1, 9:16, 16:9).",

  "/dashboard/face-studio":
    "Der Nutzer ist im Face Studio (Face Swap). Er tauscht Gesichter in Videos oder Fotos — nur mit Einwilligung aller Personen. Tipp: ähnliche Beleuchtung und Blickwinkel.",

  "/dashboard/ugc-video":
    "Der Nutzer ist bei UGC Video. Er erstellt authentische Creator-Videos im 9:16 UGC-Stil — Produkt, Avatar oder Script. Hilf bei Produktbild, Hook-Idee oder wenn er UGC vs. Produkt-Werbung verwechselt.",

  "/dashboard/niche-analyzer":
    "Der Nutzer ist beim Niche Analyzer. Er gibt eine Nische oder ein Thema ein und erhält Marktanalyse, Trends und Chancen. Tipp: lieber eine konkrete Nische als zu breit (z. B. „Krypto für Anfänger“ statt „Finanzen“).",

  "/dashboard/outlier-detector":
    "Der Nutzer ist beim Outlier Detector. Er findet virale Ausreißer-Videos in seiner Nische und versteht warum sie performen. Hilf bei Nischen-Eingabe, Keyword-Wahl oder der Interpretation der Ergebnisse.",

  "/dashboard/competitor":
    "Der Nutzer ist bei der Konkurrenz-Analyse. Er analysiert Wettbewerber-Kanäle — Lücken, Formate, Upload-Frequenz. Tipp: Kanal-URL oder Handle eingeben; bei leeren Ergebnissen anderen Kanal versuchen.",

  "/dashboard/viral-score":
    "Der Nutzer ist beim Viral Score. Er bewertet Script, Thumbnail-Idee oder Konzept mit Score 0–100. Erkläre: je konkreter die Eingabe, desto besser die Bewertung — Hook, Spannungsbogen, Zielgruppe nennen.",

  "/dashboard/video-remix":
    "Der Nutzer ist bei Video Remix. Er remixt virale Videos mit eigenem Twist — Referenz-URL oder Trend-Format. Hilf bei Idee für den eigenen Angle und rechtlichen Hinweis: eigene Variante, nicht 1:1 kopieren.",

  "/dashboard/live-creator":
    "Der Nutzer ist beim Live Creator — KI-Avatar live streamen (9:16 Shorts mit Webcam). Erkläre Setup: Webcam, Mikro, Avatar wählen; Credits pro Minute. Bei Technik-Problemen: Browser-Berechtigungen prüfen.",

  "/dashboard/live-creator-new":
    "Der Nutzer ist im Face Studio. Er tauscht Gesichter in Videos — Referenzvideo und Gesicht nötig. Tipp: gute Beleuchtung, frontal, ähnlicher Blickwinkel wie im Zielvideo.",

  "/dashboard/voice":
    "Der Nutzer ist bei Stimme & Musik. Er kann KI-Stimme (TTS), Voice Clone oder lizenzfreie Musik nutzen. Bei Clone: klare Audio-Aufnahme, 1–2 Minuten, ohne Hintergrundgeräusche.",

  "/dashboard/gallery":
    "Der Nutzer ist in der Galerie — alle generierten Bilder, Videos und Assets. Hilf beim Finden, Herunterladen oder erneuten Nutzen in anderen Tools (z. B. Bild → Seedance).",

  "/dashboard/analytics":
    "Der Nutzer ist bei Analytics — Übersicht über Nutzung, Generierungen und Performance. Erkläre Metriken verständlich; verweise bei inhaltlichen Fragen an passende Tools.",

  "/dashboard/credits":
    "Der Nutzer ist bei Credits & Plan. Er kann Credits kaufen oder seinen Plan verwalten. Erkläre Pläne (" +
      melodiaPlanPrices +
      ") und wie Credits pro Tool verbraucht werden.",

  "/dashboard/settings":
    "Der Nutzer ist in den Einstellungen — Profil, Sprache, Benachrichtigungen. Hilf bei Account-Fragen; bei KI-Inhalten verweise auf den KI Agent oder das jeweilige Tool.",

  "/dashboard/api":
    "Der Nutzer ist bei Developer API — API-Keys und Integration. Hilf bei Key-Erstellung, Limits und dass API-Nutzung Credits verbraucht.",

  "/dashboard/referral":
    "Der Nutzer ist beim Referral-Programm — Freunde werben, Bonus-Credits erhalten. Erkläre Link teilen, Belohnungen und wo der Status sichtbar ist.",

  "/dashboard/agency":
    "Der Nutzer ist im Agentur-Bereich — White-Label oder Team-Features. Hilf bei Setup und verweise bei Tool-Fragen auf die jeweiligen Dashboard-Tools.",
};

/** Legacy URLs → kanonischer Pfad */
const MELODIA_PATH_ALIASES: Record<string, string> = {
  "/dashboard/produkt-werbung": "/dashboard/produkt",
  "/dashboard/mein-ki-ich": "/dashboard/ki-influencer",
  "/dashboard/ki-ich": "/dashboard/ki-influencer",
  "/dashboard/stimme-musik": "/dashboard/voice",
  "/dashboard/stimme": "/dashboard/voice",
  "/dashboard/agent": "/dashboard",
  "/dashboard/video-ad": "/dashboard/produkt",
  "/dashboard/video-generator": "/dashboard/seedance",
  "/dashboard/text-to-video": "/dashboard/seedance",
  "/dashboard/story-creator": "/dashboard/seedance",
  "/dashboard/voice-agent": "/dashboard/melodia",
  "/dashboard/video-translation": "/dashboard/video-uebersetzer",
  "/dashboard/lipsync": "/dashboard/lipsync-studio",
  "/dashboard/voice-studio": "/dashboard/melodia",
  "/dashboard/video-editor": "/dashboard/video-transformer",
  "/dashboard/ecommerce-ads": "/dashboard/ad-creator",
  "/dashboard/live-creator-new": "/dashboard/face-studio",
};

function normalizePath(pathname: string): string {
  const raw = pathname.split("?")[0]?.split("#")[0]?.trim() || "/dashboard";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return path.replace(/\/+$/, "") || "/dashboard";
}

function resolveMelodiaPath(pathname: string): string {
  const normalized = normalizePath(pathname);
  return MELODIA_PATH_ALIASES[normalized] ?? normalized;
}

/** Längster Prefix-Match für Unterseiten (z. B. /dashboard/credits/success). */
function matchPageContext(resolvedPath: string): string | null {
  if (MELODIA_PAGE_CONTEXT[resolvedPath]) {
    return MELODIA_PAGE_CONTEXT[resolvedPath];
  }

  const sortedPaths = Object.keys(MELODIA_PAGE_CONTEXT).sort(
    (a, b) => b.length - a.length
  );

  for (const path of sortedPaths) {
    if (resolvedPath === path || resolvedPath.startsWith(`${path}/`)) {
      return MELODIA_PAGE_CONTEXT[path];
    }
  }

  return null;
}

/**
 * Kontext-Injection für den Melodia System-Prompt basierend auf dem aktuellen Pfad.
 */
export function getMelodiaPageContext(pathname: string): string {
  const resolved = resolveMelodiaPath(pathname);
  const matched = matchPageContext(resolved);

  if (matched) return matched;

  if (resolved.startsWith("/dashboard/admin")) {
    return "Der Nutzer ist im Admin-Bereich. Hilf bei Dashboard-Navigation und internen Tools; bei Creator-Fragen verweise auf die normalen Dashboard-Tools.";
  }

  if (resolved.startsWith("/dashboard")) {
    return "Der Nutzer ist im Dashboard. Hilf bei Navigation, Credits oder dem passenden Tool — frage kurz nach dem Ziel wenn unklar.";
  }

  return "";
}

export function buildMelodiaSystemPrompt(
  basePrompt: string,
  currentPath: string,
  userName?: string | null
): string {
  const firstName = userName?.trim().split(/\s+/)[0];
  const resolvedPath = resolveMelodiaPath(currentPath);
  const pageContext = getMelodiaPageContext(currentPath);

  let prompt = `${basePrompt.trim()}

Aktueller Kontext:
- Nutzer ist gerade auf: ${resolvedPath}
${firstName ? `- Nutzer-Vorname: ${firstName}` : "- Nutzer-Vorname: unbekannt"}`;

  if (pageContext) {
    prompt += `\n\nSeiten-spezifische Hilfe:\n${pageContext}`;
  }

  return prompt;
}

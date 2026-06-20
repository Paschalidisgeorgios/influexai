/**
 * Agent tool capability map — Phase 4G.4V-B.
 * Client-safe metadata for Creator Operating Agent routing & planning.
 * No provider SDKs, no secrets, no execution.
 */

import type { ToolId } from "@/components/dashboard/core/DashboardLayout";
import {
  STUDIO_PROVIDER_DISABLED_HINT,
  STUDIO_SHELL_ONLY_HINT,
  getStudioToolById,
} from "@/lib/tools/studio-tool-registry";

export type ToolExecutionStatus =
  | "available"
  | "shell_only"
  | "provider_disabled"
  | "coming_soon"
  | "disabled";

export type WorkflowStage =
  | "planning"
  | "character_setup"
  | "asset_creation"
  | "video_production"
  | "voice_avatar"
  | "live_interaction"
  | "distribution"
  | "management";

export type ToolCapabilityInput = {
  id: string;
  label: string;
  description?: string;
};

export type AgentToolCapability = {
  toolId: string;
  label: string;
  useCases: string[];
  requiredInputs: ToolCapabilityInput[];
  optionalInputs: ToolCapabilityInput[];
  outputs: string[];
  recommendedFor: string[];
  notSuitableFor: string[];
  nextSteps: string[];
  blockedWhen: string[];
  agentInstructions: string;
  workflowStage: WorkflowStage;
  executionStatus: ToolExecutionStatus;
  providerDisabledMessage: string;
  recommendedAspectRatios: string[];
  creditEstimate: string;
  safeRoutingTarget: string;
  /** Keyword hints for deterministic planner matching */
  matchKeywords: string[];
};

const PROVIDER_DISABLED =
  "Provider-Ausführung ist in dieser Umgebung deaktiviert. Es wird nichts generiert, trainiert oder hochgeladen.";

const SHELL_ONLY =
  "Dieses Tool ist vorbereitet, aber noch nicht aktiviert. Nur Planung und Vorbereitung sind möglich.";

function routeFor(toolId: string, fallback: string): string {
  return getStudioToolById(toolId)?.route ?? fallback;
}

function creditFor(toolId: string, fallback: string): string {
  return getStudioToolById(toolId)?.creditLabel ?? fallback;
}

function executionStatusFor(toolId: string): ToolExecutionStatus {
  const tool = getStudioToolById(toolId);
  if (!tool) return "shell_only";
  if (tool.status === "disabled" || tool.status === "coming_soon") return "disabled";
  if (tool.status === "shell") return "shell_only";
  if (
    tool.providerExecution === "disabled" ||
    tool.providerExecution === "shell_only"
  ) {
    return "provider_disabled";
  }
  return "available";
}

function disabledMessageFor(toolId: string): string {
  const status = executionStatusFor(toolId);
  if (status === "shell_only") return SHELL_ONLY;
  if (status === "provider_disabled") return PROVIDER_DISABLED;
  if (status === "disabled") return "Dieses Tool ist derzeit nicht verfügbar.";
  return STUDIO_PROVIDER_DISABLED_HINT;
}

export const AGENT_TOOL_CAPABILITY_MAP: AgentToolCapability[] = [
  {
    toolId: "ai-creator",
    label: "AI Creator / KI-Ich",
    useCases: [
      "AI-Influencer anlegen",
      "Character Draft erstellen",
      "Consent für Character-Nutzung",
      "Handoff für Upload vorbereiten",
    ],
    requiredInputs: [
      { id: "character_name", label: "Character-Name" },
      { id: "character_type", label: "Character-Typ" },
      { id: "consent", label: "Consent bestätigen" },
    ],
    optionalInputs: [
      { id: "persona_brief", label: "Persona-Brief" },
      { id: "trigger_word", label: "Trigger / Brief" },
    ],
    outputs: ["Character Draft", "Consent-Status", "Handoff-ready Status", "Upload-Shell-Status"],
    recommendedFor: [
      "KI-Influencer Workflows",
      "Character-basierte Kampagnen",
      "Wiedererkennbare Brand-Face",
    ],
    notSuitableFor: ["Einmalige Stock-Bilder ohne Character", "Schnelle Text-only Clips ohne Face"],
    nextSteps: ["handoff_ready", "upload_pending", "image-gen", "img-to-video"],
    blockedWhen: [
      "Consent fehlt",
      "Character Draft unvollständig",
      "Provider disabled — kein Training/Upload",
    ],
    agentInstructions:
      "Prüfe zuerst Character Draft und Consent. Erkläre Handoff- und Upload-Shell-Status. Verspreche keine Generierung solange Provider disabled ist.",
    workflowStage: "character_setup",
    executionStatus: executionStatusFor("ai-creator"),
    providerDisabledMessage: disabledMessageFor("ai-creator"),
    recommendedAspectRatios: ["9:16", "1:1"],
    creditEstimate: creditFor("ai-creator", "0 Credits · Shell"),
    safeRoutingTarget: routeFor("ai-creator", "/dashboard/ai-creator"),
    matchKeywords: [
      "ai-influencer",
      "ki-ich",
      "character",
      "influencer",
      "ki ich",
      "ai creator",
      "consent",
      "handoff",
    ],
  },
  {
    toolId: "lora-training",
    label: "LoRA / Character Training",
    useCases: [
      "Character-Modell trainieren (später)",
      "LoRA aus Upload-Set vorbereiten",
    ],
    requiredInputs: [
      { id: "character_draft", label: "Character Draft (AI Creator)" },
      { id: "handoff_ready", label: "Handoff-ready Status" },
      { id: "upload_set", label: "Upload-Set (später)" },
    ],
    optionalInputs: [{ id: "training_notes", label: "Training-Hinweise" }],
    outputs: ["Training-Job-Status (Shell)", "LoRA-Referenz (später)"],
    recommendedFor: ["Wiedererkennbare AI-Characters nach Upload-Phase"],
    notSuitableFor: ["Sofortige Video-Generierung ohne Character-Setup"],
    nextSteps: ["ai-creator", "upload_pending"],
    blockedWhen: [
      "Kein Character Draft",
      "Consent fehlt",
      "Provider disabled — kein echtes Training",
    ],
    agentInstructions:
      "Verweise auf AI Creator Flow. Training ist Shell-only — nichts starten oder versprechen.",
    workflowStage: "character_setup",
    executionStatus: "provider_disabled",
    providerDisabledMessage: PROVIDER_DISABLED,
    recommendedAspectRatios: [],
    creditEstimate: "Shell · Training deaktiviert",
    safeRoutingTarget: "/dashboard/ai-creator",
    matchKeywords: ["lora", "training", "trainieren", "character training"],
  },
  {
    toolId: "image-gen",
    label: "Image Studio",
    useCases: [
      "Kampagnenmotive generieren",
      "Produktfotos für Social",
      "Startbild für Video-Pipeline",
    ],
    requiredInputs: [{ id: "prompt", label: "Bildbeschreibung" }],
    optionalInputs: [
      { id: "aspect_ratio", label: "Format (1:1, 9:16, 16:9)" },
      { id: "model", label: "Bildmodell" },
      { id: "style_reference", label: "Stil-Referenz" },
    ],
    outputs: ["PNG/JPEG Motiv", "Galerie-Eintrag (wenn aktiv)"],
    recommendedFor: ["Thumbnails", "Produktshots", "Startframes für Video"],
    notSuitableFor: ["Lange Video-Clips", "Lip Sync ohne Video-Quelle"],
    nextSteps: ["img-to-video", "gallery", "viral-hook"],
    blockedWhen: ["Provider disabled — keine Bildgenerierung"],
    agentInstructions:
      "Empfehle Format passend zur Plattform (TikTok/Reels: 9:16). Keine Generierung versprechen wenn Provider disabled.",
    workflowStage: "asset_creation",
    executionStatus: executionStatusFor("image-gen"),
    providerDisabledMessage: disabledMessageFor("image-gen"),
    recommendedAspectRatios: ["1:1", "9:16", "16:9"],
    creditEstimate: creditFor("image-gen", "5 Credits pro Bild"),
    safeRoutingTarget: routeFor("image-gen", "/dashboard?tool=image-gen"),
    matchKeywords: ["bild", "image", "foto", "motiv", "thumbnail", "startbild"],
  },
  {
    toolId: "img-to-video",
    label: "Image-to-Video",
    useCases: [
      "Startbild in Motion-Clip",
      "Produkt-Reel aus Foto",
      "AI-Influencer Clip aus Character-Bild",
    ],
    requiredInputs: [
      { id: "start_image", label: "Startbild-URL oder Galerie-Asset" },
      { id: "motion_prompt", label: "Bewegungsbeschreibung" },
    ],
    optionalInputs: [
      { id: "duration", label: "Dauer (5s/10s)" },
      { id: "model", label: "Video-Modell" },
      { id: "resolution", label: "Auflösung" },
    ],
    outputs: ["Kurzvideo-Clip", "Galerie-Eintrag (wenn aktiv)"],
    recommendedFor: ["TikTok/Reels aus bestehendem Motiv", "Produkt-Animation"],
    notSuitableFor: ["Reine Text-Idee ohne Startbild", "Lange Formate >10s"],
    nextSteps: ["viral-hook", "talking-avatar", "gallery"],
    blockedWhen: ["Kein Startbild", "Provider disabled"],
    agentInstructions:
      "Wenn AI-Influencer: zuerst Character/Motiv aus AI Creator oder Image Studio. 9:16 für TikTok empfehlen.",
    workflowStage: "video_production",
    executionStatus: executionStatusFor("img-to-video"),
    providerDisabledMessage: disabledMessageFor("img-to-video"),
    recommendedAspectRatios: ["9:16", "16:9"],
    creditEstimate: creditFor("img-to-video", "Dynamisch"),
    safeRoutingTarget: routeFor("img-to-video", "/dashboard?tool=img-to-video"),
    matchKeywords: [
      "bild zu video",
      "image to video",
      "startbild",
      "motion",
      "reel aus foto",
    ],
  },
  {
    toolId: "text-to-video",
    label: "Text-to-Video",
    useCases: [
      "Clip aus Szenenbeschreibung",
      "Ad-Szene ohne Startbild",
      "Konzept-Video aus Brief",
    ],
    requiredInputs: [{ id: "scene_prompt", label: "Szenenbeschreibung" }],
    optionalInputs: [
      { id: "duration", label: "Dauer" },
      { id: "model", label: "Video-Modell" },
      { id: "resolution", label: "Format/Auflösung" },
    ],
    outputs: ["Kurzvideo-Clip"],
    recommendedFor: ["Schnelle Konzept-Clips", "Storyboard → Video Idee"],
    notSuitableFor: [
      "Pixel-genaue Character-Wiedererkennung ohne AI Creator",
      "Lip Sync mit bestehendem Talking Head",
    ],
    nextSteps: ["viral-hook", "content-calendar", "gallery"],
    blockedWhen: ["Leere Szenenbeschreibung", "Provider disabled"],
    agentInstructions:
      "Für AI-Influencer-Clips: prüfe ob Character-Setup nötig ist. 9:16 für TikTok.",
    workflowStage: "video_production",
    executionStatus: executionStatusFor("text-to-video"),
    providerDisabledMessage: disabledMessageFor("text-to-video"),
    recommendedAspectRatios: ["9:16", "16:9"],
    creditEstimate: creditFor("text-to-video", "Ab 50 Credits"),
    safeRoutingTarget: routeFor("text-to-video", "/dashboard?tool=text-to-video"),
    matchKeywords: [
      "text to video",
      "text-zu-video",
      "szenenbeschreibung",
      "clip aus text",
    ],
  },
  {
    toolId: "talking-avatar",
    label: "Lip Sync",
    useCases: [
      "Video mit synchronen Lippen",
      "Talking Head mit Audio",
      "AI-Influencer Sprach-Clip",
    ],
    requiredInputs: [
      { id: "video_source", label: "Video-Quelle" },
      { id: "audio_source", label: "Audio / Stimme" },
    ],
    optionalInputs: [{ id: "model", label: "Lip-Sync-Modell" }],
    outputs: ["Lip-sync Video (Shell)"],
    recommendedFor: ["Talking Head Ads", "Voice-over auf Avatar-Video"],
    notSuitableFor: ["Reine Text-Hooks", "Statische Bilder"],
    nextSteps: ["gallery", "viral-hook"],
    blockedWhen: ["Consent fehlt bei Character", "Provider disabled", "Tool Shell-only"],
    agentInstructions:
      "Shell-only vorbereiten. Audio + Video Inputs erklären. Keine Ausführung versprechen.",
    workflowStage: "voice_avatar",
    executionStatus: executionStatusFor("talking-avatar"),
    providerDisabledMessage: disabledMessageFor("talking-avatar"),
    recommendedAspectRatios: ["9:16", "1:1"],
    creditEstimate: creditFor("talking-avatar", "40 Credits"),
    safeRoutingTarget: routeFor("talking-avatar", "/dashboard?tool=talking-avatar"),
    matchKeywords: ["lip sync", "lipsync", "talking head", "stimme sync", "avatar sprechen"],
  },
  {
    toolId: "live-creator",
    label: "Live Creator / Talking Photo",
    useCases: [
      "Live Portrait vorbereiten",
      "Echtzeit-Character-Interaktion (später)",
    ],
    requiredInputs: [{ id: "character_or_photo", label: "Character oder Foto" }],
    optionalInputs: [{ id: "live_mode", label: "Live-Modus" }],
    outputs: ["Live-Session-Shell"],
    recommendedFor: ["Live-Streams", "Interaktive Character-Demos"],
    notSuitableFor: ["Batch-Video-Produktion", "Statische Kalenderplanung"],
    nextSteps: ["ai-creator", "talking-avatar"],
    blockedWhen: ["Consent fehlt", "Provider disabled", "Shell-only"],
    agentInstructions: "Nur Vorbereitung und Routing — keine Live-Session starten.",
    workflowStage: "live_interaction",
    executionStatus: executionStatusFor("live-creator"),
    providerDisabledMessage: disabledMessageFor("live-creator"),
    recommendedAspectRatios: ["9:16", "1:1"],
    creditEstimate: creditFor("live-creator", "Shell"),
    safeRoutingTarget: routeFor("live-creator", "/dashboard/live-creator"),
    matchKeywords: ["live creator", "live portrait", "talking photo", "live stream"],
  },
  {
    toolId: "face-swap-video",
    label: "Face Swap",
    useCases: ["Gesicht in Video tauschen", "Character-Face in bestehendem Clip"],
    requiredInputs: [
      { id: "source_face", label: "Quell-Gesicht" },
      { id: "target_video", label: "Ziel-Video" },
    ],
    optionalInputs: [],
    outputs: ["Face-Swap Video (Shell)"],
    recommendedFor: ["Character in Template-Video", "Varianten-Tests"],
    notSuitableFor: ["Consent-freie Personen", "Reine Text-Planung"],
    nextSteps: ["gallery", "ai-creator"],
    blockedWhen: ["Consent fehlt", "Provider disabled", "Shell-only"],
    agentInstructions: "Consent und Rechte betonen. Shell-only — keine Ausführung.",
    workflowStage: "video_production",
    executionStatus: executionStatusFor("face-swap-video"),
    providerDisabledMessage: disabledMessageFor("face-swap-video"),
    recommendedAspectRatios: ["9:16", "16:9"],
    creditEstimate: creditFor("face-swap-video", "Shell"),
    safeRoutingTarget: routeFor("face-swap-video", "/dashboard?tool=face-swap-video"),
    matchKeywords: ["face swap", "gesicht tauschen", "face-swap"],
  },
  {
    toolId: "viral-hook",
    label: "Viral Hook",
    useCases: [
      "Reels/Shorts Einstieg formulieren",
      "Hook aus Thema oder Link",
      "Ad-Opener ideieren",
    ],
    requiredInputs: [{ id: "topic_or_link", label: "Thema oder Link" }],
    optionalInputs: [{ id: "niche", label: "Nische / Zielgruppe" }],
    outputs: ["Hook-Text", "Psychologie-Hinweis", "Nischen-Anpassung"],
    recommendedFor: ["TikTok/Reels vor Video-Produktion", "Ad-Creative Briefing"],
    notSuitableFor: ["Vollständige Video-Render-Pipeline allein"],
    nextSteps: ["text-to-video", "img-to-video", "content-calendar"],
    blockedWhen: ["Leeres Thema"],
    agentInstructions:
      "Text-only Shell — kann Mock/Text liefern wenn shell_only erlaubt, aber keine Video-Generierung versprechen.",
    workflowStage: "distribution",
    executionStatus: executionStatusFor("viral-hook"),
    providerDisabledMessage: disabledMessageFor("viral-hook"),
    recommendedAspectRatios: ["9:16"],
    creditEstimate: creditFor("viral-hook", "2 Credits"),
    safeRoutingTarget: routeFor("viral-hook", "/dashboard?tool=viral-hook"),
    matchKeywords: ["hook", "viral", "einstieg", "opener", "reels text"],
  },
  {
    toolId: "content-calendar",
    label: "Content Calendar",
    useCases: [
      "Themen und Rhythmus planen",
      "7–30 Tage Content-Plan",
      "Format-Mix festlegen",
    ],
    requiredInputs: [{ id: "topic_or_brand", label: "Thema oder Brand" }],
    optionalInputs: [
      { id: "frequency", label: "Frequenz" },
      { id: "platforms", label: "Plattformen" },
    ],
    outputs: ["Kalender-Plan", "Themenliste", "Format-Vorschläge"],
    recommendedFor: ["Kampagnenplanung", "Redaktionsplan"],
    notSuitableFor: ["Sofortige Video-Generierung"],
    nextSteps: ["viral-hook", "trend-script", "image-gen"],
    blockedWhen: ["Kein Thema"],
    agentInstructions: "Planungstool — keine Medien-Generierung versprechen.",
    workflowStage: "planning",
    executionStatus: executionStatusFor("content-calendar"),
    providerDisabledMessage: disabledMessageFor("content-calendar"),
    recommendedAspectRatios: ["9:16", "1:1", "16:9"],
    creditEstimate: creditFor("content-calendar", "2 Credits"),
    safeRoutingTarget: routeFor("content-calendar", "/dashboard?tool=content-calendar"),
    matchKeywords: ["kalender", "content plan", "planung", "redaktionsplan"],
  },
  {
    toolId: "trend-script",
    label: "Trend-to-Script",
    useCases: [
      "Trend-Thema in Script überführen",
      "Short-Form Script aus Trend",
    ],
    requiredInputs: [{ id: "trend_topic", label: "Trend-Thema" }],
    optionalInputs: [{ id: "tone", label: "Ton/Stil" }],
    outputs: ["Script-Entwurf (Shell)"],
    recommendedFor: ["Trend-Reaktionen", "Script vor Aufnahme/Video"],
    notSuitableFor: ["Direktes Rendering ohne Script-Freigabe"],
    nextSteps: ["text-to-video", "talking-avatar", "viral-hook"],
    blockedWhen: ["Shell-only", "Provider disabled"],
    agentInstructions: "Shell-only Routing — Script-Vorbereitung erklären, kein Render.",
    workflowStage: "planning",
    executionStatus: executionStatusFor("trend-script"),
    providerDisabledMessage: disabledMessageFor("trend-script"),
    recommendedAspectRatios: ["9:16"],
    creditEstimate: creditFor("trend-script", "Shell"),
    safeRoutingTarget: routeFor("trend-script", "/dashboard/trend-to-script"),
    matchKeywords: ["trend script", "script", "drehbuch", "trend-to-script"],
  },
  {
    toolId: "gallery",
    label: "Gallery",
    useCases: [
      "Generierte Assets ansehen",
      "Startbild für Video auswählen",
      "Ergebnisse wiederverwenden",
    ],
    requiredInputs: [],
    optionalInputs: [{ id: "filter", label: "Filter / Typ" }],
    outputs: ["Asset-Liste", "Download-Links (wenn verfügbar)"],
    recommendedFor: ["Workflow-Fortsetzung nach Generierung", "Asset-Auswahl"],
    notSuitableFor: ["Neue Ideen ohne vorherige Produktion"],
    nextSteps: ["img-to-video", "talking-avatar"],
    blockedWhen: [],
    agentInstructions: "Verweis auf Galerie für vorhandene Assets — keine neuen Uploads.",
    workflowStage: "management",
    executionStatus: "available",
    providerDisabledMessage:
      "Galerie ist nur zur Ansicht — keine neuen Uploads oder Generierungen in dieser Umgebung.",
    recommendedAspectRatios: [],
    creditEstimate: "0 Credits",
    safeRoutingTarget: "/dashboard?tool=gallery",
    matchKeywords: ["galerie", "gallery", "assets", "ergebnisse"],
  },
  {
    toolId: "settings",
    label: "Brand Defaults / Settings",
    useCases: [
      "Brand Kit und Defaults",
      "Creator DNA / Stil-Vorgaben",
      "Kontoeinstellungen",
    ],
    requiredInputs: [],
    optionalInputs: [
      { id: "brand_colors", label: "Markenfarben" },
      { id: "default_format", label: "Standard-Format" },
    ],
    outputs: ["Gespeicherte Einstellungen"],
    recommendedFor: ["Wiederkehrende Marken-Konsistenz"],
    notSuitableFor: ["Direkte Video-Generierung"],
    nextSteps: ["image-gen", "content-calendar"],
    blockedWhen: [],
    agentInstructions: "Einstellungen erklären — keine Provider-Aktionen.",
    workflowStage: "management",
    executionStatus: "available",
    providerDisabledMessage:
      "Einstellungen können gespeichert werden — Medien-Ausführung bleibt deaktiviert.",
    recommendedAspectRatios: ["9:16", "1:1", "16:9"],
    creditEstimate: "0 Credits",
    safeRoutingTarget: "/dashboard/settings",
    matchKeywords: ["settings", "einstellungen", "brand", "defaults", "brand kit"],
  },
  {
    toolId: "credits",
    label: "Credits / Billing",
    useCases: [
      "Credit-Stand prüfen",
      "Pakete ansehen (Test-Modus)",
      "Kosten vor Tool-Nutzung klären",
    ],
    requiredInputs: [],
    optionalInputs: [],
    outputs: ["Credit-Saldo", "Preisübersicht"],
    recommendedFor: ["Vor teuren Video-Tools", "Budget-Planung"],
    notSuitableFor: ["Content-Erstellung"],
    nextSteps: ["tools"],
    blockedWhen: [],
    agentInstructions:
      "Stripe Test Mode — keine echten Abbuchungen. Credit-Hinweise aus Tool-Capability Map nutzen.",
    workflowStage: "management",
    executionStatus: "available",
    providerDisabledMessage:
      "Billing läuft im Test-Modus — keine echten Abbuchungen in dieser Umgebung.",
    recommendedAspectRatios: [],
    creditEstimate: "n/a",
    safeRoutingTarget: "/dashboard/credits",
    matchKeywords: ["credits", "billing", "guthaben", "preis", "kosten"],
  },
];

const CAPABILITY_BY_ID = new Map<string, AgentToolCapability>(
  AGENT_TOOL_CAPABILITY_MAP.map((cap) => [cap.toolId, cap])
);

export function getToolCapabilities(): AgentToolCapability[] {
  return AGENT_TOOL_CAPABILITY_MAP;
}

export function getToolCapabilityById(toolId: string): AgentToolCapability | undefined {
  return CAPABILITY_BY_ID.get(toolId);
}

export function getToolCapabilityForDashboardId(
  toolId: ToolId | string
): AgentToolCapability | undefined {
  return CAPABILITY_BY_ID.get(String(toolId));
}

export function getProviderDisabledAgentMessage(toolId: string): string {
  return (
    getToolCapabilityById(toolId)?.providerDisabledMessage ??
    STUDIO_PROVIDER_DISABLED_HINT
  );
}

export { STUDIO_SHELL_ONLY_HINT };

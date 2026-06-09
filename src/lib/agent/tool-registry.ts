import { UGC_VIDEO_CREDIT_COST } from "@/lib/akool-ugc";
import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { COMPETITOR_ANALYSIS_CREDIT_COST } from "@/lib/competitor-analysis";
import { FAL_CREDITS } from "@/lib/fal-credits";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { calcLoraCredits } from "@/lib/lora-credits";
import { LORA_STEPS_MIN } from "@/lib/lora-config";
import { MOTION_TRANSFER_CREDIT_COST } from "@/lib/motion-transfer-config";
import { PRODUCT_AD_CREDITS } from "@/lib/product-ad-config";
import { SEEDANCE_CREDIT_COST } from "@/lib/seedance-config";
import {
  KLING_25_CREDIT_COST,
  KLING_25_PROVIDER,
  KLING_25_TURBO_PRO_IMAGE_TO_VIDEO_MODEL,
} from "@/lib/kling25-config";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import { VIRAL_SCORE_CREDIT_COST } from "@/lib/viral-score";
import { AGENT_TOOL_CREDITS } from "./credits";
import { CAMPAIGN_AUTOPILOT_IS_PREVIEW } from "./campaignPlanner";

/** Central metadata for agent-facing tools. v0 — descriptive only; runtime unchanged. */

export type AgentToolRiskLevel = "low" | "medium" | "high";

export type AgentToolExecutionMode =
  | "auto_allowed"
  | "confirm_required"
  | "consent_required"
  | "redirect_only"
  | "preview_only"
  | "not_agent_ready";

export type AgentToolRegistryItem = {
  id: string;
  label: string;
  category:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "analysis"
    | "campaign"
    | "avatar"
    | "utility";
  status: "production" | "beta" | "preview" | "mock" | "risky";
  route?: string;
  api?: string;
  agentToolName?: string;
  kiAgentToolName?: string;
  description: string;
  canDo: string[];
  cannotDo: string[];
  requiredInputs: string[];
  optionalInputs: string[];
  outputType:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "json"
    | "redirect"
    | "mixed";
  creditCost: {
    type: "fixed" | "variable" | "free" | "unknown";
    min?: number;
    max?: number;
    note?: string;
  };
  requiresConsent: boolean;
  requiresUpload: boolean;
  hasProviderCost: boolean;
  hasRealResearch: boolean;
  executionMode: AgentToolExecutionMode;
  riskLevel: AgentToolRiskLevel;
  autoRunAllowed: boolean;
  confirmationRequiredReason?: string;
  notes?: string[];
  provider?: string;
  modelId?: string;
  inputTypes?: string[];
};

const LORA_MIN_CREDITS = calcLoraCredits(LORA_STEPS_MIN);

/**
 * Planner/orchestrator reference — do not wire into execute-tool or toolOrchestrator yet.
 */
export const AGENT_TOOL_REGISTRY: readonly AgentToolRegistryItem[] = [
  {
    id: "script_generator",
    label: "Script Generator",
    category: "text",
    status: "production",
    route: "/dashboard/script-generator",
    api: "/api/script-generator",
    agentToolName: "generate_script",
    kiAgentToolName: "script_generator",
    description:
      "Erstellt YouTube-Shorts-Skripte mit Hook, Story und CTA.",
    canDo: [
      "Script aus Thema generieren",
      "Hook/Main/CTA-Struktur",
      "Master Agent: direkte Ausführung",
      "KI Agent: Trend-Script-API bei script_generation / video_briefing",
    ],
    cannotDo: [
      "Video rendern",
      "Autonom veröffentlichen",
      "Echte Trend-Daten ohne Trend-Script-Pfad",
    ],
    requiredInputs: ["topic"],
    optionalInputs: ["hook", "duration", "language"],
    outputType: "text",
    creditCost: {
      type: "fixed",
      min: AGENT_TOOL_CREDITS.generate_script,
      max: AGENT_TOOL_CREDITS.generate_script,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
    notes: [
      "Master Agent nutzt Server Action generateScript.",
      "KI Agent router label script_generator → POST /api/trend-script bei Orchestrator.",
    ],
  },
  {
    id: "trend_script",
    label: "Trend Script",
    category: "text",
    status: "production",
    route: "/dashboard/trend-to-script",
    api: "/api/trend-script",
    kiAgentToolName: "trend_script",
    description:
      "Script basierend auf Trend-Videos einer Nische/Plattform.",
    canDo: [
      "Trend-Videos via YouTube Data API laden",
      "Script aus Trends ableiten",
      "KI Agent Orchestrator bei script_generation und video_briefing",
    ],
    cannotDo: [
      "Garantierte Viralität",
      "Upload/Render",
      "Autonom ohne Nutzer-Prompt",
    ],
    requiredInputs: ["topic or niche", "platform"],
    optionalInputs: ["language", "duration"],
    outputType: "text",
    creditCost: {
      type: "fixed",
      min: TREND_SCRIPT_TOOL_CREDIT_COST,
      max: TREND_SCRIPT_TOOL_CREDIT_COST,
      note: "Dashboard label may show 4 Credits; agent orchestrator uses TREND_SCRIPT_TOOL_CREDIT_COST.",
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: true,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
    notes: ["Uses fetchTrendingVideos (YouTube Data API)."],
  },
  {
    id: "viral_hook",
    label: "Viral Hook Extraktor",
    category: "text",
    status: "production",
    route: "/dashboard/viral-hook",
    api: "/api/viral-hook",
    kiAgentToolName: "viral_hook_extraktor",
    description: "Extrahiert scroll-stoppende Hooks aus Thema oder Kontext.",
    canDo: [
      "Hook-Varianten generieren",
      "KI Agent default fallback bei unknown intent",
      "Multi-Tool-Paket (hook + script + calendar)",
    ],
    cannotDo: [
      "Video produzieren",
      "Live Social Listening",
      "Autonom posten",
    ],
    requiredInputs: ["topic or prompt"],
    optionalInputs: ["platform", "language"],
    outputType: "text",
    creditCost: {
      type: "fixed",
      min: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
      max: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
      note: "Dashboard viral-hook page may use VIRAL_HOOK_CREDIT_COST (3) separately.",
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
  },
  {
    id: "content_kalender",
    label: "Content Kalender",
    category: "text",
    status: "production",
    route: "/dashboard/content-kalender",
    api: "/api/content-kalender",
    kiAgentToolName: "content_kalender",
    description: "Plant Content-Ideen und Posting-Vorschläge für eine Nische.",
    canDo: [
      "30-Tage-Content-Plan",
      "Plattform-spezifische Ideen",
      "KI Agent bei content_calendar / multi_tool",
    ],
    cannotDo: [
      "Posts automatisch veröffentlichen",
      "Kalender-Integration (Google/Notion)",
      "Echte Performance-Daten abrufen",
    ],
    requiredInputs: ["niche or topic"],
    optionalInputs: ["platform", "language", "days"],
    outputType: "json",
    creditCost: {
      type: "fixed",
      min: CONTENT_KALENDER_TOOL_CREDIT_COST,
      max: CONTENT_KALENDER_TOOL_CREDIT_COST,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
  },
  {
    id: "image_generator",
    label: "Image Generator",
    category: "image",
    status: "production",
    route: "/dashboard/image-generator",
    api: "/api/generate-image",
    agentToolName: "generate_image",
    kiAgentToolName: "image_generator",
    description: "Text-zu-Bild via Flux (fal.ai).",
    canDo: [
      "KI-Bild aus Prompt",
      "Master Agent Chat-Ausführung",
      "KI Agent bei image_generation intent",
    ],
    cannotDo: [
      "Garantierte Markenrechte",
      "Batch ohne Credits",
      "Autonom ohne Nutzer-Prompt",
    ],
    requiredInputs: ["prompt"],
    optionalInputs: ["style", "aspectRatio"],
    outputType: "image",
    creditCost: {
      type: "fixed",
      min: IMAGE_GEN_CREDITS.standard,
      max: IMAGE_GEN_CREDITS.highRes,
      note: "Standard 5 (fluxDev), highRes 8 (fluxProT2i).",
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "confirm_required",
    riskLevel: "medium",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Provider-Kosten (typisch 5+ Credits pro Bild). Master Agent führt aktuell ohne UI-Bestätigung aus — Policy-Ziel: confirm vor Run.",
    notes: [
      "Registry policy: confirm before auto-run.",
      "Runtime today: Master Agent auto-executes generate_image.",
    ],
  },
  {
    id: "ki_ich",
    label: "Mein KI-Ich",
    category: "avatar",
    status: "production",
    route: "/dashboard/ki-ich",
    agentToolName: "avatar_video",
    kiAgentToolName: "ki_ich",
    description:
      "Persönlicher KI-Avatar aus Selfie/Gesicht — Flux PuLID Pipeline.",
    canDo: [
      "Avatar-Bild aus Upload",
      "Weiterleitung im Master Agent",
      "Dashboard-Generierung",
    ],
    cannotDo: [
      "Gesicht ohne Einwilligung verarbeiten",
      "Autonom Selfie hochladen",
      "KI Agent Orchestrator (avatar_workflow fällt auf viral-hook zurück)",
    ],
    requiredInputs: ["faceImage or selfie upload"],
    optionalInputs: ["prompt", "style"],
    outputType: "image",
    creditCost: {
      type: "fixed",
      min: FAL_CREDITS.fluxPulid,
      max: FAL_CREDITS.fluxPulid,
      note: "Dashboard label ~8 Credits.",
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "consent_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Verarbeitung echter Gesichter — Rechte/Einwilligung erforderlich.",
    notes: [
      "Master Agent: redirect_only (avatar_video).",
      "KI Agent UI guard für avatar_from_face.",
    ],
  },
  {
    id: "ugc_video",
    label: "UGC Video",
    category: "video",
    status: "production",
    route: "/dashboard/ugc-video",
    agentToolName: "ugc_video",
    description: "Authentische UGC-Ads mit Produktbild-Upload.",
    canDo: [
      "UGC-Video aus Produktbild",
      "Master Agent Redirect-Karte",
      "Akool UGC Pipeline im Dashboard",
    ],
    cannotDo: [
      "Upload im Master Agent Chat",
      "Autonom ohne Produktbild",
      "Credits-freie Provider-Runs",
    ],
    requiredInputs: ["productImage upload"],
    optionalInputs: ["script", "voice", "hook"],
    outputType: "video",
    creditCost: {
      type: "fixed",
      min: UGC_VIDEO_CREDIT_COST,
      max: UGC_VIDEO_CREDIT_COST,
    },
    requiresConsent: false,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "redirect_only",
    riskLevel: "medium",
    autoRunAllowed: false,
    notes: [
      "Master Agent UGC flow: generate_product_preview → confirm → generate_video_from_image.",
    ],
  },
  {
    id: "seedance",
    label: "Bild zu Video (Seedance)",
    category: "video",
    status: "production",
    route: "/dashboard/seedance",
    api: "/api/seedance",
    agentToolName: "generate_video_from_image",
    description: "Animiert ein Bild zu einem Kurzvideo via Seedance.",
    canDo: [
      "Image-to-Video",
      "Master Agent nach Preview/Upload",
      "Motion prompt steuern",
    ],
    cannotDo: [
      "Ohne Quellbild starten",
      "Autonom ohne UGC-Bestätigung im Flow",
      "Garantierte Lip-Sync-Qualität",
    ],
    requiredInputs: ["imageUrl", "motionPrompt"],
    optionalInputs: ["duration"],
    outputType: "video",
    creditCost: {
      type: "fixed",
      min: SEEDANCE_CREDIT_COST,
      max: SEEDANCE_CREDIT_COST,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "confirm_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Hohe Provider-Kosten (40 Credits). UGC-Flow verlangt explizite Video-Bestätigung.",
    notes: ["Master Agent: auto after UGC confirm question only."],
  },
  {
    id: "kling25_i2v",
    label: "Kling 2.5 Turbo Pro",
    category: "video",
    status: "beta",
    route: "/dashboard/seedance?model=kling25_turbo_pro",
    provider: KLING_25_PROVIDER,
    modelId: KLING_25_TURBO_PRO_IMAGE_TO_VIDEO_MODEL,
    description:
      "Premium Image-to-Video für flüssige, cineastische Motion aus einem Referenzbild.",
    canDo: [
      "Image-to-Video mit Referenzbild",
      "Premium Motion aus Prompt",
      "Dashboard-Vorbereitung",
    ],
    cannotDo: [
      "Text-to-Video ohne Referenzbild",
      "Autonom ohne Upload",
      "Provider-Ausführung vor Freigabe",
    ],
    requiredInputs: ["imageUrl", "motionPrompt"],
    optionalInputs: ["duration"],
    inputTypes: ["imageUrl", "motionPrompt"],
    outputType: "video",
    creditCost: {
      type: "fixed",
      min: KLING_25_CREDIT_COST,
      max: KLING_25_CREDIT_COST,
      note: "Premium tier above Seedance (40 Credits).",
    },
    requiresConsent: false,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "confirm_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Premium Provider-Kosten (40 Credits). Provider-Anbindung folgt — nur Registry/UI vorbereitet.",
    notes: [
      "Image-to-video only. Text-to-video model registered but not enabled.",
      "Provider jobs disabled until KLING_25_PROVIDER_ENABLED.",
    ],
  },
  {
    id: "live_portrait",
    label: "Live Portrait",
    category: "video",
    status: "production",
    route: "/dashboard/live-portrait",
    api: "/api/live-portrait",
    description: "Portrait-Animation / Live-Portrait-Effekte.",
    canDo: ["Portrait aus Bild animieren", "Dashboard-only execution"],
    cannotDo: [
      "Master/KI Agent Ausführung",
      "Autonom ohne Upload",
      "Face Swap ohne Consent",
    ],
    requiredInputs: ["portraitImage"],
    optionalInputs: ["motionPreset"],
    outputType: "video",
    creditCost: {
      type: "fixed",
      min: 5,
      max: 5,
      note: "Dashboard label 5 Credits.",
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "not_agent_ready",
    riskLevel: "medium",
    autoRunAllowed: false,
  },
  {
    id: "live_creator",
    label: "Live Creator",
    category: "avatar",
    status: "production",
    route: "/dashboard/live-creator",
    agentToolName: "live_creator",
    kiAgentToolName: "live_creator",
    description: "Live-Avatar, Echtzeit-Portrait, Premium Face-Workflows.",
    canDo: [
      "Live-Avatar Session",
      "Master Agent Redirect",
      "Dashboard live-creator / live-creator-new",
    ],
    cannotDo: [
      "Autonom Face Swap",
      "Chat-Upload",
      "Credits-freie Live-Sessions",
    ],
    requiredInputs: ["faceImage or avatar setup"],
    optionalInputs: ["script"],
    outputType: "video",
    creditCost: {
      type: "variable",
      min: FAL_CREDITS.liveCreatorPortrait,
      max: 20,
      note: "Portrait frame ~20 Credits; live session per-minute costs apply.",
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "consent_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason: "Face Swap / Live-Avatar — Einwilligung erforderlich.",
  },
  {
    id: "face_swap",
    label: "Face Swap",
    category: "avatar",
    status: "risky",
    route: "/dashboard/live-creator-new",
    api: "/api/faceswap",
    description: "Gesicht in Video/Bild tauschen — High-Risk Consent Tool.",
    canDo: ["Face Swap im Dashboard (live-creator-new)"],
    cannotDo: [
      "Agent auto-run",
      "Ohne Einwilligung",
      "Deepfake ohne Nutzerkontrolle",
    ],
    requiredInputs: ["sourceFace", "targetMedia"],
    optionalInputs: [],
    outputType: "video",
    creditCost: {
      type: "variable",
      min: 5,
      max: 10,
      note: "Dashboard label 5–10 Credits.",
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "consent_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Face Swap — guards.ts action face_swap requires consent.",
    notes: ["Not exposed as Master Agent executable tool."],
  },
  {
    id: "lora_training",
    label: "LoRA Training",
    category: "image",
    status: "production",
    route: "/dashboard/lora-training",
    api: "/api/lora/train",
    kiAgentToolName: "lora_training",
    description: "Eigenes LoRA-Modell aus Upload-Set trainieren.",
    canDo: [
      "Custom Style/Character LoRA",
      "Dashboard training + generate",
    ],
    cannotDo: [
      "Agent auto-run",
      "Training ohne Upload",
      "Garantierte Identitäts-Treue",
    ],
    requiredInputs: ["trainingImages"],
    optionalInputs: ["steps", "triggerWord"],
    outputType: "mixed",
    creditCost: {
      type: "variable",
      min: LORA_MIN_CREDITS,
      max: LORA_MIN_CREDITS + 50,
      note: "calcLoraCredits(steps); dashboard label ab 10 Credits.",
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "consent_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Teures Training + Upload — Nutzer muss Bildrechte bestätigen.",
    notes: ["AgentTool type exists but not in routeToTools."],
  },
  {
    id: "produkt_werbung",
    label: "Produkt-Werbung",
    category: "video",
    status: "production",
    route: "/dashboard/produkt",
    api: "/api/product-ad/generate",
    agentToolName: "produkt_werbung",
    kiAgentToolName: "produkt_werbung",
    description:
      "Mehrstufige Produkt-Ad-Pipeline (Script, Preview, Video).",
    canDo: [
      "Produkt-Script (KI Agent POST /api/product-ad/script, 0 Credits)",
      "Preview-Bild (Master generate_product_preview)",
      "Dashboard Full Pipeline (Kling Video)",
    ],
    cannotDo: [
      "Autonom ohne Produkt-URL/Bild",
      "Master Agent Full Video ohne Flow",
      "Publish to social",
    ],
    requiredInputs: ["productName"],
    optionalInputs: ["productUrl", "imageUrl", "platform"],
    outputType: "mixed",
    creditCost: {
      type: "variable",
      min: 0,
      max: PRODUCT_AD_CREDITS.standard,
      note: "Script 0 via orchestrator; preview 5; full video up to 75 (Kling).",
    },
    requiresConsent: false,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "redirect_only",
    riskLevel: "medium",
    autoRunAllowed: false,
    notes: [
      "Master redirect href /dashboard/produkt-werbung vs dashboard flow /dashboard/produkt.",
    ],
  },
  {
    id: "product_preview",
    label: "UGC Produkt-Preview",
    category: "image",
    status: "production",
    api: "/api/product-ad",
    agentToolName: "generate_product_preview",
    description: "Produkt-Preview-Bild für UGC-Flow.",
    canDo: ["Preview aus URL oder Bild", "Input für Seedance Schritt"],
    cannotDo: ["Final Video allein", "Ohne Produktname"],
    requiredInputs: ["productName"],
    optionalInputs: ["productUrl", "imageUrl", "productDescription"],
    outputType: "image",
    creditCost: {
      type: "fixed",
      min: AGENT_TOOL_CREDITS.generate_product_preview,
      max: AGENT_TOOL_CREDITS.generate_product_preview,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "medium",
    autoRunAllowed: true,
    notes: ["Part of UGC guided flow; video step needs separate confirm."],
  },
  {
    id: "video_remix",
    label: "Video Remix",
    category: "video",
    status: "production",
    route: "/dashboard/video-remix",
    api: "/api/video-remix",
    agentToolName: "video_remix",
    description: "Remix bestehender Videos mit KI.",
    canDo: ["Master Agent Redirect", "Dashboard upload + remix"],
    cannotDo: ["Chat-Upload", "Autonom ohne Quellvideo"],
    requiredInputs: ["sourceVideo upload"],
    optionalInputs: ["prompt"],
    outputType: "video",
    creditCost: {
      type: "fixed",
      min: 2,
      max: 2,
      note: "Dashboard label 2 Credits.",
    },
    requiresConsent: false,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "redirect_only",
    riskLevel: "medium",
    autoRunAllowed: false,
  },
  {
    id: "viral_score",
    label: "Viral Score",
    category: "analysis",
    status: "production",
    route: "/dashboard/viral-score",
    api: "/api/viral-score",
    agentToolName: "viral_score",
    description: "Bewertet Script + Thumbnail-Idee auf Viral-Potenzial 0–100.",
    canDo: ["Score + Begründung", "Master Agent auto-run"],
    cannotDo: [
      "Echte Performance-Prognose",
      "YouTube Analytics abrufen",
      "Autonom optimieren",
    ],
    requiredInputs: ["script", "thumbnail idea", "niche"],
    optionalInputs: ["language"],
    outputType: "json",
    creditCost: {
      type: "fixed",
      min: VIRAL_SCORE_CREDIT_COST,
      max: VIRAL_SCORE_CREDIT_COST,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
    notes: ["LLM-scored; not empirical performance data."],
  },
  {
    id: "competitor",
    label: "Competitor Analyse",
    category: "analysis",
    status: "production",
    route: "/dashboard/competitor",
    api: "/api/competitor-analysis",
    agentToolName: "analyze_competitor",
    description: "Analysiert einen YouTube-Kanal (Konkurrenz).",
    canDo: [
      "Kanal-Metriken via YouTube",
      "Master Agent auto-run",
      "Content-Gaps identifizieren",
    ],
    cannotDo: [
      "Private Analytics",
      "Autonom Kanäle überwachen",
      "KI Agent Orchestrator (nicht angebunden)",
    ],
    requiredInputs: ["channelUrl"],
    optionalInputs: [],
    outputType: "json",
    creditCost: {
      type: "fixed",
      min: COMPETITOR_ANALYSIS_CREDIT_COST,
      max: COMPETITOR_ANALYSIS_CREDIT_COST,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: true,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
  },
  {
    id: "campaign_autopilot",
    label: "Campaign Autopilot",
    category: "campaign",
    status: "preview",
    route: "/dashboard/campaign-autopilot",
    api: "/api/agent/campaign",
    description:
      "Mock-Kampagnenplaner — kein autonomer Publish-/Media-Agent.",
    canDo: [
      "Preview-Kampagnenplan",
      "Mock Content Items",
      "Job Queue UI",
    ],
    cannotDo: [
      "Echte Posts veröffentlichen",
      "Provider-Media autonom erzeugen",
      "Credits abrechnen (Preview = 0)",
      "Autonomer Kampagnen-Agent",
    ],
    requiredInputs: ["campaignBrief"],
    optionalInputs: ["mode", "platform", "tone"],
    outputType: "mixed",
    creditCost: {
      type: "free",
      min: 0,
      max: 0,
      note: `CAMPAIGN_AUTOPILOT_IS_PREVIEW=${CAMPAIGN_AUTOPILOT_IS_PREVIEW}`,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: false,
    hasRealResearch: false,
    executionMode: "preview_only",
    riskLevel: "medium",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Preview/Mock — kein echter autonomer Kampagnen-Agent.",
    notes: [
      "mockExecutor.ts; guards TODO for publish/legal/high credits.",
      "Also reachable via POST /api/agent/execute?type=campaign.",
    ],
  },
  {
    id: "niche_analyzer",
    label: "Niche Analyzer",
    category: "analysis",
    status: "production",
    route: "/dashboard/niche-analyzer",
    api: "/api/niche-analyzer",
    agentToolName: "analyze_niche",
    description: "LLM-Nischenanalyse mit Ideen und Wettbewerb.",
    canDo: ["Nischen-Ideen", "Master Agent auto-run", "Speichern in Gallery"],
    cannotDo: [
      "Live Marktdaten",
      "Garantierte Trend-Genauigkeit",
      "KI Agent Orchestrator",
    ],
    requiredInputs: ["niche"],
    optionalInputs: ["language"],
    outputType: "json",
    creditCost: {
      type: "fixed",
      min: AGENT_TOOL_CREDITS.analyze_niche,
      max: AGENT_TOOL_CREDITS.analyze_niche,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "medium",
    autoRunAllowed: true,
    notes: [
      "Claude JSON — Halluzinationsrisiko bei Markt-/Trend-Claims.",
    ],
  },
  {
    id: "outlier_detector",
    label: "Outlier Detector",
    category: "analysis",
    status: "production",
    route: "/dashboard/outlier-detector",
    api: "/api/outlier-detector",
    agentToolName: "detect_outlier",
    description: "Findet virale Outlier-Konzepte in einer Nische.",
    canDo: ["Outlier-Konzepte", "Master Agent auto-run"],
    cannotDo: [
      "Live YouTube Outlier Scraping",
      "Verifizierte View-Zahlen",
      "KI Agent Orchestrator",
    ],
    requiredInputs: ["niche"],
    optionalInputs: ["language", "period"],
    outputType: "json",
    creditCost: {
      type: "fixed",
      min: AGENT_TOOL_CREDITS.detect_outlier,
      max: AGENT_TOOL_CREDITS.detect_outlier,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "medium",
    autoRunAllowed: true,
    notes: [
      "LLM-generated outlier concepts — not live outlier database.",
    ],
  },
  {
    id: "thumbnail_concept",
    label: "Thumbnail Konzept",
    category: "image",
    status: "production",
    route: "/dashboard/thumbnail-concept",
    api: "/api/thumbnail-concept",
    agentToolName: "generate_thumbnail",
    kiAgentToolName: "thumbnail_concept",
    description: "CTR-optimierte Thumbnail-Konzepte (Layout + Text).",
    canDo: [
      "Konzept + CSS Layout Preview",
      "Master Agent auto-run",
    ],
    cannotDo: [
      "Fertiges YouTube-Thumbnail rendern (ohne Image Gen)",
      "KI Agent Orchestrator (router only — fällt auf viral-hook)",
    ],
    requiredInputs: ["title"],
    optionalInputs: ["style"],
    outputType: "mixed",
    creditCost: {
      type: "fixed",
      min: AGENT_TOOL_CREDITS.generate_thumbnail,
      max: AGENT_TOOL_CREDITS.generate_thumbnail,
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "auto_allowed",
    riskLevel: "low",
    autoRunAllowed: true,
    notes: ["KI Agent intent thumbnail_concept not wired in toolOrchestrator."],
  },
  {
    id: "stimme_musik",
    label: "Stimme & Musik",
    category: "audio",
    status: "production",
    route: "/dashboard/stimme-musik",
    agentToolName: "stimme_musik",
    kiAgentToolName: "stimme_musik",
    description: "Voiceover, Stimmenklone und Musik.",
    canDo: [
      "TTS / Voice Clone im Dashboard",
      "Master Agent Redirect",
    ],
    cannotDo: [
      "Autonom Voice Clone",
      "Chat-Audio-Upload",
      "KI Agent Orchestrator",
    ],
    requiredInputs: ["text or voiceSample"],
    optionalInputs: ["language", "style"],
    outputType: "audio",
    creditCost: {
      type: "variable",
      min: 3,
      max: 10,
      note: "Voice dashboard ~3 Credits; clone costs vary.",
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "consent_required",
    riskLevel: "high",
    autoRunAllowed: false,
    confirmationRequiredReason:
      "Voice Cloning — guards.ts action voice_cloning requires consent.",
  },
  {
    id: "voice",
    label: "Voice (TTS)",
    category: "audio",
    status: "production",
    route: "/dashboard/voice",
    api: "/api/stimme/speak",
    description: "Text-to-Speech ohne vollständigen Agent-Pfad.",
    canDo: ["TTS im Dashboard"],
    cannotDo: ["Agent auto-run", "Autonom clone"],
    requiredInputs: ["text"],
    optionalInputs: ["voiceId"],
    outputType: "audio",
    creditCost: {
      type: "fixed",
      min: 3,
      max: 3,
      note: "Dashboard label 3 Credits.",
    },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "not_agent_ready",
    riskLevel: "low",
    autoRunAllowed: false,
  },
  {
    id: "motion_transfer",
    label: "Motion Transfer",
    category: "video",
    status: "production",
    route: "/dashboard/motion-transfer",
    api: "/api/motion-transfer",
    description: "Bewegung von Referenzvideo auf Zielbild übertragen.",
    canDo: ["Dashboard motion transfer"],
    cannotDo: ["Agent execution", "Autonom ohne Upload"],
    requiredInputs: ["sourceVideo", "targetImage"],
    optionalInputs: [],
    outputType: "video",
    creditCost: {
      type: "fixed",
      min: MOTION_TRANSFER_CREDIT_COST,
      max: MOTION_TRANSFER_CREDIT_COST,
    },
    requiresConsent: true,
    requiresUpload: true,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "not_agent_ready",
    riskLevel: "medium",
    autoRunAllowed: false,
  },
  {
    id: "gallery",
    label: "Meine Gallery",
    category: "utility",
    status: "production",
    route: "/dashboard/gallery",
    description:
      "Verlauf aller Creations — Browse, Lightbox, Download, keine Generierung.",
    canDo: [
      "Creations anzeigen/filtern",
      "Bild/Video Download & Lightbox",
      "Prompt kopieren",
    ],
    cannotDo: [
      "Neue Generierung starten",
      "Agent tool execution",
      "Credits verbrauchen",
    ],
    requiredInputs: [],
    optionalInputs: ["filter", "search"],
    outputType: "mixed",
    creditCost: { type: "free", min: 0, max: 0 },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: false,
    hasRealResearch: false,
    executionMode: "redirect_only",
    riskLevel: "low",
    autoRunAllowed: false,
    notes: ["Utility for reviewing outputs; not a generation tool."],
  },
  {
    id: "ki_agent_fallback",
    label: "KI Agent (LLM Fallback)",
    category: "text",
    status: "beta",
    route: "/dashboard/ki-agent",
    api: "/api/ki-agent",
    kiAgentToolName: "ki_agent",
    description:
      "Legacy LLM JSON agent — Fallback wenn product-ad/script fehlschlägt.",
    canDo: ["Structured JSON Antwort", "Consent hints in nextActions"],
    cannotDo: [
      "Zuverlässige Tool-Ausführung",
      "Provider-Media",
      "Echte Multi-Tool-Orchestrierung",
    ],
    requiredInputs: ["prompt"],
    optionalInputs: [],
    outputType: "json",
    creditCost: { type: "fixed", min: 1, max: 1 },
    requiresConsent: false,
    requiresUpload: false,
    hasProviderCost: true,
    hasRealResearch: false,
    executionMode: "not_agent_ready",
    riskLevel: "medium",
    autoRunAllowed: false,
    notes: [
      "Separate agent-types.ts tool list; do not merge blindly with agent/types.ts.",
    ],
  },
] as const;

export function getAgentToolById(id: string): AgentToolRegistryItem | undefined {
  return AGENT_TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getAgentToolByAgentName(
  agentToolName: string
): AgentToolRegistryItem | undefined {
  return AGENT_TOOL_REGISTRY.find(
    (tool) =>
      tool.agentToolName === agentToolName ||
      tool.kiAgentToolName === agentToolName
  );
}

export function listAgentTools(): AgentToolRegistryItem[] {
  return [...AGENT_TOOL_REGISTRY];
}

export function listAutoRunnableTools(): AgentToolRegistryItem[] {
  return AGENT_TOOL_REGISTRY.filter((tool) => tool.autoRunAllowed);
}

export function listToolsRequiringConfirmation(): AgentToolRegistryItem[] {
  return AGENT_TOOL_REGISTRY.filter(
    (tool) => tool.executionMode === "confirm_required"
  );
}

export function listToolsRequiringConsent(): AgentToolRegistryItem[] {
  return AGENT_TOOL_REGISTRY.filter(
    (tool) => tool.executionMode === "consent_required" || tool.requiresConsent
  );
}

export function listPreviewOrMockTools(): AgentToolRegistryItem[] {
  return AGENT_TOOL_REGISTRY.filter(
    (tool) =>
      tool.executionMode === "preview_only" ||
      tool.status === "preview" ||
      tool.status === "mock"
  );
}

export function listRedirectOnlyTools(): AgentToolRegistryItem[] {
  return AGENT_TOOL_REGISTRY.filter(
    (tool) => tool.executionMode === "redirect_only"
  );
}

export function isAgentToolAutoRunnable(id: string): boolean {
  return getAgentToolById(id)?.autoRunAllowed ?? false;
}

export function isAgentToolInRegistry(id: string): boolean {
  return AGENT_TOOL_REGISTRY.some((tool) => tool.id === id);
}

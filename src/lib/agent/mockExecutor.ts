// NEXT: Echte Tool-Generierung via toolOrchestrator.ts
//   → src/lib/agent/toolOrchestrator.ts orchestrate() aufrufen
//   → Tabellen agent_executions/campaign_results existieren (Migration 049-051)
//   → Credits werden in /api/agent/execute server-side abgebucht
//   → Job Queue: Vercel Background Functions wenn Campaign > 30 Items

import {
  AgentExecution,
  AgentExecutionStep,
  AgentResult,
  CampaignExecution,
  CampaignGoal,
  CampaignMode,
  CampaignPlatform,
  CampaignResult,
  CampaignTone,
} from "./types";
import {
  buildMockContentItems,
  CAMPAIGN_SPECS,
  CAMPAIGN_STEPS,
  inferBrandDNA,
} from "./campaignPlanner";
import { detectIntent, routeToTools, STEP_LABELS } from "./router";
import { scoreResult } from "./scoring";

function newExecutionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createExecution(prompt: string, userId?: string): AgentExecution {
  const intent = detectIntent(prompt);
  const tools = routeToTools(intent);
  const steps: AgentExecutionStep[] = STEP_LABELS.map((label, i) => ({
    id: `step-${i}`,
    label,
    status: "pending" as const,
    tool: i === 4 ? tools[0] : undefined,
  }));
  return {
    id: newExecutionId(),
    userId,
    prompt,
    intent,
    selectedTools: tools,
    status: "idle",
    steps,
    estimatedCredits: tools.length * 2,
    usedCredits: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function buildMockResult(execution: AgentExecution): AgentResult {
  const scores = scoreResult({}, execution.prompt);

  // TODO: GUARD — öffentlich anzeigen erfordert separate Bestätigung
  // TODO: GUARD — Publishing erfordert separate Bestätigung
  // TODO: GUARD — Face Swap, Voice Cloning, Avatar erfordert Consent-Flow
  // TODO: GUARD — sehr hohe Credits (>20) erfordert separate Bestätigung

  const intentTitles: Record<string, string> = {
    script_generation: "Script bereit",
    product_ad: "Ad Script bereit",
    hook_generation: "10 Hooks erstellt",
    content_calendar: "Content-Kalender bereit",
    image_generation: "Bild-Konzept bereit",
    video_briefing: "Video-Briefing bereit",
    thumbnail_concept: "Thumbnail-Konzept bereit",
    avatar_workflow: "Avatar-Workflow vorbereitet",
    multi_tool_content_package: "Content-Paket bereit",
    unknown: "Output bereit",
  };

  return {
    type: execution.intent,
    title: intentTitles[execution.intent] ?? "Output bereit",
    summary: `Agent hat "${execution.prompt.slice(0, 60)}..." verarbeitet.`,
    outputs: [],
    scores,
    nextActions: ["mehr_varianten", "in_kalender_uebernehmen", "exportieren"],
  };
}

function newCampaignId() {
  return Math.random().toString(36).slice(2);
}

export function createCampaignExecution(
  prompt: string,
  mode: CampaignMode,
  platforms: CampaignPlatform[],
  goal: CampaignGoal,
  tone: CampaignTone,
  userId?: string
): CampaignExecution {
  const { dna } = inferBrandDNA(prompt);
  const spec = CAMPAIGN_SPECS[mode];
  const steps = CAMPAIGN_STEPS.map((label, i) => ({
    id: `step-${i}`,
    label,
    status: "pending" as const,
  }));

  // TODO: GUARD Credits >20 → separate Bestätigung
  // TODO: GUARD Face/Voice/Avatar → Consent-Flow
  // TODO: GUARD Publishing → separate Bestätigung
  // TODO: GUARD Legal Sensitivity 'high' → manuelle Prüfung

  return {
    id: newExecutionId(),
    userId,
    prompt,
    mode,
    platforms,
    goal,
    tone,
    brandDNA: dna,
    status: "idle",
    steps,
    estimatedCredits: spec.estimatedCredits,
    usedCredits: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function buildCampaignResult(exec: CampaignExecution): CampaignResult {
  const { dna, assumptions } = inferBrandDNA(exec.prompt);
  const items = buildMockContentItems(exec.mode, exec.platforms);
  const spec = CAMPAIGN_SPECS[exec.mode];

  // NEXT: Echte Tool-Generierung via toolOrchestrator.ts (siehe Dateikopf)
  //   → Campaign Autopilot auf /api/agent/execute umstellen
  //   → Persistenz via saveCampaignResultServer (Migration 050)

  return {
    id: newCampaignId(),
    mode: exec.mode,
    title: `Beispiel: ${spec.label} Content-Paket`,
    summary: `${items.length} Beispiel-Content-Items für ${exec.platforms.join(", ")} (Preview — keine echte KI-Generierung).`,
    brandDNA: dna,
    assumptionsMade: assumptions,
    items,
    overallScores: {
      brandFit: 88,
      clarity: 85,
      platformFit: 90,
      claimRisk: "low",
      legalRisk: "low",
      overallScore: 87,
    },
    estimatedCredits: spec.estimatedCredits,
    usedCredits: 0,
    createdAt: new Date().toISOString(),
  };
}

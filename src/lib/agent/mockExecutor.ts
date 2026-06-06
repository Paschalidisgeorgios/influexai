// TODO: echte Tool-APIs hier anbinden (script_generator, image_generator etc.)
// TODO: Credits abbuchen nach jedem erfolgreichen Schritt
// TODO: Ergebnis in Supabase agent_executions Tabelle speichern
// TODO: Job Queue anbinden für lange Generierungen (Vercel Background Functions)

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
  buildCampaignSteps,
  buildMockContentItems,
  CAMPAIGN_SPECS,
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
  // TODO: echten Tool-Output hier einsetzen statt Mock
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
  const steps = buildCampaignSteps().map((label, i) => ({
    id: `step-${i}`,
    label,
    status: "pending" as const,
  }));

  // TODO: GUARD — Credits > 20 erfordert separate Bestätigung
  // TODO: GUARD — Face Swap / Voice Cloning erfordert Consent
  // TODO: GUARD — Veröffentlichung erfordert separate Bestätigung
  // TODO: GUARD — Legal Sensitivity 'high' → manuelle Prüfung vor Output

  return {
    id: newCampaignId(),
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

  // TODO: echte Tool-Generierung hier anbinden
  // TODO: Credits nach jedem Schritt abbuchen
  // TODO: Ergebnis in Supabase campaign_results Tabelle speichern
  // TODO: Job Queue für lange Kampagnen anbinden

  return {
    id: newCampaignId(),
    mode: exec.mode,
    title: `${spec.days}-Tage Content-Paket`,
    summary: `${items.length} Content-Items generiert.`,
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
    usedCredits: spec.estimatedCredits,
    createdAt: new Date().toISOString(),
  };
}

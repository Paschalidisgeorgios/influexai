/**
 * Planner v0 scenario reference — not imported by runtime agent code.
 * Run manually in dev: import { runPlannerScenarioChecks } from "./planner-examples"
 */

import { planAgentTask, type AgentPlannerDecision } from "./planner";

export type PlannerScenario = {
  name: string;
  prompt: string;
  expectedDecision: AgentPlannerDecision;
  expectedPrimaryToolId?: string;
  notes: string;
};

export const PLANNER_V0_SCENARIOS: PlannerScenario[] = [
  {
    name: "TikTok Hooks Fitness",
    prompt: "Schreib mir 5 TikTok Hooks für ein Fitnessprodukt",
    expectedDecision: "execute_auto",
    expectedPrimaryToolId: "viral_hook",
    notes: "Hook-Signal → viral_hook, auto/low risk, topic inferable.",
  },
  {
    name: "Beach image generation",
    prompt: "Erstelle ein Bild einer Frau am Strand",
    expectedDecision: "confirm_cost",
    expectedPrimaryToolId: "image_generator",
    notes: "image_generator → confirm_required in registry (~5 Credits).",
  },
  {
    name: "KI-Ich beach",
    prompt: "Erstelle mein KI-Ich am Strand",
    expectedDecision: "require_consent",
    expectedPrimaryToolId: "ki_ich",
    notes: "ki_ich → consent_required; missing selfie upload likely.",
  },
  {
    name: "Face swap",
    prompt: "Mach Face Swap mit diesem Foto",
    expectedDecision: "require_consent",
    expectedPrimaryToolId: "face_swap",
    notes: "face_swap high risk; upload hint may reduce missingInputs.",
  },
  {
    name: "Full campaign",
    prompt: "Plane eine komplette Kampagne",
    expectedDecision: "preview_only",
    expectedPrimaryToolId: "campaign_autopilot",
    notes: "campaign_autopilot always preview_only — no autonomous agent.",
  },
  {
    name: "Current trends research",
    prompt: "Analysiere aktuelle Trends für Fitness auf TikTok",
    expectedDecision: "execute_auto",
    expectedPrimaryToolId: "trend_script",
    notes:
      "Research signal prefers hasRealResearch tools; expect trend_script and research warning if LLM tool picked.",
  },
  {
    name: "TikTok video fitness coach briefing",
    prompt: "Erstelle ein TikTok Video für eine Fitness Coachin",
    expectedDecision: "ask_clarifying_question",
    expectedPrimaryToolId: "script_generator",
    notes:
      "Ambiguous video create → ask script vs. finished KI-video; script_generator as briefing option.",
  },
  {
    name: "TikTok script fitness coach explicit",
    prompt: "Schreib mir ein TikTok Script für eine Fitness Coachin",
    expectedDecision: "execute_auto",
    expectedPrimaryToolId: "script_generator",
    notes: "Explicit TikTok Script → script_generator auto-eligible.",
  },
  {
    name: "Reel script coaching offer",
    prompt: "Schreib mir ein Reel Script für ein Coaching-Angebot",
    expectedDecision: "execute_auto",
    expectedPrimaryToolId: "script_generator",
    notes: "Reel script + coaching → script_generator.",
  },
  {
    name: "Finished UGC with own photo",
    prompt: "Erstelle ein fertiges UGC Video mit meinem Foto",
    expectedDecision: "redirect_to_tool",
    expectedPrimaryToolId: "ugc_video",
    notes:
      "Explicit finished UGC → ugc_video redirect_only; not ambiguous.",
  },
  {
    name: "YouTube Short weight loss ambiguous",
    prompt: "Mach ein YouTube Short über Abnehmen",
    expectedDecision: "ask_clarifying_question",
    expectedPrimaryToolId: "script_generator",
    notes: "Short without Script keyword → clarifying question.",
  },
  {
    name: "YouTube Short script explicit",
    prompt: "Schreib mir ein YouTube Short Script über Abnehmen",
    expectedDecision: "execute_auto",
    expectedPrimaryToolId: "script_generator",
    notes: "Explicit YouTube Short Script → script_generator.",
  },
  {
    name: "TikTok trends research fitness coaches",
    prompt: "Recherchiere aktuelle TikTok Trends für Fitness Coaches",
    expectedDecision: "execute_auto",
    expectedPrimaryToolId: "trend_script",
    notes:
      "Research + TikTok trends → trend_script (hasRealResearch); may include LLM warning on secondary tools.",
  },
];

export function runPlannerScenarioChecks(): {
  name: string;
  ok: boolean;
  decision: AgentPlannerDecision;
  primaryToolId?: string;
  expectedDecision: AgentPlannerDecision;
  warnings: string[];
}[] {
  return PLANNER_V0_SCENARIOS.map((scenario) => {
    const result = planAgentTask({ prompt: scenario.prompt, locale: "de" });
    const primaryToolId = result.selectedTools[0]?.toolId;
    const decisionOk = result.decision === scenario.expectedDecision;
    const toolOk = scenario.expectedPrimaryToolId
      ? primaryToolId === scenario.expectedPrimaryToolId
      : true;

    return {
      name: scenario.name,
      ok: decisionOk && toolOk,
      decision: result.decision,
      primaryToolId,
      expectedDecision: scenario.expectedDecision,
      warnings: result.warnings,
    };
  });
}

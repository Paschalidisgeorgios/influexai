import { describe, it, expect } from "vitest";
import {
  buildAgentPreparedInputs,
  buildAgentPreparedInputsOrNull,
  buildSuggestedPrompt,
  isPreparedInputsSafe,
  isSafeCtaLabel,
  resolveRecommendedAspectRatio,
} from "@/lib/tools/agent-prepared-inputs";
import { recommendToolsForCreatorGoal } from "@/lib/tools/agent-tool-capability-planner";
import { buildRecommendationCards } from "@/lib/tools/agent-recommendation-ui";
import { buildAgentToolHandoff, reconstructHandoffForTool } from "@/lib/tools/agent-tool-handoff";

const GOAL = "TikTok Video mit meinem AI-Influencer";

function handoffFor(toolId: string) {
  const plan = recommendToolsForCreatorGoal(GOAL);
  const card =
    buildRecommendationCards(plan).find((c) => c.toolId === toolId) ??
    buildRecommendationCards(plan, true).find((c) => c.toolId === toolId);
  if (card) return buildAgentToolHandoff(plan, card, `h_${toolId}`);
  const reconstructed = reconstructHandoffForTool(GOAL, toolId);
  if (!reconstructed) throw new Error(`no handoff for ${toolId}`);
  return reconstructed;
}

describe("agent prepared inputs", () => {
  it("includes 9:16 for TikTok AI-Influencer goal", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    expect(prepared.recommendedAspectRatio).toBe("9:16");
    expect(isPreparedInputsSafe(prepared)).toBe(true);
  });

  it("requires start image and motion description for img-to-video", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    const required = prepared.inputChecklist.filter((i) => i.required);
    expect(required.some((i) => i.id === "start_image")).toBe(true);
    expect(required.some((i) => i.id === "motion_prompt")).toBe(true);
  });

  it("ai-creator mentions consent/draft/handoff without training execution", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("ai-creator"));
    const labels = prepared.inputChecklist.map((i) => i.label).join(" ");
    expect(labels).toMatch(/Consent|Draft|Handoff|Upload-Shell/i);
    expect(prepared.suggestedPrompt.toLowerCase()).not.toMatch(/training starten|upload starten/);
    expect(prepared.disabledExecutionMessage.toLowerCase()).toMatch(/deaktiviert/);
  });

  it("viral hook does not promise gallery or video output", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("viral-hook"));
    expect(prepared.outputExpectation.toLowerCase()).toMatch(/kein galerie|kein.*video-output/);
    expect(prepared.outputExpectation.toLowerCase()).toMatch(/hook/);
  });

  it("contains no secrets, base64, or provider payloads", () => {
    for (const toolId of ["img-to-video", "ai-creator", "viral-hook"] as const) {
      const prepared = buildAgentPreparedInputs(handoffFor(toolId));
      const serialized = JSON.stringify(prepared).toLowerCase();
      expect(serialized).not.toMatch(/apikey|data:image|providerpayload|service_role/);
      expect(isPreparedInputsSafe(prepared)).toBe(true);
    }
  });

  it("safeCtaLabel has no execution promises", () => {
    for (const toolId of ["img-to-video", "ai-creator", "viral-hook"] as const) {
      const prepared = buildAgentPreparedInputs(handoffFor(toolId));
      expect(isSafeCtaLabel(prepared.safeCtaLabel)).toBe(true);
      expect(prepared.safeCtaLabel.toLowerCase()).not.toMatch(
        /jetzt generieren|training starten|upload starten|credits abbuchen/
      );
    }
  });

  it("returns null without handoff", () => {
    expect(buildAgentPreparedInputsOrNull(null)).toBeNull();
    expect(buildAgentPreparedInputsOrNull(undefined)).toBeNull();
  });

  it("buildSuggestedPrompt stays preparation-only for vertical goals", () => {
    const prompt = buildSuggestedPrompt(GOAL, "text-to-video");
    expect(prompt).toContain("9:16");
    expect(prompt.toLowerCase()).toMatch(/kein render|vorbereiten|idee/i);
  });

  it("resolveRecommendedAspectRatio prefers vertical goal keywords", () => {
    expect(resolveRecommendedAspectRatio(GOAL, null, "img-to-video")).toBe("9:16");
  });
});

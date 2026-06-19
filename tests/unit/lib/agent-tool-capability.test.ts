import { describe, it, expect } from "vitest";
import {
  AGENT_TOOL_CAPABILITY_MAP,
  getToolCapabilities,
  getToolCapabilityById,
  getProviderDisabledAgentMessage,
} from "@/lib/tools/agent-tool-capability-map";
import {
  recommendToolsForCreatorGoal,
  getNextWorkflowSteps,
} from "@/lib/tools/agent-tool-capability-planner";

const IMAGE_VIDEO_TOOLS = new Set([
  "image-gen",
  "img-to-video",
  "text-to-video",
  "talking-avatar",
  "live-creator",
  "face-swap-video",
]);

describe("agent tool capability map", () => {
  it("exports all required tool families", () => {
    const ids = AGENT_TOOL_CAPABILITY_MAP.map((c) => c.toolId);
    expect(ids).toContain("ai-creator");
    expect(ids).toContain("lora-training");
    expect(ids).toContain("image-gen");
    expect(ids).toContain("img-to-video");
    expect(ids).toContain("text-to-video");
    expect(ids).toContain("talking-avatar");
    expect(ids).toContain("live-creator");
    expect(ids).toContain("face-swap-video");
    expect(ids).toContain("viral-hook");
    expect(ids).toContain("content-calendar");
    expect(ids).toContain("trend-script");
    expect(ids).toContain("gallery");
    expect(ids).toContain("settings");
    expect(ids).toContain("credits");
  });

  it.each(AGENT_TOOL_CAPABILITY_MAP.map((c) => [c.toolId, c]))(
    "%s has required capability fields",
    (_id, cap) => {
      expect(cap.safeRoutingTarget).toMatch(/^\//);
      expect(cap.executionStatus).toBeTruthy();
      expect(cap.providerDisabledMessage.length).toBeGreaterThan(10);
      expect(Array.isArray(cap.requiredInputs)).toBe(true);
      expect(Array.isArray(cap.outputs)).toBe(true);
      expect(cap.outputs.length).toBeGreaterThan(0);
      expect(Array.isArray(cap.useCases)).toBe(true);
      expect(cap.creditEstimate).toBeTruthy();
      expect(cap.agentInstructions.length).toBeGreaterThan(10);
    }
  );

  it("sets recommendedAspectRatios for image and video tools", () => {
    for (const cap of AGENT_TOOL_CAPABILITY_MAP) {
      if (IMAGE_VIDEO_TOOLS.has(cap.toolId)) {
        expect(cap.recommendedAspectRatios.length).toBeGreaterThan(0);
      }
    }
  });

  it("getToolCapabilities returns a copy of the registry", () => {
    expect(getToolCapabilities()).toHaveLength(AGENT_TOOL_CAPABILITY_MAP.length);
  });

  it("getToolCapabilityById resolves ai-creator", () => {
    const cap = getToolCapabilityById("ai-creator");
    expect(cap?.label).toMatch(/AI Creator/i);
    expect(cap?.requiredInputs.some((i) => i.id === "consent")).toBe(true);
  });

  it("getProviderDisabledAgentMessage returns tool-specific text", () => {
    const msg = getProviderDisabledAgentMessage("ai-creator");
    expect(msg.toLowerCase()).toMatch(/deaktiviert|nicht/);
  });
});

describe("agent tool capability planner", () => {
  it("recommends AI Creator and video tools for TikTok AI-Influencer goal", () => {
    const plan = recommendToolsForCreatorGoal(
      "Ich brauche ein TikTok Video mit meinem AI-Influencer"
    );

    const ids = plan.recommendations.map((r) => r.toolId);
    expect(ids).toContain("ai-creator");
    expect(
      ids.some((id) => id === "img-to-video" || id === "text-to-video")
    ).toBe(true);
    expect(plan.recommendedAspectRatio).toBe("9:16");
    expect(plan.providerDisabledNotice.toLowerCase()).toMatch(/deaktiviert/);
    expect(plan.workflowSteps.length).toBeGreaterThan(3);
  });

  it("includes optional viral hook for influencer video goals", () => {
    const plan = recommendToolsForCreatorGoal(
      "TikTok Video mit meinem AI-Influencer"
    );
    const optionalIds = plan.optionalTools.map((t) => t.toolId);
    expect(optionalIds).toContain("viral-hook");
  });

  it("getNextWorkflowSteps guides AI Creator character flow", () => {
    const steps = getNextWorkflowSteps("ai-creator", {
      hasCharacterDraft: false,
      consentConfirmed: false,
    });
    expect(steps.some((s) => /Character Draft/i.test(s))).toBe(true);
    expect(steps.some((s) => /Consent/i.test(s))).toBe(true);
    expect(steps.some((s) => /deaktiviert/i.test(s))).toBe(true);
  });

  it("communicates provider disabled in workflow steps", () => {
    const steps = getNextWorkflowSteps("image-gen");
    expect(steps.some((s) => /deaktiviert|Provider/i.test(s))).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  appendHandoffQueryParams,
  buildAgentToolHandoff,
  buildHandoffNavigationHref,
  isHandoffPayloadSafe,
  parseHandoffSearchParams,
  reconstructHandoffForTool,
  resolveAgentToolHandoff,
  truncateGoalForUrl,
} from "@/lib/tools/agent-tool-handoff";
import { recommendToolsForCreatorGoal } from "@/lib/tools/agent-tool-capability-planner";
import { buildRecommendationCards } from "@/lib/tools/agent-recommendation-ui";

const GOAL = "TikTok Video mit meinem AI-Influencer";

describe("agent tool handoff", () => {
  it("builds handoff from recommendation without forbidden payload fields", () => {
    const plan = recommendToolsForCreatorGoal(GOAL);
    const card = buildRecommendationCards(plan).find((c) => c.toolId === "ai-creator");
    expect(card).toBeDefined();

    const handoff = buildAgentToolHandoff(plan, card!, "test_handoff_id");

    expect(handoff.originalGoal).toBe(GOAL);
    expect(handoff.selectedToolId).toBe("ai-creator");
    expect(handoff.recommendedToolIds).toContain("ai-creator");
    expect(handoff.recommendedAspectRatio).toBe("9:16");
    expect(handoff.requiredInputs.length).toBeGreaterThan(0);
    expect(handoff.outputs.length).toBeGreaterThan(0);
    expect(handoff.safeRoutingTarget).toMatch(/^\//);
    expect(handoff.source).toBe("agent-recommendation");
    expect(isHandoffPayloadSafe(handoff)).toBe(true);

    const serialized = JSON.stringify(handoff).toLowerCase();
    expect(serialized).not.toMatch(/apikey|data:image|providerpayload|service_role/);
    expect(serialized).not.toMatch(/[A-Za-z0-9+/=]{500,}/);
  });

  it("appends compact query params without large JSON blobs", () => {
    const href = appendHandoffQueryParams(
      "/dashboard?tool=img-to-video",
      "h_test123",
      GOAL
    );

    expect(href).toContain("fromAgent=1");
    expect(href).toContain("handoff=h_test123");
    expect(href).toContain("tool=img-to-video");
    expect(href.length).toBeLessThan(512);
    expect(href).not.toContain("%7B");
  });

  it("truncates long goals for URL fallback", () => {
    const longGoal = "A".repeat(200);
    expect(truncateGoalForUrl(longGoal).length).toBeLessThanOrEqual(120);
  });

  it("reconstructs handoff from goal fallback when session storage is missing", () => {
    const reconstructed = reconstructHandoffForTool(GOAL, "img-to-video");
    expect(reconstructed).not.toBeNull();
    expect(reconstructed?.selectedToolId).toBe("img-to-video");
    expect(reconstructed?.recommendedAspectRatio).toBe("9:16");
    expect(reconstructed?.providerDisabledMessage.toLowerCase()).toMatch(/deaktiviert/);
  });

  it("parseHandoffSearchParams reads fromAgent and goal from URL", () => {
    const parsed = parseHandoffSearchParams(
      new URLSearchParams("fromAgent=1&handoff=h1&goal=TikTok")
    );
    expect(parsed.fromAgent).toBe(true);
    expect(parsed.handoffId).toBe("h1");
    expect(parsed.goalFallback).toBe("TikTok");
  });

  it("reconstructs from goal fallback when stored handoff is missing", () => {
    const resolved = resolveAgentToolHandoff(null, GOAL, "ai-creator", null);
    expect(resolved?.selectedToolId).toBe("ai-creator");
  });

  it("resolveAgentToolHandoff falls back when stored handoff mismatches tool", () => {
    const plan = recommendToolsForCreatorGoal(GOAL);
    const card = buildRecommendationCards(plan).find((c) => c.toolId === "ai-creator")!;
    const stored = buildAgentToolHandoff(plan, card, "h1");

    const resolved = resolveAgentToolHandoff("h1", GOAL, "img-to-video", stored);
    expect(resolved?.selectedToolId).toBe("img-to-video");
  });

  it("buildHandoffNavigationHref uses safeRoutingTarget from card", () => {
    const plan = recommendToolsForCreatorGoal(GOAL);
    const card = buildRecommendationCards(plan)[0];
    const href = buildHandoffNavigationHref(plan, card, "h_nav");
    expect(href.startsWith(card.safeRoutingTarget.split("?")[0])).toBe(true);
  });
});

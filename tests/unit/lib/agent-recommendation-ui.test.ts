import { describe, it, expect } from "vitest";
import {
  AGENT_EXECUTION_DISABLED_COPY,
  buildRecommendationCards,
  getRecommendationCtaLabel,
  isForbiddenCtaLabel,
  planCreatorGoal,
} from "@/lib/tools/agent-recommendation-ui";
import { recommendToolsForCreatorGoal } from "@/lib/tools/agent-tool-capability-planner";

describe("agent recommendation UI helpers", () => {
  it("uses safe CTA labels without forbidden execution phrases", () => {
    const labels = [
      getRecommendationCtaLabel("available"),
      getRecommendationCtaLabel("provider_disabled"),
      getRecommendationCtaLabel("shell_only"),
    ];

    for (const label of labels) {
      expect(isForbiddenCtaLabel(label)).toBe(false);
    }

    expect(isForbiddenCtaLabel("Jetzt generieren")).toBe(true);
    expect(isForbiddenCtaLabel("Training starten")).toBe(true);
  });

  it("planCreatorGoal delegates to recommendToolsForCreatorGoal", () => {
    const goal = "TikTok Video mit meinem AI-Influencer";
    const direct = recommendToolsForCreatorGoal(goal);
    const viaHelper = planCreatorGoal(goal);

    expect(viaHelper?.goal).toBe(direct.goal);
    expect(viaHelper?.recommendations.map((r) => r.toolId)).toEqual(
      direct.recommendations.map((r) => r.toolId)
    );
  });

  it("buildRecommendationCards includes capability metadata and safe routing", () => {
    const plan = recommendToolsForCreatorGoal(
      "TikTok Video mit meinem AI-Influencer"
    );
    const cards = buildRecommendationCards(plan);

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(card.safeRoutingTarget).toMatch(/^\//);
      expect(card.outputs.length).toBeGreaterThan(0);
      expect(card.providerDisabledMessage.length).toBeGreaterThan(10);
      expect(isForbiddenCtaLabel(card.ctaLabel)).toBe(false);
      expect(card.ctaLabel).not.toMatch(/generieren|training|upload starten/i);
    }

    const ids = cards.map((c) => c.toolId);
    expect(ids).toContain("ai-creator");
    expect(ids.some((id) => id === "img-to-video" || id === "text-to-video")).toBe(
      true
    );
  });

  it("surfaces provider-disabled copy for influencer video goals", () => {
    const plan = planCreatorGoal("TikTok Video mit meinem AI-Influencer");
    expect(plan?.providerDisabledNotice.toLowerCase()).toMatch(/deaktiviert/);
    expect(AGENT_EXECUTION_DISABLED_COPY.toLowerCase()).toMatch(/generiert/);

    const cards = buildRecommendationCards(plan!);
    expect(
      cards.every((c) =>
        c.providerDisabledMessage.toLowerCase().includes("deaktiviert")
      )
    ).toBe(true);
  });

  it("prioritizes 9:16 for TikTok goals", () => {
    const plan = planCreatorGoal("TikTok Video mit meinem AI-Influencer");
    expect(plan?.recommendedAspectRatio).toBe("9:16");
  });
});

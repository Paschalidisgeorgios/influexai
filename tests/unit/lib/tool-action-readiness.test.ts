import { describe, it, expect } from "vitest";
import { buildAgentPreparedInputs } from "@/lib/tools/agent-prepared-inputs";
import { recommendToolsForCreatorGoal } from "@/lib/tools/agent-tool-capability-planner";
import { buildRecommendationCards } from "@/lib/tools/agent-recommendation-ui";
import { buildAgentToolHandoff, reconstructHandoffForTool } from "@/lib/tools/agent-tool-handoff";
import {
  buildImgToVideoLocalState,
  buildTextToVideoLocalState,
  buildToolActionReadiness,
  isProvidersDisabledForReadiness,
  isReadinessStateSafe,
  isSafeReadinessCtaLabel,
  READINESS_EXECUTION_DISABLED_MESSAGE,
} from "@/lib/tools/tool-action-readiness";

const GOAL = "TikTok Video mit meinem AI-Influencer";
const PROVIDERS_OFF = { providerDisabled: true };

function handoffFor(toolId: string) {
  const plan = recommendToolsForCreatorGoal(GOAL);
  const card =
    buildRecommendationCards(plan).find((c) => c.toolId === toolId) ??
    buildRecommendationCards(plan, true).find((c) => c.toolId === toolId);
  if (!card) {
    const reconstructed = reconstructHandoffForTool(GOAL, toolId);
    if (!reconstructed) throw new Error(`no handoff for ${toolId}`);
    return reconstructed;
  }
  return buildAgentToolHandoff(plan, card, `h_${toolId}`);
}

describe("tool action readiness", () => {
  it("keeps canExecute false when PROVIDERS_DISABLED=true", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    const local = buildImgToVideoLocalState({
      imageUrl: "https://example.com/start.jpg",
      prompt: "Langsame Kamerafahrt",
      aspectRatio: "9:16",
    });
    const readiness = buildToolActionReadiness(prepared, local, PROVIDERS_OFF);
    expect(isProvidersDisabledForReadiness("img-to-video", PROVIDERS_OFF)).toBe(true);
    expect(readiness.canExecute).toBe(false);
    expect(readiness.providerDisabled).toBe(true);
  });

  it("img-to-video without start image is missing_inputs", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    const readiness = buildToolActionReadiness(
      prepared,
      buildImgToVideoLocalState({ prompt: "Motion", aspectRatio: "9:16" }),
      PROVIDERS_OFF
    );
    expect(readiness.status).toBe("missing_inputs");
    expect(readiness.missingRequiredInputs).toContain("Startbild");
  });

  it("img-to-video with start image, motion and 9:16 is ready_preview with canExecute false", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    const readiness = buildToolActionReadiness(
      prepared,
      buildImgToVideoLocalState({
        imageUrl: "https://example.com/start.jpg",
        prompt: "Sanfte Kamerafahrt",
        aspectRatio: "9:16",
      }),
      PROVIDERS_OFF
    );
    expect(readiness.status).toBe("ready_preview");
    expect(readiness.canExecute).toBe(false);
    expect(readiness.completedInputs).toContain("Startbild");
    expect(readiness.completedInputs).toContain("Bewegungsbeschreibung");
    expect(readiness.completedInputs).toContain("Format 9:16");
  });

  it("ai-creator without consent or draft is missing_inputs", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("ai-creator"));
    const readiness = buildToolActionReadiness(
      prepared,
      { hasConsent: false, hasCharacterDraft: false },
      PROVIDERS_OFF
    );
    expect(readiness.status).toBe("missing_inputs");
    expect(readiness.missingRequiredInputs).toEqual(
      expect.arrayContaining(["Consent bestätigen", "Character Draft prüfen"])
    );
  });

  it("text-to-video without prompt is missing_inputs", () => {
    const handoff = reconstructHandoffForTool(
      "Kurzes TikTok Video aus Textbriefing",
      "text-to-video"
    );
    expect(handoff).not.toBeNull();
    const prepared = buildAgentPreparedInputs(handoff!);
    const readiness = buildToolActionReadiness(
      prepared,
      buildTextToVideoLocalState({ aspectRatio: "9:16" }),
      PROVIDERS_OFF
    );
    expect(readiness.status).toBe("missing_inputs");
    expect(readiness.missingRequiredInputs).toContain("Script / Szenenbeschreibung");
  });

  it("viral hook does not promise gallery or video output", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("viral-hook"));
    const readiness = buildToolActionReadiness(
      prepared,
      { audience: "Creator", topic: GOAL, platform: "TikTok" },
      PROVIDERS_OFF
    );
    expect(readiness.outputExpectation?.toLowerCase()).toMatch(/kein galerie|kein.*video-output/);
    expect(readiness.outputExpectation?.toLowerCase()).toMatch(/hook/);
  });

  it("safeCtaLabel has no forbidden execution promises", () => {
    for (const toolId of ["img-to-video", "ai-creator", "viral-hook"] as const) {
      const prepared = buildAgentPreparedInputs(handoffFor(toolId));
      const readiness = buildToolActionReadiness(prepared, {}, PROVIDERS_OFF);
      expect(isSafeReadinessCtaLabel(readiness.safeCtaLabel)).toBe(true);
      expect(readiness.safeCtaLabel.toLowerCase()).not.toMatch(
        /jetzt generieren|training starten|upload starten|credits abbuchen/
      );
    }
  });

  it("readiness state contains no secrets, base64, or provider payloads", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    const readiness = buildToolActionReadiness(
      prepared,
      buildImgToVideoLocalState({
        imageUrl: "https://example.com/start.jpg",
        prompt: "Motion",
        aspectRatio: "9:16",
      }),
      PROVIDERS_OFF
    );
    const serialized = JSON.stringify(readiness).toLowerCase();
    expect(serialized).not.toMatch(/apikey|data:image|providerpayload|service_role/);
    expect(isReadinessStateSafe(readiness)).toBe(true);
  });

  it("uses extended execution disabled message when providers disabled", () => {
    const prepared = buildAgentPreparedInputs(handoffFor("img-to-video"));
    const readiness = buildToolActionReadiness(prepared, {}, PROVIDERS_OFF);
    expect(readiness.executionDisabledMessage).toBe(READINESS_EXECUTION_DISABLED_MESSAGE);
    expect(readiness.executionDisabledMessage).toMatch(/abgerechnet/);
  });
});

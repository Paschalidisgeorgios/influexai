import type { GeneratedScript } from "@/app/actions/generate-script";
import type { NicheIdea } from "@/app/actions/analyze-niche";

export function isE2eMockGenerationsEnabled() {
  return process.env.E2E_MOCK_GENERATIONS === "1";
}

export function e2eMockScript(topic: string): GeneratedScript {
  return {
    script: `[HOOK]\nE2E Test Hook: ${topic}\n\n[MAIN]\nHauptinhalt für das Video.\n\n[CTA]\nFolge für mehr Content!`,
    hookVariants: [],
    wordCount: 24,
    estimatedSeconds: 10,
    toneDescription: "E2E Mock — energetisch",
  };
}

export function e2eMockNiches(topic: string): NicheIdea[] {
  return Array.from({ length: 5 }, (_, i) => ({
    title: `${topic} Nische ${i + 1}`,
    description: `Profitables Sub-Nischen-Segment ${i + 1} für ${topic}.`,
    competition: (["low", "medium", "high"] as const)[i % 3],
    potential: (Math.min(5, i + 2) || 3) as 1 | 2 | 3 | 4 | 5,
    trend: "rising" as const,
    videoIdeas: [
      `${topic} Video-Idee ${i + 1}a`,
      `${topic} Video-Idee ${i + 1}b`,
      `${topic} Video-Idee ${i + 1}c`,
    ],
  }));
}

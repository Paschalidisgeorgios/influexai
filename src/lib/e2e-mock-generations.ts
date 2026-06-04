import type { GeneratedScript } from "@/app/actions/generate-script";
import type { NicheIdea } from "@/app/actions/analyze-niche";
import type { OutlierConcept } from "@/lib/outlier-analysis";
import type { RemixConcept } from "@/lib/remix-analysis";

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

export function e2eMockOutliers(niche: string, language = "de"): OutlierConcept[] {
  const prefix = language === "de" ? "Viral" : "Viral";
  return Array.from({ length: 6 }, (_, i) => ({
    title: `${prefix}: ${niche} Outlier ${i + 1}`,
    thumbnailConcept: `Kontrastreicher Text + Gesicht — ${niche}`,
    outlierScore: 7 + (i % 3),
    whyItWorked: [
      "Hook in den ersten 3 Sekunden.",
      "Hohe Relevanz für die Zielgruppe.",
      "Thumbnail erzeugt Neugier.",
    ] as [string, string, string],
    hook:
      language === "de"
        ? `Das hat niemand über ${niche} erzählt…`
        : `Nobody talks about this in ${niche}…`,
    viralMechanism: (
      [
        "curiosity_gap",
        "contrarian",
        "list",
        "transformation",
        "secret",
        "controversy",
      ] as const
    )[i % 6],
  }));
}

export function e2eMockRemixes(niche: string, remixStyle: string): RemixConcept[] {
  return Array.from({ length: 4 }, (_, i) => ({
    remixTitle: `Remix ${i + 1}: ${niche}`,
    description: `E2E Mock — ${remixStyle} für ${niche}.`,
    hook: `Was niemand über ${niche} sagt…`,
    structure: {
      intro: "Hook + Kontext",
      middle: "Kerninhalt mit Twist",
      cta: "Follow für Teil 2",
    },
    similarityPercent: 35 + i * 10,
    uniqueAngle: `Lokaler DACH-Twist #${i + 1}`,
  }));
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

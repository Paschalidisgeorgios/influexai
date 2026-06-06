import type { ContentScores, QualityDecision } from "./types";

export function scoreTextContent(
  text: string,
  brand: {
    forbiddenClaims?: string[];
    toneKeywords?: string[];
  }
): ContentScores {
  const t = text.toLowerCase();

  const hasRiskyFinance =
    /garantiert|spart.*€|sicher.*rendite|100%.*(gewinn|erfolg)/i.test(t);
  const hasRiskyHealth = /heilt|kuriert|garantierte.*gesundheit/i.test(t);
  const claimRisk = hasRiskyFinance || hasRiskyHealth ? "high" : "low";

  let brandFit = 75;
  if (brand.forbiddenClaims?.some((c) => t.includes(c.toLowerCase())))
    brandFit -= 20;
  if (text.length > 50 && text.length < 300) brandFit += 10;

  const ctaStrength = /kommentier|klick|folg|link|schreib|jetzt/i.test(t)
    ? 82
    : 55;

  const hookScore = /\?|—|\.\.\.|ich|du|stell dir vor/i.test(t) ? 88 : 65;

  // TODO: echte Duplikat-Prüfung gegen gespeicherte Outputs

  const overallScore = Math.round((brandFit + ctaStrength + hookScore) / 3);

  return { brandFit, ctaStrength, hookScore, claimRisk, overallScore };
}

export function qualityDecision(scores: ContentScores): QualityDecision {
  const s = scores.overallScore ?? 0;
  if (scores.claimRisk === "high" || scores.legalRisk === "high")
    return "manual_review";
  if (s >= 90) return "accept";
  if (s >= 75) return "improve";
  return "regenerate";
}

// TODO: Bild-QA hier anbinden (Anatomy Score, Hand Check, Face Quality, Text Legibility)
// TODO: Video-QA hier anbinden (Scene Continuity, Face Consistency, Voiceover Fit)
// Wichtig: Text und Logo NICHT von Bild-KI generieren lassen
// → Motiv/Hintergrund generieren, Text/Logo als echtes Overlay im Designsystem

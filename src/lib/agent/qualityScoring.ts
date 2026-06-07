import type { ContentScores, QualityDecision } from "./types";

export function scoreTextContent(text: string): ContentScores {
  const t = text.toLowerCase();
  const claimRisk =
    /garantiert|spart.*€|sicher.*rendite|100%.*(gewinn|erfolg)|heilt|kuriert/i.test(
      t
    )
      ? "high"
      : "low";

  let brandFit = 75;
  if (text.length > 50 && text.length < 300) brandFit += 10;
  const ctaStrength = /kommentier|klick|folg|link|schreib|jetzt/i.test(t)
    ? 82
    : 55;
  const hookScore = /\?|—|\.\.\.|ich|du|stell dir vor/i.test(t) ? 88 : 65;
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

// TODO: Bild-QA anbinden (Anatomy, Hand/Finger, Face, Text Legibility)
// TODO: Video-QA anbinden (Scene Continuity, Face Consistency)
// Regel: Text/Logo NIE von Bild-KI generieren —
//   Motiv generieren, Text/Logo als echtes Overlay setzen

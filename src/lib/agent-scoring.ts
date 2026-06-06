import type { AgentOutput, AgentScores, FitLevel, RiskLevel } from "./agent-types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function scoreOutput(output: AgentOutput, platform: string): AgentScores {
  let hookScore = 50;
  let clarity = 50;
  let ctaStrength = 50;

  if (output.type === "script") {
    const hook = output.hook;
    if (hook.length > 20 && hook.length < 200) hookScore += 20;
    if (/\?|—|\.\.\./.test(hook)) hookScore += 15;
    if (/ich|du|wir/i.test(hook)) hookScore += 10;
    if (hook.length > 200) hookScore -= 15;

    const story = output.story;
    if (story.length > 30 && story.length < 500) clarity += 25;
    if (story.length > 500) clarity -= 10;

    const cta = output.cta;
    if (/kommentier|klick|link|folg|schick/i.test(cta)) ctaStrength += 30;
    if (cta.length > 10 && cta.length < 100) ctaStrength += 15;
  }

  if (output.type === "hooks") {
    const avg =
      output.variants.reduce((s, v) => s + v.length, 0) /
      (output.variants.length || 1);
    if (avg > 20 && avg < 150) hookScore += 25;
    if (output.variants.length >= 5) hookScore += 10;
    clarity += 20;
  }

  const platformFit: FitLevel = /tiktok|reels|shorts/i.test(platform)
    ? "high"
    : /instagram|youtube/i.test(platform)
      ? "medium"
      : "low";

  const trendFit: FitLevel = "medium";

  const allText = JSON.stringify(output);
  const hasRisk =
    /garantiert|versprechen|sicher.*gewinn|100%.*erfolg|ärztlich/i.test(allText);
  const riskLevel: RiskLevel = hasRisk ? "high" : "low";

  return {
    hookScore: clamp(hookScore, 0, 100),
    clarity: clamp(clarity, 0, 100),
    platformFit,
    trendFit,
    ctaStrength: clamp(ctaStrength, 0, 100),
    riskLevel,
  };
}

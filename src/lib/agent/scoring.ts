import { AgentScores, AgentResult } from "./types";

export function scoreResult(
  result: Partial<AgentResult>,
  platform: string
): AgentScores {
  const text = JSON.stringify(result).toLowerCase();

  // RiskLevel — prüfe gefährliche Claims
  const hasRisk =
    /garantiert|spart.*€|versprechen|sicher.*gewinn|ärztlich|100%.*(erfolg|rendite)/i.test(
      text
    );

  // HookScore heuristisch
  let hookScore = 60;
  if (/hook/i.test(text)) hookScore += 15;
  if (/\?|—|\.\.\./.test(text)) hookScore += 10;
  if (text.length > 200) hookScore += 10;

  // PlatformFit
  const platformFit = /tiktok|reels|shorts/i.test(platform)
    ? ("high" as const)
    : /instagram|youtube/i.test(platform)
      ? ("medium" as const)
      : ("low" as const);

  return {
    hookScore: Math.min(hookScore, 100),
    clarity: 78,
    platformFit,
    trendFit: "medium",
    ctaStrength: 72,
    riskLevel: hasRisk ? "high" : "low",
  };
}

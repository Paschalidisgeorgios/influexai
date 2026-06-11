import type { AgentIntent, AgentOutput, AgentResponse } from "@/lib/agent-types";

export const INTENT_BADGE_LABELS: Record<AgentIntent, string> = {
  script_generation: "Skript",
  ad_creation: "Werbung",
  hook_generation: "Hook-Generierung",
  calendar_planning: "Kalender",
  thumbnail_creation: "Thumbnail",
  avatar_creation: "Avatar",
  unknown: "Strategie",
};

export function formatAgentOutputMarkdown(output: AgentOutput): string {
  switch (output.type) {
    case "script":
      return [
        "**Hook**",
        output.hook,
        "",
        "**Story**",
        output.story,
        "",
        "**CTA**",
        output.cta,
        output.hashtags.length
          ? `\n**Hashtags:** ${output.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "hooks":
      return output.variants
        .map((v, i) => `${i + 1}. ${v}`)
        .join("\n");
    case "calendar":
      return [
        output.entries
          .map((e) => `- **${e.day}** (${e.format}): ${e.idea}`)
          .join("\n"),
        output.bestTime ? `\n**Beste Posting-Zeit:** ${output.bestTime}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "ad":
      return [
        "**Hook**",
        output.hook,
        "",
        "**Spot**",
        output.body,
        output.hashtags.length
          ? `\n**Hashtags:** ${output.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "raw":
    default:
      return output.text;
  }
}

export function formatAgentResponseMarkdown(response: AgentResponse): string {
  const parts: string[] = [];
  if (response.summary) {
    parts.push(response.summary);
    parts.push("");
  }
  parts.push(formatAgentOutputMarkdown(response.output));
  if (response.missingInfo.length > 0) {
    parts.push("");
    parts.push("**Noch offen:**");
    for (const info of response.missingInfo) {
      parts.push(`- ${info}`);
    }
  }
  if (response.nextActions.length > 0) {
    parts.push("");
    parts.push("**Nächster Schritt:**");
    parts.push(`→ ${response.nextActions[0]}`);
  }
  return parts.join("\n");
}

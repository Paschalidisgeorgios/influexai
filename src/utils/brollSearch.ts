export type BrollMatch = {
  id: string;
  visualPrompt: string;
  scriptSegment: string;
  segmentIndex: number;
  similarity: number;
  trendScore: number;
  tags: string[];
};

export type ScriptSegment = {
  index: number;
  text: string;
  brollHint?: string;
  label: string;
};

const BROLL_MARKER = /\[B-ROLL:\s*([^\]]+)\]/gi;

export function parseScriptSegments(script: string): ScriptSegment[] {
  const trimmed = script.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  if (parts.length === 0) {
    return [{ index: 0, text: trimmed, label: "Abschnitt 1" }];
  }

  return parts.map((block, index) => {
    const hintMatch = BROLL_MARKER.exec(block);
    BROLL_MARKER.lastIndex = 0;
    const brollHint = hintMatch?.[1]?.trim();
    const text = block.replace(BROLL_MARKER, "").trim();
    return {
      index,
      text: text || block.trim(),
      brollHint,
      label: `Abschnitt ${index + 1}`,
    };
  });
}

export function isScriptAsset(toolId: string, outputType: string, text?: string): boolean {
  if (outputType !== "text") return false;
  if (
    toolId === "trend-script" ||
    toolId === "viral-hook" ||
    toolId === "product-ad" ||
    toolId === "agent-autopilot"
  ) {
    return true;
  }
  if (!text) return false;
  return (
    /\[B-ROLL:/i.test(text) ||
    /\b(HOOK|MAIN|CTA|VOICEOVER|SKRIPT)\b/i.test(text) ||
    text.length > 120
  );
}

export async function fetchBrollMatches(
  script: string,
  options?: { niche?: string; limit?: number; signal?: AbortSignal }
): Promise<BrollMatch[]> {
  const segments = parseScriptSegments(script);
  const res = await fetch("/api/trends/broll-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script,
      segments: segments.map((s) => ({
        text: s.text,
        brollHint: s.brollHint,
        label: s.label,
      })),
      niche: options?.niche,
      limit: options?.limit ?? 3,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error("B-Roll matching failed");
  }

  const data = (await res.json()) as { matches: BrollMatch[] };
  return data.matches ?? [];
}

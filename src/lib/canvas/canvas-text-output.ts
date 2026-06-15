import type { ViralScoreResult } from "@/lib/viral-score";

type NicheIdeaLike = {
  title?: string;
  description?: string;
  competition?: string;
  potential?: number;
  trend?: string;
  videoIdeas?: string[];
};

type ThumbnailConceptLike = {
  conceptTitle?: string;
  layoutDescription?: string;
  ctrPrediction?: string;
  ctrReasoning?: string;
  emotion?: string;
};

type OutlierLike = {
  title?: string;
  outlierScore?: number;
  hook?: string;
  whyItWorked?: string[];
  viralMechanism?: string;
};

type CampaignContentItem = {
  type?: string;
  title?: string;
  caption?: string;
  hook?: string;
};

export function formatViralScoreText(score: ViralScoreResult): string {
  const lines = [
    `# Viral Score: ${score.total_score}/100`,
    "",
    `**Hook:** ${score.hook_score}/25 · **Retention:** ${score.retention_score}/25 · **CTR:** ${score.ctr_score}/25 · **Trend:** ${score.trend_score}/25`,
    "",
    `## Urteil`,
    score.verdict,
    "",
    "## Stärken",
    ...score.strengths.map((s) => `- ${s}`),
    "",
    "## Verbesserungen",
    ...score.improvements.map((s) => `- ${s}`),
    "",
    "## Verbesserter Hook",
    score.improved_hook,
  ];
  return lines.join("\n");
}

export function formatNicheAnalysisText(niches: NicheIdeaLike[]): string {
  return niches
    .map((n, i) => {
      const ideas = Array.isArray(n.videoIdeas) ? n.videoIdeas : [];
      return [
        `## ${i + 1}. ${n.title ?? "Nische"}`,
        n.description ?? "",
        n.competition ? `**Wettbewerb:** ${n.competition}` : "",
        n.potential ? `**Potenzial:** ${"⭐".repeat(Math.min(5, n.potential))}` : "",
        n.trend ? `**Trend:** ${n.trend}` : "",
        ideas.length ? `**Video-Ideen:** ${ideas.join(" · ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export function formatThumbnailConceptsText(concepts: ThumbnailConceptLike[]): string {
  return concepts
    .map((c, i) =>
      [
        `## Konzept ${i + 1}: ${c.conceptTitle ?? "Thumbnail"}`,
        c.layoutDescription ?? "",
        c.emotion ? `**Emotion:** ${c.emotion}` : "",
        c.ctrPrediction ? `**CTR-Prognose:** ${c.ctrPrediction}` : "",
        c.ctrReasoning ?? "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");
}

export function formatOutlierAnalysisText(outliers: OutlierLike[]): string {
  return outliers
    .map((o, i) =>
      [
        `## ${i + 1}. ${o.title ?? "Outlier"}`,
        o.outlierScore != null ? `**Score:** ${o.outlierScore}/10` : "",
        o.hook ? `**Hook:** ${o.hook}` : "",
        o.viralMechanism ? `**Mechanismus:** ${o.viralMechanism}` : "",
        Array.isArray(o.whyItWorked) && o.whyItWorked.length
          ? `**Warum es funktionierte:**\n${o.whyItWorked.map((w) => `- ${w}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");
}

export function formatCampaignResultText(result: {
  summary?: string;
  content?: CampaignContentItem[];
  items?: CampaignContentItem[];
}): string {
  const parts: string[] = [];
  if (result.summary?.trim()) {
    parts.push(`## Kampagnen-Zusammenfassung\n${result.summary.trim()}`);
  }
  const items = Array.isArray(result.items)
    ? result.items
    : Array.isArray(result.content)
      ? result.content
      : [];
  if (items.length) {
    parts.push(
      "## Content-Plan",
      ...items.slice(0, 12).map((item, i) => {
        const title = item.title ?? item.hook ?? `Post ${i + 1}`;
        const type = item.type ? ` (${item.type})` : "";
        const caption = item.caption ? `\n${item.caption}` : "";
        return `### ${i + 1}. ${title}${type}${caption}`;
      })
    );
  }
  return parts.join("\n\n") || "Kampagne erstellt.";
}

export function extractStructuredCanvasText(
  body: Record<string, unknown>
): string | undefined {
  if (body.score && typeof body.score === "object") {
    return formatViralScoreText(body.score as ViralScoreResult);
  }

  if (Array.isArray(body.niches) && body.niches.length > 0) {
    return formatNicheAnalysisText(body.niches as NicheIdeaLike[]);
  }

  if (Array.isArray(body.concepts) && body.concepts.length > 0) {
    return formatThumbnailConceptsText(body.concepts as ThumbnailConceptLike[]);
  }

  if (Array.isArray(body.outliers) && body.outliers.length > 0) {
    return formatOutlierAnalysisText(body.outliers as OutlierLike[]);
  }

  if (body.result && typeof body.result === "object") {
    return formatCampaignResultText(
      body.result as {
        summary?: string;
        content?: CampaignContentItem[];
        items?: CampaignContentItem[];
      }
    );
  }

  return undefined;
}

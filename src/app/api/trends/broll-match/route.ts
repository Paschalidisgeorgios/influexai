import { NextResponse } from "next/server";
import brollVectors from "@/config/brollTrendVectors.json";

type SegmentInput = {
  text: string;
  brollHint?: string;
  label?: string;
};

type VectorEntry = {
  id: string;
  visualPrompt: string;
  tags: string[];
  trendWeight: number;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\säöüß-]/g, " ");
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function scoreSegmentAgainstVector(
  segment: SegmentInput,
  vector: VectorEntry,
  niche?: string
): number {
  const corpus = [segment.text, segment.brollHint ?? "", niche ?? ""].join(" ");
  const segTokens = tokenSet(corpus);
  const vecTokens = tokenSet([vector.visualPrompt, ...vector.tags].join(" "));

  let score = jaccardSimilarity(segTokens, vecTokens);

  if (segment.brollHint) {
    const hintTokens = tokenSet(segment.brollHint);
    score += jaccardSimilarity(hintTokens, vecTokens) * 0.45;
  }

  if (niche) {
    const nicheTokens = tokenSet(niche);
    score += jaccardSimilarity(nicheTokens, vecTokens) * 0.2;
  }

  return score * vector.trendWeight;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      script?: string;
      segments?: SegmentInput[];
      niche?: string;
      limit?: number;
    };

    const script = body.script?.trim() ?? "";
    const niche = body.niche?.trim();
    const limit = Math.min(Math.max(body.limit ?? 3, 1), 6);

    const segments: SegmentInput[] =
      body.segments?.length && body.segments.some((s) => s.text?.trim())
        ? body.segments
        : script
          ? [{ text: script, label: "Abschnitt 1" }]
          : [];

    if (segments.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const vectors = brollVectors.vectors as VectorEntry[];
    const matches: {
      id: string;
      visualPrompt: string;
      scriptSegment: string;
      segmentIndex: number;
      similarity: number;
      trendScore: number;
      tags: string[];
    }[] = [];

    segments.forEach((segment, segmentIndex) => {
      const ranked = vectors
        .map((vector) => ({
          vector,
          raw: scoreSegmentAgainstVector(segment, vector, niche),
        }))
        .sort((a, b) => b.raw - a.raw);

      const best = ranked[0];
      if (!best || best.raw < 0.04) return;

      matches.push({
        id: `${best.vector.id}-seg-${segmentIndex}`,
        visualPrompt: best.vector.visualPrompt,
        scriptSegment: segment.text.slice(0, 280),
        segmentIndex,
        similarity: Math.round(Math.min(0.99, best.raw) * 100) / 100,
        trendScore: Math.round(best.vector.trendWeight * 100),
        tags: best.vector.tags,
      });
    });

    matches.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      updated: brollVectors.updated,
      matches: matches.slice(0, limit),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

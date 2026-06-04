import { CLAUDE_JSON_SYSTEM_RULE, parseClaudeJson } from "@/lib/anthropic";

export type RemixStructure = {
  intro: string;
  middle: string;
  cta: string;
};

export type RemixConcept = {
  remixTitle: string;
  description: string;
  hook: string;
  structure: RemixStructure;
  similarityPercent: number;
  uniqueAngle: string;
};

export const REMIX_SYSTEM_PROMPT = `Du bist ein YouTube Content Stratege für Video-Remixing. Virale Mechaniken neu interpretieren — kein Kopieren. ${CLAUDE_JSON_SYSTEM_RULE}`;

export function buildRemixUserPrompt(params: {
  originalLabel: string;
  urlContext: string;
  remixStyle: string;
  niche: string;
}): string {
  return `Original Video: ${params.originalLabel}
${params.urlContext}
Remix-Stil: ${params.remixStyle}
Ziel-Nische: ${params.niche}

Erstelle 4 einzigartige Remix-Konzepte.
Verwende exakt diese englischen JSON-Feldnamen (keine deutschen Keys).

JSON:
[{
  "remixTitle": string,
  "description": string,
  "hook": string,
  "structure": { "intro": string, "middle": string, "cta": string },
  "similarityPercent": number,
  "uniqueAngle": string
}]`;
}

export function parseRemixConcepts(raw: string): RemixConcept[] {
  const parsed = parseClaudeJson<unknown>(raw);
  const wrapped = parsed as
    | {
        remixes?: unknown;
        results?: unknown;
        data?: unknown;
      }
    | unknown[];
  const list = Array.isArray(wrapped)
    ? wrapped
    : ((wrapped as { remixes?: unknown }).remixes ??
      (wrapped as { results?: unknown }).results ??
      (wrapped as { data?: unknown }).data);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Ungültiges JSON-Format");
  }

  return list.slice(0, 4).map((entry, i) => {
    const item = entry as Record<string, unknown>;
    const structureRaw = (item.structure ?? {}) as Record<string, unknown>;
    const similarity = Number(
      item.similarityPercent ?? item.similarity_percent
    );
    const similarityPercent = Math.min(
      80,
      Math.max(20, Number.isFinite(similarity) ? similarity : 50)
    );

    const remixTitle = String(
      item.remixTitle ??
        item.remix_title ??
        item.titel ??
        item.title ??
        `Remix ${i + 1}`
    );
    const description = String(
      item.description ??
        item.beschreibung ??
        item.zielgruppe ??
        ""
    );
    const uniqueAngle = String(
      item.uniqueAngle ?? item.unique_angle ?? item.unique_angle_de ?? ""
    );

    return {
      remixTitle,
      description,
      hook: String(item.hook ?? item.hooks ?? ""),
      structure: {
        intro: String(
          structureRaw.intro ??
            structureRaw.einleitung ??
            (uniqueAngle || description.slice(0, 120))
        ),
        middle: String(
          structureRaw.middle ?? structureRaw.mitte ?? description.slice(0, 200)
        ),
        cta: String(structureRaw.cta ?? structureRaw.abschluss ?? "Follow für mehr"),
      },
      similarityPercent,
      uniqueAngle: uniqueAngle || description.slice(0, 160),
    };
  });
}

export function remixResultsSaveErrorMessage(code?: string): string {
  if (code === "42P01" || code === "PGRST205") {
    return "Speichern vorübergehend nicht möglich. Bitte später erneut versuchen.";
  }
  return "Speichern in der Gallery fehlgeschlagen.";
}

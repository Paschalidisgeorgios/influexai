import {
  CLAUDE_JSON_SYSTEM_RULE,
  CLAUDE_SONNET_45_MODEL,
  parseClaudeJson,
} from "@/lib/anthropic";

/** Premium Script + B-Roll pipeline — same default as central Anthropic config. */
export const CLAUDE_PREMIUM_MODEL =
  process.env.ANTHROPIC_PREMIUM_MODEL?.trim() || CLAUDE_SONNET_45_MODEL;

export const PREMIUM_GENERATE_CREDIT_COST = 2;

export const CLAUDE_PREMIUM_SYSTEM_PROMPT = `Du bist das hochintelligente Gehirn eines Elite-KI-Creator-Studios. Deine Aufgabe ist es, virale Skripte zu schreiben und JEDEM Abschnitt sofort den exakt passenden, hochvisuellen Bild-/Video-Prompt für Generatoren wie Flux und Kling zuzuweisen.

${CLAUDE_JSON_SYSTEM_RULE}

Gib das Ergebnis AUSSCHLIESSLICH in diesem JSON-Schema zurück (keine anderen Keys, kein Markdown):
{
  "hook": { "text": "...", "broll_prompt": "..." },
  "body": [
    { "text": "Satz 1...", "broll_prompt": "Visual prompt für Kling/Flux..." }
  ],
  "cta": { "text": "...", "broll_prompt": "..." }
}

Regeln:
- hook.text: maximal 2 Sätze, starker Pattern-Interrupt für Short-Form (TikTok/Reels/Shorts).
- body: 2–5 Absätze, jeder text max. 2–3 Sätze, natürlich sprechbar.
- cta: klarer Call-to-Action, max. 2 Sätze.
- broll_prompt: immer englisch, cinematic, konkret (Kamera, Licht, Bewegung, 4K), optimiert für Flux/Kling/Seedance.
- Keine Platzhalter wie "..." — echte, produktionsreife Inhalte.`;

export type ClaudeScriptSection = {
  text: string;
  broll_prompt: string;
};

export type ClaudePremiumScript = {
  hook: ClaudeScriptSection;
  body: ClaudeScriptSection[];
  cta: ClaudeScriptSection;
};

export type PremiumBrollSegment = {
  id: string;
  label: string;
  text: string;
  broll_prompt: string;
  segmentIndex: number;
};

export type PremiumGenerateRequest = {
  topic: string;
  platform?: string;
  videoLength?: string;
  scriptInput?: string;
  niche?: string;
  targetAudience?: string;
  tone?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseSection(value: unknown, label: string): ClaudeScriptSection | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (!isNonEmptyString(obj.text) || !isNonEmptyString(obj.broll_prompt)) {
    return null;
  }
  if (obj.text.trim().length < 8) {
    throw new Error(`${label}: Text zu kurz.`);
  }
  if (obj.broll_prompt.trim().length < 12) {
    throw new Error(`${label}: B-Roll-Prompt zu kurz.`);
  }
  return {
    text: obj.text.trim(),
    broll_prompt: obj.broll_prompt.trim(),
  };
}

export function validatePremiumScript(raw: unknown): ClaudePremiumScript {
  if (!raw || typeof raw !== "object") {
    throw new Error("Claude-Antwort ist kein JSON-Objekt.");
  }

  const data = raw as Record<string, unknown>;
  const hook = parseSection(data.hook, "Hook");
  const cta = parseSection(data.cta, "CTA");

  if (!hook || !cta) {
    throw new Error("Hook oder CTA fehlen im JSON.");
  }

  if (!Array.isArray(data.body) || data.body.length === 0) {
    throw new Error("Body-Abschnitte fehlen im JSON.");
  }

  const body: ClaudeScriptSection[] = [];
  data.body.forEach((entry, index) => {
    const section = parseSection(entry, `Body ${index + 1}`);
    if (!section) {
      throw new Error(`Body-Abschnitt ${index + 1} ist ungültig.`);
    }
    body.push(section);
  });

  return { hook, body, cta };
}

export function parsePremiumScriptFromClaude(raw: string): ClaudePremiumScript {
  const parsed = parseClaudeJson<unknown>(raw);
  return validatePremiumScript(parsed);
}

export function formatPremiumScriptAsText(script: ClaudePremiumScript): string {
  const blocks: string[] = [
    `🎬 HOOK\n${script.hook.text}\n[B-ROLL: ${script.hook.broll_prompt}]`,
    ...script.body.map(
      (section, index) =>
        `📖 BODY ${index + 1}\n${section.text}\n[B-ROLL: ${section.broll_prompt}]`
    ),
    `🎯 CTA\n${script.cta.text}\n[B-ROLL: ${script.cta.broll_prompt}]`,
  ];
  return blocks.join("\n\n");
}

export function extractPremiumBrollSegments(script: ClaudePremiumScript): PremiumBrollSegment[] {
  const segments: PremiumBrollSegment[] = [
    {
      id: "premium-hook",
      label: "Hook",
      text: script.hook.text,
      broll_prompt: script.hook.broll_prompt,
      segmentIndex: 0,
    },
    ...script.body.map((section, index) => ({
      id: `premium-body-${index}`,
      label: `Body ${index + 1}`,
      text: section.text,
      broll_prompt: section.broll_prompt,
      segmentIndex: index + 1,
    })),
    {
      id: "premium-cta",
      label: "CTA",
      text: script.cta.text,
      broll_prompt: script.cta.broll_prompt,
      segmentIndex: script.body.length + 1,
    },
  ];
  return segments;
}

export function buildPremiumGenerateUserPrompt(input: PremiumGenerateRequest): string {
  const lines = [
    `Erstelle ein virales Short-Form-Skript zum Thema: ${input.topic}`,
    `Plattform: ${input.platform ?? "TikTok"}`,
    `Ziel-Länge: ${input.videoLength ?? "60s"}`,
  ];

  if (input.niche?.trim()) lines.push(`Nische: ${input.niche.trim()}`);
  if (input.targetAudience?.trim()) lines.push(`Zielgruppe: ${input.targetAudience.trim()}`);
  if (input.tone?.trim()) lines.push(`Tonalität: ${input.tone.trim()}`);
  if (input.scriptInput?.trim()) {
    lines.push(
      "",
      "Optionaler Hook / Vorlage (einbauen oder verbessern):",
      input.scriptInput.trim()
    );
  }

  lines.push(
    "",
    "Liefere das strikte JSON-Schema mit hochvisuellen englischen broll_prompts für Flux/Kling."
  );

  return lines.join("\n");
}

export type PremiumGeneratePayload = {
  premiumScript: ClaudePremiumScript;
  brollSegments: PremiumBrollSegment[];
  formattedScript: string;
};

export function buildPremiumGeneratePayload(script: ClaudePremiumScript): PremiumGeneratePayload {
  return {
    premiumScript: script,
    brollSegments: extractPremiumBrollSegments(script),
    formattedScript: formatPremiumScriptAsText(script),
  };
}

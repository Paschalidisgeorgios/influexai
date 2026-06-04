export function replaceHookInScript(script: string, newHook: string): string {
  const pattern = /(\[HOOK\]\s*)([\s\S]*?)(?=\[MAIN\]|\[CTA\]|$)/i;
  if (pattern.test(script)) {
    return script.replace(pattern, `$1${newHook.trim()}\n\n`);
  }
  return `[HOOK]\n${newHook.trim()}\n\n${script}`;
}

export function scriptToPlainText(script: string): string {
  return script
    .replace(/\[HOOK\]/gi, "—— HOOK ——\n")
    .replace(/\[MAIN\]/gi, "\n—— MAIN ——\n")
    .replace(/\[CTA\]/gi, "\n—— CTA ——\n")
    .trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type ScriptBlock = {
  tag: "hook" | "main" | "cta" | null;
  lines: string[];
};

export function parseScriptBlocks(script: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  const parts = script.split(/(\[HOOK\]|\[MAIN\]|\[CTA\])/gi);

  let currentTag: ScriptBlock["tag"] = null;
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0 || currentTag) {
      blocks.push({ tag: currentTag, lines: [...buffer] });
      buffer = [];
    }
  };

  for (const part of parts) {
    const upper = part.toUpperCase();
    if (upper === "[HOOK]") {
      flush();
      currentTag = "hook";
      continue;
    }
    if (upper === "[MAIN]") {
      flush();
      currentTag = "main";
      continue;
    }
    if (upper === "[CTA]") {
      flush();
      currentTag = "cta";
      continue;
    }
    const lines = part.split("\n");
    for (const line of lines) {
      if (line.trim() || buffer.length > 0) buffer.push(line);
    }
  }
  flush();

  if (blocks.length === 0) {
    blocks.push({ tag: null, lines: script.split("\n") });
  }

  return blocks;
}

export function isBRollLine(line: string): boolean {
  return /\[B-ROLL:/i.test(line);
}

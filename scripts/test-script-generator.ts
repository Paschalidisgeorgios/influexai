import { config } from "dotenv";
config({ path: ".env.local" });

import {
  createAnthropicMessage,
  parseClaudeJson,
  stripClaudeJson,
} from "../src/lib/anthropic";

const topic = "Morning routine tips";
const systemPrompt = `Du bist ein professioneller Short-Form Video Script Writer. Antworte NUR mit validem JSON.`;
const userPrompt = `Thema: ${topic}
Erstelle ein Video-Script.
JSON: {"script": string, "hookVariants": [], "wordCount": number, "estimatedSeconds": number, "toneDescription": string}`;

async function run(model: string) {
  console.log("\n========== Script test:", model, "==========");
  const claude = await createAnthropicMessage({
    system: systemPrompt,
    user: userPrompt,
    model,
  });
  if (!claude.ok) {
    console.error("FAIL:", claude.error);
    return;
  }
  console.log("Raw (first 200):", claude.text.slice(0, 200));
  try {
    const parsed = parseClaudeJson<Record<string, unknown>>(claude.text);
    console.log("Parsed script length:", String(parsed.script ?? "").length);
  } catch (e) {
    console.error("JSON parse error:", e);
    console.error("Stripped:", stripClaudeJson(claude.text).slice(0, 300));
  }
}

async function main() {
  await run("claude-opus-4-5");
  await run("claude-sonnet-4-20250514");
  await run("claude-sonnet-4-5-20250929");
}

main().catch(console.error);

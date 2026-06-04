/**
 * Optional: generate tr, es, fr, ar, pt from de.json via Claude API.
 * Run: npx tsx scripts/translate.ts
 * Requires: ANTHROPIC_API_KEY
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const root = path.join(__dirname, "..");
const master = JSON.parse(
  fs.readFileSync(path.join(root, "messages/de.json"), "utf-8")
);

const languages: Record<string, string> = {
  tr: "Turkish",
  es: "Spanish (Latin American)",
  fr: "French",
  ar: "Arabic (RTL language)",
  pt: "Portuguese (Brazilian)",
};

async function main() {
  const client = new Anthropic();

  for (const [code, name] of Object.entries(languages)) {
    const outPath = path.join(root, `messages/${code}.json`);
    if (fs.existsSync(outPath)) {
      console.log(`⏭ ${code} exists, skip`);
      continue;
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Translate this JSON from German to ${name}.
Keep all JSON keys exactly the same.
Only translate the values.
Keep {variables} like {count}, {name}, {cost} unchanged.
For Arabic: use natural Modern Standard Arabic suitable for a tech app.
Return ONLY valid JSON, no markdown.

${JSON.stringify(master, null, 2)}`,
        },
      ],
    });

    const translated =
      response.content[0].type === "text" ? response.content[0].text : "";
    fs.writeFileSync(outPath, translated.trim());
    console.log(`✅ ${name} → messages/${code}.json`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

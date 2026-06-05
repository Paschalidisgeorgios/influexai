/**
 * Fix corrupted landingPage.toolExamples translations (mixed languages from bad batch).
 * Run: node scripts/i18n-fix-tool-examples.mjs
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { flatten, setByPath, sortKeys } from "./i18n-utils.mjs";

config({ path: path.join(process.cwd(), ".env.local") });

const messagesDir = path.join(process.cwd(), "messages");
const locales = ["tr", "es", "fr", "pt", "ar"];

const LOCALE_LANGUAGE = {
  tr: "Turkish",
  es: "Spanish (Latin American)",
  fr: "French",
  pt: "Portuguese (Brazilian)",
  ar: "Arabic (Modern Standard Arabic, suitable for a tech app)",
};

const PREFIX = "landingPage.toolExamples.";

async function translateObject(entries, targetLanguage) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key?.startsWith("sk-ant-")) {
    throw new Error("ANTHROPIC_API_KEY missing in .env.local");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Translate these UI strings from English to ${targetLanguage} for InfluexAI (SaaS for creators).
Keep each JSON key exactly as given (short keys like agent_desc, not full paths).
Only translate string values.
Keep placeholders unchanged: {count}, {name}, {cost}.
Keep product terms when natural: InfluexAI, Master Agent, Viral Score, Face Swap, Live Creator, Acid Noir, TikTok, YouTube, Reels, CTR, Hook, Script, Thumbnail, Dashboard.
Return ONLY valid JSON (key → translated string), no markdown.

${JSON.stringify(entries, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf-8"));
const enFlat = flatten(en);
const source = Object.fromEntries(
  Object.entries(enFlat)
    .filter(([k]) => k.startsWith(PREFIX))
    .map(([k, v]) => [k.slice(PREFIX.length), v])
);

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`\n${locale}: translating toolExamples (${Object.keys(source).length} keys)`);
  const translated = await translateObject(source, LOCALE_LANGUAGE[locale]);
  for (const [shortKey, value] of Object.entries(translated)) {
    if (typeof value === "string") {
      setByPath(messages, `${PREFIX}${shortKey}`, value);
    }
  }
  fs.writeFileSync(filePath, `${JSON.stringify(sortKeys(messages), null, 2)}\n`, "utf-8");
  console.log(`✓ ${locale}.json fixed`);
}

console.log("\nDone.");

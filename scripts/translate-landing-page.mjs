/**
 * Force-translate landingPage namespace from de.json into all locales.
 * Run: node scripts/translate-landing-page.mjs
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const messagesDir = path.join(process.cwd(), "messages");
const locales = ["en", "el", "tr", "es", "fr", "ar", "pt"];
const LOCALE_LANGUAGE = {
  en: "English",
  el: "Greek",
  tr: "Turkish",
  es: "Spanish (Latin American)",
  fr: "French",
  ar: "Arabic (Modern Standard Arabic)",
  pt: "Portuguese (Brazilian)",
};

async function translateLanding(source, targetLanguage) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key?.startsWith("sk-ant-")) throw new Error("ANTHROPIC_API_KEY missing");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `Translate this JSON object from German to ${targetLanguage} for a SaaS landing page (InfluexAI).
Keep all keys exactly the same. Only translate string values.
Keep brand/product names: InfluexAI, TikTok, Instagram, YouTube, LinkedIn, Face Consistency™, LiveSwap™, Master Agent, KI-Ich, GDPR, Credits, API, CTR, Hook, Script where they are product terms.
Keep € prices and placeholders unchanged.
Return ONLY valid JSON, no markdown.

${JSON.stringify(source, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const data = await response.json();
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
}

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function save(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, "utf-8");
}

const de = load(path.join(messagesDir, "de.json"));
const source = de.landingPage;
if (!source) throw new Error("de.json missing landingPage");

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const messages = load(filePath);
  console.log(`Translating landingPage → ${locale} (${LOCALE_LANGUAGE[locale]})…`);
  messages.landingPage = await translateLanding(source, LOCALE_LANGUAGE[locale]);
  if (locale !== "de") {
    messages.footer = { ...messages.footer, partner: messages.footer?.partner };
  }
  save(filePath, messages);
  console.log(`✓ ${locale}.json`);
}

console.log("Done.");

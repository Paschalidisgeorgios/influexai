/**
 * Full i18n sync: fill missing keys, translate German/English placeholders via Claude.
 * Run: npm run i18n:sync
 * Requires: ANTHROPIC_API_KEY in .env.local
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import {
  alignToMaster,
  flatten,
  setByPath,
  sortKeys,
} from "./i18n-utils.mjs";

config({ path: path.join(process.cwd(), ".env.local") });

const messagesDir = path.join(process.cwd(), "messages");
const locales = ["en", "el", "tr", "es", "fr", "ar", "pt"];

const LOCALE_LANGUAGE = {
  en: "English",
  el: "Greek",
  tr: "Turkish",
  es: "Spanish (Latin American)",
  fr: "French",
  ar: "Arabic (Modern Standard Arabic, suitable for a tech app)",
  pt: "Portuguese (Brazilian)",
};

/** Values that should stay as-is across locales */
const SKIP_VALUE_RE =
  /^(InfluexAI|Made in Germany|Face Consistency™|Multi-Platform Export|TikTok|Instagram|YouTube|LinkedIn|API|CTR|Hook|LIVE|GDPR|DSGVO-konform|𝕏|in|▶|I$|Credits|Script|Dashboard|Community|Referral|OK|FAQ)$/i;

const KEEP_SUBSTRINGS = [
  "InfluexAI",
  "Face Consistency",
  "LiveSwap",
  "Master Agent",
  "Viral Score",
  "KI-Ich",
];

function shouldSkipTranslation(value) {
  if (!value || typeof value !== "string") return true;
  if (SKIP_VALUE_RE.test(value.trim())) return true;
  // Very short technical tags
  if (value.length <= 2) return true;
  return false;
}

function needsTranslation(locale, pathKey, deVal, enVal, locVal) {
  if (shouldSkipTranslation(deVal)) return false;
  if (!locVal) return true;

  if (locale === "en") {
    return locVal === deVal;
  }

  // Non-EN: still German, or still English while German differs from English
  if (locVal === deVal) return true;
  if (deVal !== enVal && locVal === enVal) return true;

  return false;
}

async function translateBatch(entries, targetLanguage) {
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
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `Translate these UI strings from German to ${targetLanguage} for InfluexAI (SaaS for creators).
Keep each JSON key exactly as given. Only translate the string values.
Keep placeholders unchanged: {count}, {name}, {cost}, {scripts}, {videos}, {thumbnails}, {max}, {label}.
Keep these product/brand terms when they appear: ${KEEP_SUBSTRINGS.join(", ")}.
Keep € prices, emojis, and "·" separators in badges.
Return ONLY a valid JSON object (key → translated string), no markdown.
Escape double quotes inside string values with backslashes.

${JSON.stringify(entries, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic ${response.status}: ${(await response.text()).slice(0, 300)}`
    );
  }

  const data = await response.json();
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function saveJson(file, obj) {
  fs.writeFileSync(file, `${JSON.stringify(sortKeys(obj), null, 2)}\n`, "utf-8");
}

const de = loadJson(path.join(messagesDir, "de.json"));
const en = loadJson(path.join(messagesDir, "en.json"));
const enFlat = flatten(en);
const deFlat = flatten(de);

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  let messages = loadJson(filePath);

  // de.json structure; missing values → English (not German); drop orphan keys
  messages = alignToMaster(de, en, messages);

  const localeFlat = flatten(messages);
  const toTranslate = {};

  for (const [pathKey, deValue] of Object.entries(deFlat)) {
    const enValue = enFlat[pathKey] ?? deValue;
    const locValue = localeFlat[pathKey];
    if (needsTranslation(locale, pathKey, deValue, enValue, locValue)) {
      toTranslate[pathKey] = deValue;
    }
  }

  const keys = Object.keys(toTranslate);
  console.log(`\n${locale}: ${keys.length} strings to translate`);

  if (keys.length === 0) {
    saveJson(filePath, messages);
    continue;
  }

  const BATCH = 60;
  for (let i = 0; i < keys.length; i += BATCH) {
    const slice = keys.slice(i, i + BATCH);
    const batch = Object.fromEntries(slice.map((k) => [k, toTranslate[k]]));
    console.log(`  → batch ${Math.floor(i / BATCH) + 1} (${slice.length} keys)`);

    let translated;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        translated = await translateBatch(batch, LOCALE_LANGUAGE[locale]);
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt === 3 || !msg.includes("JSON")) throw err;
        console.warn(`  ⚠ batch retry ${attempt} (${msg.slice(0, 100)})`);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    for (const [pathKey, value] of Object.entries(translated)) {
      if (typeof value === "string") setByPath(messages, pathKey, value);
    }
    saveJson(filePath, messages);
    await new Promise((r) => setTimeout(r, 400));
  }

  saveJson(filePath, messages);
  console.log(`✓ ${locale}.json saved`);
}

console.log("\nAudit:");
for (const locale of locales) {
  const loc = flatten(loadJson(path.join(messagesDir, `${locale}.json`)));
  const sameAsDe = Object.keys(deFlat).filter((k) => loc[k] === deFlat[k]).length;
  const sameAsEn = Object.keys(deFlat).filter(
    (k) => deFlat[k] !== enFlat[k] && loc[k] === enFlat[k]
  ).length;
  console.log(`  ${locale}: sameAsDe=${sameAsDe} sameAsEn=${sameAsEn}`);
}

console.log("\nDone. Run: npm run i18n:check && node scripts/i18n-audit.mjs");

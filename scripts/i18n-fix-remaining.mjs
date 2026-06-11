/**
 * Second pass: translate keys still identical to German (excluding brand-only strings).
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

function flat(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const pk = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flat(v, pk));
    else if (typeof v === "string") out[pk] = v;
  }
  return out;
}

function setByPath(obj, pathKey, value) {
  const parts = pathKey.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function isBrandOnly(s) {
  return /^[\s\W]*(?:InfluexAI|LiveSwap|Face Consistency|Master Agent|Viral Score|KI-Ich|Live Creator|Video Remix|Powered by)[\s\W\d™®]*$/i.test(s)
    || /^[A-Za-z0-9.@\s™®·→+\-]+$/i.test(s) && /InfluexAI|Engine|Vision|Voice|Music|Brain/i.test(s);
}

async function translateBatch(entries, targetLanguage) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Translate from German to ${targetLanguage}. Return ONLY JSON.\n${JSON.stringify(entries)}`,
        },
      ],
    }),
  });
  const data = await res.json();
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
}

const de = flat(JSON.parse(fs.readFileSync(path.join(messagesDir, "de.json"), "utf-8")));

for (const locale of locales) {
  const file = path.join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(file, "utf-8"));
  const loc = flat(messages);
  const toTranslate = {};
  for (const [k, deVal] of Object.entries(de)) {
    if (loc[k] !== deVal) continue;
    if (locale === "de") continue;
    if (isBrandOnly(deVal)) continue;
    if (deVal.length < 4) continue;
    toTranslate[k] = deVal;
  }
  const keys = Object.keys(toTranslate);
  if (!keys.length) {
    console.log(`${locale}: nothing left`);
    continue;
  }
  console.log(`${locale}: ${keys.length} remaining`);
  const translated = await translateBatch(toTranslate, LOCALE_LANGUAGE[locale]);
  for (const [k, v] of Object.entries(translated)) setByPath(messages, k, v);
  fs.writeFileSync(file, `${JSON.stringify(messages, null, 2)}\n`);
}

console.log("Done");

/**
 * Translate locale strings that are still identical to de.json.
 * Run: node scripts/translate-locales.mjs
 * Requires: ANTHROPIC_API_KEY in .env.local
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const dir = "messages";
const base = JSON.parse(fs.readFileSync(path.join(dir, "de.json"), "utf8"));

/** Project locales (no it.json — ar is the 8th locale) */
const targets = {
  en: "English",
  el: "Greek",
  es: "Spanish (Latin American)",
  fr: "French",
  pt: "Portuguese (Brazilian)",
  tr: "Turkish",
  ar: "Arabic (Modern Standard Arabic, suitable for a tech app)",
};

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "string") out[`${key}[${i}]`] = item;
      });
    } else if (typeof v === "object" && v !== null) {
      Object.assign(out, flatten(v, key));
    }
  }
  return out;
}

function setByPath(obj, pathStr, value) {
  const arrayMatch = pathStr.match(/^(.+)\[(\d+)\]$/);
  if (arrayMatch) {
    const parts = arrayMatch[1].split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]][parseInt(arrayMatch[2], 10)] = value;
    return;
  }
  const parts = pathStr.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

async function translateBatch(entries, langName) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key?.startsWith("sk-ant-")) {
    throw new Error("ANTHROPIC_API_KEY missing in .env.local");
  }

  const keys = Object.keys(entries);
  const texts = keys.map((k) => entries[k]);

  const prompt = `Translate these German UI strings to ${langName} for InfluexAI (SaaS for creators).
Rules:
- Return ONLY a JSON array of translations, same order, same length as the input array.
- Keep placeholders like {name}, {count}, {thumbnails}, {max}, {cost} EXACTLY unchanged.
- Keep \\n line breaks exactly where they are.
- For marketing slogans (short uppercase phrases), adapt creatively but keep them punchy and short. Keep UPPERCASE where the source uses it.
- NO exaggerated promises ("garantiert"/"guaranteed"/"viral guaranteed").
- Keep product terms when natural: InfluexAI, Master Agent, Viral Score, Face Swap, Live Creator, TikTok, YouTube, Reels, CTR, Hook, Script, Thumbnail, Dashboard, Credits.
- Keep € prices, emojis, and "·" separators in badges.

Input JSON array:
${JSON.stringify(texts, null, 2)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const translated = JSON.parse(cleaned);

  if (!Array.isArray(translated) || translated.length !== texts.length) {
    throw new Error(
      `Batch length mismatch: expected ${texts.length}, got ${translated?.length ?? 0}`
    );
  }

  return Object.fromEntries(keys.map((k, i) => [k, translated[i]]));
}

const baseFlat = flatten(base);

for (const [code, langName] of Object.entries(targets)) {
  const file = path.join(dir, `${code}.json`);
  const target = JSON.parse(fs.readFileSync(file, "utf8"));
  const targetFlat = flatten(target);

  const toTranslate = {};
  for (const [key, deVal] of Object.entries(baseFlat)) {
    if (targetFlat[key] === deVal && deVal.trim().length > 0) {
      toTranslate[key] = deVal;
    }
  }

  const keys = Object.keys(toTranslate);
  if (keys.length === 0) {
    console.log(`${code}: bereits vollständig übersetzt`);
    continue;
  }

  console.log(`${code}: übersetze ${keys.length} Strings...`);

  const BATCH = 40;
  for (let i = 0; i < keys.length; i += BATCH) {
    const batchKeys = keys.slice(i, i + BATCH);
    const batchEntries = Object.fromEntries(batchKeys.map((k) => [k, toTranslate[k]]));
    const translated = await translateBatch(batchEntries, langName);
    for (const [key, value] of Object.entries(translated)) {
      if (typeof value === "string") setByPath(target, key, value);
    }
    console.log(`  ${code}: ${Math.min(i + BATCH, keys.length)}/${keys.length}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.writeFileSync(file, `${JSON.stringify(target, null, 2)}\n`, "utf8");
  console.log(`${code}: fertig, gespeichert`);
}

console.log("Alle Sprachen übersetzt.");

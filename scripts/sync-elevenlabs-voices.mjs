/**
 * Validates ELEVENLABS_VOICES against GET /v1/voices and tests TTS per locale.
 * Run: node scripts/sync-elevenlabs-voices.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const MODEL_ID = "eleven_multilingual_v2";
const TEST_TEXT = {
  de: "Das ist ein Test der deutschen Stimme.",
  en: "This is an English voice test.",
  es: "Esta es una prueba de voz.",
  fr: "Ceci est un test de voix.",
  pt: "Este é um teste de voz.",
  tr: "Bu bir ses testidir.",
  el: "Αυτή είναι μια δοκιμή φωνής.",
  ar: "هذا اختبار للصوت",
};

// Parse ELEVENLABS_VOICES from source (avoid TS import in .mjs)
const configSrc = readFileSync(
  resolve("src/lib/elevenlabs-config.ts"),
  "utf8"
);
const voicesBlock = configSrc.match(
  /export const ELEVENLABS_VOICES[^=]*=\s*\{([^}]+)\}/s
)?.[1];
if (!voicesBlock) {
  console.error("Could not parse ELEVENLABS_VOICES from elevenlabs-config.ts");
  process.exit(1);
}

const ELEVENLABS_VOICES = {};
for (const line of voicesBlock.split("\n")) {
  const m = line.match(/^\s*(\w+):\s*"([^"]+)"/);
  if (m) ELEVENLABS_VOICES[m[1]] = m[2];
}

const key = process.env.ELEVENLABS_API_KEY?.trim();
if (!key) {
  console.error("ELEVENLABS_API_KEY fehlt in .env.local");
  process.exit(1);
}

console.log("=== ElevenLabs Voice Sync ===\n");

const listRes = await fetch("https://api.elevenlabs.io/v1/voices", {
  headers: { "xi-api-key": key },
});
if (!listRes.ok) {
  console.error("GET /v1/voices failed:", listRes.status, await listRes.text());
  process.exit(1);
}

const listJson = await listRes.json();
const apiIds = new Set((listJson.voices ?? []).map((v) => v.voice_id));
console.log(`API voices: ${apiIds.size}\n`);

let allOk = true;

for (const [locale, voiceId] of Object.entries(ELEVENLABS_VOICES)) {
  const inApi = apiIds.has(voiceId);
  console.log(`${locale}: ${voiceId} ${inApi ? "✓ in API" : "⚠ not in API list"}`);

  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: TEST_TEXT[locale] ?? TEST_TEXT.en,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.75, similarity_boost: 0.75 },
      }),
    }
  );

  if (!ttsRes.ok) {
    console.error(`  ❌ TTS ${locale}:`, ttsRes.status, (await ttsRes.text()).slice(0, 120));
    allOk = false;
  } else {
    const buf = await ttsRes.arrayBuffer();
    console.log(`  ✅ TTS ${locale}: ${buf.byteLength} bytes`);
  }
}

console.log(allOk ? "\n=== All locale voices OK ===" : "\n=== Some tests failed ===");
process.exit(allOk ? 0 : 1);

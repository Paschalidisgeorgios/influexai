/**
 * Tests ElevenLabs TTS (German default + optional legacy ID remap).
 * Run: node scripts/test-elevenlabs-tts.mjs [voice_id]
 */
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const src = readFileSync(resolve("src/lib/elevenlabs-config.ts"), "utf8");
const deVoice = src.match(/de:\s*"([^"]+)"/)?.[1];
const enVoice = src.match(/en:\s*"([^"]+)"/)?.[1];
const legacyRachel = "21m00Tcm4TlvDq8ikWAM";
const MODEL_ID = "eleven_multilingual_v2";

const key = process.env.ELEVENLABS_API_KEY?.trim();
if (!key) {
  console.error("ELEVENLABS_API_KEY fehlt in .env.local");
  process.exit(1);
}

const rawArg = process.argv[2]?.trim();
const voiceId =
  rawArg === legacyRachel ? (enVoice ?? deVoice) : rawArg || deVoice;
if (rawArg === legacyRachel) {
  console.log(`Legacy Rachel → ${voiceId}`);
}

const text =
  voiceId === enVoice ? "This is a test" : "Das ist ein Test";

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.75, similarity_boost: 0.75 },
    }),
  }
);

if (!res.ok) {
  console.error("TTS failed:", res.status, await res.text());
  process.exit(1);
}

const buf = await res.arrayBuffer();
console.log(`OK — voice ${voiceId}, ${buf.byteLength} bytes audio/mpeg`);

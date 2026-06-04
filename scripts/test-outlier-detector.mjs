/**
 * Outlier Detector smoke test (Claude + Supabase outlier_results).
 * Run: node scripts/test-outlier-detector.mjs
 *
 * Parser unit tests: npm run test:unit:run -- tests/unit/outlier-analysis.test.ts
 * API (auth required): POST /api/outlier-detector
 *   Body: { "niche": "YouTube Shorts", "language": "de" }
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const TEST_BODY = { niche: "YouTube Shorts", language: "de" };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

if (!anthropicKey?.startsWith("sk-ant-")) {
  console.error("ANTHROPIC_API_KEY fehlt oder ungültig in .env.local");
  process.exit(1);
}

const userPrompt = `Nische: ${TEST_BODY.niche}
Zeitraum: Letzter Monat
Plattform: YouTube Shorts
Kanal-Größe: Alle
Sprache: Deutsch (de)

Generiere 6 Outlier-Video-Konzepte als JSON Array mit title, thumbnailConcept, outlierScore, whyItWorked, hook, viralMechanism.`;

console.log("=== Outlier Detector Test ===");
console.log("Request:", JSON.stringify(TEST_BODY, null, 2));
console.log(
  "Flow: UI → detectOutliers | POST /api/outlier-detector → Anthropic → outlier_results → Gallery\n"
);
console.log("Note: YOUTUBE_API_KEY is NOT used (optional for Video Remix only).\n");

const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": anthropicKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system:
      "Du bist ein YouTube Viral Content Analyst. Antworte NUR mit validem JSON, ohne Markdown.",
    messages: [{ role: "user", content: userPrompt }],
  }),
});

const claudeJson = await claudeRes.json();
if (!claudeRes.ok) {
  console.error("Anthropic error:", claudeRes.status, JSON.stringify(claudeJson, null, 2));
  process.exit(1);
}

const text = claudeJson.content?.find((c) => c.type === "text")?.text ?? "";
let outliers;
try {
  const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = clean.search(/[[{]/);
  const parsed = JSON.parse(start >= 0 ? clean.slice(start) : clean);
  outliers = Array.isArray(parsed) ? parsed : parsed.outliers ?? parsed.results ?? [];
} catch (e) {
  console.error("JSON parse failed:", e.message);
  console.error("Raw (500 chars):", text.slice(0, 500));
  process.exit(1);
}

console.log("Claude OK — raw outliers count:", outliers.length);

if (!url || !serviceKey) {
  console.warn("\nSupabase skip — no URL/service key");
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const suffix = randomUUID();
const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
  email: `outlier-test-${suffix}@influexai.verify`,
  password: randomUUID(),
  email_confirm: true,
});

if (userErr) {
  console.error("Test user create failed:", userErr.message);
  process.exit(1);
}

const userId = userData.user.id;
const { error: insertErr } = await supabase.from("outlier_results").insert({
  user_id: userId,
  niche: TEST_BODY.niche,
  results: outliers.slice(0, 6),
});

await supabase.auth.admin.deleteUser(userId);

if (insertErr) {
  console.error("outlier_results insert FAILED:", insertErr.message, insertErr.code);
  process.exit(1);
}

console.log("Supabase outlier_results insert: OK");
console.log("Vercel: maxDuration=60s on /api/outlier-detector");

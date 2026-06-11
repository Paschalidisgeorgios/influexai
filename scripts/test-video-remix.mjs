/**
 * Manual Video Remix test (Claude + remix_results — no fal.ai).
 * Run: node scripts/test-video-remix.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const TEST_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const TEST_BODY = {
  mode: "url",
  url: TEST_URL,
  niche: "Tech",
  remixStyle: "Gleiche Idee, andere Zielgruppe",
};

const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
const falKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY;
const youtubeKey = process.env.YOUTUBE_API_KEY?.trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== Video Remix Test ===\n");
console.log("Hinweis: Kein app/api/video-remix/fal — Feature nutzt Claude (Konzepte).\n");
console.log("Env:");
console.log("  FAL_KEY:", falKey ? "gesetzt (nicht für Remix genutzt)" : "fehlt");
console.log("  YOUTUBE_API_KEY:", youtubeKey ? "gesetzt" : "fehlt (optional)");
console.log("  ANTHROPIC_API_KEY:", anthropicKey?.startsWith("sk-ant-") ? "ok" : "FEHLT");

function extractVideoId(u) {
  try {
    const parsed = new URL(u);
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

const videoId = extractVideoId(TEST_URL);
console.log("\nTest-Request:", JSON.stringify(TEST_BODY, null, 2));

if (falKey) {
  const falRes = await fetch("https://queue.fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: "test" }),
  });
  const falText = await falRes.text();
  console.log(
    "\nfal.ai connectivity (flux probe):",
    falRes.status,
    falText.slice(0, 120)
  );
  if (falRes.status === 401) {
    console.log("→ FAL_KEY ungültig (betrifft KI-Ich, nicht Video Remix)");
  }
} else {
  console.log("\nfal.ai: übersprungen (kein FAL_KEY)");
}

if (!anthropicKey?.startsWith("sk-ant-")) {
  process.exit(1);
}

let originalLabel = `YouTube Video (${videoId})`;
if (youtubeKey && videoId) {
  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  ytUrl.searchParams.set("part", "snippet");
  ytUrl.searchParams.set("id", videoId);
  ytUrl.searchParams.set("key", youtubeKey);
  const ytRes = await fetch(ytUrl);
  const ytData = await ytRes.json();
  if (ytRes.ok && ytData.items?.[0]?.snippet?.title) {
    originalLabel = ytData.items[0].snippet.title;
    console.log("\nYouTube metadata OK:", originalLabel);
  } else {
    console.log("\nYouTube API:", ytRes.status, JSON.stringify(ytData).slice(0, 200));
  }
}

const userPrompt = `Original Video: ${originalLabel}
URL: ${TEST_URL}
Video-ID: ${videoId}
Remix-Stil: ${TEST_BODY.remixStyle}
Ziel-Nische: ${TEST_BODY.niche}

Erstelle 4 einzigartige Remix-Konzepte als JSON Array.`;

const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": anthropicKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system:
      "Du bist ein YouTube Content Stratege. Antworte NUR mit validem JSON Array.",
    messages: [{ role: "user", content: userPrompt }],
  }),
});

const claudeJson = await claudeRes.json();
if (!claudeRes.ok) {
  console.error("Claude error:", claudeRes.status, JSON.stringify(claudeJson));
  process.exit(1);
}

const text = claudeJson.content?.find((c) => c.type === "text")?.text ?? "";
const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
const start = clean.search(/[[{]/);
const parsed = JSON.parse(start >= 0 ? clean.slice(start) : clean);
const remixes = Array.isArray(parsed) ? parsed : parsed.remixes ?? [];

console.log("\nClaude OK — remix concepts:", remixes.length);
console.log("Sample:", JSON.stringify(remixes[0] ?? null, null, 2));

if (!url || !serviceKey) {
  console.warn("\nSupabase skip");
  process.exit(0);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const suffix = randomUUID();
const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
  email: `remix-test-${suffix}@influexai.verify`,
  password: randomUUID(),
  email_confirm: true,
});
if (userErr) {
  console.error("Test user:", userErr.message);
  process.exit(1);
}

const { error: insertErr } = await supabase.from("remix_results").insert({
  user_id: userData.user.id,
  original_url: TEST_URL,
  results: remixes.slice(0, 4),
});

await supabase.auth.admin.deleteUser(userData.user.id);

if (insertErr) {
  console.error("remix_results insert FAILED:", insertErr.message);
  process.exit(1);
}

console.log("\nSupabase remix_results insert: OK");
console.log("\nResponse shape:");
console.log(
  JSON.stringify(
    {
      success: true,
      remixes: remixes.slice(0, 4),
      saved: true,
      falAiUsed: false,
      webhook: "N/A — sync Claude only",
    },
    null,
    2
  )
);

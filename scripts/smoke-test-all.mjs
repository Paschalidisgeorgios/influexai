/**
 * API / infra smoke tests (no browser).
 * Run: node scripts/smoke-test-all.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const results = [];

function pass(id, detail = "") {
  results.push({ id, ok: true, detail });
  console.log(`✅ ${id}${detail ? ` — ${detail}` : ""}`);
}

function fail(id, detail = "") {
  results.push({ id, ok: false, detail });
  console.log(`❌ ${id}${detail ? ` — ${detail}` : ""}`);
}

function skip(id, detail = "") {
  results.push({ id, ok: null, detail });
  console.log(`⏭️  ${id}${detail ? ` — ${detail}` : ""}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== InfluexAI Smoke Test (API/Infra) ===\n");

// ENV
const envChecks = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
  ["ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")],
  ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY?.startsWith("sk_")],
  ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_")],
  ["FAL_KEY", process.env.FAL_KEY || process.env.FAL_API_KEY],
  ["ELEVENLABS_API_KEY", process.env.ELEVENLABS_API_KEY?.length > 10],
  ["RESEND_API_KEY", process.env.RESEND_API_KEY?.startsWith("re_")],
  ["AKOOL_CLIENT_ID", process.env.AKOOL_CLIENT_ID],
  ["AKOOL_API_KEY", process.env.AKOOL_API_KEY],
];

for (const [name, ok] of envChecks) {
  if (ok) pass(`env:${name}`);
  else fail(`env:${name}`, "fehlt oder ungültig in .env.local");
}

// Migration 028 tables
if (url && serviceKey) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const tables = [
    "saved_scripts",
    "thumbnail_concepts",
    "niche_saves",
    "outlier_results",
    "remix_results",
  ];
  const suffix = randomUUID();
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: `smoke-${suffix}@influexai.verify`,
    password: randomUUID(),
    email_confirm: true,
  });
  if (userErr) {
    fail("db:auth-user", userErr.message);
  } else {
    const uid = userData.user.id;
    for (const table of tables) {
      const { error } = await admin.from(table).insert({
        user_id: uid,
        ...(table === "saved_scripts"
          ? { script: "smoke", topic: "smoke" }
          : table === "thumbnail_concepts"
            ? { topic: "smoke", concepts: [] }
            : table === "niche_saves"
              ? {
                  niche_data: {
                    title: "t",
                    description: "d",
                    competition: "low",
                    potential: 3,
                    trend: "stable",
                    videoIdeas: ["a", "b", "c"],
                  },
                }
              : table === "outlier_results"
                ? { niche: "smoke", results: [] }
                : { original_url: null, results: [] }),
      });
      if (error) fail(`db:${table}`, `${error.code} ${error.message}`);
      else pass(`db:${table}`, "INSERT OK");
    }
    await admin.auth.admin.deleteUser(uid);
  }
} else {
  skip("db:tables", "no supabase credentials");
}

// Anthropic ping
if (process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 32,
      messages: [{ role: "user", content: 'Say "ok" only' }],
    }),
  });
  if (r.ok) pass("api:anthropic");
  else fail("api:anthropic", `${r.status} ${(await r.text()).slice(0, 120)}`);
}

// FAL queue
const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (falKey) {
  const r = await fetch("https://queue.fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: "smoke test icon" }),
  });
  const t = await r.text();
  if (r.ok && t.includes("request_id")) pass("api:fal", "request_id returned");
  else fail("api:fal", `${r.status} ${t.slice(0, 100)}`);
}

// ElevenLabs
if (process.env.ELEVENLABS_API_KEY) {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
  });
  if (r.ok) pass("api:elevenlabs-voices");
  else fail("api:elevenlabs-voices", String(r.status));
}

// Resend
if (process.env.RESEND_API_KEY?.startsWith("re_")) {
  const r = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (r.ok || r.status === 403) pass("api:resend", r.status === 403 ? "key valid, scope ok" : "domains ok");
  else fail("api:resend", String(r.status));
}

// Production routes
const prodBase = "https://influexaicreator.com";
const routes = [
  ["/", 200],
  ["/login", 200],
  ["/signup", 200],
  ["/forgot-password", null],
  ["/dashboard/gallery", 307],
  ["/de", null],
  ["/en", null],
];
for (const [path, expected] of routes) {
  try {
    const r = await fetch(`${prodBase}${path}`, { redirect: "manual" });
    const code = r.status;
    if (expected && code === expected) pass(`prod:${path}`, String(code));
    else if (expected === null && (code === 200 || code === 307 || code === 308))
      pass(`prod:${path}`, String(code));
    else fail(`prod:${path}`, `expected ${expected ?? "2xx/3xx"}, got ${code}`);
  } catch (e) {
    fail(`prod:${path}`, e.message);
  }
}

// Write JSON for SUMMARY
import { writeFileSync } from "fs";
writeFileSync(
  resolve(process.cwd(), "scripts/smoke-results.json"),
  JSON.stringify(results, null, 2)
);

const ok = results.filter((r) => r.ok === true).length;
const bad = results.filter((r) => r.ok === false).length;
console.log(`\n=== ${ok} passed, ${bad} failed, ${results.length - ok - bad} skipped ===`);

process.exit(bad > 0 ? 1 : 0);

/**
 * Verify + smoke-test Churn Prevention (Edge Function + DB table).
 * Run: node scripts/activate-churn-prevention.mjs
 * Optional: node scripts/activate-churn-prevention.mjs --run-cron
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runCron = process.argv.includes("--run-cron");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

console.log("=== Churn Prevention Activation Check ===\n");

const { error: tableErr } = await supabase.from("churn_prevention").select("id").limit(1);
if (tableErr) {
  console.error("❌ churn_prevention table:", tableErr.message);
  console.log("\n→ Run in Supabase SQL Editor:");
  console.log("   scripts/apply-churn-prevention-sql-editor.sql");
  process.exit(1);
}
console.log("✓ churn_prevention table exists");
console.log("  Expected columns: id (uuid), user_id (uuid), sent_at (timestamptz), type (text)");

const fnUrl = `${url}/functions/v1/churn-prevention`;
console.log("\nEdge Function:", fnUrl);

if (runCron) {
  console.log("\nTriggering cron run…");
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "cron" }),
  });
  const text = await res.text();
  console.log("Status:", res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
} else {
  console.log("\nDry run only. Deploy + cron:");
  console.log("  supabase functions deploy churn-prevention --project-ref hszjafdelcydnppyolkm");
  console.log("  supabase secrets set ANTHROPIC_API_KEY=... RESEND_API_KEY=...");
  console.log("  SQL Editor: scripts/apply-churn-prevention-sql-editor.sql");
  console.log("\nManual test:");
  console.log('  node scripts/activate-churn-prevention.mjs --run-cron');
}

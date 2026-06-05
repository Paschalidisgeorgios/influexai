/**
 * Verify push_notifications table + optional smoke test.
 * Run: node scripts/describe-push-schema.mjs
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

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

console.log("=== push_notifications schema check ===\n");

const { error } = await supabase.from("push_notifications").select("id").limit(1);

if (error) {
  console.error("❌ push_notifications:", error.message);
  console.log("\n→ Apply: supabase/migrations/038_push_notifications_web.sql");
  process.exit(1);
}

console.log("✓ push_notifications table exists");
console.log("\nExpected columns:");
console.log("  id (uuid), user_id (uuid), endpoint (text), p256dh (text), auth (text)");
console.log("  user_agent (text), created_at (timestamptz), updated_at (timestamptz)");
console.log("\nSQL Editor verify:");
console.log(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'push_notifications';"
);

const hasVapid =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
console.log(`\nVAPID keys: ${hasVapid ? "✓ set locally" : "❌ missing in .env.local"}`);

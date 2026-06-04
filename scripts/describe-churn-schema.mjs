/**
 * Prints churn-related table columns from production Supabase.
 * Run: node scripts/describe-churn-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
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

const tables = [
  "churn_prevention",
  "profiles",
  "dismissed_nudges",
  "user_activity_visits",
];

for (const table of tables) {
  const { error } = await supabase.from(table).select("*").limit(0);
  console.log(`\n=== ${table} ===`);
  if (error) {
    console.log("  ", error.code, error.message);
    continue;
  }
  console.log("  (table exists — run SQL Editor for column list)");
}

console.log("\nRun in SQL Editor:");
console.log(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'churn_prevention';"
);

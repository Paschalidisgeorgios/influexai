/**
 * Verify platform + generations tables on remote Supabase (REST / service role).
 * Run: node scripts/verify-platform-and-generations.mjs
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

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLES = [
  "profiles",
  "announcements",
  "platform_settings",
  "daily_suggestions",
  "push_notifications",
  "generations",
  "credit_transactions",
];

console.log("Remote:", url, "\n");

let ok = 0;
for (const name of TABLES) {
  const { error } = await supabase.from(name).select("id").limit(1);
  if (error) {
    const missing =
      error.code === "PGRST205" ||
      error.message.includes("does not exist") ||
      error.message.includes("schema cache");
    console.log(`${missing ? "✗" : "⚠"} ${name}: ${error.code ?? "?"} — ${error.message}`);
  } else {
    console.log(`✓ ${name}`);
    ok += 1;
  }
}

console.log(`\n${ok}/${TABLES.length} Tabellen erreichbar`);
process.exit(ok === TABLES.length ? 0 : 2);

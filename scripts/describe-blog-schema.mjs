/**
 * Verify blog_posts + newsletter_subscribers tables.
 * Run: node scripts/describe-blog-schema.mjs
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
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(url, key);

for (const table of ["blog_posts", "newsletter_subscribers", "guides"]) {
  const { error } = await supabase.from(table).select("id").limit(1);
  console.log(`\n=== ${table} ===`);
  if (error) console.log("  ❌", error.message);
  else console.log("  ✓ table exists");
}

console.log("\nSQL Editor:");
console.log(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('blog_posts','newsletter_subscribers');"
);

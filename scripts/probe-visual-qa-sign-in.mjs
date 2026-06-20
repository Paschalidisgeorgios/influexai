/**
 * Local staging sign-in probe for visualqa@ (no secrets logged).
 * Run: node scripts/probe-visual-qa-sign-in.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const EMAIL = "visualqa@influexai.test";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const password = process.env.VISUAL_QA_PASSWORD?.trim();

function maskRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

if (!password) {
  console.error("❌ Missing VISUAL_QA_PASSWORD (not logged).");
  console.error("Add to .env.local, then: node scripts/probe-visual-qa-sign-in.mjs");
  process.exit(1);
}

if (!url || !anonKey) {
  console.log(
    JSON.stringify(
      {
        sign_in_ok: false,
        error: "missing_supabase_public_env",
        supabase_ref: maskRef(url),
      },
      null,
      2
    )
  );
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data, error } = await anon.auth.signInWithPassword({
  email: EMAIL,
  password,
});

const ref = maskRef(url);
console.log(
  JSON.stringify(
    {
      sign_in_ok: Boolean(data.user && !error),
      supabase_ref: ref,
      staging_ref_ok: ref === STAGING_REF,
      user_id: data.user?.id ?? null,
      error_code: error?.code ?? null,
      error_message: error?.message ?? null,
      secrets_logged: false,
    },
    null,
    2
  )
);
process.exit(data.user && !error ? 0 : 1);

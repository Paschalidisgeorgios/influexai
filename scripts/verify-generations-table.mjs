/**
 * Verify generations table: service-role + authenticated RLS insert.
 * Run: node scripts/verify-generations-table.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let testUserId = null;
let insertedId = null;

async function cleanup() {
  if (insertedId) {
    await admin.from("generations").delete().eq("id", insertedId);
  }
  if (testUserId) {
    await admin.auth.admin.deleteUser(testUserId);
  }
}

try {
  const pwd = randomUUID();
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: `verify-gen-${randomUUID()}@influexai.verify`,
    password: pwd,
    email_confirm: true,
  });
  if (userErr) throw userErr;
  testUserId = userData.user.id;

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: session, error: loginErr } = await userClient.auth.signInWithPassword({
    email: userData.user.email,
    password: pwd,
  });
  if (loginErr) throw loginErr;

  const authed = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authedInsert = await authed
    .from("generations")
    .insert({
      user_id: testUserId,
      type: "__verify_rls__",
      prompt: "rls test",
      credits_used: 1,
      result: { paid: false },
    })
    .select("id")
    .single();

  if (authedInsert.error) {
    console.log(
      "✗ Authenticated INSERT (RLS):",
      authedInsert.error.code,
      "—",
      authedInsert.error.message
    );
    process.exit(2);
  }

  insertedId = authedInsert.data.id;
  console.log("✓ Authenticated INSERT (RLS) OK, id:", insertedId);
  console.log("✓ Tabelle public.generations + INSERT-Policy funktionieren");
} finally {
  await cleanup();
}

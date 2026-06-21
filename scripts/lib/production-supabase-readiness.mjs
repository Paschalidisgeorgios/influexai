/**
 * Read-only Production Supabase readiness checks (no data mutation).
 */
import { readdirSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { PROD_REF } from "./supabase-env-audit.mjs";

const { Client } = pg;
const EXPECTED_MIGRATION_MAX = 68;

export function countLocalMigrations() {
  const dir = resolve(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f));
  const versions = files
    .map((f) => Number.parseInt(f.slice(0, 3), 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  return {
    count: files.length,
    max: versions.at(-1) ?? 0,
    min: versions[0] ?? 0,
    expected_max: EXPECTED_MIGRATION_MAX,
    local_complete: versions.at(-1) === EXPECTED_MIGRATION_MAX,
  };
}

async function queryRemoteMigrations(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query(
      `select version
       from supabase_migrations.schema_migrations
       order by version`
    );
    const versions = rows.map((r) => String(r.version));
    const numeric = versions
      .map((v) => Number.parseInt(v.slice(0, 3), 10))
      .filter((n) => !Number.isNaN(n));
    return {
      count: versions.length,
      max: numeric.at(-1) ?? 0,
      min: numeric[0] ?? 0,
      versions_sample: versions.slice(-5),
      has_068: numeric.includes(68),
      method: "postgres",
    };
  } finally {
    await client.end();
  }
}

function resolveDatabaseUrl(env) {
  if (env.DATABASE_URL?.trim()) return env.DATABASE_URL.trim();
  const password = env.SUPABASE_DB_PASSWORD?.trim();
  if (!password) return null;
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${PROD_REF}:${encoded}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
}

async function probeTable(admin, table) {
  const { error } = await admin.from(table).select("id", { head: true, count: "exact" });
  return { table, ok: !error, code: error?.code ?? null, hint: error?.hint?.slice(0, 80) ?? null };
}

async function probeRpc(admin) {
  const fakeId = "00000000-0000-0000-0000-000000000000";
  const { error } = await admin.rpc("deduct_credits", {
    p_user_id: fakeId,
    p_amount: 1,
  });
  if (!error) return { ok: true, code: null };
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("could not find the function") || error.code === "PGRST202") {
    return { ok: false, code: "rpc_missing" };
  }
  return { ok: true, code: error.code ?? "exists" };
}

async function probeStorage(admin) {
  const { data, error } = await admin.storage.listBuckets();
  if (error) return { ok: false, buckets: [], code: error.message?.slice(0, 80) };
  const names = (data ?? []).map((b) => b.name);
  const wants = ["generated-assets", "lora-training", "faceswap-uploads"];
  return {
    ok: names.includes("generated-assets"),
    buckets: names,
    required_present: wants.filter((n) => names.includes(n)),
  };
}

export async function checkProductionSupabaseReadiness(liveEnv) {
  const blockers = [];
  const local = countLocalMigrations();

  const url = liveEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = liveEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      pass: false,
      blockers: ["missing_production_supabase_credentials"],
      local_migrations: local,
      secrets_logged: false,
    };
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const tables = await Promise.all([
    probeTable(admin, "profiles"),
    probeTable(admin, "generations"),
    probeTable(admin, "credit_transactions"),
  ]);
  for (const t of tables) {
    if (!t.ok) blockers.push(`table_missing_${t.table}`);
  }

  const rpc = await probeRpc(admin);
  if (!rpc.ok) blockers.push("deduct_credits_rpc_missing");

  const storage = await probeStorage(admin);
  if (!storage.ok) blockers.push("storage_buckets_unreadable");
  if (!storage.required_present?.includes("generated-assets")) {
    blockers.push("generated_assets_bucket_missing");
  }

  let remoteMigrations = null;
  const databaseUrl = resolveDatabaseUrl(liveEnv);
  if (databaseUrl) {
    try {
      remoteMigrations = await queryRemoteMigrations(databaseUrl);
      if (!remoteMigrations.has_068) blockers.push("remote_migration_068_missing");
      if (remoteMigrations.max < EXPECTED_MIGRATION_MAX) {
        blockers.push("remote_migrations_incomplete");
      }
    } catch (err) {
      blockers.push("remote_migration_query_failed");
      remoteMigrations = { error: String(err.message ?? err).slice(0, 120) };
    }
  } else {
    blockers.push("migration_check_needs_database_url_or_supabase_db_password");
  }

  return {
    pass: blockers.length === 0,
    blockers,
    local_migrations: local,
    remote_migrations: remoteMigrations,
    tables,
    rpc,
    storage,
    migration_plan_command:
      blockers.includes("remote_migrations_incomplete") ||
      blockers.includes("remote_migration_068_missing")
        ? "Review: supabase link --project-ref hszjafdelcydnppyolkm && supabase db push (manual approval required)"
        : null,
    secrets_logged: false,
  };
}

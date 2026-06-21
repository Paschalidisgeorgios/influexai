/**
 * Read-only Production Supabase readiness checks (no data mutation).
 */
import { readdirSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { PROD_REF, maskRef } from "./supabase-env-audit.mjs";

const { Client } = pg;
const EXPECTED_MIGRATION_MAX = 68;
const DEFAULT_POOLER_HOST = "aws-0-eu-central-1.pooler.supabase.com";
const DEFAULT_POOLER_PORT = 6543;

export function sanitizePgErrorMessage(message) {
  return String(message ?? "")
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "postgresql://[redacted]")
    .replace(/password=[^\s&'"]+/gi, "password=[redacted]")
    .replace(/:[^@\s'"]+@/g, ":[redacted]@")
    .slice(0, 240);
}

export function classifyPgError(err) {
  const code = err?.code ?? null;
  const name = err?.name ?? "Error";
  const raw = String(err?.message ?? err ?? "");
  const message = sanitizePgErrorMessage(raw);

  let error_class = "unknown";
  if (code === "28P01" || /password authentication failed/i.test(raw)) {
    error_class = "auth";
  } else if (
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH" ||
    /timeout|timed out|getaddrinfo/i.test(raw)
  ) {
    error_class = "network";
  } else if (/self signed certificate|ssl|tls|certificate/i.test(raw)) {
    error_class = "ssl";
  } else if (code === "42P01" || /relation .* does not exist/i.test(raw)) {
    error_class = "relation_not_found";
  } else if (code === "3F000" || /schema .* does not exist/i.test(raw)) {
    error_class = "schema_not_found";
  } else if (code === "42501" || /permission denied/i.test(raw)) {
    error_class = "permission";
  }

  return { name, code, message, error_class, secrets_logged: false };
}

export function extractRefFromDatabaseUrl(databaseUrl) {
  const match = String(databaseUrl ?? "").match(
    /postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/i
  );
  return match?.[1] ?? null;
}

export function resolveDatabaseConnection(env) {
  const supabaseUrlRef = maskRef(env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  if (env.DATABASE_URL?.trim()) {
    const databaseUrl = env.DATABASE_URL.trim();
    return {
      databaseUrl,
      connection_method: "DATABASE_URL",
      connection_ref: extractRefFromDatabaseUrl(databaseUrl),
      supabase_url_ref: supabaseUrlRef,
      pooler_host: null,
      pooler_port: null,
      secrets_logged: false,
    };
  }

  const password = env.SUPABASE_DB_PASSWORD?.trim();
  if (!password) {
    return {
      databaseUrl: null,
      connection_method: null,
      connection_ref: null,
      supabase_url_ref: supabaseUrlRef,
      pooler_host: null,
      pooler_port: null,
      secrets_logged: false,
    };
  }

  const encoded = encodeURIComponent(password);
  return {
    databaseUrl: `postgresql://postgres.${PROD_REF}:${encoded}@${DEFAULT_POOLER_HOST}:${DEFAULT_POOLER_PORT}/postgres`,
    connection_method: "SUPABASE_DB_PASSWORD",
    connection_ref: PROD_REF,
    supabase_url_ref: supabaseUrlRef,
    pooler_host: DEFAULT_POOLER_HOST,
    pooler_port: DEFAULT_POOLER_PORT,
    secrets_logged: false,
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

export async function diagnoseRemoteMigrationQuery(env) {
  const connection = resolveDatabaseConnection(env);
  const diagnostics = {
    connection_method: connection.connection_method,
    connection_ref: connection.connection_ref,
    supabase_url_ref: connection.supabase_url_ref,
    is_production_ref:
      connection.supabase_url_ref === PROD_REF &&
      (connection.connection_ref === PROD_REF || connection.connection_ref === null),
    pooler_host: connection.pooler_host,
    pooler_port: connection.pooler_port,
    connect_ok: false,
    migration_schema_exists: null,
    migration_table_query_ok: false,
    error: null,
    secrets_logged: false,
  };

  if (!connection.databaseUrl) {
    diagnostics.error = {
      name: "MissingDatabaseCredentials",
      code: null,
      message: "DATABASE_URL and SUPABASE_DB_PASSWORD are both unset",
      error_class: "missing_credentials",
    };
    return diagnostics;
  }

  const client = new Client({
    connectionString: connection.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    diagnostics.connect_ok = true;

    const schemaCheck = await client.query(
      `select exists (
         select 1
         from information_schema.schemata
         where schema_name = 'supabase_migrations'
       ) as schema_exists`
    );
    diagnostics.migration_schema_exists = schemaCheck.rows[0]?.schema_exists === true;

    if (!diagnostics.migration_schema_exists) {
      diagnostics.error = {
        name: "MigrationSchemaMissing",
        code: "3F000",
        message: "schema supabase_migrations not found",
        error_class: "schema_not_found",
      };
      return diagnostics;
    }

    await client.query(
      `select version
       from supabase_migrations.schema_migrations
       order by version
       limit 1`
    );
    diagnostics.migration_table_query_ok = true;
    return diagnostics;
  } catch (err) {
    diagnostics.error = classifyPgError(err);
    return diagnostics;
  } finally {
    await client.end().catch(() => {});
  }
}

function resolveDatabaseUrl(env) {
  return resolveDatabaseConnection(env).databaseUrl;
}

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
  let migrationQueryDiagnostics = null;
  const databaseUrl = resolveDatabaseUrl(liveEnv);
  migrationQueryDiagnostics = await diagnoseRemoteMigrationQuery(liveEnv);

  if (databaseUrl) {
    try {
      remoteMigrations = await queryRemoteMigrations(databaseUrl);
      if (!remoteMigrations.has_068) blockers.push("remote_migration_068_missing");
      if (remoteMigrations.max < EXPECTED_MIGRATION_MAX) {
        blockers.push("remote_migrations_incomplete");
      }
    } catch (err) {
      blockers.push("remote_migration_query_failed");
      remoteMigrations = {
        error: sanitizePgErrorMessage(err?.message ?? err),
        error_detail: classifyPgError(err),
      };
    }
  } else {
    blockers.push("migration_check_needs_database_url_or_supabase_db_password");
  }

  return {
    pass: blockers.length === 0,
    blockers,
    local_migrations: local,
    remote_migrations: remoteMigrations,
    migration_query_diagnostics: {
      ...migrationQueryDiagnostics,
      query:
        "select version from supabase_migrations.schema_migrations order by version",
      transport: "postgres_direct_pooler",
    },
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

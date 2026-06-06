/**
 * Apply idempotent SQL migrations to remote Supabase via direct Postgres.
 *
 * Requires one of:
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@...
 *   SUPABASE_DB_PASSWORD=[database password from Dashboard → Settings → Database]
 *
 * Run:
 *   node scripts/apply-remote-migrations.mjs
 *   node scripts/apply-remote-migrations.mjs --only 044
 *   node scripts/apply-remote-migrations.mjs --only 045
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import pg from "pg";

const { Client } = pg;

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();

const PROJECT_REF = "hszjafdelcydnppyolkm";

const MIGRATIONS = {
  "044": "scripts/apply-platform-tables-sql-editor.sql",
  "045": "scripts/apply-generations-sql-editor.sql",
};

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) return null;
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${PROJECT_REF}:${encoded}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
}

async function applySql(client, label, filePath) {
  const sql = readFileSync(resolve(process.cwd(), filePath), "utf8");
  console.log(`\n▶ Applying ${label} (${filePath})…`);
  await client.query(sql);
  console.log(`✓ ${label} applied`);
}

async function verifyTables(client) {
  const names = [
    "announcements",
    "platform_settings",
    "daily_suggestions",
    "push_notifications",
    "generations",
    "credit_transactions",
  ];
  const { rows } = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name = any($1::text[])
     order by table_name`,
    [names]
  );
  console.log("\n=== Tabellen in public (Remote) ===");
  for (const name of names) {
    const found = rows.some((r) => r.table_name === name);
    console.log(`${found ? "✓" : "✗"} ${name}`);
  }
  return rows.map((r) => r.table_name);
}

async function main() {
  const onlyArg = process.argv.indexOf("--only");
  const only = onlyArg !== -1 ? process.argv[onlyArg + 1] : null;

  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) {
    console.error(
      "Fehlt DATABASE_URL oder SUPABASE_DB_PASSWORD in .env.local / Umgebung.\n" +
        "Dashboard → Project Settings → Database → Database password\n\n" +
        "Alternativ: SQL Editor → scripts/apply-platform-tables-sql-editor.sql\n" +
        "            dann scripts/apply-generations-sql-editor.sql"
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const toRun = only
      ? { [only]: MIGRATIONS[only] }
      : MIGRATIONS;

    if (only && !MIGRATIONS[only]) {
      throw new Error(`Unknown --only ${only} (use 044 or 045)`);
    }

    for (const [label, file] of Object.entries(toRun)) {
      await applySql(client, label, file);
    }

    await verifyTables(client);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

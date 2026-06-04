/**
 * Verifies Migration 028 flow-save tables on Production Supabase.
 * Run: node scripts/verify-migration-028.mjs
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local (bypasses RLS; no anon session).
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomUUID } from "crypto";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Fehlt: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLES = [
  {
    name: "thumbnail_concepts",
    insert: {
      topic: "__verify_028__",
      concepts: [{ conceptTitle: "test" }],
    },
    update: { topic: "__verify_028_updated__" },
  },
  {
    name: "niche_saves",
    insert: {
      niche_data: {
        title: "test",
        description: "x",
        competition: "low",
        potential: 3,
        trend: "stable",
        videoIdeas: ["a", "b", "c"],
      },
    },
    update: {
      niche_data: {
        title: "test-updated",
        description: "y",
        competition: "low",
        potential: 3,
        trend: "stable",
        videoIdeas: ["a"],
      },
    },
  },
  {
    name: "saved_scripts",
    insert: {
      topic: "__verify_028__",
      script: "[HOOK]\nTest\n[MAIN]\nBody\n[CTA]\nEnd",
      settings: {},
    },
    update: { topic: "__verify_028_updated__" },
  },
  {
    name: "outlier_results",
    insert: {
      niche: "__verify_028__",
      results: [
        {
          title: "t",
          outlierScore: 8,
          hook: "h",
          thumbnailConcept: "c",
          whyItWorked: ["a", "b", "c"],
          viralMechanism: "list",
        },
      ],
    },
    update: { niche: "__verify_028_updated__" },
  },
  {
    name: "remix_results",
    insert: {
      original_url: "https://example.com/video",
      results: [
        {
          remixTitle: "t",
          description: "d",
          hook: "h",
          structure: { intro: "i", middle: "m", cta: "c" },
          similarityPercent: 50,
          uniqueAngle: "u",
        },
      ],
    },
    update: { original_url: "https://example.com/updated" },
  },
];

/** Rows inserted during this run (for final cleanup). */
const insertedRowIds = [];

/**
 * user_id must exist in auth.users (FK). Service role bypasses RLS only.
 * We create a throwaway user; its id is a random UUID for all test rows.
 */
let ephemeralAuthUserId = null;

async function createTestUserId() {
  const suffix = randomUUID();
  const { data, error } = await supabase.auth.admin.createUser({
    email: `verify-028-${suffix}@influexai.verify`,
    password: randomUUID(),
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Test-User anlegen fehlgeschlagen: ${error.message}`);
  }

  ephemeralAuthUserId = data.user.id;
  return data.user.id;
}

async function cleanupEphemeralUser() {
  if (!ephemeralAuthUserId) return;
  await supabase.auth.admin.deleteUser(ephemeralAuthUserId);
  ephemeralAuthUserId = null;
}

async function cleanupTestRows() {
  for (const { table, id } of insertedRowIds) {
    await supabase.from(table).delete().eq("id", id);
  }
  insertedRowIds.length = 0;
}

async function verifyTable(tableDef, userId) {
  const { name, insert, update } = tableDef;

  const countRes = await supabase
    .from(name)
    .select("*", { count: "exact", head: true });

  if (countRes.error) {
    const msg = countRes.error.message;
    if (
      countRes.error.code === "PGRST205" ||
      countRes.error.code === "42P01" ||
      msg.includes("does not exist") ||
      msg.includes("schema cache")
    ) {
      return { ok: false, step: "exists", message: `Tabelle fehlt: ${msg}` };
    }
    return { ok: false, step: "exists", message: msg };
  }

  const ins = await supabase
    .from(name)
    .insert({ user_id: userId, ...insert })
    .select("id")
    .single();

  if (ins.error) {
    return { ok: false, step: "insert", message: ins.error.message };
  }

  const rowId = ins.data.id;
  insertedRowIds.push({ table: name, id: rowId });

  const sel = await supabase.from(name).select("*").eq("id", rowId).single();
  if (sel.error) {
    return { ok: false, step: "select", message: sel.error.message };
  }

  const upd = await supabase
    .from(name)
    .update(update)
    .eq("id", rowId)
    .select("id")
    .single();

  if (upd.error) {
    return { ok: false, step: "update", message: upd.error.message };
  }

  const del = await supabase.from(name).delete().eq("id", rowId);
  if (del.error) {
    return { ok: false, step: "delete", message: del.error.message };
  }

  const idx = insertedRowIds.findIndex((r) => r.table === name && r.id === rowId);
  if (idx !== -1) insertedRowIds.splice(idx, 1);

  return { ok: true };
}

function formatLine(table, result) {
  if (result.ok) {
    return `✅ ${table} — CREATE / READ / UPDATE / DELETE OK`;
  }
  const stepLabels = {
    exists: "Tabelle existiert nicht",
    insert: "INSERT fehlgeschlagen",
    select: "SELECT fehlgeschlagen",
    update: "UPDATE fehlgeschlagen",
    delete: "DELETE fehlgeschlagen",
  };
  const label = stepLabels[result.step] ?? result.step;
  return `❌ ${table} — ${label}: ${result.message}`;
}

async function main() {
  console.log("Migration 028 — Tabellen-Check (Production Supabase)");
  console.log("URL:", url);
  console.log("");

  const userId = await createTestUserId();
  console.log("Test user_id:", userId, "\n");

  let okCount = 0;
  const lines = [];

  try {
    for (const tableDef of TABLES) {
      const result = await verifyTable(tableDef, userId);
      lines.push(formatLine(tableDef.name, result));
      if (result.ok) okCount += 1;
    }
  } finally {
    await cleanupTestRows();
    await cleanupEphemeralUser();
  }

  for (const line of lines) {
    console.log(line);
  }

  console.log("");
  console.log(`Zusammenfassung: ${okCount}/5 Tabellen OK`);

  if (okCount < 5) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

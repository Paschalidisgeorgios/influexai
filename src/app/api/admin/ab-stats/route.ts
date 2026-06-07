import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin";
import { buildAbResults } from "@/lib/ab-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.error === "Nicht eingeloggt." ? 401 : 403 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: events, error } = await supabaseAdmin
    .from("ab_events")
    .select("variant, event");

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({
        results: buildAbResults([]),
        warning: "Tabelle ab_events fehlt — Migration 012 ausführen.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of events ?? []) {
    const key = `${row.variant}:${row.event}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const rows = [...counts.entries()].map(([key, count]) => {
    const [variant, event] = key.split(":");
    return { variant, event, count };
  });

  return NextResponse.json({ results: buildAbResults(rows) });
}

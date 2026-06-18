import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST() {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

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

  const { error } = await supabaseAdmin
    .from("ab_events")
    .delete()
    .in("variant", ["a", "b"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST() {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({ last_active_at: now })
    .eq("id", user.id);

  await supabase.from("user_activity_visits").insert({
    user_id: user.id,
    visited_at: now,
  });

  return NextResponse.json({ ok: true });
}

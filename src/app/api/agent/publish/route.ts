
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { executionId } = (await req.json()) as {
    executionId?: string;
  };

  if (!executionId) {
    return NextResponse.json(
      { error: "executionId erforderlich" },
      { status: 400 }
    );
  }

  // TODO: GUARD — nur nach Guard-Bestätigung aufrufbar
  // TODO: Social Media APIs (Instagram Graph, TikTok, LinkedIn)

  const { error } = await supabase
    .from("agent_executions")
    .update({
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", executionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Als veröffentlicht markiert.",
    note: "Direkte Social-Media-Veröffentlichung folgt wenn APIs angebunden.",
  });
}

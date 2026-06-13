import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  fetchCanvasAnalytics,
  recordCanvasGeneration,
} from "@/lib/canvas/analytics-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const snapshot = await fetchCanvasAnalytics(supabase, user.id);
    return NextResponse.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analytics fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const { toolId, creditsUsed, prompt } = body as Record<string, unknown>;
  if (typeof toolId !== "string" || typeof creditsUsed !== "number") {
    return NextResponse.json({ error: "toolId und creditsUsed erforderlich" }, { status: 400 });
  }

  try {
    await recordCanvasGeneration(supabase, user.id, {
      toolId,
      creditsUsed,
      prompt: typeof prompt === "string" ? prompt : undefined,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speichern fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

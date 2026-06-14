import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  calculateCanvasToolCoins,
  getCanvasToolBaseCoins,
} from "@/lib/canvas/tool-credit-costs";
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

  const { toolId, prompt } = body as Record<string, unknown>;
  if (typeof toolId !== "string") {
    return NextResponse.json({ error: "toolId erforderlich" }, { status: 400 });
  }

  const params =
    body.params && typeof body.params === "object" && !Array.isArray(body.params)
      ? (body.params as Record<string, unknown>)
      : {};

  const creditsUsed = calculateCanvasToolCoins(
    { id: toolId, baseCoins: getCanvasToolBaseCoins(toolId) },
    params
  );

  try {
    await recordCanvasGeneration(supabase, user.id, {
      toolId,
      creditsUsed,
      prompt: typeof prompt === "string" ? prompt : undefined,
    });
    return NextResponse.json({ success: true, creditsUsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speichern fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

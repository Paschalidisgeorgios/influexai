import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Invalid subscription payload" },
      { status: 400 }
    );
  }

  const userAgent = request.headers.get("user-agent") ?? undefined;
  const now = new Date().toISOString();

  const { error } = await supabase.from("push_notifications").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
      updated_at: now,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("[push/subscribe]", error.message);
    return NextResponse.json({ error: "Could not save subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    await supabase
      .from("push_notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
  } else {
    await supabase.from("push_notifications").delete().eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}

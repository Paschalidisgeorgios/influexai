import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function isE2eTestApiEnabled() {
  return process.env.E2E_TEST_API === "1" || process.env.PLAYWRIGHT === "1";
}

export async function POST(request: Request) {
  if (!isE2eTestApiEnabled()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let credits: number;
  try {
    const body = await request.json();
    credits = Number(body?.credits);
    if (!Number.isFinite(credits) || credits < 0) {
      return NextResponse.json({ error: "Invalid credits" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceSupabaseClient();
  const { error } = await service
    .from("profiles")
    .update({ credits })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, credits });
}

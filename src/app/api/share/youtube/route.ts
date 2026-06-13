import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  publishAssetToSocial,
  validateSharePublishBody,
} from "@/lib/share/publish-handler";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const validated = validateSharePublishBody(body);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  try {
    const result = await publishAssetToSocial("youtube", validated, user.id, supabase);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "YouTube-Upload fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

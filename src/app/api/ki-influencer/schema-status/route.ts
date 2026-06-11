import { NextResponse } from "next/server";
import { checkKiInfluencerWizardSchema } from "@/lib/ki-influencer-schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Nicht eingeloggt." }, {
      status: 401,
    });
  }

  const status = await checkKiInfluencerWizardSchema(supabase);

  return NextResponse.json({
    success: true,
    ready: status.ready,
    missing: status.missing,
  });
}

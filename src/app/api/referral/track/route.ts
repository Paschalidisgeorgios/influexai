import { cookies } from "next/headers";

import { NextResponse } from "next/server";
import { registerReferralOnSignup } from "@/app/actions/referral";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { REFERRAL_REF_COOKIE } from "@/lib/referral-ref-cookie";

export const dynamic = "force-dynamic";

/**
 * POST /api/referral/track
 * Body (optional): { "ref": "user-uuid-or-referral-code" }
 * Falls back to influexai_ref cookie from middleware.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  let ref: string | undefined;
  try {
    const body = (await request.json()) as { ref?: string };
    ref = body.ref?.trim();
  } catch {
    /* empty body ok */
  }

  if (!ref) {
    const cookieStore = await cookies();
    ref = cookieStore.get(REFERRAL_REF_COOKIE)?.value?.trim();
  }

  if (!ref) {
    return NextResponse.json({
      success: true,
      tracked: false,
      message: "Kein Referral-Parameter",
    });
  }

  const result = await registerReferralOnSignup(user.id, ref);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error ?? "Tracking fehlgeschlagen" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true, tracked: true });
  response.cookies.set(REFERRAL_REF_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}

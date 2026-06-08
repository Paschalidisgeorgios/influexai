import { NextRequest, NextResponse } from "next/server";

import { hasActivePlan } from "@/lib/access";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";
import { normalizePlan } from "@/lib/subscription-plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Read-only checkout confirmation — never mutates plan or credits. */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  const type = request.nextUrl.searchParams.get("type") ?? "subscription";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { status: "error", message: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  if (sessionId && type === "subscription") {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const metaUser =
        session.metadata?.user_id ?? session.metadata?.userId ?? null;
      if (metaUser && metaUser !== user.id) {
        return NextResponse.json(
          { status: "error", message: "Ungültige Checkout-Session." },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "Checkout-Session konnte nicht geladen werden.",
        },
        { status: 400 }
      );
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, role, is_admin")
    .eq("id", user.id)
    .single();

  const accessUser = {
    email: user.email,
    plan: profile?.plan,
    role: profile?.role,
    is_admin: profile?.is_admin,
  };

  if (isPlatformAdminServer(accessUser) || hasActivePlan(accessUser)) {
    return NextResponse.json({
      status: "active",
      redirectTo: "/dashboard",
      plan: normalizePlan(profile?.plan),
    });
  }

  return NextResponse.json({ status: "pending" });
}

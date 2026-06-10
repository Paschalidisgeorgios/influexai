import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: admin.error === "Nicht eingeloggt." ? 401 : 403 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, plan, credits, created_at, is_admin")
    .order("created_at", { ascending: false });

  const totalUsers = users?.length ?? 0;
  const freeUsers = users?.filter((u) => u.plan === "free").length ?? 0;
  const starterUsers = users?.filter((u) => u.plan === "starter").length ?? 0;
  const creatorUsers = users?.filter((u) => u.plan === "creator").length ?? 0;
  const proUsers = users?.filter((u) => u.plan === "pro").length ?? 0;
  const businessUsers = users?.filter((u) => u.plan === "business").length ?? 0;
  const totalCredits =
    users?.reduce((sum, u) => sum + (u.credits ?? 0), 0) ?? 0;

  return NextResponse.json({
    stats: {
      totalUsers,
      freeUsers,
      starterUsers,
      creatorUsers,
      proUsers,
      businessUsers,
      totalCredits,
    },
    users: users ?? [],
  });
}

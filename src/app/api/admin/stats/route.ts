import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Alle Nutzer laden
  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, plan, credits, created_at, is_admin")
    .order("created_at", { ascending: false });

  const totalUsers = users?.length ?? 0;
  const freeUsers = users?.filter((u) => u.plan === "free").length ?? 0;
  const creatorUsers = users?.filter((u) => u.plan === "creator").length ?? 0;
  const businessUsers = users?.filter((u) => u.plan === "business").length ?? 0;
  const totalCredits =
    users?.reduce((sum, u) => sum + (u.credits ?? 0), 0) ?? 0;

  return NextResponse.json({
    stats: { totalUsers, freeUsers, creatorUsers, businessUsers, totalCredits },
    users: users ?? [],
  });
}

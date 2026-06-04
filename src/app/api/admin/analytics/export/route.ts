import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("email, full_name, plan, credits, created_at, is_admin")
    .order("created_at", { ascending: false });

  const header = "email,full_name,plan,credits,created_at,is_admin";
  const lines = (users ?? []).map((u) => {
    const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
    return [
      esc(u.email ?? ""),
      esc(u.full_name ?? ""),
      u.plan ?? "",
      String(u.credits ?? 0),
      u.created_at ?? "",
      String(u.is_admin ?? false),
    ].join(",");
  });

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="influexai-users.csv"',
    },
  });
}

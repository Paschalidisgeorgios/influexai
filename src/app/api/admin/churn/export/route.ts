import { NextResponse } from "next/server";
import { getAdminChurnDashboard } from "@/app/actions/churn";

export async function GET() {
  const data = await getAdminChurnDashboard("all");

  if ("error" in data) {
    return NextResponse.json({ error: data.error }, { status: 403 });
  }

  const header =
    "email,full_name,last_active,last_generation,churn_score,risk,reasons";
  const lines = data.users.map((u) => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      esc(u.email),
      esc(u.fullName ?? ""),
      esc(u.lastActiveAt ?? ""),
      esc(u.lastGenerationAt ?? ""),
      String(u.score),
      u.risk,
      esc(u.reasons.join("; ")),
    ].join(",");
  });

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="influexai-churn-at-risk.csv"',
    },
  });
}

import { NextResponse } from "next/server";
import { getBetaPublicStats } from "@/app/actions/beta";

export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getBetaPublicStats();
    return NextResponse.json(stats);
  } catch (e) {
    console.error("[beta/stats]", e);
    return NextResponse.json(
      { taken: 0, total: 100, spotsLeft: 100, recent: [] },
      { status: 500 }
    );
  }
}

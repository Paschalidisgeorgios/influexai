export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "RunPod nicht aktiv." }, { status: 410 });
}

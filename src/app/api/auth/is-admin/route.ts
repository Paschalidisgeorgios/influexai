export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";

export async function GET() {
  const admin = await isAdminUser();
  return NextResponse.json({ isAdmin: admin });
}

import { NextResponse } from "next/server";

/** Hit GET /api/sentry-test to verify Sentry captures server errors. */
export async function GET() {
  if (process.env.NODE_ENV === "production" && !process.env.SENTRY_TEST_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  throw new Error("Sentry Test");
}

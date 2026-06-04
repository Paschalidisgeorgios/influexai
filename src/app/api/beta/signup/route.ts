import { NextResponse } from "next/server";
import { joinBeta, joinBetaWaitlist } from "@/app/actions/beta";

export const runtime = "nodejs";

type Body = {
  email?: string;
  name?: string;
  niche?: string;
  waitlist?: boolean;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const niche = body.niche?.trim();
  if (!email || !niche) {
    return NextResponse.json(
      { success: false, error: "email and niche are required" },
      { status: 400 }
    );
  }

  try {
    if (body.waitlist) {
      const res = await joinBetaWaitlist({
        email,
        name: body.name,
        niche,
      });
      if (!res.success) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    const res = await joinBeta({
      email,
      name: body.name,
      niche,
    });

    if (!res.success) {
      const status = res.error === "FULL" ? 409 : 400;
      return NextResponse.json(res, { status });
    }

    return NextResponse.json(res);
  } catch (e) {
    console.error("[api/beta/signup]", e);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

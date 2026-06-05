import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/web-push-server";

type Body = {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
};

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("Authorization");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!serviceKey && auth === `Bearer ${serviceKey}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, title, body: pushBody, url } = body;
  if (!userId || !title || !pushBody) {
    return NextResponse.json(
      { error: "userId, title and body required" },
      { status: 400 }
    );
  }

  const result = await sendPushToUser(userId, {
    title,
    body: pushBody,
    url: url ?? "/dashboard",
  });

  return NextResponse.json(result);
}

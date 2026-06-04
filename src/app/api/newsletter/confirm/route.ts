import { NextRequest, NextResponse } from "next/server";
import { confirmNewsletterByToken } from "@/app/actions/newsletter";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await confirmNewsletterByToken(token);

  const redirect = new URL(
    result.ok ? "/guides?newsletter=confirmed" : "/guides?newsletter=invalid",
    request.url
  );

  return NextResponse.redirect(redirect);
}

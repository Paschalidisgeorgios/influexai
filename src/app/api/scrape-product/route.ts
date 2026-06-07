import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertGatedFeature } from "@/lib/access.server";
import { scrapeProductUrl } from "@/lib/scrape-product";

export const dynamic = "force-dynamic";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("produkt-ads");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: string };
    url = body.url?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const result = await scrapeProductUrl(url);
  if (!result.ok) {
    const status = result.error.includes("geladen") ? 422 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, product: result.product });
}

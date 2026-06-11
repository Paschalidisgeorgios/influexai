import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  downloadStorageObject,
  getOwnedGeneration,
} from "@/lib/generation-assets";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const download = request.nextUrl.searchParams.get("download") === "1";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const row = await getOwnedGeneration(supabase, id, user.id);
  if (!row?.asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storagePath = row.asset.finalPath;
  if (!storagePath) {
    return NextResponse.json({ error: "Audio not available" }, { status: 404 });
  }

  try {
    const { data, contentType } = await downloadStorageObject(storagePath);
    const buffer = Buffer.from(await data.arrayBuffer());
    const filename = `ki-stimme-${id.slice(0, 8)}.mp3`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "audio/mpeg",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="${filename}"`,
            }
          : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio not available" }, { status: 404 });
  }
}

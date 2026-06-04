import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  downloadStorageObject,
  getOwnedGeneration,
} from "@/lib/generation-assets";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const variant = request.nextUrl.searchParams.get("variant") ?? "preview";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const row = await getOwnedGeneration(supabase, id, user.id);
  if (!row?.asset) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const { asset } = row;
  let storagePath: string | undefined;

  if (variant === "final") {
    if (!asset.downloadPaid || !asset.finalPath) {
      return NextResponse.json({ error: "Nicht freigeschaltet" }, { status: 403 });
    }
    storagePath = asset.finalPath;
  } else if (variant === "source") {
    storagePath = asset.sourcePath;
    if (!storagePath) {
      return NextResponse.json({ error: "Quelle nicht verfügbar" }, { status: 404 });
    }
  } else if (variant === "upscaled") {
    storagePath = asset.upscaledPath;
    if (!storagePath) {
      return NextResponse.json({ error: "Upscale nicht verfügbar" }, { status: 404 });
    }
  } else {
    storagePath = asset.previewPath ?? (asset.downloadPaid ? asset.finalPath : undefined);
    if (!storagePath) {
      return NextResponse.json({ error: "Vorschau nicht verfügbar" }, { status: 404 });
    }
  }

  try {
    const { data, contentType } = await downloadStorageObject(storagePath);
    const buffer = Buffer.from(await data.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Bild nicht verfügbar" }, { status: 404 });
  }
}

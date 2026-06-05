import { NextResponse } from "next/server";
import {
  downloadStorageObject,
  getOwnedGeneration,
} from "@/lib/generation-assets";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createServiceSupabaseClient();

  const { data: gen } = await supabase
    .from("generations")
    .select("id, user_id, is_public, result, type")
    .eq("id", id)
    .maybeSingle();

  if (!gen?.is_public) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", gen.user_id)
    .eq("is_public", true)
    .not("username", "is", null)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const owned = await getOwnedGeneration(supabase, id, gen.user_id);
  const asset = owned?.asset ?? parseGenerationAssetResult(gen.result);
  const storagePath =
    asset?.previewPath ??
    (asset?.downloadPaid ? asset.finalPath : undefined) ??
    asset?.sourcePath;

  if (!storagePath) {
    return NextResponse.json({ error: "Vorschau nicht verfügbar" }, { status: 404 });
  }

  try {
    const { data, contentType } = await downloadStorageObject(storagePath);
    const buffer = Buffer.from(await data.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset nicht ladbar" }, { status: 500 });
  }
}

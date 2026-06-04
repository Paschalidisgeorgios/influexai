import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  downloadStorageObject,
  getOwnedGeneration,
} from "@/lib/generation-assets";

function filenameForType(type: string, mimeType: string): string {
  if (mimeType.startsWith("video/")) {
    return `influexai-${type}.mp4`;
  }
  return `influexai-${type}.jpg`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ generation_id: string }> }
) {
  const { generation_id: generationId } = await context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const row = await getOwnedGeneration(supabase, generationId, user.id);
  if (!row?.asset?.finalPath) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  if (!row.asset.downloadPaid && !row.asset.paid) {
    return NextResponse.json(
      { error: "Download erst nach Freischaltung möglich" },
      { status: 403 }
    );
  }

  try {
    const { data, contentType } = await downloadStorageObject(row.asset.finalPath);
    const buffer = Buffer.from(await data.arrayBuffer());
    const filename = filenameForType(row.type, row.asset.mimeType ?? contentType);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download fehlgeschlagen" }, { status: 500 });
  }
}

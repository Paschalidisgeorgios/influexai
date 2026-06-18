import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { LORA_STORAGE_BUCKET } from "@/lib/lora-config";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  let loraId: string | undefined;
  try {
    const body = (await request.json()) as { id?: string };
    loraId = body.id;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!loraId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: lora } = await supabase
    .from("lora_models")
    .select("id, session_id, status")
    .eq("id", loraId)
    .eq("user_id", user.id)
    .single();

  if (!lora) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lora.status === "training") {
    return NextResponse.json(
      { error: "Cannot delete while training is in progress" },
      { status: 409 }
    );
  }

  const { error: deleteErr } = await supabase
    .from("lora_models")
    .delete()
    .eq("id", loraId)
    .eq("user_id", user.id);

  if (deleteErr) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  if (lora.session_id) {
    const service = createServiceSupabaseClient();
    const prefix = `${user.id}/${lora.session_id}`;
    const { data: files } = await service.storage
      .from(LORA_STORAGE_BUCKET)
      .list(`${user.id}/${lora.session_id}`);

    if (files?.length) {
      const paths = files.map((f) => `${prefix}/${f.name}`);
      await service.storage.from(LORA_STORAGE_BUCKET).remove(paths);
    }
  }

  return NextResponse.json({ success: true });
}

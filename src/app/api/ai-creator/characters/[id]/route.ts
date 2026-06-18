import { NextResponse } from "next/server";

import {
  assertCharacterDeletable,
} from "@/lib/ai-creator/characters-delete.server";
import { CHARACTERS_BASELINE_SELECT, type CharactersBaselineRow } from "@/lib/ai-creator/characters-list.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import {
  assertKiInfluencerAccess,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE — remove own draft/failed AI Creator character (no storage/lora cleanup). */
export async function DELETE(_request: Request, context: RouteContext) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const { id: characterId } = await context.params;
  const trimmedId = characterId?.trim();
  if (!trimmedId) {
    return NextResponse.json(
      { success: false, error: "Character nicht gefunden." },
      { status: 404 }
    );
  }

  try {
    const { data, error: fetchError } = await supabase
      .from("characters")
      .select(CHARACTERS_BASELINE_SELECT)
      .eq("id", trimmedId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      return mapSupabaseWriteError("ai-creator character delete lookup", fetchError);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Character nicht gefunden." },
        { status: 404 }
      );
    }

    const row = data as CharactersBaselineRow;
    const deletable = assertCharacterDeletable(row);
    if (!deletable.ok) {
      return NextResponse.json(
        { success: false, error: deletable.error },
        { status: 409 }
      );
    }

    const { error: deleteError } = await supabase
      .from("characters")
      .delete()
      .eq("id", trimmedId)
      .eq("user_id", userId);

    if (deleteError) {
      return mapSupabaseWriteError("ai-creator character delete", deleteError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logKiInfluencerError("ai-creator character delete", error);
    return NextResponse.json(
      { success: false, error: "Character konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import type { KiToolAccessGranted } from "@/lib/access.server";
import {
  assertHandoffEligible,
  buildHandoffStatusUpdate,
} from "@/lib/ai-creator/characters-handoff.server";
import { CHARACTER_HANDOFF_BLOCKED_MESSAGE } from "@/lib/ai-creator/characters-handoff-policy";
import {
  aiCreatorRowToListItem,
  CHARACTERS_AI_CREATOR_SELECT,
  CHARACTERS_HANDOFF_SELECT,
  type CharactersHandoffRow,
} from "@/lib/ai-creator/characters-list.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import {
  assertKiInfluencerAccess,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";
import { isSupabaseRelationMissingError } from "@/lib/ki-influencer-supabase-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function mapHandoffWriteError(context: string, error: unknown): NextResponse {
  logKiInfluencerError(context, error);

  if (isSupabaseRelationMissingError(error)) {
    return NextResponse.json(
      { success: false, error: "Characters-Tabelle ist nicht verfügbar." },
      { status: 503 }
    );
  }

  const record = error as { code?: string; message?: string };
  const message = record.message ?? "";

  if (record.code === "42703" || /column .* does not exist/i.test(message)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Datenbankschema ist für diesen Vorgang nicht kompatibel. Migration ausstehend.",
      },
      { status: 503 }
    );
  }

  if (record.code === "23514") {
    return NextResponse.json(
      { success: false, error: "Ungültige Character-Daten." },
      { status: 400 }
    );
  }

  return mapSupabaseWriteError(context, error);
}

async function loadOwnCharacterForHandoff(
  supabase: KiToolAccessGranted["supabase"],
  userId: string,
  characterId: string
): Promise<
  | { ok: true; row: CharactersHandoffRow }
  | { ok: false; response: NextResponse }
> {
  const { data, error } = await supabase
    .from("characters")
    .select(CHARACTERS_HANDOFF_SELECT)
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: mapHandoffWriteError("ai-creator character handoff lookup", error),
    };
  }

  if (!data) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Character nicht gefunden." },
        { status: 404 }
      ),
    };
  }

  return { ok: true, row: data as CharactersHandoffRow };
}

/** POST — validate draft and mark character as ready for upload preparation (no upload/training). */
export async function POST(_request: Request, context: RouteContext) {
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
    const loaded = await loadOwnCharacterForHandoff(supabase, userId, trimmedId);
    if (!loaded.ok) return loaded.response;

    const eligible = assertHandoffEligible(loaded.row);
    if (!eligible.ok) {
      return NextResponse.json(
        {
          success: false,
          error: eligible.error,
          code: eligible.code,
          issues: eligible.issues,
        },
        { status: eligible.status }
      );
    }

    const { data, error } = await supabase
      .from("characters")
      .update(buildHandoffStatusUpdate())
      .eq("id", trimmedId)
      .eq("user_id", userId)
      .eq("status", "draft")
      .select(CHARACTERS_AI_CREATOR_SELECT)
      .single();

    if (error) {
      return mapHandoffWriteError("ai-creator character handoff", error);
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: CHARACTER_HANDOFF_BLOCKED_MESSAGE,
          code: "handoff_not_allowed",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      character: aiCreatorRowToListItem(data),
      message: "Draft ist bereit für die Upload-Vorbereitung.",
    });
  } catch (error) {
    logKiInfluencerError("ai-creator character handoff", error);
    return NextResponse.json(
      { success: false, error: "Handoff konnte nicht abgeschlossen werden." },
      { status: 500 }
    );
  }
}

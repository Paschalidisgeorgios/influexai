import { NextResponse } from "next/server";

import type { KiToolAccessGranted } from "@/lib/access.server";
import {
  assertUploadShellEligible,
  buildUploadShellResponseMeta,
  buildUploadShellStatusUpdate,
} from "@/lib/ai-creator/characters-upload-shell.server";
import { CHARACTER_UPLOAD_SHELL_BLOCKED_MESSAGE } from "@/lib/ai-creator/characters-upload-shell-policy";
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

function mapUploadShellWriteError(context: string, error: unknown): NextResponse {
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

async function loadOwnCharacterForUploadShell(
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
      response: mapUploadShellWriteError(
        "ai-creator character upload-shell lookup",
        error
      ),
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

/** POST — staging shell: mark handoff_ready character as upload_pending (no files/providers). */
export async function POST(request: Request, context: RouteContext) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        success: false,
        error: "Datei-Uploads sind in dieser Shell nicht erlaubt.",
        code: "upload_shell_no_files",
      },
      { status: 400 }
    );
  }

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
    const loaded = await loadOwnCharacterForUploadShell(supabase, userId, trimmedId);
    if (!loaded.ok) return loaded.response;

    const eligible = assertUploadShellEligible(loaded.row);
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
      .update(buildUploadShellStatusUpdate())
      .eq("id", trimmedId)
      .eq("user_id", userId)
      .eq("status", "handoff_ready")
      .select(CHARACTERS_AI_CREATOR_SELECT)
      .single();

    if (error) {
      return mapUploadShellWriteError("ai-creator character upload-shell", error);
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: CHARACTER_UPLOAD_SHELL_BLOCKED_MESSAGE,
          code: "upload_shell_not_allowed",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      character: aiCreatorRowToListItem(data),
      shell: buildUploadShellResponseMeta(),
      message:
        "Upload-/Training-Vorbereitung ist bereit. Provider sind in dieser Umgebung deaktiviert.",
    });
  } catch (error) {
    logKiInfluencerError("ai-creator character upload-shell", error);
    return NextResponse.json(
      { success: false, error: "Upload-Shell konnte nicht abgeschlossen werden." },
      { status: 500 }
    );
  }
}

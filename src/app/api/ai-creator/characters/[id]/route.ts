import { NextRequest, NextResponse } from "next/server";

import {
  assertCharacterDeletable,
} from "@/lib/ai-creator/characters-delete.server";
import {
  aiCreatorRowToListItem,
  CHARACTERS_AI_CREATOR_SELECT,
  type CharactersAiCreatorRow,
} from "@/lib/ai-creator/characters-list.server";
import {
  assertCharacterEditable,
  validateUpdateCharacterBody,
  type UpdateCharacterBody,
} from "@/lib/ai-creator/characters-update.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import type { KiToolAccessGranted } from "@/lib/access.server";
import {
  assertKiInfluencerAccess,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";
import { isSupabaseRelationMissingError } from "@/lib/ki-influencer-supabase-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function mapCharacterWriteError(context: string, error: unknown): NextResponse {
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

async function loadOwnCharacter(
  supabase: KiToolAccessGranted["supabase"],
  userId: string,
  characterId: string
): Promise<
  | { ok: true; row: CharactersAiCreatorRow }
  | { ok: false; response: NextResponse }
> {
  const { data, error } = await supabase
    .from("characters")
    .select(CHARACTERS_AI_CREATOR_SELECT)
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: mapCharacterWriteError("ai-creator character lookup", error),
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

  return { ok: true, row: data as CharactersAiCreatorRow };
}

/** PATCH — update own draft AI Creator character (no consent/training/provider changes). */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

  let body: UpdateCharacterBody;
  try {
    body = (await request.json()) as UpdateCharacterBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, error: "Keine gültigen Felder zum Aktualisieren." },
      { status: 400 }
    );
  }

  try {
    const loaded = await loadOwnCharacter(supabase, userId, trimmedId);
    if (!loaded.ok) return loaded.response;

    const editable = assertCharacterEditable(loaded.row);
    if (!editable.ok) {
      return NextResponse.json(
        { success: false, error: editable.error },
        { status: 409 }
      );
    }

    const validated = validateUpdateCharacterBody(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: validated.status }
      );
    }

    const { data, error } = await supabase
      .from("characters")
      .update(validated.data)
      .eq("id", trimmedId)
      .eq("user_id", userId)
      .select(CHARACTERS_AI_CREATOR_SELECT)
      .single();

    if (error) {
      return mapCharacterWriteError("ai-creator character patch", error);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Character konnte nicht aktualisiert werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      character: aiCreatorRowToListItem(data as CharactersAiCreatorRow),
    });
  } catch (error) {
    logKiInfluencerError("ai-creator character patch", error);
    return NextResponse.json(
      { success: false, error: "Character konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}

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
    const loaded = await loadOwnCharacter(supabase, userId, trimmedId);
    if (!loaded.ok) return loaded.response;

    const deletable = assertCharacterDeletable(loaded.row);
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
      return mapCharacterWriteError("ai-creator character delete", deleteError);
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

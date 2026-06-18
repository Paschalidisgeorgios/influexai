import { NextRequest, NextResponse } from "next/server";

import {
  buildBaselineCharacterInsert,
  type CreateCharacterBody,
  validateCreateCharacterBody,
} from "@/lib/ai-creator/characters-create.server";
import {
  baselineRowToListItem,
  CHARACTERS_BASELINE_SELECT,
  type CharactersBaselineRow,
} from "@/lib/ai-creator/characters-list.server";
import {
  assertKiInfluencerAccess,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import { isSupabaseRelationMissingError } from "@/lib/ki-influencer-supabase-errors";

export const dynamic = "force-dynamic";

function mapCharacterInsertError(context: string, error: unknown): NextResponse {
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

/** GET — list user's AI Creator characters (read-only, schema-tolerant baseline). */
export async function GET() {
  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  try {
    const { data, error } = await supabase
      .from("characters")
      .select(CHARACTERS_BASELINE_SELECT)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return mapSupabaseWriteError("ai-creator characters list", error);
    }

    return NextResponse.json({
      success: true,
      characters: (data ?? []).map((row) =>
        baselineRowToListItem(row as CharactersBaselineRow)
      ),
    });
  } catch (error) {
    logKiInfluencerError("ai-creator characters list", error);
    return kiInfluencerErrorResponse("generation_failed", 500);
  }
}

/** POST — create draft AI Creator character (baseline schema only, no training). */
export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  let body: CreateCharacterBody;
  try {
    body = (await request.json()) as CreateCharacterBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const validated = validateCreateCharacterBody(body);
  if (!validated.ok) {
    return NextResponse.json(
      { success: false, error: validated.error },
      { status: validated.status }
    );
  }

  try {
    const { data, error } = await supabase
      .from("characters")
      .insert(buildBaselineCharacterInsert(userId, validated.data))
      .select(CHARACTERS_BASELINE_SELECT)
      .single();

    if (error) {
      return mapCharacterInsertError("ai-creator character insert", error);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Character konnte nicht erstellt werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      character: baselineRowToListItem(data as CharactersBaselineRow),
    });
  } catch (error) {
    logKiInfluencerError("ai-creator character insert", error);
    return NextResponse.json(
      { success: false, error: "Character konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}

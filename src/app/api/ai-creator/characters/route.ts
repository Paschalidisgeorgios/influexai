import { NextRequest, NextResponse } from "next/server";

import {
  assertKiInfluencerAccess,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";
import { mapStatusToDb } from "@/lib/ai-creator/status";
import type { CharacterType, TrainingStatus } from "@/lib/ai-creator/types";

export const dynamic = "force-dynamic";

type CharacterRow = {
  id: string;
  name: string;
  description: string | null;
  character_type: string | null;
  source: string;
  trigger_word: string | null;
  niche: string | null;
  style: string | null;
  tone: string | null;
  platforms: string[] | null;
  target_audience: string | null;
  consent_confirmed: boolean;
  reference_image_urls: string[] | null;
  status: string;
  lora_ref: string | null;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
};

function rowToPayload(row: CharacterRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    characterType: row.character_type as CharacterType | null,
    triggerWord: row.trigger_word ?? "",
    niche: row.niche ?? "",
    style: row.style ?? "",
    tone: row.tone ?? "",
    platforms: row.platforms ?? [],
    targetAudience: row.target_audience ?? "",
    consentConfirmed: row.consent_confirmed,
    referenceImageUrls: row.reference_image_urls ?? [],
    trainingStatus: row.status as TrainingStatus,
    loraUrl: row.lora_ref,
    previewImageUrl: row.preview_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET — list user's AI Creator characters (all statuses) */
export async function GET() {
  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  try {
    const { data, error } = await supabase
      .from("characters")
      .select(
        "id, name, description, character_type, source, trigger_word, niche, style, tone, platforms, target_audience, consent_confirmed, reference_image_urls, status, lora_ref, preview_image_url, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return mapSupabaseWriteError("ai-creator characters list", error);
    }

    return NextResponse.json({
      success: true,
      characters: (data ?? []).map((row) => rowToPayload(row as CharacterRow)),
    });
  } catch (error) {
    logKiInfluencerError("ai-creator characters list", error);
    return kiInfluencerErrorResponse("generation_failed", 500);
  }
}

type CreateBody = {
  name?: string;
  characterType?: CharacterType;
  triggerWord?: string;
  niche?: string;
  style?: string;
  tone?: string;
  platforms?: string[];
  targetAudience?: string;
  description?: string;
  consentConfirmed?: boolean;
  referenceImageUrls?: string[];
  trainingStatus?: TrainingStatus;
  previewImageUrl?: string;
};

/** POST — create or update draft AI Creator character (no training execution) */
export async function POST(request: NextRequest) {
  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json(
      { success: false, error: "Name ist erforderlich." },
      { status: 400 }
    );
  }

  const characterType = body.characterType ?? null;
  const source = characterType === "self" ? "uploaded" : "generated";
  const status = mapStatusToDb(body.trainingStatus ?? "draft");

  try {
    const { data, error } = await supabase
      .from("characters")
      .insert({
        user_id: userId,
        name,
        description: body.description?.trim() || null,
        source,
        character_type: characterType,
        trigger_word: body.triggerWord?.trim() || null,
        niche: body.niche?.trim() || null,
        style: body.style?.trim() || null,
        tone: body.tone?.trim() || null,
        platforms: body.platforms?.length ? body.platforms : null,
        target_audience: body.targetAudience?.trim() || null,
        consent_confirmed: Boolean(body.consentConfirmed),
        reference_image_urls: body.referenceImageUrls?.length
          ? body.referenceImageUrls
          : null,
        preview_image_url: body.previewImageUrl?.trim() || null,
        status,
      })
      .select(
        "id, name, description, character_type, source, trigger_word, niche, style, tone, platforms, target_audience, consent_confirmed, reference_image_urls, status, lora_ref, preview_image_url, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      if (error) return mapSupabaseWriteError("ai-creator character insert", error);
      return kiInfluencerErrorResponse("generation_failed", 500);
    }

    return NextResponse.json({
      success: true,
      character: rowToPayload(data as CharacterRow),
    });
  } catch (error) {
    logKiInfluencerError("ai-creator character insert", error);
    return kiInfluencerErrorResponse("generation_failed", 500);
  }
}

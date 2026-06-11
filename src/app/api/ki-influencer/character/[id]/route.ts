import { NextResponse } from "next/server";
import {
  getCharacterTrainingImageUrls,
  getOwnedCharacter,
} from "@/lib/ki-influencer-db";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Nicht eingeloggt." }, {
      status: 401,
    });
  }

  const character = await getOwnedCharacter(supabase, characterId, user.id);
  if (!character) {
    return NextResponse.json(
      { success: false, error: "Charakter nicht gefunden." },
      { status: 404 }
    );
  }

  const training_images = await getCharacterTrainingImageUrls(
    supabase,
    user.id,
    character
  );

  return NextResponse.json({
    success: true,
    character: {
      id: character.id,
      name: character.name,
      description: character.description,
      source: character.source,
      status: character.status,
      lora_id: character.lora_id,
      casting_image_url: character.casting_image_url,
      casting_generation_id: character.casting_generation_id,
      training_images,
    },
  });
}

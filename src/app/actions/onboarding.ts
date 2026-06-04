"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { firstNameFromFullName } from "@/lib/onboarding";

export type CreatorProfileInput = {
  channelName?: string;
  creatorNiche: string;
  subscriberCount: string;
  creatorGoal: string;
};

type ActionOk = { success: true };
type ActionFail = { success: false; error: string };

export async function getOnboardingUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, channel_name, creator_niche, subscriber_count, creator_goal, onboarding_completed, credits"
    )
    .eq("id", user.id)
    .single();

  return {
    firstName: firstNameFromFullName(profile?.full_name),
    credits: profile?.credits ?? 0,
    profile: profile ?? null,
  };
}

export async function saveCreatorProfile(
  input: CreatorProfileInput
): Promise<ActionOk | ActionFail> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("profiles")
    .update({
      channel_name: input.channelName?.trim() || null,
      creator_niche: input.creatorNiche,
      subscriber_count: input.subscriberCount,
      creator_goal: input.creatorGoal,
    })
    .eq("id", user.id);

  if (error) {
    console.error("saveCreatorProfile:", error.message);
    return { success: false, error: "Profil konnte nicht gespeichert werden." };
  }
  return { success: true };
}

export async function completeOnboarding(): Promise<ActionOk | ActionFail> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) {
    console.error("completeOnboarding:", error.message);
    return {
      success: false,
      error: "Onboarding konnte nicht abgeschlossen werden.",
    };
  }
  return { success: true };
}

export async function skipOnboarding(): Promise<ActionOk | ActionFail> {
  return completeOnboarding();
}

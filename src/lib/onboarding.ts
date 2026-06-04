export type OnboardingProfile = {
  onboarding_completed: boolean;
  created_at: string;
  full_name: string | null;
  channel_name: string | null;
  creator_niche: string | null;
  subscriber_count: string | null;
  creator_goal: string | null;
};

/** New user: account < 24h OR no generations yet, and onboarding not done. */
export function shouldRequireOnboarding(
  profile: Pick<OnboardingProfile, "onboarding_completed" | "created_at">,
  generationCount: number
): boolean {
  if (profile.onboarding_completed) return false;

  const createdAt = new Date(profile.created_at).getTime();
  const isWithin24h = Date.now() - createdAt < 24 * 60 * 60 * 1000;
  const neverGenerated = generationCount === 0;

  return isWithin24h || neverGenerated;
}

export function firstNameFromFullName(
  fullName: string | null | undefined
): string {
  if (!fullName?.trim()) return "Creator";
  return fullName.trim().split(/\s+/)[0];
}

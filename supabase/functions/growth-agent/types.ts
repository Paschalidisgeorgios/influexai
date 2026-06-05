export type DailyVideoIdea = {
  title: string;
  hook: string;
  outline: string;
  why_viral: string;
};

export type TrendingVideo = {
  title: string;
  channel: string;
  description: string;
  videoId: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  creator_niche: string | null;
  niche: string | null;
  daily_suggestions_email: boolean;
  onboarding_completed?: boolean;
  credits?: number | null;
};

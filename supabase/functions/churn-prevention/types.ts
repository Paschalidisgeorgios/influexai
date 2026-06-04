export type ChurnEmailType = "day3" | "day7" | "day14";

export type ChurnProfile = {
  id: string;
  email: string;
  full_name: string | null;
  credits: number | null;
  nurture_unsubscribed: boolean;
  is_churned: boolean;
  last_active_at: string | null;
  created_at: string;
};

export type Day3Idea = {
  title: string;
  hook: string;
};

export type Day7Trends = {
  trends: string[];
};

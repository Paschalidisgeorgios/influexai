import { getCommunityInitial } from "@/app/actions/community";
import { CommunityHub } from "@/components/community/community-hub";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60;

export const metadata = {
  title: "Community — InfluexAI",
  description: "Creator teilen Wins, Ideen und Feedback.",
};

export default async function CommunityPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = await getCommunityInitial(user?.id ?? null);

  return (
    <CommunityHub
      isLoggedIn={!!user}
      userId={user?.id ?? null}
      initial={initial}
    />
  );
}

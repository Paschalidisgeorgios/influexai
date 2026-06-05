import { getCommunityInitial } from "@/app/actions/community";
import { getCommunityPageData } from "@/app/actions/community-creations";
import { CommunityPageHub } from "@/components/community/community-page-hub";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60;

export const metadata = {
  title: "Community — InfluexAI",
  description:
    "Creator Showcase, Inspiration Feed und Leaderboard — teile deine besten KI-Creations.",
};

export default async function CommunityPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;

  const [creationData, socialInitial] = await Promise.all([
    getCommunityPageData(userId),
    getCommunityInitial(userId),
  ]);

  return (
    <CommunityPageHub
      isLoggedIn={!!user}
      userId={userId}
      creationData={creationData}
      socialInitial={socialInitial}
    />
  );
}

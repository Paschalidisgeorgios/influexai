import { hasActivePlan } from "@/lib/access";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";
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

  let memberHomeHref: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, role, is_admin")
      .eq("id", user.id)
      .single();
    const accessUser = {
      email: user.email,
      plan: profile?.plan,
      role: profile?.role,
      is_admin: profile?.is_admin,
    };
    memberHomeHref =
      hasActivePlan(accessUser) || isPlatformAdminServer(accessUser)
        ? "/dashboard"
        : "/pricing";
  }

  const [creationData, socialInitial] = await Promise.all([
    getCommunityPageData(userId),
    getCommunityInitial(userId),
  ]);

  return (
    <CommunityPageHub
      isLoggedIn={!!user}
      userId={userId}
      memberHomeHref={memberHomeHref}
      creationData={creationData}
      socialInitial={socialInitial}
    />
  );
}

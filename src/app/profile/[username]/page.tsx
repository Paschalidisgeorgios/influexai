import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicProfileByUsername } from "@/app/actions/community-creations";
import { PublicProfileViewClient } from "@/components/community/public-profile-view";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/creator-profile";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchPublicProfileByUsername(username, null);
  if (!profile) {
    return { title: "Profil nicht gefunden | InfluexAI" };
  }
  const name = profile.fullName ?? profile.username;
  return {
    title: `${name} | InfluexAI Creator`,
    description:
      profile.bio?.trim() ||
      `${name} — ${profile.publicGenerationCount} öffentliche Creations auf InfluexAI.`,
    openGraph: {
      title: `${name} | InfluexAI`,
      url: `${SITE_URL}/profile/${profile.username}`,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await fetchPublicProfileByUsername(username, user?.id ?? null);
  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-[#060608]">
      <PublicProfileViewClient profile={profile} isLoggedIn={!!user} />
    </div>
  );
}

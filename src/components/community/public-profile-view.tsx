"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PublicProfileView as PublicProfileData } from "@/app/actions/community-creations";
import { CREATOR_BADGES } from "@/lib/community-creations";
import { initials } from "@/lib/community";
import { FollowButton } from "./follow-button";
import { CreationCard } from "./creation-card";

type Props = {
  profile: PublicProfileData;
  isLoggedIn: boolean;
};

export function PublicProfileViewClient({ profile, isLoggedIn }: Props) {
  const t = useTranslations("community");
  const displayName = profile.fullName ?? profile.username;

  return (
    <div className="max-w-3xl mx-auto px-5 py-12 pb-24">
      <section className="text-center mb-10">
        <div
          className="w-28 h-28 mx-auto mb-4 rounded-full p-[3px]"
          style={{
            background:
              "linear-gradient(135deg, #B4FF00, rgba(180,255,0,0.25))",
          }}
        >
          <div className="w-full h-full rounded-full bg-[#18181d] flex items-center justify-center font-[family-name:var(--font-bebas)] text-3xl text-[#B4FF00]">
            {initials(displayName)}
          </div>
        </div>
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8]">
          {displayName}
        </h1>
        <p className="text-[rgba(255,255,255,0.65)] mt-1">@{profile.username}</p>
        {profile.bio && (
          <p className="text-white/70 text-sm max-w-md mx-auto mt-4 leading-relaxed">
            {profile.bio}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {profile.badges.map((b) => (
            <span
              key={b}
              className="text-xs px-2 py-1 rounded-lg bg-[#B4FF00]/10 text-[#B4FF00] border border-[#B4FF00]/30"
            >
              {CREATOR_BADGES[b].emoji} {t(CREATOR_BADGES[b].labelKey)}
            </span>
          ))}
        </div>
        <div className="mt-6">
          <FollowButton
            targetUserId={profile.userId}
            initialFollowing={profile.following}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 mb-10 text-center">
        <Stat label={t("stat_generations")} value={profile.generationCount} />
        <Stat label={t("stat_followers")} value={profile.followerCount} />
        <Stat
          label={t("stat_viral_avg")}
          value={profile.avgViralScore ?? "—"}
        />
      </div>

      <h2 className="font-[family-name:var(--font-bebas)] text-xl text-[#F0EFE8] mb-4">
        {t("public_creations")}
      </h2>
      {profile.creations.length === 0 ? (
        <p className="text-[rgba(255,255,255,0.65)] text-sm">{t("empty_profile")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.creations.map((item) => (
            <CreationCard
              key={item.id}
              item={item}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-center">
        <Link href="/community" className="text-[#B4FF00] text-sm font-semibold">
          ← {t("back_community")}
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f0f12] p-4">
      <div className="font-[family-name:var(--font-bebas)] text-2xl text-[#B4FF00]">
        {value}
      </div>
      <div className="text-[rgba(255,255,255,0.65)] text-xs mt-1">{label}</div>
    </div>
  );
}

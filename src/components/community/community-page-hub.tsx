"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { getCommunityPageData } from "@/app/actions/community-creations";
import type { getCommunityInitial } from "@/app/actions/community";
import { CommunityHub } from "./community-hub";
import { ShowcaseGallery } from "./showcase-gallery";
import { InspirationFeed } from "./inspiration-feed";
import { LeaderboardPanel } from "./leaderboard-panel";

type Tab = "showcase" | "feed" | "leaderboard" | "discuss";

type CreationData = Awaited<ReturnType<typeof getCommunityPageData>>;
type SocialInitial = Awaited<ReturnType<typeof getCommunityInitial>>;

type Props = {
  isLoggedIn: boolean;
  userId: string | null;
  memberHomeHref?: string | null;
  creationData: CreationData;
  socialInitial: SocialInitial;
};

export function CommunityPageHub({
  isLoggedIn,
  userId,
  memberHomeHref,
  creationData,
  socialInitial,
}: Props) {
  const t = useTranslations("community");
  const [tab, setTab] = useState<Tab>("showcase");

  const tabs: { id: Tab; label: string }[] = [
    { id: "showcase", label: t("tab_showcase") },
    { id: "feed", label: t("tab_feed") },
    { id: "leaderboard", label: t("tab_leaderboard") },
    { id: "discuss", label: t("tab_discuss") },
  ];

  return (
    <div className="min-h-screen bg-[#060608] text-[#F0EFE8]">
      <div className="max-w-6xl mx-auto px-5 pt-10 pb-32 md:pb-16">
        <header className="mb-8">
          <p className="text-[#B4FF00] text-xs font-bold uppercase tracking-[0.14em] mb-2">
            Acid Noir
          </p>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl mb-2">
            {t("title")}
          </h1>
          <p className="text-[rgba(255,255,255,0.65)] max-w-xl text-sm leading-relaxed">
            {t("hero_desc")}
          </p>
          {!isLoggedIn && (
            <Link
              href="/auth/sign-up"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#B4FF00] text-[#060608] font-bold text-sm"
            >
              {t("cta_join")}
            </Link>
          )}
          {isLoggedIn && (
            <Link
              href="/dashboard/profile/public"
              className="inline-block mt-4 text-sm text-[#B4FF00] font-semibold"
            >
              {t("cta_share")} →
            </Link>
          )}
        </header>

        <nav className="flex flex-wrap gap-2 mb-8 border-b border-white/[0.08] pb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === item.id
                  ? "bg-[#B4FF00] text-[#060608]"
                  : "text-[rgba(255,255,255,0.65)] hover:text-[#F0EFE8]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "showcase" && (
          <ShowcaseGallery
            initialItems={creationData.showcase.items}
            initialHasMore={creationData.showcase.hasMore}
            isLoggedIn={isLoggedIn}
            userId={userId}
          />
        )}

        {tab === "feed" && (
          <InspirationFeed
            initialItems={creationData.feed.items}
            initialHasMore={creationData.feed.hasMore}
            isLoggedIn={isLoggedIn}
            userId={userId}
          />
        )}

        {tab === "leaderboard" && (
          <LeaderboardPanel entries={creationData.leaderboard} />
        )}

        {tab === "discuss" && (
          <div className="[&>div]:max-w-none [&>div]:p-0">
            <CommunityHub
              isLoggedIn={isLoggedIn}
              userId={userId}
              memberHomeHref={memberHomeHref}
              initial={socialInitial}
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getCommunityFeed } from "@/app/actions/community-creations";
import type { CommunityCreationItem } from "@/lib/community-creations";
import { CreationCard } from "./creation-card";

type Props = {
  initialItems: CommunityCreationItem[];
  initialHasMore: boolean;
  isLoggedIn: boolean;
  userId: string | null;
};

export function InspirationFeed({
  initialItems,
  initialHasMore,
  isLoggedIn,
  userId,
}: Props) {
  const t = useTranslations("community");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const res = await getCommunityFeed(offset, userId);
    setItems((prev) => [...prev, ...res.items]);
    setHasMore(res.hasMore);
    setOffset((o) => o + res.items.length);
    setLoading(false);
  }, [loading, hasMore, offset, userId]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (window.innerWidth >= 768) return;
      if (e.key === "ArrowDown" && mobileIndex < items.length - 1) {
        setMobileIndex((i) => i + 1);
      }
      if (e.key === "ArrowUp" && mobileIndex > 0) {
        setMobileIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileIndex, items.length]);

  return (
    <section className="mt-16">
      <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#F0EFE8] mb-2">
        {t("feed_title")}
      </h2>
      <p className="text-[rgba(255,255,255,0.65)] text-sm mb-6">{t("feed_desc")}</p>

      {/* Mobile TikTok-style */}
      <div className="md:hidden fixed inset-0 top-[52px] z-30 bg-[#060608] overflow-hidden">
        {items[mobileIndex] ? (
          <CreationCard
            key={items[mobileIndex].id}
            item={items[mobileIndex]}
            isLoggedIn={isLoggedIn}
            fullscreen
          />
        ) : (
          <p className="p-8 text-[rgba(255,255,255,0.65)] text-center">{t("empty_feed")}</p>
        )}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 text-xs text-[rgba(255,255,255,0.65)]">
          <button
            type="button"
            disabled={mobileIndex <= 0}
            onClick={() => setMobileIndex((i) => Math.max(0, i - 1))}
          >
            ↑
          </button>
          <span>
            {mobileIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            disabled={mobileIndex >= items.length - 1}
            onClick={() => {
              if (mobileIndex >= items.length - 2) loadMore();
              setMobileIndex((i) => Math.min(items.length - 1, i + 1));
            }}
          >
            ↓
          </button>
        </div>
      </div>

      {/* Desktop scroll */}
      <div className="hidden md:block space-y-6 max-w-lg mx-auto">
        {items.map((item) => (
          <CreationCard
            key={item.id}
            item={item}
            isLoggedIn={isLoggedIn}
          />
        ))}
        <div ref={sentinel} className="h-4" />
        {loading && (
          <p className="text-center text-[rgba(255,255,255,0.65)] text-sm">{t("loading")}</p>
        )}
      </div>
    </section>
  );
}

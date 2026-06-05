"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getCommunityShowcase } from "@/app/actions/community-creations";
import type {
  CommunityCreationItem,
  ShowcaseSort,
  ShowcaseTypeFilter,
} from "@/lib/community-creations";
import { CreationCard } from "./creation-card";

type Props = {
  initialItems: CommunityCreationItem[];
  initialHasMore: boolean;
  isLoggedIn: boolean;
  userId: string | null;
};

const TYPE_FILTERS: ShowcaseTypeFilter[] = [
  "all",
  "image",
  "video",
  "script",
  "viral_score",
  "remix",
];

export function ShowcaseGallery({
  initialItems,
  initialHasMore,
  isLoggedIn,
  userId,
}: Props) {
  const t = useTranslations("community");
  const [sort, setSort] = useState<ShowcaseSort>("popular");
  const [typeFilter, setTypeFilter] = useState<ShowcaseTypeFilter>("all");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);

  const reload = async (nextSort: ShowcaseSort, nextType: ShowcaseTypeFilter) => {
    setLoading(true);
    const res = await getCommunityShowcase(nextSort, nextType, 0, userId);
    setItems(res.items);
    setHasMore(res.hasMore);
    setOffset(res.items.length);
    setLoading(false);
  };

  const loadMore = async () => {
    setLoading(true);
    const res = await getCommunityShowcase(sort, typeFilter, offset, userId);
    setItems((prev) => [...prev, ...res.items]);
    setHasMore(res.hasMore);
    setOffset((o) => o + res.items.length);
    setLoading(false);
  };

  return (
    <section>
      <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#F0EFE8] mb-4">
        {t("showcase_title")}
      </h2>
      <p className="text-[rgba(255,255,255,0.65)] text-sm mb-4">{t("showcase_desc")}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["newest", "popular"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSort(s);
              reload(s, typeFilter);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              sort === s
                ? "bg-[#B4FF00] text-[#060608]"
                : "bg-white/[0.06] text-[rgba(255,255,255,0.65)]"
            }`}
          >
            {t(s === "newest" ? "filter_newest" : "filter_popular")}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setTypeFilter(f);
              reload(sort, f);
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              typeFilter === f
                ? "border border-[#B4FF00]/50 text-[#B4FF00]"
                : "text-[rgba(255,255,255,0.65)] border border-transparent"
            }`}
          >
            {t(`type_${f}`)}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <p className="text-[rgba(255,255,255,0.65)]">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-[rgba(255,255,255,0.65)]">{t("empty_showcase")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CreationCard
              key={item.id}
              item={item}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={loadMore}
          className="mt-6 w-full py-3 rounded-xl border border-white/10 text-[#B4FF00] font-semibold text-sm hover:bg-white/[0.04]"
        >
          {loading ? t("loading") : t("load_more")}
        </button>
      )}
    </section>
  );
}

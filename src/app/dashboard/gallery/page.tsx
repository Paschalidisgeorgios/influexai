"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Images } from "lucide-react";
import { getGallery, deleteGalleryItem } from "@/app/actions/get-gallery";
import { GALLERY_PAGE_SIZE } from "@/lib/gallery-types";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { Skeleton } from "@/components/ui/Skeleton";
import type { GalleryFilter, GalleryItem } from "@/lib/gallery-types";
import { collectGalleryMedia } from "@/lib/gallery-media-client";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
} from "@/components/dashboard/core/DashboardSurface";

const VALID_FILTERS = new Set<GalleryFilter>([
  "all",
  "script",
  "image",
  "video",
  "niche",
  "thumbnail",
  "outlier",
  "remix",
]);

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");
  const [filter, setFilter] = useState<GalleryFilter>(() =>
    initialFilter && VALID_FILTERS.has(initialFilter as GalleryFilter)
      ? (initialFilter as GalleryFilter)
      : "all"
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const mediaItems = useMemo(() => collectGalleryMedia(items), [items]);

  const openMedia = useCallback(
    (item: GalleryItem) => {
      const index = mediaItems.findIndex((entry) => entry.id === item.id);
      if (index >= 0) setLightboxIndex(index);
    },
    [mediaItems]
  );

  const filterTabs = useMemo(
    () =>
      (
        [
          "all",
          "script",
          "image",
          "video",
          "niche",
          "thumbnail",
          "outlier",
          "remix",
        ] as const
      ).map((id) => ({
        id,
        label: t(`filters.${id}`),
      })),
    [t]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (pageIndex: number, append: boolean) => {
      if (pageIndex === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const result = await getGallery(
        filter,
        pageIndex,
        GALLERY_PAGE_SIZE,
        debouncedSearch
      );

      if (result.error) {
        setError(sanitizeUserMessage(result.error));
        if (!append) {
          setItems([]);
          setTotal(0);
        }
      } else if (append) {
        setItems((prev) => [...prev, ...result.items]);
        setTotal(result.total);
        setHasMore(result.hasMore);
      } else {
        setItems(result.items);
        setTotal(result.total);
        setHasMore(result.hasMore);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [filter, debouncedSearch]
  );

  useEffect(() => {
    setPage(0);
    load(0, false);
  }, [load]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  const handleDelete = async (id: string, type: string) => {
    const result = await deleteGalleryItem(id, type);
    if (!result.success) {
      setError(sanitizeUserMessage(result.error ?? t("deleteFailed")));
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  };

  const shown = items.length;

  const refreshGallery = useCallback(async () => {
    setPage(0);
    await load(0, false);
  }, [load]);

  useEffect(() => {
    const onGenerationsUpdated = () => {
      void refreshGallery();
    };
    window.addEventListener("generations-updated", onGenerationsUpdated);
    return () =>
      window.removeEventListener("generations-updated", onGenerationsUpdated);
  }, [refreshGallery]);

  const { pulling, refreshing } = usePullToRefresh(refreshGallery);

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden pb-6">
      {(pulling || refreshing) && (
        <div
          className="fixed top-14 left-0 right-0 z-40 flex justify-center pointer-events-none md:hidden"
          aria-live="polite"
        >
          <span className="px-3 py-1 rounded-full bg-[#0f0f12] border border-[#B4FF00]/30 text-[#B4FF00] text-xs font-semibold">
            {refreshing ? t("refreshing") : t("pull_refresh")}
          </span>
        </div>
      )}
      <DashboardPageHeader
        kicker={t("eyebrow")}
        title={t("title")}
        subtitle={t("count", { count: total })}
      />

      <input
        type="search"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full min-w-0 rounded-xl border px-4 py-3 text-[0.95rem] outline-none"
        style={{
          background: "#FFFCF7",
          borderColor: "rgba(8,8,8,0.12)",
          color: DASHBOARD_TEXT,
        }}
      />

      <div
        className="-mx-1 mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t("filters.all")}
      >
        {filterTabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.id)}
              className="shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[0.78rem] font-semibold transition-colors sm:px-4"
              style={{
                borderColor: active ? "rgba(180,255,0,0.45)" : "rgba(8,8,8,0.10)",
                background: active ? "rgba(180,255,0,0.14)" : "#FFFCF7",
                color: active ? DASHBOARD_TEXT : DASHBOARD_MUTED,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(255,80,100,0.1)",
            border: "1px solid rgba(255,80,100,0.3)",
            color: "#ff8a9a",
            marginBottom: 20,
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="gallery-grid grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-[14px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-6 py-16 text-center"
          style={{
            background: "rgba(255,255,255,0.35)",
            borderColor: "rgba(8,8,8,0.12)",
          }}
        >
          <Images
            size={48}
            strokeWidth={1.25}
            style={{ margin: "0 auto 16px", color: "rgba(8,8,8,0.20)" }}
          />
          <p className="mb-2 text-[1.1rem] font-semibold" style={{ color: DASHBOARD_TEXT }}>
            {t("emptyTitle")}
          </p>
          <p className="mb-6 text-[0.9rem]" style={{ color: DASHBOARD_MUTED }}>
            {t("emptyDescription")}
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-xl px-6 py-3 font-bold no-underline"
            style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
          >
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {items.map((item) => (
              <GalleryCard
                key={`${item._type}-${item.id}`}
                item={item}
                onDelete={handleDelete}
                onOpenMedia={openMedia}
              />
            ))}
          </div>

          {lightboxIndex != null && mediaItems.length > 0 && (
            <GalleryLightbox
              items={mediaItems}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={setLightboxIndex}
            />
          )}

          <p className="mt-6 text-center text-[0.85rem]" style={{ color: DASHBOARD_MUTED }}>
            {t("showing", { shown, total })}
          </p>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: "12px 28px",
                  borderRadius: 12,
                  border: "1px solid rgba(180,255,0,0.35)",
                  background: "rgba(180,255,0,0.12)",
                  color: DASHBOARD_TEXT,
                  fontWeight: 700,
                  cursor: loadingMore ? "wait" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? t("loadingMore") : t("loadMore")}
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 560px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

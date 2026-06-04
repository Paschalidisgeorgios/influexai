"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Images } from "lucide-react";
import { getGallery, deleteGalleryItem } from "@/app/actions/get-gallery";
import { GALLERY_PAGE_SIZE } from "@/lib/gallery-types";
import { GalleryCard } from "@/components/gallery/gallery-card";
import type { GalleryFilter, GalleryItem } from "@/lib/gallery-types";

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.error);
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
      setError(result.error ?? t("deleteFailed"));
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  };

  const shown = items.length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#B4FF00",
            marginBottom: 8,
          }}
        >
          {t("eyebrow")}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "2.5rem",
                color: "#F0EFE8",
                lineHeight: 1.1,
                marginBottom: 4,
              }}
            >
              {t("title")}
            </h1>
            <p style={{ color: "rgba(240,239,232,0.5)", fontSize: "0.95rem" }}>
              {t("count", { count: total })}
            </p>
          </div>
        </div>
      </div>

      <input
        type="search"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 12,
          background: "#18181d",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#F0EFE8",
          fontSize: "0.95rem",
          marginBottom: 16,
          outline: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        {filterTabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 600,
                border: `1px solid ${active ? "rgba(180,255,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: active ? "rgba(180,255,0,0.1)" : "transparent",
                color: active ? "#B4FF00" : "rgba(240,239,232,0.45)",
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 220,
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 20,
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <Images
            size={48}
            strokeWidth={1.25}
            color="rgba(240,239,232,0.2)"
            style={{ margin: "0 auto 16px" }}
          />
          <p
            style={{
              color: "#F0EFE8",
              fontWeight: 600,
              fontSize: "1.1rem",
              marginBottom: 8,
            }}
          >
            {t("emptyTitle")}
          </p>
          <p
            style={{
              color: "rgba(240,239,232,0.45)",
              fontSize: "0.9rem",
              marginBottom: 24,
            }}
          >
            {t("emptyDescription")}
          </p>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 12,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
            className="gallery-grid"
          >
            {items.map((item) => (
              <GalleryCard
                key={`${item._type}-${item.id}`}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#505055",
              fontSize: "0.85rem",
              marginTop: 24,
            }}
          >
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
                  background: "rgba(180,255,0,0.08)",
                  color: "#B4FF00",
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

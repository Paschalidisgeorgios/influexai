"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NicheIdea } from "@/app/actions/analyze-niche";
import type { OutlierConcept } from "@/lib/outlier-analysis";
import type { RemixConcept } from "@/lib/remix-analysis";
import type { ThumbnailConcept } from "@/app/actions/generate-thumbnail";
import type { ScriptSettings } from "@/app/actions/generate-script";
import {
  GALLERY_PAGE_SIZE,
  type GalleryFilter,
  type GalleryItem,
} from "@/lib/gallery-types";
import { resolveGenerationMediaUrls } from "@/lib/gallery-media";

function isImageGenerationType(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t.includes("ki-ich") ||
    t === "ki-ich" ||
    t.includes("produkt") ||
    t.includes("image-generator") ||
    t === "image"
  );
}

function isVideoGenerationType(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t.includes("live-creator") ||
    t.includes("video-remix") ||
    t.includes("voice") ||
    t.includes("stimme") ||
    t === "product_ad" ||
    t === "seedance" ||
    (t.includes("video") && !t.includes("remix"))
  );
}

function normalizeScript(row: {
  id: string;
  topic: string | null;
  script: string;
  settings: ScriptSettings | null;
  created_at: string;
}): GalleryItem {
  const topic = row.topic?.trim() || "Script";
  return {
    id: row.id,
    _type: "script",
    created_at: row.created_at,
    title: topic,
    searchText: `${topic} ${row.script}`.toLowerCase(),
    script: row.script,
    settings: row.settings ?? undefined,
  };
}

function normalizeThumbnail(row: {
  id: string;
  topic: string;
  concepts: ThumbnailConcept[];
  created_at: string;
}): GalleryItem {
  const topic = row.topic?.trim() || "Thumbnail";
  const concepts = Array.isArray(row.concepts) ? row.concepts : [];
  return {
    id: row.id,
    _type: "thumbnail",
    created_at: row.created_at,
    title: topic,
    searchText: `${topic} ${JSON.stringify(concepts)}`.toLowerCase(),
    concepts,
  };
}

function normalizeNiche(row: {
  id: string;
  niche_data: NicheIdea;
  created_at: string;
}): GalleryItem {
  const data = row.niche_data;
  const title = data?.title?.trim() || "Niche";
  return {
    id: row.id,
    _type: "niche",
    created_at: row.created_at,
    title,
    searchText: `${title} ${data?.description ?? ""} ${(data?.videoIdeas ?? []).join(" ")}`.toLowerCase(),
    nicheData: data,
  };
}

function normalizeOutlier(row: {
  id: string;
  niche: string | null;
  results: OutlierConcept[];
  created_at: string;
}): GalleryItem {
  const niche = row.niche?.trim() || "Outlier";
  const outliers = Array.isArray(row.results) ? row.results : [];
  return {
    id: row.id,
    _type: "outlier",
    created_at: row.created_at,
    title: niche,
    searchText: `${niche} ${outliers.map((o) => o.title).join(" ")}`.toLowerCase(),
    outliers,
  };
}

function normalizeRemix(row: {
  id: string;
  original_url: string | null;
  results: RemixConcept[];
  created_at: string;
}): GalleryItem {
  const remixes = Array.isArray(row.results) ? row.results : [];
  const title =
    remixes[0]?.remixTitle?.trim() ||
    row.original_url?.trim() ||
    "Video Remix";
  return {
    id: row.id,
    _type: "remix",
    created_at: row.created_at,
    title,
    searchText: `${title} ${row.original_url ?? ""} ${remixes.map((r) => r.description).join(" ")}`.toLowerCase(),
    remixes,
    originalUrl: row.original_url,
  };
}

function normalizeGeneration(row: {
  id: string;
  type: string;
  prompt: string;
  created_at: string;
}): GalleryItem | null {
  const type = row.type;
  const prompt = row.prompt?.trim() || type;
  const media = resolveGenerationMediaUrls(type, prompt);
  const displayTitle =
    media.imageUrl || media.videoUrl
      ? type.replace(/-/g, " ")
      : prompt.slice(0, 80);

  if (isImageGenerationType(type)) {
    return {
      id: row.id,
      _type: "image",
      created_at: row.created_at,
      title: displayTitle,
      searchText: `${type} ${prompt}`.toLowerCase(),
      generationType: type,
      imageUrl: media.imageUrl,
    };
  }
  if (isVideoGenerationType(type)) {
    const videoUrl =
      type === "product_ad" || type === "seedance"
        ? `/api/generated-video/${row.id}`
        : media.videoUrl;
    return {
      id: row.id,
      _type: "video",
      created_at: row.created_at,
      title: prompt.slice(0, 80) || "Product Ad",
      searchText: `${type} ${prompt}`.toLowerCase(),
      generationType: type,
      videoUrl,
    };
  }
  return null;
}

function matchesFilter(item: GalleryItem, filter: GalleryFilter): boolean {
  if (filter === "all") return true;
  return item._type === filter;
}

function matchesSearch(item: GalleryItem, search: string): boolean {
  if (!search.trim()) return true;
  return item.searchText.includes(search.trim().toLowerCase());
}

async function fetchTableRows<T>(
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    console.error("getGallery query:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getGallery(
  filter: GalleryFilter = "all",
  page = 0,
  limit = GALLERY_PAGE_SIZE,
  search = ""
): Promise<{
  items: GalleryItem[];
  total: number;
  hasMore: boolean;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], total: 0, hasMore: false, error: "Nicht eingeloggt." };
  }

  const queries: Promise<GalleryItem[]>[] = [];

  if (filter === "all" || filter === "script") {
    queries.push(
      fetchTableRows(
        supabase
          .from("saved_scripts")
          .select("id, topic, script, settings, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).then((rows) => rows.map(normalizeScript))
    );
  }

  if (filter === "all" || filter === "thumbnail") {
    queries.push(
      fetchTableRows(
        supabase
          .from("thumbnail_concepts")
          .select("id, topic, concepts, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).then((rows) =>
        rows.map((row) =>
          normalizeThumbnail({
            ...row,
            concepts: row.concepts as ThumbnailConcept[],
          })
        )
      )
    );
  }

  if (filter === "all" || filter === "niche") {
    queries.push(
      fetchTableRows(
        supabase
          .from("niche_saves")
          .select("id, niche_data, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).then((rows) =>
        rows.map((row) =>
          normalizeNiche({
            ...row,
            niche_data: row.niche_data as NicheIdea,
          })
        )
      )
    );
  }

  if (filter === "all" || filter === "outlier") {
    queries.push(
      fetchTableRows(
        supabase
          .from("outlier_results")
          .select("id, niche, results, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).then((rows) =>
        rows.map((row) =>
          normalizeOutlier({
            ...row,
            results: row.results as OutlierConcept[],
          })
        )
      )
    );
  }

  if (filter === "all" || filter === "remix") {
    queries.push(
      fetchTableRows(
        supabase
          .from("remix_results")
          .select("id, original_url, results, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).then((rows) =>
        rows.map((row) =>
          normalizeRemix({
            ...row,
            results: row.results as RemixConcept[],
          })
        )
      )
    );
  }

  if (filter === "all" || filter === "image" || filter === "video") {
    queries.push(
      fetchTableRows(
        supabase
          .from("generations")
          .select("id, type, prompt, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).then((rows) =>
        rows
          .map(normalizeGeneration)
          .filter((item): item is GalleryItem => item !== null)
          .filter((item) => matchesFilter(item, filter))
      )
    );
  }

  const results = await Promise.all(queries);
  const allItems = results
    .flat()
    .filter((item) => matchesFilter(item, filter))
    .filter((item) => matchesSearch(item, search));

  allItems.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = allItems.length;
  const paginated = allItems.slice(page * limit, (page + 1) * limit);

  return {
    items: paginated,
    total,
    hasMore: total > (page + 1) * limit,
  };
}

export async function deleteGalleryItem(
  itemId: string,
  type: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const tableMap: Record<string, string> = {
    script: "saved_scripts",
    thumbnail: "thumbnail_concepts",
    niche: "niche_saves",
    outlier: "outlier_results",
    remix: "remix_results",
  };

  const table = tableMap[type];
  if (!table) {
    return {
      success: false,
      error: "Dieser Eintrag kann nicht gelöscht werden.",
    };
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  return { success: !error, error: error?.message };
}

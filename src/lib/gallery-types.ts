import type { NicheIdea } from "@/app/actions/analyze-niche";
import type { OutlierConcept } from "@/lib/outlier-analysis";
import type { RemixConcept } from "@/lib/remix-analysis";
import type { ThumbnailConcept } from "@/app/actions/generate-thumbnail";
import type { ScriptSettings } from "@/app/actions/generate-script";

export const GALLERY_PAGE_SIZE = 20;

export type GalleryFilter =
  | "all"
  | "script"
  | "image"
  | "video"
  | "niche"
  | "thumbnail"
  | "outlier"
  | "remix";

export type GalleryItemType =
  | "script"
  | "thumbnail"
  | "niche"
  | "outlier"
  | "remix"
  | "image"
  | "video";

export type GalleryItem = {
  id: string;
  _type: GalleryItemType;
  created_at: string;
  title: string;
  searchText: string;
  script?: string;
  settings?: ScriptSettings;
  concepts?: ThumbnailConcept[];
  nicheData?: NicheIdea;
  outliers?: OutlierConcept[];
  remixes?: RemixConcept[];
  originalUrl?: string | null;
  generationType?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
};

export const GALLERY_FILTER_TABS: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "script", label: "Scripts" },
  { id: "image", label: "Bilder" },
  { id: "video", label: "Videos" },
  { id: "niche", label: "Niches" },
  { id: "thumbnail", label: "Thumbnails" },
  { id: "outlier", label: "Outlier" },
  { id: "remix", label: "Remix" },
];

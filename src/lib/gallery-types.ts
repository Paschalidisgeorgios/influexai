import type { NicheIdea } from "@/app/actions/analyze-niche";
import type { OutlierConcept } from "@/app/actions/detect-outliers";
import type { RemixConcept } from "@/app/actions/remix-video";
import type { ThumbnailConcept } from "@/app/actions/generate-thumbnail";
import type { ScriptSettings } from "@/app/actions/generate-script";

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

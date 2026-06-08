import type { GalleryItem } from "@/lib/gallery-types";

export type GalleryMediaItem = {
  id: string;
  itemType: GalleryItem["_type"];
  kind: "image" | "video";
  src: string;
  title: string;
};

export function galleryItemMediaKey(item: GalleryItem): string {
  return `${item._type}-${item.id}`;
}

export function galleryItemToMedia(item: GalleryItem): GalleryMediaItem | null {
  if (item._type === "image" && item.imageUrl) {
    return {
      id: item.id,
      itemType: item._type,
      kind: "image",
      src: item.imageUrl,
      title: item.title,
    };
  }
  if (item._type === "video" && item.videoUrl) {
    return {
      id: item.id,
      itemType: item._type,
      kind: "video",
      src: item.videoUrl,
      title: item.title,
    };
  }
  return null;
}

export function collectGalleryMedia(items: GalleryItem[]): GalleryMediaItem[] {
  return items
    .map(galleryItemToMedia)
    .filter((entry): entry is GalleryMediaItem => entry !== null);
}

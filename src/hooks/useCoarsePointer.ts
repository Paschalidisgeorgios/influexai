"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/** True on smartphones / tablets with coarse touch pointers. */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(max-width: 767px), (pointer: coarse)");
}

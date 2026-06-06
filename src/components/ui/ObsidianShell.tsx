"use client";

import { usePathname } from "next/navigation";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { CustomCursor } from "@/components/ui/CustomCursor";

function isDashboardPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Global Obsidian effects: custom cursor (desktop) + ambient glow */
export function ObsidianShell() {
  const pathname = usePathname();
  const hideCursor = isDashboardPath(pathname);

  return (
    <>
      <AmbientGlow />
      {!hideCursor ? <CustomCursor /> : null}
    </>
  );
}

"use client";

import { useEffect } from "react";
import { GlobalSidebar } from "./GlobalSidebar";

export function DashboardMobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Menü schließen"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="absolute top-0 left-0 h-full w-[min(88vw,280px)] shadow-2xl">
        <GlobalSidebar mobile />
      </div>
    </div>
  );
}

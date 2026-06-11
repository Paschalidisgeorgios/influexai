"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DashboardMobileSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="dashboard-sidebar-overlay md:hidden" role="presentation">
      <button
        type="button"
        className="dashboard-sidebar-backdrop"
        aria-label="Menü schließen"
        onClick={onClose}
      />
      <div className="dashboard-sidebar-drawer" role="dialog" aria-modal="true">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 text-white/80"
          aria-label="Menü schließen"
        >
          <X size={20} aria-hidden />
        </button>
        <DashboardSidebar drawerMode />
      </div>
    </div>
  );
}

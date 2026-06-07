"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function AccountDeletedNotice() {
  const t = useTranslations("settings.deleteAccount");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("account_deleted_notice") === "1") {
        sessionStorage.removeItem("account_deleted_notice");
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[300] rounded-xl border border-[#B4FF00]/30 bg-[#0f0f12] px-4 py-3 shadow-lg flex items-start gap-3"
    >
      <p className="text-sm text-[#F0EFE8] flex-1 leading-relaxed">
        {t("success_title")}
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-white/50 hover:text-white text-lg leading-none"
        aria-label={t("dismiss")}
      >
        ×
      </button>
    </div>
  );
}

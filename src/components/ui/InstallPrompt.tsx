"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  dismissInstallPrompt,
  incrementVisitCount,
  isInstallDismissed,
  isIos,
  isStandalone,
} from "@/lib/pwa/visit-tracker";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || isInstallDismissed()) return;

    const visits = incrementVisitCount();
    if (visits < 2) return;

    if (isIos()) {
      setIosGuide(true);
      setVisible(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const close = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      close();
      return;
    }
    if (iosGuide) close();
  }, [close, deferred, iosGuide]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-4 right-4 z-[120] md:bottom-6 md:left-auto md:right-6 md:max-w-sm rounded-2xl border border-[#B4FF00]/30 bg-[#0f0f12] p-4 shadow-2xl"
      role="dialog"
      aria-labelledby="install-prompt-title"
    >
      <p
        id="install-prompt-title"
        className="text-[#B4FF00] text-xs font-bold uppercase tracking-wider mb-1"
      >
        {t("install_kicker")}
      </p>
      <h3 className="text-[#F0EFE8] font-semibold text-base mb-2">
        {t("install_title")}
      </h3>

      {iosGuide ? (
        <ol className="text-[rgba(255,255,255,0.65)] text-sm space-y-2 mb-4 list-decimal list-inside">
          <li>{t("ios_step_share")}</li>
          <li>{t("ios_step_add")}</li>
        </ol>
      ) : (
        <p className="text-[rgba(255,255,255,0.65)] text-sm mb-4 leading-relaxed">
          {t("install_body")}
        </p>
      )}

      <div className="flex gap-2">
        {!iosGuide && (
          <button
            type="button"
            onClick={install}
            className="flex-1 min-h-[44px] rounded-xl bg-[#B4FF00] text-[#060608] font-bold text-sm"
          >
            {t("install_cta")}
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="min-h-[44px] px-4 rounded-xl border border-white/10 text-[rgba(255,255,255,0.65)] text-sm font-medium"
        >
          {t("install_dismiss")}
        </button>
      </div>
    </div>
  );
}

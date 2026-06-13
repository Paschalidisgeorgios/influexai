"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInstallDismissed,
  isIos,
  isStandalone,
} from "@/lib/pwa/visit-tracker";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isIosGuide, setIsIosGuide] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    if (isStandalone() || isInstallDismissed()) return;

    if (isIos()) {
      setIsIosGuide(true);
      setCanInstall(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setCanInstall(false);
      return true;
    }
    return isIosGuide;
  }, [deferred, isIosGuide]);

  return { canInstall, isIosGuide, install };
}

"use client";

import { useEffect } from "react";
import { AppSplash } from "@/components/ui/AppSplash";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      return;
    }

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch {
        /* SW optional */
      }
    };

    void register();
  }, []);

  return (
    <>
      <AppSplash />
      <InstallPrompt />
    </>
  );
}

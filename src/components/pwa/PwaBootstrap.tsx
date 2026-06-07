"use client";

import { useEffect } from "react";
import { AppSplash } from "@/components/ui/AppSplash";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { flushGenerationQueue } from "@/lib/pwa/generation-queue";

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

    const onOnline = () => {
      void flushGenerationQueue();
    };

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "SYNC_GENERATIONS") {
        void flushGenerationQueue();
      }
    };

    window.addEventListener("online", onOnline);
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <>
      <AppSplash />
      <InstallPrompt />
    </>
  );
}

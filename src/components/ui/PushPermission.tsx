"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function subscriptionToJson(sub: PushSubscription) {
  const p256dh = sub.getKey("p256dh");
  const auth = sub.getKey("auth");
  if (!p256dh || !auth) throw new Error("Invalid subscription keys");

  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: bufferToBase64Url(p256dh),
      auth: bufferToBase64Url(auth),
    },
  };
}

export function PushPermission() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) return;

    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const dismissKey = `influex-push-banner-${user.id}`;
      if (localStorage.getItem(dismissKey) === "1") return;
      if (Notification.permission === "granted") {
        const { count } = await supabase
          .from("push_notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if ((count ?? 0) > 0) return;
      }
      if (Notification.permission === "denied") return;

      setVisible(true);
    })();
  }, []);

  const dismiss = useCallback(() => {
    if (userId) {
      localStorage.setItem(`influex-push-banner-${userId}`, "1");
    }
    setVisible(false);
  }, [userId]);

  const enable = useCallback(async () => {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid || loading) return;

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });

      const payload = subscriptionToJson(sub);
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("subscribe failed");

      if (userId) {
        localStorage.setItem(`influex-push-banner-${userId}`, "1");
      }
      setVisible(false);
    } catch (e) {
      console.error("[PushPermission]", e);
    } finally {
      setLoading(false);
    }
  }, [dismiss, loading, userId]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[200] mx-auto max-w-md md:bottom-4 lg:left-auto lg:right-6"
      role="region"
      aria-label="Push-Benachrichtigungen"
    >
      <div
        className="flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md"
        style={{
          background: "rgba(15,15,18,0.92)",
          borderColor: "rgba(180,255,0,0.2)",
        }}
      >
        <span className="text-lg leading-none mt-0.5" aria-hidden>
          🔔
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F0EFE8] mb-0.5">
            Benachrichtigungen aktivieren?
          </p>
          <p className="text-xs text-white/80 leading-relaxed">
            Erhalte Updates wenn deine Videos fertig sind, Credits knapp werden
            oder neue Ideen da sind.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => void enable()}
              disabled={loading}
              className="btn-acid text-xs py-2 px-3 min-h-0"
            >
              {loading ? "…" : "Ja, aktivieren"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-white/75 hover:text-white/70 px-2 py-2"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useRef,
  useCallback,
  useEffect,
  createElement,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";

export type IntentKey =
  | "visuals"
  | "video-film"
  | "avatar-live"
  | "agent-autopilot"
  | "audio"
  | "werbung";

const DWELL_MS = 3000;
const STORAGE_KEY = "influex_intent";

export function useIntentTracking() {
  const timers = useRef<Map<IntentKey, ReturnType<typeof setTimeout>>>(new Map());

  const getIntent = useCallback((): IntentKey | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEY) as IntentKey | null;
  }, []);

  const setIntent = useCallback((key: IntentKey) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, key);
  }, []);

  const startDwell = useCallback(
    (key: IntentKey) => {
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        setIntent(key);
        timers.current.delete(key);
      }, DWELL_MS);
      timers.current.set(key, t);
    },
    [setIntent]
  );

  const cancelDwell = useCallback((key: IntentKey) => {
    const t = timers.current.get(key);
    if (t) {
      clearTimeout(t);
      timers.current.delete(key);
    }
  }, []);

  const getIntentHref = useCallback(
    (base: string): string => {
      const intent = getIntent();
      if (!intent) return base;
      return base + (base.includes("?") ? "&" : "?") + "intent=" + intent;
    },
    [getIntent]
  );

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    []
  );

  return { startDwell, cancelDwell, getIntent, setIntent, getIntentHref };
}

export function IntentLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { getIntentHref } = useIntentTracking();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    const intentHref = getIntentHref(href);
    if (intentHref !== href) {
      e.preventDefault();
      window.location.href = intentHref;
    }
  };

  return createElement(
    "a",
    { href, onClick: handleClick, className, ...rest },
    children
  );
}

export function useCardDwell(key: IntentKey) {
  const ref = useRef<HTMLDivElement>(null);
  const { startDwell, cancelDwell } = useIntentTracking();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          startDwell(key);
        } else {
          cancelDwell(key);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [key, startDwell, cancelDwell]);

  return { ref, startDwell, cancelDwell };
}

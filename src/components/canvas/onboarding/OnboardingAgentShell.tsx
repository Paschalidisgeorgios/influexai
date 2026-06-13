"use client";

import { useEffect } from "react";
import { OnboardingChatOverlay } from "./OnboardingChatOverlay";
import { OnboardingHelpWidget } from "./OnboardingHelpWidget";
import {
  ONBOARDING_INACTIVITY_MS,
  useOnboardingStore,
} from "@/lib/canvas/onboarding-store";

const GREETING_AUTO_HIDE_MS = 8000;

export function OnboardingAgentShell({ children }: { children: React.ReactNode }) {
  const dismissGreeting = useOnboardingStore((s) => s.dismissGreeting);
  const evaluateInactivity = useOnboardingStore((s) => s.evaluateInactivity);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => dismissGreeting(), GREETING_AUTO_HIDE_MS);

    const onScroll = () => dismissGreeting();
    window.addEventListener("scroll", onScroll, { passive: true });

    const inactivityTimer = window.setInterval(() => evaluateInactivity(), 5000);

    const onGlobalActivity = () => touchActivity();
    window.addEventListener("keydown", onGlobalActivity);
    window.addEventListener("wheel", onGlobalActivity, { passive: true });
    window.addEventListener("pointerdown", onGlobalActivity);

    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(inactivityTimer);
      window.removeEventListener("keydown", onGlobalActivity);
      window.removeEventListener("wheel", onGlobalActivity);
      window.removeEventListener("pointerdown", onGlobalActivity);
    };
  }, [dismissGreeting, evaluateInactivity, touchActivity]);

  return (
    <>
      {children}
      <OnboardingHelpWidget />
      <OnboardingChatOverlay />
    </>
  );
}

export { ONBOARDING_INACTIVITY_MS };

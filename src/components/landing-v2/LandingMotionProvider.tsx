"use client";

import type { ReactNode } from "react";
import { useLandingLenis } from "./hooks/useLandingLenis";
import { useLandingMotionDebug } from "./hooks/useLandingMotionDebug";

type LandingMotionProviderProps = {
  children: ReactNode;
};

/** Client-only Lenis + GSAP ScrollTrigger sync — mount scope = landing preview only */
export function LandingMotionProvider({ children }: LandingMotionProviderProps) {
  useLandingLenis();
  useLandingMotionDebug();
  return <>{children}</>;
}

"use client";

import type { ReactNode } from "react";
import { useLandingLenis } from "./hooks/useLandingLenis";

type LandingMotionProviderProps = {
  children: ReactNode;
};

/** Client-only Lenis + GSAP ScrollTrigger sync — mount scope = landing preview only */
export function LandingMotionProvider({ children }: LandingMotionProviderProps) {
  useLandingLenis();
  return <>{children}</>;
}

"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/** Subtle GSAP reveals — design-preview only; no text scale blur */
export function usePreviewCommandMotion(
  rootRef: RefObject<HTMLElement | null>,
  workflowRef: RefObject<HTMLElement | null>,
  submitted: boolean
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const command = root.querySelector<HTMLElement>("[data-preview-command]");
    const idle = root.querySelector<HTMLElement>("[data-preview-idle]");
    const targets = [command, idle].filter(Boolean) as HTMLElement[];

    gsap.set(targets, { opacity: 0, y: 18 });
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "transform",
    });
  }, [rootRef]);

  useEffect(() => {
    const panel = workflowRef.current;
    if (!submitted || !panel) return;

    gsap.fromTo(
      panel,
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.42,
        ease: "power2.out",
        clearProps: "transform",
      }
    );
  }, [submitted, workflowRef]);
}

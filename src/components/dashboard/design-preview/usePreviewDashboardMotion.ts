"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/** GSAP reveals for design-preview — no Lenis, no input transforms */
export function usePreviewDashboardMotion(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const ctx = gsap.context(() => {
      const entrance = root.querySelectorAll<HTMLElement>("[data-preview-enter]");
      const stagger = root.querySelectorAll<HTMLElement>("[data-preview-stagger]");

      gsap.set(entrance, { opacity: 0, y: 24 });
      gsap.set(stagger, { opacity: 0, y: 18 });

      gsap.to(entrance, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: "power3.out",
        stagger: 0.08,
        onComplete: () => {
          gsap.set(entrance, { clearProps: "transform" });
        },
      });

      gsap.to(stagger, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.12,
        onComplete: () => {
          gsap.set(stagger, { clearProps: "transform" });
        },
      });
    }, root);

    return () => ctx.revert();
  }, [rootRef, enabled]);
}

export function animatePreviewPanel(
  panelRef: RefObject<HTMLElement | null>,
  visible: boolean
) {
  const panel = panelRef.current;
  if (!panel) return;

  gsap.killTweensOf(panel);

  if (visible) {
    gsap.fromTo(
      panel,
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        onComplete: () => {
          gsap.set(panel, { clearProps: "transform" });
        },
      }
    );
  } else {
    gsap.to(panel, { opacity: 0, y: 12, duration: 0.35, ease: "power2.in" });
  }
}

/** Stagger workflow blocks after command submit */
export function animatePreviewWorkflowItems(panelRef: RefObject<HTMLElement | null>) {
  const panel = panelRef.current;
  if (!panel) return;

  const items = panel.querySelectorAll<HTMLElement>(
    "[data-preview-stagger], [data-preview-workflow], [data-preview-stagger-item]"
  );

  if (!items.length) return;

  gsap.fromTo(
    items,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.58,
      ease: "power3.out",
      stagger: 0.08,
      onComplete: () => {
        gsap.set(items, { clearProps: "transform" });
      },
    }
  );
}

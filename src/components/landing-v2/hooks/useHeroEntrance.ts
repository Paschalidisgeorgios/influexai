"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import { useReducedMotion } from "./useReducedMotion";

function clearTextTransforms(targets: Element[]) {
  if (!targets.length) return;
  gsap.set(targets, { clearProps: "transform" });
}

export function useHeroEntrance(
  sectionRef: RefObject<HTMLElement | null>,
  heroReady = true
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !heroReady) return;
    if (reduceMotion) return;

    let split: SplitType | null = null;

    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector("[data-hero-eyebrow]");
      const rotatingHeadline = section.querySelector("[data-hero-headline-rotating]");
      const headline = section.querySelector<HTMLElement>("[data-hero-headline]");
      const headlineLines = section.querySelectorAll<HTMLElement>("[data-hero-headline-line]");
      const subline = section.querySelector("[data-hero-subline]");
      const ctas = section.querySelectorAll("[data-hero-cta]");
      const panel = section.querySelector("[data-hero-video-stage]");
      const flow = section.querySelector("[data-hero-flow]");

      if (headline && !rotatingHeadline && headlineLines.length === 0) {
        split = new SplitType(headline, {
          types: "lines",
          tagName: "span",
        });
      }

      const lines =
        headlineLines.length > 0
          ? (Array.from(headlineLines) as Element[])
          : (split?.lines ?? []);
      const textTargets = [eyebrow, subline, ...lines, ...ctas].filter(
        Boolean
      ) as Element[];

      gsap.set(textTargets, { opacity: 0, y: 20 });
      if (lines.length) {
        gsap.set(lines, { y: 28, opacity: 0 });
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          clearTextTransforms(textTargets);
          if (lines.length) {
            gsap.set(lines, { clearProps: "transform" });
          }
        },
      });

      if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.55 }, 0.08);
      if (lines.length) {
        tl.to(
          lines,
          { y: 0, opacity: 1, duration: 0.78, stagger: 0.08, ease: "power3.out" },
          0.18
        );
      }
      if (subline) tl.to(subline, { opacity: 1, y: 0, duration: 0.65 }, 0.52);
      if (ctas.length) tl.to(ctas, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, 0.68);
      if (panel) {
        tl.fromTo(
          panel,
          { opacity: 0, y: 56, scale: 1.02 },
          { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: "power2.out" },
          0.42
        );
      }
      if (flow) {
        tl.fromTo(
          flow,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power2.out",
            onComplete: () => {
              gsap.set(flow, { clearProps: "transform" });
            },
          },
          0.72
        );
      }
    }, section);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [sectionRef, reduceMotion, heroReady]);
}

"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import { HERO_ENTRANCE } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

function clearTextTransforms(targets: Element[]) {
  if (!targets.length) return;
  gsap.set(targets, { clearProps: "transform,filter" });
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

    const wordSplits: SplitType[] = [];
    let legacySplit: SplitType | null = null;

    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector("[data-hero-eyebrow]");
      const rotatingHeadline = section.querySelector("[data-hero-headline-rotating]");
      const keywordHeadline = section.querySelector("[data-hero-keyword-headline]");
      const headline = section.querySelector<HTMLElement>("[data-hero-headline]");
      const splitLines = section.querySelectorAll<HTMLElement>('[data-hero-headline-split="words"]');
      const headlineLines = section.querySelectorAll<HTMLElement>("[data-hero-headline-line]");
      const manualWords = section.querySelectorAll<HTMLElement>("[data-hero-headline-word]");
      const keywordLine = section.querySelector<HTMLElement>("[data-hero-keyword-line]");
      const rotatingKeyword = section.querySelector<HTMLElement>("[data-hero-rotating-keyword]");
      const motionWord = section.querySelector<HTMLElement>("[data-hero-motion-word]");
      const motionLine = section.querySelector<HTMLElement>("[data-hero-motion-line]");
      const subline = section.querySelector("[data-hero-subline]");
      const ctas = section.querySelectorAll("[data-hero-cta]");
      const panel = section.querySelector("[data-hero-video-stage]");
      const flow = section.querySelector("[data-hero-flow]");

      const { word: wordMotion, subline: sublineMotion, cta: ctaMotion, motionSignal } =
        HERO_ENTRANCE;

      if (headline && !rotatingHeadline && !keywordHeadline && headlineLines.length === 0) {
        legacySplit = new SplitType(headline, {
          types: "lines",
          tagName: "span",
        });
      }

      splitLines.forEach((line) => {
        wordSplits.push(
          new SplitType(line, {
            types: "words",
            tagName: "span",
          })
        );
      });

      const splitWords = wordSplits.flatMap((split) => split.words ?? []);
      const legacyLines =
        headlineLines.length > 0 && splitWords.length === 0
          ? (Array.from(headlineLines) as Element[])
          : (legacySplit?.lines ?? []);

      const headlineTargets = keywordHeadline
        ? [...splitWords]
        : splitWords.length > 0
          ? [...splitWords, ...Array.from(manualWords)]
          : legacyLines;

      const entranceTargets = keywordHeadline
        ? ([...headlineTargets, keywordLine].filter(Boolean) as Element[])
        : headlineTargets;

      const textTargets = [eyebrow, subline, ...entranceTargets, ...ctas].filter(
        Boolean
      ) as Element[];

      gsap.set(textTargets, { opacity: 0, y: wordMotion.y });
      if (rotatingKeyword) {
        gsap.set(rotatingKeyword, { opacity: 1, y: 0, clearProps: "transform,filter" });
      }
      if (motionLine) {
        gsap.set(motionLine, { scaleX: 0, opacity: 0, transformOrigin: "left center" });
      }

      const tl = gsap.timeline({
        defaults: { ease: wordMotion.ease },
        onComplete: () => {
          clearTextTransforms(textTargets);
          if (motionWord) {
            gsap.set(motionWord, { clearProps: "transform,filter" });
          }
          if (rotatingKeyword) {
            gsap.set(rotatingKeyword, { clearProps: "transform,filter" });
          }
          if (motionLine) {
            gsap.set(motionLine, { clearProps: "transform,opacity" });
          }
        },
      });

      if (eyebrow) {
        tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.55 }, 0.08);
      }

      if (entranceTargets.length) {
        tl.to(
          entranceTargets,
          {
            y: 0,
            opacity: 1,
            duration: wordMotion.duration,
            stagger: wordMotion.stagger,
            ease: wordMotion.ease,
          },
          wordMotion.delay
        );
      }

      if (motionWord && !keywordHeadline) {
        const signalAt =
          wordMotion.delay +
          wordMotion.duration +
          (headlineTargets.length - 1) * wordMotion.stagger +
          0.05;

        tl.fromTo(
          motionWord,
          { filter: "brightness(1)" },
          {
            filter: `brightness(${motionSignal.brightnessPeak})`,
            duration: motionSignal.brightnessIn,
            ease: "power2.out",
          },
          signalAt
        ).to(
          motionWord,
          {
            filter: "brightness(1)",
            duration: motionSignal.brightnessOut,
            ease: "power2.inOut",
          },
          `>-0.05`
        );

        if (motionLine) {
          tl.fromTo(
            motionLine,
            { scaleX: 0, opacity: 0.55 },
            {
              scaleX: 1,
              opacity: 0.75,
              duration: motionSignal.lineIn,
              ease: "power3.out",
            },
            signalAt + 0.06
          ).to(
            motionLine,
            {
              opacity: 0,
              duration: motionSignal.lineFade,
              ease: "power2.in",
            },
            `>+${motionSignal.lineHold}`
          );
        }
      }

      if (rotatingKeyword && keywordHeadline) {
        const signalAt =
          wordMotion.delay +
          wordMotion.duration +
          (entranceTargets.length - 1) * wordMotion.stagger +
          0.04;

        tl.fromTo(
          rotatingKeyword,
          { filter: "brightness(1)" },
          {
            filter: `brightness(${motionSignal.brightnessPeak})`,
            duration: motionSignal.brightnessIn,
            ease: "power2.out",
          },
          signalAt
        ).to(
          rotatingKeyword,
          {
            filter: "brightness(1)",
            duration: motionSignal.brightnessOut,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.set(rotatingKeyword, { clearProps: "transform,filter" });
            },
          },
          `>-0.05`
        );
      }

      if (subline) {
        tl.to(subline, { opacity: 1, y: 0, duration: sublineMotion.duration }, sublineMotion.delay);
      }
      if (ctas.length) {
        tl.to(
          ctas,
          {
            opacity: 1,
            y: 0,
            duration: ctaMotion.duration,
            stagger: ctaMotion.stagger,
          },
          ctaMotion.delay
        );
      }
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
          0.82
        );
      }
    }, section);

    return () => {
      wordSplits.forEach((split) => split.revert());
      legacySplit?.revert();
      ctx.revert();
    };
  }, [sectionRef, reduceMotion, heroReady]);
}

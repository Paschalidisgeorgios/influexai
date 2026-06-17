"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRODUCT_STORIES } from "./product-story-data";
import { ToolMockup } from "./ToolMockup";

gsap.registerPlugin(ScrollTrigger);

function ProductStoryBlock({
  story,
}: {
  story: (typeof PRODUCT_STORIES)[number];
}) {
  const blockRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const block = blockRef.current;
      const copy = copyRef.current;
      const visual = visualRef.current;
      if (!block || !copy || !visual) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        gsap.set(copy, { x: -60, opacity: 0 });
        gsap.set(visual, { y: 30, opacity: 0.85 });

        ScrollTrigger.create({
          trigger: block,
          start: "top top",
          end: "+=85%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            gsap.set(copy, {
              x: -60 + p * 60,
              opacity: Math.min(1, p * 1.4),
            });
            gsap.set(visual, {
              y: 30 - p * 60,
              opacity: 0.85 + p * 0.15,
            });
          },
          onLeave: () => {
            gsap.set(copy, { clearProps: "transform" });
          },
          onLeaveBack: () => {
            gsap.set(copy, { x: -60, opacity: 0 });
          },
        });
      });

      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          copy,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: block,
              start: "top 78%",
              once: true,
            },
            onComplete: () => {
              gsap.set(copy, { clearProps: "transform" });
            },
          }
        );

        gsap.fromTo(
          visual,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: visual,
              start: "top 85%",
              once: true,
            },
            onComplete: () => {
              gsap.set(visual, { clearProps: "transform" });
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: blockRef }
  );

  return (
    <section
      ref={blockRef}
      className="relative z-10 min-h-[100svh] bg-[#09090b] px-5 py-16 md:px-10 md:py-0"
      aria-labelledby={`story-${story.id}`}
    >
      <div className="mx-auto grid h-full min-h-[100svh] max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
        <div ref={copyRef} className="flex flex-col gap-5">
          <p className="font-mono text-sm text-white/20">{story.number}</p>
          <h2
            id={`story-${story.id}`}
            className="text-[clamp(36px,4vw,64px)] font-bold leading-[1.02] tracking-[-0.03em] text-white"
          >
            {story.title}
          </h2>
          <p className="max-w-md text-base font-light leading-relaxed text-white/45">
            {story.description}
          </p>
          <Link
            href={story.href}
            className="inline-flex w-fit text-sm font-medium text-[#b4ff00] transition-opacity hover:opacity-80"
          >
            → Zum Tool
          </Link>
        </div>

        <div
          ref={visualRef}
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12]"
        >
          <ToolMockup variant={story.mockup} />
        </div>
      </div>
    </section>
  );
}

export function ProductStorySection() {
  return (
    <div id="product-story" className="relative z-10">
      {PRODUCT_STORIES.map((story) => (
        <ProductStoryBlock key={story.id} story={story} />
      ))}
    </div>
  );
}

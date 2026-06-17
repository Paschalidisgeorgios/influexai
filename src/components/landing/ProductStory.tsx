"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRODUCT_STORIES } from "./product-story-data";
import { ToolMockup } from "./ToolMockup";

gsap.registerPlugin(ScrollTrigger);

function StorySection({
  story,
}: {
  story: (typeof PRODUCT_STORIES)[number];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const copy = copyRef.current;
      const visual = visualRef.current;
      if (!copy || !visual || !sectionRef.current) return;

      gsap.fromTo(
        copy,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        visual,
        { x: 60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] flex min-h-screen items-center px-6 py-24 md:px-20 md:py-[120px]"
      aria-labelledby={`story-${story.id}`}
    >
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20">
        <div ref={copyRef}>
          <p className="mb-4 font-mono text-[11px] tracking-[0.2em] text-[#b4ff00]">
            {story.number}
          </p>
          <h2
            id={`story-${story.id}`}
            className="mb-5 text-[clamp(36px,4vw,64px)] font-bold leading-[1.1] tracking-[-0.03em] text-white"
          >
            {story.title}
          </h2>
          <p className="mb-7 max-w-[420px] text-base font-light leading-[1.75] text-white/45">
            {story.description}
          </p>
          <Link
            href={story.href}
            className="group inline-flex items-center gap-2 text-[13px] text-[#b4ff00] transition-[gap] hover:gap-3"
          >
            → Zum Tool
          </Link>
        </div>

        <div
          ref={visualRef}
          className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7"
        >
          <ToolMockup variant={story.mockup} />
        </div>
      </div>
    </section>
  );
}

export default function ProductStory() {
  return (
    <div id="product-story" className="relative z-[1]">
      {PRODUCT_STORIES.map((story) => (
        <StorySection key={story.id} story={story} />
      ))}
    </div>
  );
}

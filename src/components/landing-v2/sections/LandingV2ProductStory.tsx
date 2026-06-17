"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2TerminalVisual } from "../ui/LandingV2TerminalVisual";
import { useProductStoryMotion } from "../hooks/useProductStoryMotion";

const copy = LANDING_V2_COPY.productStory;

function ProductStoryBlock({
  item,
  reversed,
}: {
  item: (typeof copy.items)[number];
  reversed: boolean;
}) {
  const blockRef = useRef<HTMLElement>(null);
  useProductStoryMotion(blockRef);

  const blockClass = [
    "landing-v2-terminal-story__block",
    reversed ? "landing-v2-terminal-story__block--reverse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      ref={blockRef}
      className={blockClass}
      aria-labelledby={`lv2-story-${item.id}-heading`}
    >
      <div className="landing-v2-terminal-story__copy" data-terminal-copy>
        <p className="landing-v2-terminal-story__number" data-terminal-number>
          {item.number}
        </p>
        <h3
          id={`lv2-story-${item.id}-heading`}
          className="landing-v2-terminal-story__tool"
          data-terminal-tool
        >
          {item.tool}
        </h3>
        <p className="landing-v2-terminal-story__headline">{item.headline}</p>
        <p className="landing-v2-terminal-story__body">{item.body}</p>
      </div>

      <div className="landing-v2-terminal-story__visual-wrap">
        <LandingV2TerminalVisual variant={item.visual} />
      </div>
    </article>
  );
}

export function LandingV2ProductStory() {
  return (
    <section
      id="story"
      className="landing-v2-section landing-v2-section--terminal-story"
      aria-labelledby="lv2-product-story-heading"
    >
      <div className="landing-v2-terminal-story mx-auto w-full max-w-[90rem]">
        <header className="landing-v2-terminal-story__intro">
          <p className="landing-v2-terminal-story__eyebrow" id="lv2-product-story-heading">
            {copy.eyebrow}
          </p>
        </header>

        <div className="landing-v2-terminal-story__list">
          {copy.items.map((item, index) => (
            <ProductStoryBlock key={item.id} item={item} reversed={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

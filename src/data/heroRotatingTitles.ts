/** Extra hero headline slides — appended to i18n `hero.rotating_titles` (existing entries unchanged). */

export type HeroTitleSlide = {
  lines: string[];
  /** Word on its line to render in #B4FF00 */
  highlightWord?: string;
  /** 0-based line index for full-line accent; defaults to last line when omitted */
  highlightLine?: number;
};

export type HeroTitleInput = string | HeroTitleSlide;

/** Additional agent/strategy labels — merged after locale rotating_titles. */
export const EXTRA_HERO_ROTATING_TITLES: HeroTitleSlide[] = [
  {
    lines: ["INFLUEXAI STRATEGY", "AGENT"],
    highlightWord: "AGENT",
  },
  {
    lines: ["CONTENT", "INTELLIGENCE", "AGENT"],
    highlightWord: "INTELLIGENCE",
  },
];

export function normalizeHeroTitleSlide(input: HeroTitleInput): HeroTitleSlide {
  if (typeof input === "string") {
    return {
      lines: input
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    };
  }
  return input;
}

export function parseHeroTitleSlides(raw: HeroTitleInput[]): HeroTitleSlide[] {
  return raw.map(normalizeHeroTitleSlide).filter((slide) => slide.lines.length > 0);
}

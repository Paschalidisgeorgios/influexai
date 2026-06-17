type LandingV2ChapterMarkerProps = {
  number: string;
  label: string;
  className?: string;
};

/** Large editorial chapter index — 01 / System */
export function LandingV2ChapterMarker({
  number,
  label,
  className = "",
}: LandingV2ChapterMarkerProps) {
  return (
    <p
      className={`landing-v2-chapter-marker ${className}`.trim()}
      data-lv2-chapter
    >
      <span className="landing-v2-chapter-marker__number">{number}</span>
      <span className="landing-v2-chapter-marker__sep" aria-hidden>
        —
      </span>
      <span className="landing-v2-chapter-marker__label">{label}</span>
    </p>
  );
}

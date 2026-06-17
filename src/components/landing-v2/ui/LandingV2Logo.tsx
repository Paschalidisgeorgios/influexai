import Link from "next/link";

type LandingV2LogoProps = {
  href?: string;
  size?: "nav" | "footer";
  className?: string;
  ariaLabel?: string;
};

export function LandingV2Logo({
  href,
  size = "nav",
  className = "",
  ariaLabel = "InfluexAI — Startseite",
}: LandingV2LogoProps) {
  const rootClass = ["landing-v2-logo", `landing-v2-logo--${size}`, className]
    .filter(Boolean)
    .join(" ");

  const mark = (
    <span className={rootClass}>
      <span className="landing-v2-logo__mark" aria-hidden="true">
        <span className="landing-v2-logo__i">I</span>
      </span>
      <span className="landing-v2-logo__word">
        <span className="landing-v2-logo__influex">INFLUEX</span>
        <span className="landing-v2-logo__ai">AI</span>
      </span>
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link href={href} className="landing-v2-logo__link" aria-label={ariaLabel}>
      {mark}
    </Link>
  );
}

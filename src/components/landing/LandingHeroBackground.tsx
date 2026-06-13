export function LandingHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="landing-hero-dot-grid absolute inset-0" />
      <div className="landing-hero-glow landing-hero-glow--violet" />
      <div className="landing-hero-glow landing-hero-glow--green" />
      <div className="landing-hero-vignette absolute inset-0" />
    </div>
  );
}

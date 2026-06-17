import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="relative z-[1] flex flex-col items-center justify-between gap-6 border-t border-white/[0.05] px-6 py-12 text-center md:flex-row md:px-20 md:py-12 md:text-left">
      <Link href="/" className="font-mono text-sm font-bold text-white">
        INFLUEX<span className="text-[#b4ff00]">AI</span>
      </Link>

      <nav
        className="flex flex-wrap items-center justify-center gap-8"
        aria-label="Footer"
      >
        {[
          { label: "Studio", href: "#product-story" },
          { label: "Preise", href: "#pricing" },
          { label: "Für Brands", href: "/business" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[13px] text-white/30 transition-colors hover:text-white/60"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <p className="text-xs text-white/20">© 2026 InfluexAI</p>
    </footer>
  );
}

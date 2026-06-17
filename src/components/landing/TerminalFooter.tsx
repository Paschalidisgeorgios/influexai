import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Product", href: "#product-story" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo", href: "/demo" },
  { label: "Sign in", href: "/auth/sign-in" },
] as const;

export function TerminalFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.05] bg-[#09090b] px-5 py-8 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm md:flex-row">
        <Link
          href="/"
          className="font-extrabold tracking-[-0.03em] text-white"
          aria-label="InfluexAI Home"
        >
          INFLUEXAI
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-5" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white/35 transition-colors hover:text-white/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-white/35">© 2026 InfluexAI</p>
      </div>
    </footer>
  );
}

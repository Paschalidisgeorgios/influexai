import Link from "next/link";

export function LandingV2Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10 text-sm text-white/45">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p>© {new Date().getFullYear()} InfluexAI — Landing Preview</p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="hover:text-white/70">
            Live-Landing
          </Link>
          <Link href="/pricing" className="hover:text-white/70">
            Preise
          </Link>
          <Link href="/impressum" className="hover:text-white/70">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-white/70">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}

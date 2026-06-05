import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getTranslations("landing");

  return (
    <div className="landing-root min-h-screen bg-[#060608]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060608]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="text-lg font-bold text-[#B4FF00] hover:opacity-90"
          >
            InfluexAI
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/community" className="text-[#B4FF00] font-semibold">
              {nav("nav_community")}
            </Link>
            <Link href="/blog" className="text-white/80 hover:text-[#B4FF00]">
              {nav("nav_blog")}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-[#B4FF00]/40 px-3 py-1.5 text-[#B4FF00] font-semibold"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

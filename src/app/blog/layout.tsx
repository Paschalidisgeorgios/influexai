import Link from "next/link";
import { ContentEmailExitIntent } from "@/components/content-email-capture";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#060608] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-[#B4FF00] transition-opacity hover:opacity-90"
          >
            InfluexAI
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/blog"
              className="text-white/70 hover:text-[#B4FF00]"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#B4FF00] px-4 py-2 font-semibold text-black hover:bg-[#c8ff33]"
            >
              Anmelden
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <ContentEmailExitIntent source="blog" />
    </div>
  );
}

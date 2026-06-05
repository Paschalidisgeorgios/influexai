import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentEmailExitIntent } from "@/components/content-email-capture";

export default async function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("guides");
  const nav = await getTranslations("landing");

  return (
    <div className="landing-root min-h-screen bg-[#060608] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-[#B4FF00] transition-opacity hover:opacity-90"
          >
            InfluexAI
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/guides" className="text-[#B4FF00]">
              {t("title")}
            </Link>
            <Link href="/blog" className="text-white/70 hover:text-[#B4FF00]">
              {nav("nav_blog")}
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-[#B4FF00] px-4 py-2 font-semibold text-black hover:bg-[#c8ff33]"
            >
              {nav("auth_signup")}
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <ContentEmailExitIntent source="guides" />
    </div>
  );
}

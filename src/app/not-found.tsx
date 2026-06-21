import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: "#060608", color: "#F0EFE8" }}
    >
      <h1
        className="not-found-glitch mb-5"
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(5rem, 18vw, 10rem)",
          letterSpacing: "0.06em",
          lineHeight: 1,
          color: "#B4FF00",
        }}
      >
        404
      </h1>

      <p
        className="mb-3"
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(1.25rem, 4vw, 2rem)",
          letterSpacing: "0.02em",
        }}
      >
        {t("headline")}
      </p>

      <p
        className="mb-10 max-w-md text-[0.95rem] leading-relaxed"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {t("body")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-acid">
          {t("cta_home")}
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          {t("cta_dashboard")}
        </Link>
      </div>
    </div>
  );
}

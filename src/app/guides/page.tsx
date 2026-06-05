import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fetchAllPublishedGuides } from "@/lib/guides/queries";
import { FEATURE_TUTORIALS } from "@/lib/guides/feature-tutorials";
import { PILLAR_META, PILLAR_SLUGS } from "@/lib/guides/pillars";
import { SEO_BASE_URL } from "@/lib/seo";
import { ContentEmailCaptureInline } from "@/components/content-email-capture";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guides");
  return {
    title: `${t("title")} — InfluexAI`,
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: `${SEO_BASE_URL}/guides`,
      type: "website",
    },
  };
}

export default async function GuidesIndexPage() {
  const t = await getTranslations("guides");
  const guides = await fetchAllPublishedGuides();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="landing-heading text-4xl text-white">{t("title")}</h1>
      <p className="mt-3 text-lg text-white/80">{t("subtitle")}</p>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#B4FF00]">
          {t("tutorials_title")}
        </h2>
        <p className="mt-2 text-sm text-white/80">{t("tutorials_subtitle")}</p>
        <div className="mt-6 space-y-4">
          {FEATURE_TUTORIALS.map((tutorial) => (
            <div
              key={tutorial.id}
              className="glass-card rounded-2xl border border-white/10 p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {t(`tutorials.${tutorial.titleKey}`)}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    {t(`tutorials.${tutorial.descKey}`)}
                  </p>
                </div>
                <Link
                  href={tutorial.href}
                  className="btn-acid shrink-0 text-center text-sm"
                >
                  {t("open_tool")}
                </Link>
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/70">
                {tutorial.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#B4FF00]">
          {t("pillars_title")}
        </h2>
        <p className="mt-2 text-sm text-white/80">{t("pillars_subtitle")}</p>
        <div className="mt-6 space-y-4">
          {PILLAR_SLUGS.map((slug) => {
            const meta = PILLAR_META[slug];
            const guide = guides.find((g) => g.slug === slug);
            return (
              <Link
                key={slug}
                href={`/guides/${slug}`}
                className="glass-card block rounded-2xl border border-white/10 p-6 transition-colors hover:border-[#B4FF00]/35"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-[#B4FF00]">
                  {t("read_guide")}
                </span>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {meta.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-white/80">
                  {meta.excerpt}
                </p>
                {guide && (
                  <p className="mt-3 text-xs text-white/70">
                    {t("words", { count: guide.word_count.toLocaleString("de-DE") })}{" "}
                    · {t("min_read", { minutes: guide.reading_time_minutes })}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-14 max-w-xl">
        <ContentEmailCaptureInline source="guides-index" />
      </section>
    </div>
  );
}

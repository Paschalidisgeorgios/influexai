import Link from "next/link";
import { categoryCtaLabel, categoryToFeaturePath } from "@/lib/blog/categories";
import { autoInternalLinks } from "@/lib/auto-internal-links";
import { ContentEmailCaptureInline } from "@/components/content-email-capture";
import { ArticleMdx } from "@/components/blog/article-mdx";
import { markdownToHtml } from "@/lib/blog/markdown";
import { blogCategoryToFeature, findNicheInText } from "@/lib/programmatic-seo";

function MidArticleCta({ category }: { category: string }) {
  const href = categoryToFeaturePath(category);
  const label = categoryCtaLabel(category);

  return (
    <div className="my-10 rounded-2xl border border-[#B4FF00]/40 bg-[#B4FF00]/5 p-6">
      <p className="mb-3 text-lg font-semibold text-white">
        Probier es selbst aus →
      </p>
      <p className="mb-4 text-sm text-white/80">
        Nutze {label} in InfluexAI und setze die Tipps aus diesem Artikel direkt
        um.
      </p>
      <Link
        href={href}
        className="inline-flex rounded-xl bg-[#B4FF00] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#c8ff33]"
      >
        Zu {label}
      </Link>
    </div>
  );
}

function injectMidBlocks(html: string): string {
  const parts = html.split(/<\/p>/i);
  if (parts.length < 4) return html;
  parts[3] = `${parts[3]}<!--MID_CTA--><!--NEWSLETTER-->`;
  return parts.join("</p>");
}

export async function ArticleBody({
  markdown,
  category,
  targetKeyword = "",
}: {
  markdown: string;
  category: string;
  targetKeyword?: string;
}) {
  const nicheFromKeyword = findNicheInText(targetKeyword);
  const linkedMarkdown = autoInternalLinks(markdown, {
    defaultNiche: nicheFromKeyword ?? findNicheInText(markdown) ?? "lifestyle",
    defaultFeature: blogCategoryToFeature(category) ?? "script-generator",
  });

  const useMdx = !linkedMarkdown.includes("<script");

  if (useMdx) {
    return (
      <div className="blog-prose max-w-none">
        <ArticleMdx source={linkedMarkdown} />
        <MidArticleCta category={category} />
        <ContentEmailCaptureInline source={`blog-${category}`} />
      </div>
    );
  }

  const rawHtml = await markdownToHtml(linkedMarkdown);
  const withMarkers = injectMidBlocks(rawHtml);
  const chunks = withMarkers.split("<!--MID_CTA-->");

  return (
    <div className="blog-prose max-w-none">
      {chunks.length >= 2 ? (
        <>
          <div dangerouslySetInnerHTML={{ __html: chunks[0] }} />
          <MidArticleCta category={category} />
          {chunks[1].includes("<!--NEWSLETTER-->") ? (
            (() => {
              const [afterCta, rest] = chunks[1].split("<!--NEWSLETTER-->");
              return (
                <>
                  <div dangerouslySetInnerHTML={{ __html: afterCta }} />
                  <ContentEmailCaptureInline source={`blog-${category}`} />
                  <div dangerouslySetInnerHTML={{ __html: rest }} />
                </>
              );
            })()
          ) : (
            <div dangerouslySetInnerHTML={{ __html: chunks[1] }} />
          )}
        </>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: withMarkers }} />
      )}
    </div>
  );
}

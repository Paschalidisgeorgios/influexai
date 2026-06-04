import Link from "next/link";
import { autoInternalLinks } from "@/lib/auto-internal-links";
import { markdownToHtml } from "@/lib/blog/markdown";
import { ContentEmailCaptureInline } from "@/components/content-email-capture";

function FeaturedSnippetBox({ text }: { text: string }) {
  return (
    <div className="mb-8 rounded-2xl border border-[#B4FF00]/40 bg-[#B4FF00]/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#B4FF00] mb-2">
        Auf einen Blick
      </p>
      <p className="text-base leading-relaxed text-white/85">{text}</p>
    </div>
  );
}

function injectInlineNewsletter(html: string, source: string): string {
  const parts = html.split(/<\/p>/i);
  if (parts.length < 4) return html;
  parts[3] = `${parts[3]}<!--NEWSLETTER-->`;
  return parts.join("</p>");
}

export async function GuideBody({
  markdown,
  featuredSnippet,
  source,
}: {
  markdown: string;
  featuredSnippet: string;
  source: string;
}) {
  const linked = autoInternalLinks(markdown);
  const html = await markdownToHtml(linked);
  const withNl = injectInlineNewsletter(html, source);
  const segments = withNl.split("<!--NEWSLETTER-->");

  return (
    <div className="guide-prose blog-prose max-w-none">
      <FeaturedSnippetBox text={featuredSnippet} />
      {segments.length === 2 ? (
        <>
          <div dangerouslySetInnerHTML={{ __html: segments[0] }} />
          <ContentEmailCaptureInline source={source} />
          <div dangerouslySetInnerHTML={{ __html: segments[1] }} />
        </>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: withNl }} />
      )}
    </div>
  );
}

export function GuideAuthorBox() {
  return (
    <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
        Autor
      </p>
      <p className="font-semibold text-white">InfluexAI Team</p>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">
        Wir helfen YouTube- und Shorts-Creatorn, mit KI schneller bessere
        Scripts, Nischen und Konzepte zu erstellen — datenbasiert und praxisnah.
      </p>
      <Link
        href="/signup"
        className="mt-4 inline-flex text-sm text-[#B4FF00] hover:underline"
      >
        Kostenlos testen →
      </Link>
    </div>
  );
}

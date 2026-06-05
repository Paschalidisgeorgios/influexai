import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

const mdxComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="blog-heading text-3xl font-semibold text-white mb-6" {...props} />
  ),
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      id={props.id}
      className="blog-heading blog-h2 text-2xl font-semibold text-white mt-10 mb-4"
      {...props}
    />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      id={props.id}
      className="blog-heading blog-h3 text-xl font-semibold text-white mt-8 mb-3"
      {...props}
    />
  ),
  a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-[#B4FF00] underline underline-offset-2 hover:text-[#c8ff33]"
      {...props}
    />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-relaxed text-white/80" {...props} />
  ),
  ul: (props: HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 list-disc pl-6 space-y-1 text-white/80" {...props} />
  ),
  ol: (props: HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 list-decimal pl-6 space-y-1 text-white/80" {...props} />
  ),
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-4 border-[#B4FF00] pl-4 text-white/80 italic"
      {...props}
    />
  ),
  code: (props: HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-[#B4FF00]"
      {...props}
    />
  ),
  pre: (props: HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-[#0f0f12] p-4 text-sm"
      {...props}
    />
  ),
};

export function ArticleMdx({ source }: { source: string }) {
  return (
    <div className="blog-prose max-w-none">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </div>
  );
}

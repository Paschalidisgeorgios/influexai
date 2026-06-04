import Link from "next/link";
import { categoryBadgeClass } from "@/lib/blog/categories";
import type { BlogPost } from "@/lib/blog/types";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[#B4FF00]/30">
      <span
        className={`mb-3 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass(post.category)}`}
      >
        {post.category}
      </span>
      <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-white group-hover:text-[#B4FF00]">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-white/50">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>
          {post.reading_time_minutes} Min · {formatDate(post.published_at)}
        </span>
        <Link
          href={`/blog/${post.slug}`}
          className="font-medium text-[#B4FF00] transition-opacity hover:opacity-80"
        >
          Weiterlesen →
        </Link>
      </div>
    </article>
  );
}

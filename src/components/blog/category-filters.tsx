"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";

export function CategoryFilters() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "Alle";
  const page = searchParams.get("page");

  return (
    <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2 scrollbar-none">
      {BLOG_CATEGORIES.map((cat) => {
        const params = new URLSearchParams();
        if (cat !== "Alle") params.set("category", cat);
        if (page && cat === active) params.set("page", page);
        const href = params.toString() ? `/blog?${params}` : "/blog";

        return (
          <Link
            key={cat}
            href={href}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === cat
                ? "bg-[#B4FF00] text-black"
                : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {cat}
          </Link>
        );
      })}
    </div>
  );
}

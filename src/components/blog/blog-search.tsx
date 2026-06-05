"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function BlogSearch() {
  const t = useTranslations("blog");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : "/blog");
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search_placeholder")}
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#B4FF00]/50 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-[#B4FF00] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#c8ff33]"
      >
        {t("search_button")}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { ArticleShare } from "@/components/blog/article-share";

export function GuideHeaderActions({
  title,
  url,
  pdfSlug,
}: {
  title: string;
  url: string;
  pdfSlug: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/guides/${pdfSlug}/pdf`);
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${pdfSlug}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <ArticleShare title={title} url={url} />
      <button
        type="button"
        onClick={downloadPdf}
        disabled={downloading}
        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-[#B4FF00]/40 hover:text-[#B4FF00] disabled:opacity-50"
      >
        {downloading ? "PDF wird erstellt…" : "Guide als PDF herunterladen"}
      </button>
    </div>
  );
}

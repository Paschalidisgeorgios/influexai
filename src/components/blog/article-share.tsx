"use client";

import { useState } from "react";

export function ArticleShare({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-white/70">Teilen</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${text}&url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
      >
        Twitter
      </a>
      <a
        href={`https://wa.me/?text=${text}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
      >
        WhatsApp
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
      >
        {copied ? "Kopiert ✓" : "Link kopieren"}
      </button>
    </div>
  );
}

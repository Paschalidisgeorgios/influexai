"use client";

import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/lib/locale";

const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "el", name: "Ελληνικά", flag: "🇬🇷" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

function setLocaleCookie(code: string) {
  document.cookie = `locale=${code};path=/;max-age=31536000;SameSite=Lax`;
  window.location.reload();
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-[#F0EFE8] transition-colors hover:border-white/20 hover:bg-white/[0.08] ${
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span aria-hidden>{current.flag}</span>
        {!compact && <span>{current.name}</span>}
        <span className="text-white/40 text-[10px]">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 z-[100] mt-1.5 min-w-[180px] max-h-[280px] overflow-y-auto rounded-xl border border-white/10 bg-[#0f0f12] py-1 shadow-xl"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === locale}
                onClick={() => {
                  setOpen(false);
                  if (lang.code !== locale) setLocaleCookie(lang.code);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition-colors hover:bg-white/[0.06] ${
                  lang.code === locale
                    ? "text-[var(--accent)]"
                    : "text-[#F0EFE8]/90"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

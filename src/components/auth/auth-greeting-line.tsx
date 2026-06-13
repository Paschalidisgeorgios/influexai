"use client";

import { getGreeting, getGreetingEmoji } from "@/lib/greeting";
import { useLocale } from "next-intl";

export function AuthGreetingLine() {
  const locale = useLocale();
  return (
    <p className="mb-4 text-sm text-white/60">
      {getGreeting(locale)}! {getGreetingEmoji()}
    </p>
  );
}

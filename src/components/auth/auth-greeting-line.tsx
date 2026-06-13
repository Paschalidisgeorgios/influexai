"use client";

import { getGreeting, getGreetingEmoji } from "@/lib/greeting";
import { useLocale } from "next-intl";

export function AuthGreetingLine() {
  const locale = useLocale();
  return (
    <p className="text-white/60 text-sm mb-6">
      {getGreeting(locale)}! {getGreetingEmoji()}
    </p>
  );
}

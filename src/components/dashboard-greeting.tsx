"use client";

import {
  getGreeting,
  getGreetingEmoji,
  getGreetingSubtext,
} from "@/lib/greeting";

type Props = {
  firstName: string;
  locale?: string;
};

export function DashboardGreeting({ firstName, locale = "de" }: Props) {
  const greeting = getGreeting(locale);
  const emoji = getGreetingEmoji();
  const subtext = getGreetingSubtext(locale);

  return (
    <div>
      <h1 className="text-2xl font-medium text-white">
        {greeting},{" "}
        <span className="text-[#B4FF00]">{firstName}</span> {emoji}
      </h1>
      <p className="text-white/50 text-sm mt-1">{subtext}</p>
    </div>
  );
}

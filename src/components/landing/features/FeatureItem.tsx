"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  href: string;
  label: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function FeatureItem({
  href,
  label,
  onNavigate,
  variant = "desktop",
}: Props) {
  const className =
    variant === "mobile"
      ? "features-mega-item features-mega-item--mobile"
      : "features-mega-item";

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      <span>{label}</span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" strokeWidth={2} />
    </Link>
  );
}

import Link from "next/link";

type BrandWordmarkProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
  onClick?: () => void;
};

const SIZE_CLASS = {
  sm: "text-base tracking-[0.2em]",
  md: "text-xl tracking-widest",
} as const;

export function BrandWordmark({
  href = "/",
  className = "",
  size = "md",
  ariaLabel = "Zur Startseite",
  onClick,
}: BrandWordmarkProps) {
  const wordmark = (
    <span
      className={`font-sans uppercase font-extrabold text-white antialiased ${SIZE_CLASS[size]} ${className}`}
    >
      INFLUEX{" "}
      <span className="text-[#ccff00] drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]">
        AI
      </span>
    </span>
  );

  if (!href) return wordmark;

  return (
    <Link
      href={href}
      className="flex shrink-0 items-center no-underline"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {wordmark}
    </Link>
  );
}

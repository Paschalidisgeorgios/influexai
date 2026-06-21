import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { InfluexPageShell } from "./InfluexPageShell";

export type LegalShellProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  toc?: ReactNode;
  className?: string;
  articleClassName?: string;
};

/**
 * Legal page frame — layout only, no content changes.
 * For future impressum / datenschutz / agb rollout.
 */
export function LegalShell({
  title,
  children,
  backHref = "/",
  backLabel = "← Zur Startseite",
  toc,
  className,
  articleClassName,
}: LegalShellProps) {
  return (
    <InfluexPageShell
      variant="legal"
      backgroundIntensity="subtle"
      className={cn("influex-legal-shell", className)}
    >
      <div
        className={cn(
          "influex-legal-shell__layout",
          toc && "influex-legal-shell__layout--toc"
        )}
      >
        {toc ? <aside className="influex-legal-shell__toc">{toc}</aside> : null}

        <article className={cn("influex-legal-shell__article", articleClassName)}>
          <Link href={backHref} className="influex-legal-shell__back">
            {backLabel}
          </Link>
          <h1 className="influex-legal-shell__title">{title}</h1>
          <div className="influex-legal-shell__prose">{children}</div>
        </article>
      </div>
    </InfluexPageShell>
  );
}

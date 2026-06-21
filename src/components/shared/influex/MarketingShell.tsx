import type { ReactNode } from "react";
import { cn } from "./cn";
import { InfluexPageShell } from "./InfluexPageShell";
import { LegalFooterLinks } from "@/components/legal/LegalPageLayout";

export type MarketingShellProps = {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  mainClassName?: string;
  containerClassName?: string;
  withBackground?: boolean;
};

/**
 * Marketing page frame for future `/` and `/pricing` rollout.
 * Not wired to production routes in Phase 4G.1.
 */
export function MarketingShell({
  toolbar,
  children,
  footer,
  className,
  mainClassName,
  containerClassName,
  withBackground = true,
}: MarketingShellProps) {
  const resolvedFooter =
    footer === undefined ? (
      <LegalFooterLinks className="influex-marketing-shell__legal-footer" />
    ) : (
      footer
    );

  return (
    <InfluexPageShell
      variant="marketing"
      withToolbarSpace={Boolean(toolbar)}
      withBackground={withBackground}
      className={cn("influex-marketing-shell", className)}
      contentClassName="influex-marketing-shell__content"
    >
      {toolbar ? (
        <div className="influex-marketing-shell__toolbar">{toolbar}</div>
      ) : null}

      <main className={cn("influex-marketing-shell__main", mainClassName)}>
        <div className={cn("influex-marketing-shell__container", containerClassName)}>
          {children}
        </div>
      </main>

      {resolvedFooter ? (
        <footer className="influex-marketing-shell__footer">{resolvedFooter}</footer>
      ) : null}
    </InfluexPageShell>
  );
}

import type { ReactNode } from "react";
import { cn } from "./cn";
import { InfluexPageShell } from "./InfluexPageShell";

export type AuthShellProps = {
  children: ReactNode;
  editorial?: ReactNode;
  className?: string;
  frameClassName?: string;
  formClassName?: string;
};

/**
 * Auth page frame — UI shell only, no session logic.
 * For future sign-in / sign-up / forgot-password rollout.
 */
export function AuthShell({
  children,
  editorial,
  className,
  frameClassName,
  formClassName,
}: AuthShellProps) {
  return (
    <InfluexPageShell
      variant="auth"
      backgroundIntensity="subtle"
      className={cn("influex-auth-shell", className)}
      contentClassName="w-full"
    >
      <div className={cn("influex-auth-shell__frame", frameClassName)}>
        {editorial ? (
          <aside className="influex-auth-shell__editorial">{editorial}</aside>
        ) : null}
        <div className={cn("influex-auth-shell__form", formClassName)}>{children}</div>
      </div>
    </InfluexPageShell>
  );
}

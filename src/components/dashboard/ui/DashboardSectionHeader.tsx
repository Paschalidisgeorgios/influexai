/**
 * DashboardSectionHeader — consistent section titling.
 *
 * Renders eyebrow → title → description with optional right-side action slot.
 * Purely visual — no routing, no data fetching.
 *
 * Usage:
 *   <DashboardSectionHeader
 *     eyebrow="Galerie"
 *     title="Deine generierten Assets"
 *     description="Alle Bilder, Videos und Texte auf einen Blick."
 *     action={<DashboardButton variant="ghost" size="sm">Filter</DashboardButton>}
 *   />
 */

import { text } from "@/lib/design/dashboard-tokens";

export interface DashboardSectionHeaderProps {
  /** Large primary heading */
  title: string;
  /** Small uppercase label above the title */
  eyebrow?: string;
  /** Supporting sentence below the title */
  description?: string;
  /** Optional slot for a button or link rendered to the right */
  action?: React.ReactNode;
  className?: string;
}

export function DashboardSectionHeader({
  title,
  eyebrow,
  description,
  action,
  className = "",
}: DashboardSectionHeaderProps) {
  return (
    <div className={["flex items-start justify-between gap-4", className].filter(Boolean).join(" ")}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {eyebrow}
          </p>
        )}
        <h2 className={`text-base font-semibold leading-snug ${text.primary}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-1 text-sm leading-relaxed ${text.muted}`}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 pt-0.5">{action}</div>
      )}
    </div>
  );
}

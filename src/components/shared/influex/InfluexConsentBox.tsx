import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type InfluexConsentBoxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "title"
> & {
  title: string;
  description: ReactNode;
  className?: string;
};

/**
 * Consent UI primitive only — no global consent logic.
 * For AI Creator, Digital Twin, Face Swap, LoRA, UGC workflows.
 */
export function InfluexConsentBox({
  title,
  description,
  className,
  id,
  ...props
}: InfluexConsentBoxProps) {
  const checkboxId = id ?? "influex-consent-checkbox";

  return (
    <label htmlFor={checkboxId} className={cn("influex-consent", className)}>
      <input
        id={checkboxId}
        type="checkbox"
        className="influex-consent__checkbox"
        {...props}
      />
      <div className="influex-consent__content">
        <p className="influex-consent__title">{title}</p>
        <div className="influex-consent__body">{description}</div>
      </div>
    </label>
  );
}

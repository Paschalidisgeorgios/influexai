import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export type InfluexTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function InfluexTextarea({
  label,
  hint,
  error,
  className,
  wrapperClassName,
  id,
  ...props
}: InfluexTextareaProps) {
  const inputId =
    id ?? (label ? `influex-textarea-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={cn("influex-field", wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className="influex-field__label">
          {label}
        </label>
      ) : null}

      <textarea
        id={inputId}
        className={cn("influex-textarea", error && "influex-textarea--error", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />

      {hint && !error ? (
        <p id={`${inputId}-hint`} className="influex-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="influex-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

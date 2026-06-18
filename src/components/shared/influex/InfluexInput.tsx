import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type InfluexInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
};

export function InfluexInput({
  label,
  hint,
  error,
  icon,
  className,
  wrapperClassName,
  id,
  ...props
}: InfluexInputProps) {
  const inputId = id ?? (label ? `influex-input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={cn("influex-field", wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className="influex-field__label">
          {label}
        </label>
      ) : null}

      <div className={cn(icon && "influex-input-wrap")}>
        {icon ? <span className="influex-input-wrap__icon">{icon}</span> : null}
        <input
          id={inputId}
          className={cn("influex-input", error && "influex-input--error", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
      </div>

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

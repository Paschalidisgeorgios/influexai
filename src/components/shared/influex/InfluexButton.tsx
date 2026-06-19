import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import type { InfluexButtonVariant } from "./types";

type BaseProps = {
  variant?: InfluexButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = BaseProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: boolean;
};

export type InfluexButtonProps = ButtonProps | LinkButtonProps;

const VARIANT_CLASS: Record<InfluexButtonVariant, string> = {
  primary: "influex-btn--primary",
  secondary: "influex-btn--secondary",
  ghost: "influex-btn--ghost",
  lime: "influex-btn--lime",
  danger: "influex-btn--danger",
};

const SIZE_CLASS = {
  sm: "influex-btn--sm",
  md: "",
  lg: "influex-btn--lg",
} as const;

function buttonClasses({
  variant = "primary",
  size = "md",
  loading,
  className,
}: {
  variant?: InfluexButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
}) {
  return cn(
    "influex-btn",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    loading && "influex-btn--loading",
    className
  );
}

export function InfluexButton(props: InfluexButtonProps) {
  const {
    variant,
    size,
    loading,
    className,
    children,
    ...domProps
  } = props;

  const classes = buttonClasses({ variant, size, loading, className });

  if ("href" in props && props.href) {
    const { href, disabled } = props;
    if (disabled) {
      return (
        <span className={classes} aria-disabled="true">
          {loading ? <span className="influex-btn__spinner" aria-hidden /> : null}
          {children}
        </span>
      );
    }
    return (
      <Link href={href} className={classes}>
        {loading ? <span className="influex-btn__spinner" aria-hidden /> : null}
        {children}
      </Link>
    );
  }

  const { disabled, type = "button" } = domProps as ButtonProps;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="influex-btn__spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}

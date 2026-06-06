"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { forwardRef } from "react";

const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

type AcidMotionButtonProps = {
  href?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export const AcidMotionButton = forwardRef<
  HTMLButtonElement,
  AcidMotionButtonProps
>(function AcidMotionButton(
  { href, children, className, onClick, style, disabled, type = "button" },
  ref
) {
  const classes = className ?? "btn-acid";
  const isPrimary = classes.includes("btn-acid");
  const tap = isPrimary ? { scale: 0.97 } : { scale: 0.97 };
  const hover = { scale: 1.03 };

  if (href) {
    return (
      <motion.span
        whileHover={hover}
        whileTap={tap}
        transition={spring}
        className={`inline-flex${isPrimary ? " acid-motion-btn--primary" : ""}`}
        style={{ willChange: "transform" }}
      >
        <Link
          href={href}
          className={classes}
          onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
          style={style}
        >
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${classes}${isPrimary ? " acid-motion-btn--primary" : ""}`}
      onClick={onClick as MouseEventHandler<HTMLButtonElement> | undefined}
      whileHover={hover}
      whileTap={tap}
      transition={spring}
      style={{ ...style, willChange: "transform" }}
    >
      {children}
    </motion.button>
  );
});

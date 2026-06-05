"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { forwardRef } from "react";

const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

const acidShockTap = {
  scale: 0.97,
  boxShadow: "0 0 0 14px rgba(180,255,0,0.28)",
};

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

  if (href) {
    return (
      <motion.span
        whileHover={{ scale: 1.03 }}
        whileTap={isPrimary ? acidShockTap : { scale: 0.97 }}
        transition={spring}
        className="inline-flex"
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
      className={classes}
      onClick={onClick as MouseEventHandler<HTMLButtonElement> | undefined}
      whileHover={{ scale: 1.03 }}
      whileTap={isPrimary ? acidShockTap : { scale: 0.97 }}
      transition={spring}
      style={{ ...style, willChange: "transform" }}
    >
      {children}
    </motion.button>
  );
});

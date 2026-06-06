"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ACTIVE_INDICATOR_CLASS =
  "pointer-events-none absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#B4FF00]";

type SidebarNavLinkProps = {
  href: string;
  active: boolean;
  disabled?: boolean;
  collapsed?: boolean;
  title?: string;
  className: string;
  children: ReactNode;
};

export function SidebarNavLink({
  href,
  active,
  disabled,
  collapsed,
  title,
  className,
  children,
}: SidebarNavLinkProps) {
  if (disabled) {
    return (
      <span title={title} className={className}>
        {children}
      </span>
    );
  }

  return (
    <motion.div
      className="relative"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      {active ? (
        <span className={ACTIVE_INDICATOR_CLASS} aria-hidden />
      ) : null}
      <Link href={href} title={title} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

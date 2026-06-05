"use client";

import { AnimatePresence, motion } from "framer-motion";

type TabPanelTransitionProps = {
  tabKey: string;
  direction: number;
  children: React.ReactNode;
  className?: string;
};

export function TabPanelTransition({
  tabKey,
  direction,
  children,
  className,
}: TabPanelTransitionProps) {
  const x = direction >= 0 ? 24 : -24;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tabKey}
        className={className}
        initial={{ opacity: 0, x }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -x }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

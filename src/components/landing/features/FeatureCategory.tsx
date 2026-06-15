"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { FeatureMenuCategory } from "@/lib/landing-features-menu";
import { useFeaturesMenuLabel } from "@/lib/features-menu-i18n";
import { FeatureItem } from "./FeatureItem";

const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  open: { height: "auto", opacity: 1 },
};

type Props = {
  category: FeatureMenuCategory;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  defaultOpen?: boolean;
};

export function FeatureCategory({
  category,
  onNavigate,
  variant = "desktop",
  defaultOpen = false,
}: Props) {
  const { label } = useFeaturesMenuLabel();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (variant === "mobile") {
    return (
      <div
        className={`rounded-xl border transition-colors duration-300 ${
          isOpen
            ? "border-[#ccff00]/30 bg-zinc-950/40"
            : "border-zinc-800/60 bg-transparent"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className={`flex min-h-12 w-full items-center justify-between px-3 py-3 text-left font-mono text-sm font-semibold tracking-wide transition-colors duration-300 ${
            isOpen ? "text-[#ccff00]" : "text-zinc-400"
          }`}
        >
          {label(`categories.${category.id}`)}
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-[#ccff00]" : "text-zinc-400"
            }`}
            strokeWidth={2}
          />
        </button>
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={accordionVariants}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="overflow-hidden px-1 pb-2"
            >
              <div className="pb-2">
                {category.groups.map((group) =>
                  group.items.map((item) => (
                    <FeatureItem
                      key={item.id}
                      href={item.href}
                      label={label(`items.${item.id}`)}
                      onNavigate={onNavigate}
                      variant="mobile"
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="mb-4 border-b border-zinc-800/60 pb-2 font-mono text-sm font-semibold tracking-wide text-zinc-400">
        {label(`categories.${category.id}`)}
      </p>
      <div className="space-y-4">
        {category.groups.map((group) => {
          const Icon = group.icon;
          const groupTitle = label(`groups.${group.id}.title`);
          return group.items.map((item) => (
            <FeatureItem
              key={item.id}
              href={item.href}
              label={label(`items.${item.id}`)}
              subtitle={groupTitle}
              icon={Icon}
              onNavigate={onNavigate}
            />
          ));
        })}
      </div>
    </div>
  );
}

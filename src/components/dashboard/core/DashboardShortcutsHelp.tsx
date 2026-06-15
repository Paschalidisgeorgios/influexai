"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["?"], label: "Hilfe anzeigen" },
  { keys: ["Esc"], label: "Panel schließen" },
  { keys: ["G"], label: "Generieren" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DashboardShortcutsHelp({ open, onOpenChange }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="shortcuts"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X size={16} />
            </button>
            <h2 className="mb-4 text-sm font-semibold text-white">Tastenkürzel</h2>
            <ul className="space-y-2">
              {SHORTCUTS.map(({ keys, label }) => (
                <li key={label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-zinc-400">{label}</span>
                  <div className="flex gap-1">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

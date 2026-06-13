"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Space"], label: "Canvas verschieben (halten)" },
  { keys: ["1", "F"], label: "Alles einpassen (Fit View)" },
  { keys: ["Entf"], label: "Auswahl löschen" },
  { keys: ["V"], label: "Video-Node (Seedance)" },
  { keys: ["I"], label: "Bild-Node (Flux)" },
  { keys: ["?"], label: "Shortcuts anzeigen" },
] as const;

type CanvasShortcutsHelpProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="canvas-shortcut-kbd inline-flex min-w-[1.4rem] items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-200">
      {children}
    </kbd>
  );
}

function CanvasShortcutsHelpComponent({ open, onOpenChange }: CanvasShortcutsHelpProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="canvas-shortcut-trigger absolute bottom-4 left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800/70 bg-zinc-950/70 text-zinc-500 backdrop-blur-md transition-colors hover:border-[#ccff00]/30 hover:text-[#ccff00]"
        aria-label="Tastatur-Shortcuts anzeigen"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Keyboard className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
              aria-label="Shortcuts schließen"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Tastatur-Shortcuts"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="canvas-shortcut-panel absolute bottom-14 left-4 z-40 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/75 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-3.5 w-3.5 text-[#ccff00]" strokeWidth={1.75} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300">
                    Shortcuts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                  aria-label="Schließen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <ul className="space-y-2">
                {SHORTCUTS.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-[11px] text-zinc-400"
                  >
                    <span>{item.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={key} className="flex items-center gap-1">
                          {i > 0 ? (
                            <span className="text-[9px] text-zinc-600">/</span>
                          ) : null}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export const CanvasShortcutsHelp = memo(CanvasShortcutsHelpComponent);

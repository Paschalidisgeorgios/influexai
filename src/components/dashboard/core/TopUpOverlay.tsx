"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useCredits } from "@/components/credits/BuyCreditsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  requiredCoins: number;
}

export function TopUpOverlay({ open, onClose, requiredCoins }: Props) {
  const { openBuyModal } = useCredits();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="topup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="w-full max-w-xs rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ccff00]/10 text-[#ccff00]">
                <Zap size={22} />
              </span>
            </div>
            <h2 className="mb-1 text-base font-semibold text-white">Nicht genug Credits</h2>
            <p className="mb-4 text-xs text-zinc-400">
              Du benötigst <strong className="text-white">{requiredCoins} Credits</strong> für diese Aktion.
            </p>
            <button
              type="button"
              onClick={() => { openBuyModal(); onClose(); }}
              className="w-full rounded-xl bg-[#ccff00] px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
            >
              Credits aufladen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Abbrechen
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

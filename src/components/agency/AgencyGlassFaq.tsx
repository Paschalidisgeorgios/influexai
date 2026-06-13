"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

type AgencyGlassFaqProps = {
  headline: string;
  items: FaqItem[];
};

export function AgencyGlassFaq({ headline, items }: AgencyGlassFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-[clamp(20px,6vw,64px)]">
      <div className="max-w-[720px] mx-auto">
        <h2 className="landing-heading text-4xl text-center mb-10">{headline}</h2>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.question} className="studio-glass-faq-item">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="studio-glass-faq-trigger"
                  aria-expanded={open}
                >
                  {item.question}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 studio-glass-accent transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="studio-glass-faq-body">{item.answer}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

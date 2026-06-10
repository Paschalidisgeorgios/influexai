"use client";

import { useEffect, useState } from "react";

type Options = {
  examples: string[];
  typingMs?: number;
  deletingMs?: number;
  pauseMs?: number;
  enabled?: boolean;
};

export function useTypewriterPlaceholder({
  examples,
  typingMs = 45,
  deletingMs = 20,
  pauseMs = 2000,
  enabled = true,
}: Options): string {
  const [text, setText] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled || examples.length === 0) {
      setText("");
      return;
    }

    const current = examples[exampleIndex] ?? "";

    const timeout = window.setTimeout(
      () => {
        if (!deleting) {
          if (charIndex < current.length) {
            setText(current.slice(0, charIndex + 1));
            setCharIndex((c) => c + 1);
          } else {
            window.setTimeout(() => setDeleting(true), pauseMs);
          }
        } else if (charIndex > 0) {
          setCharIndex((c) => c - 1);
          setText(current.slice(0, charIndex - 1));
        } else {
          setDeleting(false);
          setExampleIndex((i) => (i + 1) % examples.length);
        }
      },
      deleting ? deletingMs : typingMs
    );

    return () => window.clearTimeout(timeout);
  }, [
    enabled,
    examples,
    exampleIndex,
    charIndex,
    deleting,
    typingMs,
    deletingMs,
    pauseMs,
  ]);

  useEffect(() => {
    if (!enabled) return;
    setText("");
    setCharIndex(0);
    setDeleting(false);
    setExampleIndex(0);
  }, [enabled, examples]);

  return text;
}

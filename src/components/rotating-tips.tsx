"use client";

import { useEffect, useState } from "react";

type RotatingTipsProps = {
  tips: string[];
  intervalMs?: number;
};

export function RotatingTips({ tips, intervalMs = 4000 }: RotatingTipsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (tips.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % tips.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [tips, intervalMs]);

  if (tips.length === 0) return null;

  return (
    <p
      style={{
        color: "rgba(255,255,255,0.75)",
        fontSize: "0.85rem",
        minHeight: "1.25rem",
        transition: "opacity 0.3s",
      }}
    >
      {tips[index]}
    </p>
  );
}

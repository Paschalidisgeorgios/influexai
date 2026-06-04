"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
};

export function ImageCompareSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Original",
  afterAlt = "Upscaled",
}: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-[20px] border border-white/12 bg-[#060608] select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          updateFromClientX(e.clientX);
        }
      }}
    >
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        unoptimized
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="object-contain"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          unoptimized
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="object-contain"
        />
      </div>
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 cursor-ew-resize bg-[#B4FF00] shadow-[0_0_12px_#B4FF00]"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#B4FF00] bg-[#060608] text-xs font-bold text-[#B4FF00]">
          ↔
        </div>
      </div>
    </div>
  );
}

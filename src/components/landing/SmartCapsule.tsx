"use client";

import { useState, useEffect } from "react";

interface SmartCapsuleProps {
  rgb: string;
  message: string;
  isFlashing?: boolean;
}

export function SmartCapsule({
  rgb,
  message,
  isFlashing = false,
}: SmartCapsuleProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [displayMsg, setDisplayMsg] = useState(message);
  const [msgOpacity, setMsgOpacity] = useState(1);

  useEffect(() => {
    setMsgOpacity(0);
    const t = setTimeout(() => {
      setDisplayMsg(message);
      setMsgOpacity(1);
    }, 200);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const glowSize = isScrolled ? 10 : 18;
  const glowOp = isScrolled ? 0.18 : 0.3;

  return (
    <div
      className="pointer-events-none fixed top-5 left-1/2 z-50 select-none"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="flex items-center gap-2 rounded-full border"
        style={{
          padding: isScrolled ? "4px 12px" : "5px 16px",
          background: isFlashing
            ? `rgba(${rgb},0.15)`
            : isScrolled
              ? "rgba(9,9,11,0.3)"
              : "rgba(18,18,20,0.7)",
          backdropFilter: isScrolled ? "blur(40px)" : "blur(24px)",
          borderColor: `rgba(${rgb},${isScrolled ? 0.2 : 0.3})`,
          boxShadow: isFlashing
            ? `0 0 40px rgba(${rgb},0.5),0 0 80px rgba(${rgb},0.2)`
            : `0 0 ${glowSize}px rgba(${rgb},${glowOp}),0 0 ${glowSize * 2}px rgba(${rgb},${glowOp * 0.4}),inset 0 0.5px 0 rgba(255,255,255,0.06)`,
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform, box-shadow",
        }}
      >
        <span
          className="relative flex shrink-0 items-center justify-center"
          style={{
            width: isScrolled ? "10px" : "12px",
            height: isScrolled ? "10px" : "12px",
          }}
        >
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ background: `rgba(${rgb},0.4)`, animationDuration: "2s" }}
          />
          <span
            className="relative rounded-full"
            style={{
              width: isScrolled ? "5px" : "6px",
              height: isScrolled ? "5px" : "6px",
              background: `rgb(${rgb})`,
              boxShadow: `0 0 8px rgba(${rgb},0.9)`,
              transition: "all 0.5s ease",
            }}
          />
        </span>

        <span
          className="font-sans font-medium uppercase"
          style={{
            fontSize: isScrolled ? "9px" : "10px",
            letterSpacing: isScrolled ? "1px" : "1.5px",
            color: `rgba(${rgb},0.8)`,
            opacity: msgOpacity,
            transition: "opacity 0.25s ease, font-size 0.5s ease",
            maxWidth: isScrolled ? "260px" : "460px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayMsg}
        </span>
      </div>
    </div>
  );
}

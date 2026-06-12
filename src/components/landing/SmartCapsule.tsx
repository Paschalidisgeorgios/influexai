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

  return (
    <div
      className="pointer-events-none fixed top-5 left-1/2 z-50 select-none overflow-hidden"
      style={{ transform: "translateX(-50%)", maxWidth: "calc(100vw - 2rem)" }}
    >
      <div
        className="flex items-center gap-2 overflow-hidden rounded-full border"
        style={{
          padding: isScrolled ? "4px 12px" : "5px 16px",
          background: isFlashing
            ? `rgba(${rgb},0.12)`
            : isScrolled
              ? "rgba(9,9,11,0.3)"
              : "rgba(18,18,20,0.7)",
          backdropFilter: isScrolled ? "blur(40px)" : "blur(24px)",
          borderColor: `rgba(${rgb},${isScrolled ? 0.2 : 0.25})`,
          boxShadow: isFlashing
            ? `0 0 24px rgba(${rgb},0.25), inset 0 0.5px 0 rgba(255,255,255,0.06)`
            : `0 0 12px rgba(${rgb},0.12), inset 0 0.5px 0 rgba(255,255,255,0.06)`,
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <span
          className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
          style={{
            width: "12px",
            height: "12px",
            flexShrink: 0,
          }}
        >
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: `rgba(${rgb},0.4)`,
              animationDuration: "2s",
            }}
          />
          <span
            className="relative rounded-full"
            style={{
              width: "5px",
              height: "5px",
              background: `rgb(${rgb})`,
              boxShadow: `0 0 6px rgba(${rgb},0.9)`,
            }}
          />
        </span>

        <span
          className="min-w-0 font-sans font-medium uppercase"
          style={{
            fontSize: isScrolled ? "9px" : "10px",
            letterSpacing: isScrolled ? "1px" : "1.5px",
            color: `rgba(${rgb},0.8)`,
            opacity: msgOpacity,
            transition: "opacity 0.25s ease, font-size 0.5s ease",
            maxWidth: isScrolled ? "min(260px, 70vw)" : "min(460px, 75vw)",
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

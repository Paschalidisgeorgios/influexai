"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const pathname = usePathname();
  const ring1 = useRef<HTMLDivElement>(null);
  const ring2 = useRef<HTMLDivElement>(null);
  const ring3 = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const disabled =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  useEffect(() => {
    if (disabled) {
      setActive(false);
      document.body.classList.remove("has-custom-cursor");
      return;
    }

    const desktop =
      window.matchMedia("(min-width: 769px) and (pointer: fine)").matches;
    if (!desktop) return;

    setActive(true);
    document.body.classList.add("has-custom-cursor");

    let x = 0;
    let y = 0;
    let r2x = 0;
    let r2y = 0;
    let r3x = 0;
    let r3y = 0;
    let raf = 0;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const onEnter = () => {
      ring2.current?.style.setProperty("transform", "scale(1.5)");
      ring3.current?.style.setProperty("opacity", "0.8");
    };

    const onLeave = () => {
      ring2.current?.style.removeProperty("transform");
      ring3.current?.style.setProperty("opacity", "0.2");
    };

    const interactive = () =>
      document.querySelectorAll(
        "a, button, [role='button'], input, textarea, select, label"
      );

    const bindInteractive = () => {
      interactive().forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };

    const unbindInteractive = () => {
      interactive().forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };

    window.addEventListener("mousemove", move);
    bindInteractive();

    const animate = () => {
      if (ring1.current) {
        ring1.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      }
      r2x += (x - r2x) * 0.15;
      r2y += (y - r2y) * 0.15;
      if (ring2.current) {
        ring2.current.style.transform = `translate3d(${r2x - 12}px, ${r2y - 12}px, 0)`;
      }
      r3x += (x - r3x) * 0.08;
      r3y += (y - r3y) * 0.08;
      if (ring3.current) {
        ring3.current.style.transform = `translate3d(${r3x - 22}px, ${r3y - 22}px, 0)`;
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    const observer = new MutationObserver(() => {
      unbindInteractive();
      bindInteractive();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      unbindInteractive();
      observer.disconnect();
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [disabled]);

  if (!active || disabled) return null;

  const baseStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: "50%",
    pointerEvents: "none",
    border: "1px solid var(--accent, #B4FF00)",
    willChange: "transform",
    transition: "border-color 0.6s ease, background-color 0.6s ease",
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden"
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={ring1}
        className="pointer-events-none"
        style={{
          ...baseStyle,
          pointerEvents: "none",
          width: 8,
          height: 8,
          background: "var(--accent, #B4FF00)",
          opacity: 0.9,
        }}
      />
      <div
        ref={ring2}
        className="pointer-events-none"
        style={{
          ...baseStyle,
          pointerEvents: "none",
          width: 24,
          height: 24,
          opacity: 0.5,
          transition: "transform 0.1s ease, opacity 0.15s ease",
        }}
      />
      <div
        ref={ring3}
        className="pointer-events-none"
        style={{
          ...baseStyle,
          pointerEvents: "none",
          width: 44,
          height: 44,
          opacity: 0.2,
          transition: "transform 0.15s ease, opacity 0.15s ease",
        }}
      />
    </div>
  );
}

"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export function use3DReveal(modelId: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const depthRef = useRef(0);
  const targetRef = useRef(0);
  const mxRef = useRef(0);
  const myRef = useRef(0);
  const mxSmoothRef = useRef(0);
  const mySmoothRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setRevealed(false);
    depthRef.current = 0;
    targetRef.current = 0;
    const t = window.setTimeout(() => {
      targetRef.current = 1;
      setRevealed(true);
    }, 150);
    return () => clearTimeout(t);
  }, [modelId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mxRef.current = (e.clientX - r.left) / r.width - 0.5;
      myRef.current = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      mxRef.current = 0;
      myRef.current = 0;
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      depthRef.current += (targetRef.current - depthRef.current) * 0.028;
      mxSmoothRef.current += (mxRef.current - mxSmoothRef.current) * 0.06;
      mySmoothRef.current += (myRef.current - mySmoothRef.current) * 0.06;

      const d = depthRef.current;
      const ep = 1 - Math.pow(1 - Math.min(d, 1), 3);
      const z = -500 + 500 * ep;
      const sc = 0.5 + 0.5 * ep;
      const bl = Math.max(0, 20 - 20 * ep);
      const op = Math.min(1, d * 2.5);
      const tX = mySmoothRef.current * 7 * ep;
      const tY = mxSmoothRef.current * -7 * ep;

      if (elementRef.current) {
        elementRef.current.style.transform = `translate(-50%,-50%) perspective(1200px) translateZ(${z}px) scale(${sc}) rotateX(${tX}deg) rotateY(${tY}deg)`;
        elementRef.current.style.opacity = String(op);
        elementRef.current.style.filter = `blur(${bl}px)`;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const triggerImpulse = useCallback((amount = 40) => {
    const orig = depthRef.current;
    let t = 0;
    const iv = window.setInterval(() => {
      t += 16;
      const extra = Math.sin((t / 200) * Math.PI) * amount * 0.001;
      if (elementRef.current) {
        elementRef.current.style.transform = `translate(-50%,-50%) perspective(1200px) translateZ(${-500 + 500 * orig + extra * 100}px) scale(${0.5 + 0.5 * orig + extra})`;
      }
      if (t > 300) clearInterval(iv);
    }, 16);
  }, []);

  return { containerRef, elementRef, revealed, triggerImpulse };
}

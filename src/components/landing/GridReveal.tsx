"use client";

import { useEffect, useRef } from "react";

function getCellSize(): number {
  if (typeof window === "undefined") return 60;
  return window.matchMedia("(max-width: 767px)").matches ? 40 : 60;
}

export default function GridReveal() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const canvasCtx = ctx;

    let W = 0;
    let H = 0;
    let mx = -999;
    let my = -999;
    let CELL = getCellSize();
    let raf = 0;

    const resize = () => {
      CELL = getCellSize();
      W = cv.width = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
    };
    resize();

    const parent = cv.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const mq = window.matchMedia("(max-width: 767px)");
    const onMq = () => {
      CELL = getCellSize();
    };
    mq.addEventListener("change", onMq);

    const onMove = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const onLeave = () => {
      mx = -999;
      my = -999;
    };
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);

    const sentinel = document.getElementById("landing-hero-sentinel");
    const io = sentinel
      ? new IntersectionObserver(
          ([entry]) => {
            visibleRef.current = entry.isIntersecting;
          },
          { threshold: 0.05 }
        )
      : null;
    if (sentinel) io?.observe(sentinel);

    function draw() {
      if (!visibleRef.current) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (!W || !H) {
        raf = requestAnimationFrame(draw);
        return;
      }
      canvasCtx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / CELL) + 1;
      const rows = Math.ceil(H / CELL) + 1;
      const cx = Math.floor(mx / CELL);
      const cy = Math.floor(my / CELL);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * CELL;
          const y = j * CELL;
          const dist = Math.sqrt((i - cx) ** 2 + (j - cy) ** 2);
          const inf = Math.max(0, 1 - dist / 5);
          if (inf > 0.01) {
            canvasCtx.fillStyle = `rgba(180,255,0,${inf * 0.06})`;
            canvasCtx.fillRect(x, y, CELL, CELL);
            canvasCtx.strokeStyle = `rgba(180,255,0,${inf * 0.35})`;
            canvasCtx.lineWidth = 0.5;
            canvasCtx.strokeRect(x + 0.25, y + 0.25, CELL - 0.5, CELL - 0.5);
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 1.5 * inf, 0, Math.PI * 2);
            canvasCtx.fillStyle = `rgba(180,255,0,${inf * 0.6})`;
            canvasCtx.fill();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", onMq);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
      io?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={cvRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
    />
  );
}

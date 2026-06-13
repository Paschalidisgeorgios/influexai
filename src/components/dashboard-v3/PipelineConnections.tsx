"use client";

import { useEffect, useRef, useCallback } from "react";
import type { RefObject } from "react";
import type { NodeOutput } from "@/lib/dashboard-v3/usePipeline";

interface PipelineConnectionsProps {
  outputs: NodeOutput[];
  panelRefsMap: RefObject<Map<string, HTMLDivElement>>;
  panelIds: string[];
  containerRef: RefObject<HTMLDivElement | null>;
  themeRgb: string;
}

function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number) {
  return (
    Math.pow(1 - t, 3) * p0 +
    3 * Math.pow(1 - t, 2) * t * p1 +
    3 * (1 - t) * Math.pow(t, 2) * p2 +
    Math.pow(t, 3) * p3
  );
}

export function PipelineConnections({
  outputs,
  panelRefsMap,
  panelIds,
  containerRef,
  themeRgb,
}: PipelineConnectionsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | undefined>(undefined);
  const progressRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    progressRef.current = (progressRef.current + 0.008) % 1;

    const panelRefs = panelIds.map((id) => ({
      id,
      element: panelRefsMap.current.get(id) ?? null,
    }));

    outputs.forEach((output) => {
      const fromIndex = panelRefs.findIndex((p) => p.id === output.panelId);
      const toRef = panelRefs[fromIndex + 1];
      const fromRef = panelRefs[fromIndex];

      if (!fromRef?.element || !toRef?.element) return;

      const containerRect = container.getBoundingClientRect();
      const fromRect = fromRef.element.getBoundingClientRect();
      const toRect = toRef.element.getBoundingClientRect();

      const x1 = fromRect.right - containerRect.left + container.scrollLeft;
      const y1 = fromRect.top - containerRect.top + fromRect.height / 2;

      const x2 = toRect.left - containerRect.left + container.scrollLeft;
      const y2 = toRect.top - containerRect.top + toRect.height / 2;

      const cpx1 = x1 + (x2 - x1) * 0.4;
      const cpy1 = y1;
      const cpx2 = x1 + (x2 - x1) * 0.6;
      const cpy2 = y2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
      ctx.strokeStyle = `rgba(${themeRgb}, 0.15)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      const t = progressRef.current;
      const px = bezierPoint(x1, cpx1, cpx2, x2, t);
      const py = bezierPoint(y1, cpy1, cpy2, y2, t);

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
      gradient.addColorStop(0, `rgba(${themeRgb}, 0.9)`);
      gradient.addColorStop(0.5, `rgba(${themeRgb}, 0.4)`);
      gradient.addColorStop(1, `rgba(${themeRgb}, 0)`);

      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${themeRgb})`;
      ctx.fill();

      const mx = bezierPoint(x1, cpx1, cpx2, x2, 0.5);
      const my = bezierPoint(y1, cpy1, cpy2, y2, 0.5);

      ctx.font = "10px DM Sans, sans-serif";
      ctx.fillStyle = `rgba(${themeRgb}, 0.6)`;
      ctx.textAlign = "center";
      ctx.fillText(output.label, mx, my - 10);
    });

    animFrameRef.current = requestAnimationFrame(draw);
  }, [outputs, panelIds, panelRefsMap, containerRef, themeRgb]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    const container = containerRef.current;
    const onScroll = () => {
      progressRef.current = (progressRef.current + 0.001) % 1;
    };
    container?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container?.removeEventListener("scroll", onScroll);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{ willChange: "transform" }}
    />
  );
}

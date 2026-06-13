type CanvasNodeAmbientGlowProps = {
  accentRgb?: string;
};

export function CanvasNodeAmbientGlow({
  accentRgb = "204,255,0",
}: CanvasNodeAmbientGlowProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 blur-[120px]"
      style={{
        background: `radial-gradient(circle, rgba(${accentRgb}, 0.1) 0%, transparent 70%)`,
      }}
    />
  );
}

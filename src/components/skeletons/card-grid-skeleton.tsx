type Props = { count?: number; columns?: number };

export function CardGridSkeleton({ count = 3, columns = 3 }: Props) {
  return (
    <div
      className="grid gap-4 animate-pulse"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 1 ? "100%" : "220px"}, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-white/[0.03] p-5 space-y-3"
        >
          <div className="h-5 w-3/4 rounded-lg bg-white/5" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-[85%] rounded bg-white/5" />
          <div className="h-8 w-24 rounded-lg bg-white/5 mt-2" />
        </div>
      ))}
    </div>
  );
}

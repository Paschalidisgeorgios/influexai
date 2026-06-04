export function AnalyticsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-56 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-white/5 border border-white/5"
          />
        ))}
      </div>
      <div className="h-64 w-full rounded-xl bg-white/5 border border-white/5" />
      <div className="h-48 w-full rounded-xl bg-white/5 border border-white/5" />
    </div>
  );
}

export function ScriptSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 rounded-lg bg-white/5" />
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5 space-y-3">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-[92%] rounded bg-white/5" />
        <div className="h-4 w-[88%] rounded bg-white/5" />
        <div className="h-4 w-[95%] rounded bg-white/5" />
        <div className="h-4 w-[70%] rounded bg-white/5" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-28 rounded-lg bg-white/5" />
        <div className="h-10 w-28 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

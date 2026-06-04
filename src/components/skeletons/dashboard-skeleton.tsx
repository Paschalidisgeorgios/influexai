export function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#060608] animate-pulse">
      <div className="hidden lg:block w-[220px] bg-[#0f0f12] border-r border-white/5 p-4 space-y-3">
        <div className="h-8 w-32 rounded-lg bg-white/5" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-full rounded-lg bg-white/5" />
        ))}
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <div className="h-14 border-b border-white/5 bg-[#0f0f12] px-5 flex items-center">
          <div className="h-6 w-40 rounded-lg bg-white/5" />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-32 w-full rounded-xl bg-white/5" />
          <div className="h-48 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

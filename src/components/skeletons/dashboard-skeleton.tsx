import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#060608]">
      <div className="hidden lg:block w-[220px] bg-[#0f0f12] border-r border-white/5 p-4 space-y-3">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <div className="h-14 border-b border-white/5 bg-[#0f0f12] px-5 flex items-center">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

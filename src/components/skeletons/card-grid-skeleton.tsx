import { Skeleton } from "@/components/ui/Skeleton";

type Props = { count?: number; columns?: number };

export function CardGridSkeleton({ count = 3, columns = 3 }: Props) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 1 ? "100%" : "220px"}, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-white/[0.03] p-5 space-y-3"
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-8 w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}

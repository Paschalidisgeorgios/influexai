type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={className ? `skeleton rounded-lg ${className}` : "skeleton rounded-lg"}
      aria-hidden
    />
  );
}

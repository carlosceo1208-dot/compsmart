import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "pulse";
}

function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === "shimmer" && "shimmer",
        variant === "pulse" && "animate-pulse bg-muted",
        variant === "default" && "bg-muted",
        className
      )}
      {...props}
    />
  );
}

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-6 space-y-3", className)}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
  </div>
);

const SkeletonKPI = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-6 space-y-4", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
    <Skeleton className="h-9 w-32" />
    <Skeleton className="h-3 w-20" />
  </div>
);

const SkeletonChart = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-6 space-y-4", className)}>
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-[260px] w-full" />
  </div>
);

const SkeletonTable = ({ rows = 5, className }: { rows?: number; className?: string }) => (
  <div className={cn("card-elevated p-6 space-y-3", className)}>
    <Skeleton className="h-5 w-1/4" />
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export { Skeleton, SkeletonCard, SkeletonKPI, SkeletonChart, SkeletonTable };

import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  variant?: "default" | "tool" | "list" | "dashboard";
}

const PageSkeleton = ({ variant = "default" }: PageSkeletonProps) => {
  if (variant === "dashboard") {
    return (
      <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-lg mx-auto space-y-5 sm:space-y-7 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "tool") {
    return (
      <div className="px-3 sm:px-4 py-6 max-w-lg mx-auto space-y-5 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="px-3 sm:px-4 py-6 max-w-lg mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  // Default
  return (
    <div className="px-3 sm:px-4 py-6 max-w-lg mx-auto space-y-5 animate-fade-in">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
};

export default PageSkeleton;

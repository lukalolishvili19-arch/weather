import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]",
        className,
      )}
      {...props}
    />
  );
}

export function PageSkeleton({ cards = 4, className }: { cards?: number; className?: string }) {
  return (
    <div
      className={cn("space-y-5", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading page…</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 max-w-full sm:w-96" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className="h-[100px]" />
        ))}
      </div>
      <Skeleton className="h-[280px] w-full" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-[180px]" />
        <Skeleton className="h-[180px]" />
      </div>
    </div>
  );
}

export function RouteFallback() {
  return (
    <div className="mx-auto max-w-[1440px] p-4 sm:p-6">
      <PageSkeleton />
    </div>
  );
}

export function InlineSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

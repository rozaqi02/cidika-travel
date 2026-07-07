import React from "react";

export function Skeleton({ className = "", rounded = "rounded-lg" }) {
  return <div className={`skeleton-shimmer ${rounded} ${className}`.trim()} aria-hidden="true" />;
}

export function PackageCardSkeleton({ compact = false }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/40 bg-white shadow-sm dark:border-gray-700/40 dark:bg-gray-900">
      <Skeleton className="h-48 w-full rounded-none" rounded="rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex items-center justify-between gap-2 pt-1">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PackageCardSkeletonGrid({ count = 6, compact = false }) {
  return (
    <div className={`grid gap-6 ${compact ? "sm:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"}`}>
      {Array.from({ length: count }).map((_, index) => (
        <PackageCardSkeleton key={index} compact={compact} />
      ))}
    </div>
  );
}

export function PopularCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="aspect-[4/3] w-full rounded-none" rounded="rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DestinationCardSkeleton({ reverse = false }) {
  return (
    <div className={`mb-24 flex flex-col items-center gap-8 lg:gap-16 ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
      <Skeleton className="aspect-[4/3] w-full rounded-[2.5rem] lg:aspect-[5/4] lg:w-1/2" />
      <div className="w-full space-y-4 lg:w-1/2">
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-12 w-48 rounded-full" />
      </div>
    </div>
  );
}

export function FaqListSkeleton({ count = 5 }) {
  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200/60 bg-white p-5 shadow-sm dark:border-gray-700/60 dark:bg-gray-900"
        >
          <Skeleton className="mb-3 h-5 w-4/5" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function GalleryGridSkeleton() {
  return (
    <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
      {Array.from({ length: 8 }).map((_, index) => {
        const isLarge = index === 0;
        const isWide = index === 5;
        return (
          <Skeleton
            key={index}
            className={`h-full w-full rounded-[1.5rem] ${isLarge ? "col-span-2 row-span-2" : isWide ? "col-span-2" : ""}`}
            rounded="rounded-[1.5rem]"
          />
        );
      })}
    </div>
  );
}

export function PackageDetailSkeleton() {
  return (
    <div className="container mt-2 pb-20">
      <Skeleton className="h-[40vh] w-full rounded-3xl sm:h-[55vh]" rounded="rounded-3xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-6 w-40" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" rounded="rounded-full" />
            ))}
          </div>
          <Skeleton className="h-6 w-32" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" rounded="rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" rounded="rounded-2xl" />
      </div>
    </div>
  );
}
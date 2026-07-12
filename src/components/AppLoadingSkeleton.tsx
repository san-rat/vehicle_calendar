import { Panel } from "@/components/ui";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-block rounded-[14px] ${className}`}
    />
  );
}

export function AppLoadingSkeleton({
  columns = 3,
  rows = 4,
}: {
  columns?: 2 | 3;
  rows?: 3 | 4 | 5;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-10 w-full max-w-xl" />
        <SkeletonBlock className="h-5 w-full max-w-3xl" />
      </div>

      <div
        className={
          columns === 2
            ? "grid gap-4 md:grid-cols-2"
            : "grid gap-4 md:grid-cols-3"
        }
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Panel className="space-y-4" key={index} variant="elevated">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-8 w-28" />
            <SkeletonBlock className="h-3 w-full" />
          </Panel>
        ))}
      </div>

      <Panel className="space-y-4" variant="elevated">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            className="grid gap-3 rounded-[18px] border border-[var(--border-subtle)] p-4 md:grid-cols-[1.2fr_0.8fr_0.6fr]"
            key={index}
          >
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-3/4" />
            <SkeletonBlock className="h-5 w-28" />
          </div>
        ))}
      </Panel>
    </div>
  );
}

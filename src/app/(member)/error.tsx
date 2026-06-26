"use client";

import { RouteErrorState } from "@/components/RouteErrorState";

export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      description="The fleet workspace could not finish loading. Retry once, and contact an admin if it keeps happening."
      error={error}
      reset={reset}
      title="Workspace interrupted"
    />
  );
}

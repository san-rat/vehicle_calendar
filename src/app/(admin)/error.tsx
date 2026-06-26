"use client";

import { RouteErrorState } from "@/components/RouteErrorState";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      description="The admin workspace could not finish loading. Retry once, and check the audit log if the problem repeats."
      error={error}
      reset={reset}
      title="Admin workspace interrupted"
    />
  );
}

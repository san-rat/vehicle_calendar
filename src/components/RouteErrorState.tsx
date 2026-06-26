"use client";

import { useEffect } from "react";
import { Button, EmptyState, Notice } from "@/components/ui";
import { EmptyStateIcon } from "@/components/ui/icons";

export function RouteErrorState({
  description = "The page could not finish loading. Retry once, and contact an admin if it keeps happening.",
  error,
  reset,
  title = "Something went wrong",
}: {
  description?: string;
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <Notice tone="danger">
        {error.digest ? `Error reference: ${error.digest}` : description}
      </Notice>
      <EmptyState
        action={
          <Button onClick={reset} tone="primary" type="button">
            Try again
          </Button>
        }
        description={description}
        icon={EmptyStateIcon}
        title={title}
      />
    </div>
  );
}

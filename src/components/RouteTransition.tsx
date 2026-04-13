"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type RouteTransitionProps = {
  children: ReactNode;
  className?: string;
  transitionKey?: string;
};

function joinClasses(...classes: Array<string | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RouteTransition({
  children,
  className,
  transitionKey,
}: RouteTransitionProps) {
  const pathname = usePathname();
  const resolvedKey = transitionKey ?? pathname ?? "fleettime-route";

  return (
    <div className={joinClasses("page-enter", className)} key={resolvedKey}>
      {children}
    </div>
  );
}

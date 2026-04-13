"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ClipboardTextProps = {
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
  copiedLabel?: string;
  text: string;
};

function joinClasses(...classes: Array<string | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ClipboardText({
  ariaLabel,
  children,
  className,
  copiedLabel = "Copied",
  text,
}: ClipboardTextProps) {
  const [status, setStatus] = useState<"copied" | "failed" | "idle">("idle");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const queueReset = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setStatus("idle");
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    queueReset();
  };

  const tooltipLabel =
    status === "failed" ? "Copy failed" : status === "copied" ? copiedLabel : "Copy";

  return (
    <button
      aria-label={ariaLabel ?? `Copy ${text}`}
      className={joinClasses(
        "group relative inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors [@media(hover:hover)]:hover:bg-gray-100 active:scale-[0.98]",
        className
      )}
      onClick={handleCopy}
      type="button"
    >
      {children ?? <span>{text}</span>}
      <span
        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--text)] px-2 py-1 text-[11px] font-medium text-white shadow-sm transition-all duration-200 ${
          status === "idle"
            ? "translate-y-1 opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
            : "translate-y-0 opacity-100"
        }`}
      >
        {tooltipLabel}
      </span>
    </button>
  );
}

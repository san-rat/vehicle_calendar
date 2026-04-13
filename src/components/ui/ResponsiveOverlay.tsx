"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { buttonClassName } from "./index";
import { CloseIcon } from "./icons";

type ResponsiveOverlayProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

function joinClasses(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function ResponsiveOverlay({
  children,
  description,
  onClose,
  open,
  title,
}: ResponsiveOverlayProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-[var(--text)]/40 px-2 pt-8 backdrop-blur-xl sm:px-4 md:items-center md:px-6 md:py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={joinClasses(
          "flex w-full max-w-3xl flex-col overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-md shadow-slate-900/10",
          "max-h-[88vh] rounded-t-[1.75rem] md:max-h-[82vh] md:rounded-3xl"
        )}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <div className="px-5 pt-3 md:hidden">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-[var(--border)]" />
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/80 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h2
              className="text-xl font-semibold tracking-[-0.02em] text-[var(--text)]"
              id={titleId}
            >
              {title}
            </h2>
            {description ? (
              <p
                className="mt-1 text-sm leading-6 text-[var(--muted)]"
                id={descriptionId}
              >
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label={`Close ${title}`}
            className={buttonClassName({
              className: "mt-0.5 h-11 w-11 shrink-0 p-0",
              tone: "ghost",
            })}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-5 md:px-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

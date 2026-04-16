"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { buttonClassName } from "./index";
import { CloseIcon } from "./icons";

type ResponsiveOverlayProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
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
  footer,
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
      className="fixed inset-0 z-[140] flex items-end justify-center bg-[var(--text-primary)]/24 px-0 pt-4 backdrop-blur-lg md:items-center md:bg-[var(--text-primary)]/28 md:px-6 md:py-8 md:backdrop-blur-xl"
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
          "flex w-full max-w-[980px] flex-col overflow-hidden border border-white/80 bg-[var(--bg-surface)] shadow-[0_28px_80px_rgba(15,23,42,0.2)]",
          "max-h-[92dvh] rounded-t-[1.5rem] md:max-h-[82vh] md:rounded-3xl"
        )}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <div className="px-4 pt-3 md:hidden">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-[var(--border-strong)]/70" />
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(246,251,250,0.96),rgba(255,255,255,0.92))] px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]"
                id={titleId}
              >
                {title}
              </h2>
              {description ? (
                <p
                  className="mt-1 text-sm leading-6 text-[var(--text-secondary)]"
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
        </div>

        <div className="overflow-y-auto px-4 pb-5 pt-4 md:px-6 md:pb-6">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-4 md:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

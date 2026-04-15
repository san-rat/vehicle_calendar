"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangleIcon, CheckCircleIcon } from "@/components/ui/icons";

const TOAST_DURATION_MS = 4000;
const TOAST_EXIT_MS = 220;

type ToastType = "error" | "success";

type ToastRecord = {
  id: number;
  message: string;
  type: ToastType;
};

function ToastCard({
  id,
  message,
  onRemove,
  type,
}: ToastRecord & {
  onRemove: (id: number) => void;
}) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState("100%");
  const isError = type === "error";
  const Icon = isError ? AlertTriangleIcon : CheckCircleIcon;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
      setProgressWidth("0%");
    });
    const leaveTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, TOAST_DURATION_MS);
    const removeTimer = window.setTimeout(() => {
      onRemove(id);
    }, TOAST_DURATION_MS + TOAST_EXIT_MS);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, [id, onRemove]);

  return (
    <div
      className={`pointer-events-auto relative mt-2 flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-[22px] border px-4 py-4 shadow-[0_18px_42px_rgba(15,23,42,0.14)] transition-all duration-300 ease-out ${
        isError
          ? "border-[var(--danger)]/18 bg-[var(--danger-soft)]"
          : "border-white/80 bg-[var(--bg-surface)]"
      } ${
        isVisible && !isLeaving
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0"
      }`}
      role={isError ? "alert" : "status"}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isError
            ? "bg-[var(--danger)]/12 text-[var(--danger)]"
            : "bg-[var(--success)]/12 text-[var(--success)]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="pr-2 text-sm font-medium text-[var(--text-primary)]">
        {message}
      </p>
      <div
        className={`absolute bottom-0 left-0 h-1 ${
          isError ? "bg-[var(--danger)]" : "bg-[var(--success)]"
        }`}
        style={{
          transition: `width ${TOAST_DURATION_MS}ms linear`,
          width: progressWidth,
        }}
      />
    </div>
  );
}

export function ToastViewport() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextToastIdRef = useRef(1);
  const removeToast = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!pathname || pathname === "/login") {
      return;
    }

    const params = new URLSearchParams(searchKey);
    const errorMessage = params.get("error");
    const successMessage = params.get("success");
    const message = errorMessage ?? successMessage;

    if (!message) {
      return;
    }

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id: nextToastIdRef.current++,
        message,
        type: errorMessage ? "error" : "success",
      },
    ]);

    params.delete("error");
    params.delete("success");

    const nextQuery = params.toString();

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }, [pathname, router, searchKey]);

  return (
    <div
      aria-atomic="true"
      aria-live="assertive"
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center px-4 pb-6 sm:pb-8"
    >
      {toasts.map((toast) => (
        <ToastCard
          id={toast.id}
          key={toast.id}
          message={toast.message}
          onRemove={removeToast}
          type={toast.type}
        />
      ))}
    </div>
  );
}

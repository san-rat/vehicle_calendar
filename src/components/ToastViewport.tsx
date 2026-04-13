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
      className={`relative mt-2 flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl px-4 py-4 shadow-lg ring-1 transition-all duration-300 ease-out pointer-events-auto ${
        isError
          ? "bg-red-50 ring-red-900/10"
          : "bg-white ring-black/5"
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
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="pr-2 text-sm font-medium text-[var(--text)]">{message}</p>
      <div
        className={`absolute bottom-0 left-0 h-1 ${
          isError ? "bg-red-500" : "bg-green-500"
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

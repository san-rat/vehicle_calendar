"use client";

import Link from "next/link";
import { type AppUser } from "@/lib/auth/user";
import { Button, ButtonLink, buttonClassName } from "@/components/ui";
import {
  CloseIcon,
  FleetIcon,
  LogIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type TopBarProps = {
  currentUser: Pick<AppUser, "name" | "role">;
  showAdminActions?: boolean;
};

type MobileNavDrawerProps = {
  currentUser: Pick<AppUser, "name" | "role">;
  onClose: () => void;
  open: boolean;
  showAdminActions: boolean;
};

function MobileNavDrawer({
  currentUser,
  onClose,
  open,
  showAdminActions,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[130] bg-[var(--text)]/34 backdrop-blur-md sm:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex h-full w-[min(320px,calc(100%-1rem))] flex-col border-r border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-md shadow-slate-900/10"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <Link
            className="inline-flex min-h-11 items-center gap-3 rounded-xl px-1 text-lg font-semibold tracking-[-0.02em] text-[var(--text)]"
            href="/vehicles"
            onClick={onClose}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--primary)]/12 bg-white/80 text-[var(--primary)] shadow-sm shadow-blue-100/40">
              <FleetIcon className="h-5 w-5" />
            </span>
            FleetTime
          </Link>

          <button
            aria-label="Close navigation menu"
            className={buttonClassName({
              className: "h-11 w-11 p-0",
              tone: "ghost",
            })}
            onClick={onClose}
            type="button"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--muted)]">
          <UserIcon className="h-4 w-4" />
          <span className="truncate">{currentUser.name}</span>
        </div>

        <nav className="mt-4 flex flex-col gap-2">
          <Link
            className={buttonClassName({
              className: "justify-start",
              tone: "ghost",
            })}
            href="/vehicles"
            onClick={onClose}
          >
            <FleetIcon className="h-4 w-4" />
            Vehicles
          </Link>
          <Link
            className={buttonClassName({
              className: "justify-start",
              tone: "ghost",
            })}
            href="/log"
            onClick={onClose}
          >
            <LogIcon className="h-4 w-4" />
            Log
          </Link>
          {showAdminActions ? (
            <Link
              className={buttonClassName({
                className: "justify-start",
                tone: "ghost",
              })}
              href="/admin/settings"
              onClick={onClose}
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
          ) : null}
        </nav>

        <form action="/auth/logout" className="mt-auto border-t border-[var(--border)] pt-4" method="post">
          <Button className="w-full justify-start bg-white/90" size="sm" tone="danger" type="submit">
            <LogoutIcon className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function TopBar({
  currentUser,
  showAdminActions = false,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)]/60 bg-[var(--bg)]/95 shadow-sm shadow-slate-200/30 transition-colors duration-300 supports-[backdrop-filter]:bg-[var(--bg)]/75 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="app-container py-3">
        <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center sm:hidden">
          <button
            aria-label="Open navigation menu"
            className={buttonClassName({
              className: "h-11 w-11 p-0",
              tone: "ghost",
            })}
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link
            className="mx-auto inline-flex min-h-11 items-center gap-3 rounded-xl px-1 text-lg font-semibold tracking-[-0.02em] text-[var(--text)]"
            href="/vehicles"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--primary)]/12 bg-white/80 text-[var(--primary)] shadow-sm shadow-blue-100/40">
              <FleetIcon className="h-5 w-5" />
            </span>
            FleetTime
          </Link>

          <span aria-hidden="true" className="block h-11 w-11" />
        </div>

        <div className="hidden min-h-16 items-center justify-between gap-3 sm:flex">
          <Link
            href="/vehicles"
            className="inline-flex min-h-11 items-center gap-3 rounded-xl px-1 text-lg font-semibold tracking-[-0.02em] text-[var(--text)] transition [@media(hover:hover)]:hover:text-[var(--primary)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--primary)]/12 bg-white/80 text-[var(--primary)] shadow-sm shadow-blue-100/40">
              <FleetIcon className="h-5 w-5" />
            </span>
            <span>FleetTime</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)]/80 bg-white/70 px-3 py-2 text-sm text-[var(--muted)] backdrop-blur-sm">
              <UserIcon className="h-4 w-4" />
              <span className="max-w-36 truncate sm:max-w-48">
                {currentUser.name}
              </span>
            </span>
            <ButtonLink href="/log" size="sm" tone="ghost">
              <LogIcon className="h-4 w-4" />
              Log
            </ButtonLink>
            {showAdminActions ? (
              <ButtonLink href="/admin/settings" size="sm" tone="ghost">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </ButtonLink>
            ) : null}
            <form action="/auth/logout" method="post">
              <Button
                className="bg-white/90"
                size="sm"
                tone="danger"
                type="submit"
              >
                <LogoutIcon className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>

      <MobileNavDrawer
        currentUser={currentUser}
        onClose={() => setIsMenuOpen(false)}
        open={isMenuOpen}
        showAdminActions={showAdminActions}
      />
    </header>
  );
}

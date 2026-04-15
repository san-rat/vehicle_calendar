"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { type AppUser } from "@/lib/auth/user";
import { Button, buttonClassName } from "@/components/ui";
import {
  CalendarIcon,
  CloseIcon,
  LogIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";

type TopBarProps = {
  currentUser: Pick<AppUser, "name" | "role">;
  showAdminActions?: boolean;
};

type NavItem = {
  href: string;
  icon: typeof CalendarIcon;
  label: string;
};

type MobileNavDrawerProps = {
  adminItems: NavItem[];
  currentUser: Pick<AppUser, "name" | "role">;
  navItems: NavItem[];
  onClose: () => void;
  open: boolean;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getRoleLabel(role: AppUser["role"]) {
  return role === "super_admin" ? "Super admin" : "Member";
}

function useIsActivePath() {
  const pathname = usePathname();

  return (href: string) => {
    if (!pathname) {
      return false;
    }

    if (href === "/vehicles") {
      return pathname === "/vehicles" || pathname.startsWith("/vehicles/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

function DesktopNavLink({ href, icon: Icon, label }: NavItem) {
  const isActive = useIsActivePath()(href);

  return (
    <Link
      className={joinClasses(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-[var(--brand-100)] text-[var(--brand-600)] shadow-[inset_0_0_0_1px_rgba(17,122,108,0.14)]"
          : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]"
      )}
      href={href}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  onClose,
}: NavItem & { onClose: () => void }) {
  const isActive = useIsActivePath()(href);

  return (
    <Link
      className={joinClasses(
        "inline-flex min-h-12 items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-[var(--brand-100)] text-[var(--brand-600)] shadow-[inset_0_0_0_1px_rgba(17,122,108,0.14)]"
          : "bg-[var(--bg-surface-tint)] text-[var(--text-primary)] hover:bg-white"
      )}
      href={href}
      onClick={onClose}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MobileNavDrawer({
  adminItems,
  currentUser,
  navItems,
  onClose,
  open,
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
      className="fixed inset-0 z-[130] bg-[var(--text-primary)]/28 backdrop-blur-xl sm:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex h-full w-[min(348px,calc(100%-1rem))] flex-col border-r border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,251,250,0.95))] px-4 py-4 shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between gap-3 pb-5">
          <Link
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-[1.35rem] font-bold tracking-tight text-[var(--text-primary)] transition-all hover:opacity-80"
            href="/vehicles"
            onClick={onClose}
          >
            <span className="mr-[2px] text-[var(--brand-500)]">Fleet</span>Time
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

        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/92 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
              <UserIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {currentUser.name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {getRoleLabel(currentUser.role)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Workspace
          </p>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <MobileNavLink key={item.href} onClose={onClose} {...item} />
            ))}
          </nav>
        </div>

        {adminItems.length > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Admin
            </p>
            <nav className="flex flex-col gap-2">
              {adminItems.map((item) => (
                <MobileNavLink key={item.href} onClose={onClose} {...item} />
              ))}
            </nav>
          </div>
        ) : null}

        <form
          action="/auth/logout"
          className="mt-auto border-t border-[var(--border-subtle)] pt-4"
          method="post"
        >
          <Button className="w-full justify-start" size="sm" tone="danger" type="submit">
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
  const isActive = useIsActivePath();

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: "/vehicles", icon: CalendarIcon, label: "Vehicles" },
      { href: "/log", icon: LogIcon, label: "Log" },
    ],
    []
  );

  const adminItems = useMemo<NavItem[]>(
    () =>
      showAdminActions
        ? [
            { href: "/admin/settings", icon: SettingsIcon, label: "Settings" },
            { href: "/admin/requests", icon: LogIcon, label: "Requests" },
          ]
        : [],
    [showAdminActions]
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-[rgba(243,245,247,0.86)] backdrop-blur-xl shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="app-container">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-4 py-3 sm:min-h-20">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation menu"
              className={buttonClassName({
                className: "h-11 w-11 p-0 sm:hidden",
                tone: "ghost",
              })}
              onClick={() => setIsMenuOpen(true)}
              type="button"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <Link
              className="inline-flex items-center rounded-xl px-2 text-[1.45rem] font-bold tracking-[-0.03em] text-[var(--text-primary)] transition-all hover:text-[var(--brand-600)]"
              href="/vehicles"
            >
              <span className="mr-[2px] text-[var(--brand-500)]">Fleet</span>Time
            </Link>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {navItems.map((item) => (
              <DesktopNavLink key={item.href} {...item} />
            ))}
            {showAdminActions ? (
              <DesktopNavLink
                href="/admin/settings"
                icon={SettingsIcon}
                label="Settings"
              />
            ) : null}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="rounded-full border border-[var(--border-subtle)] bg-white/88 px-4 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2">
                <span
                  className={joinClasses(
                    "h-2.5 w-2.5 rounded-full",
                    currentUser.role === "super_admin"
                      ? "bg-[var(--brand-500)]"
                      : "bg-[var(--info)]"
                  )}
                />
                <div className="min-w-0">
                  <p className="max-w-44 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {getRoleLabel(currentUser.role)}
                  </p>
                </div>
              </div>
            </div>

            <form action="/auth/logout" method="post">
              <Button className="bg-white/90" size="sm" tone="danger" type="submit">
                <LogoutIcon className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>

          <Link
            aria-current={isActive("/log") ? "page" : undefined}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white/90 text-[var(--text-secondary)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all hover:text-[var(--text-primary)] sm:hidden"
            href="/log"
          >
            <LogIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <MobileNavDrawer
        adminItems={adminItems}
        currentUser={currentUser}
        navItems={navItems}
        onClose={() => setIsMenuOpen(false)}
        open={isMenuOpen}
      />
    </header>
  );
}

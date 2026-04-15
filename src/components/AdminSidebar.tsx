"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Panel } from "@/components/ui";
import {
  CalendarIcon,
  LogIcon,
  ManageIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";

type SidebarItem = {
  description: string;
  href: string;
  icon: typeof CalendarIcon;
  label: string;
};

const sidebarItems: SidebarItem[] = [
  {
    href: "/admin/settings",
    icon: SettingsIcon,
    label: "Overview",
    description: "Workspace summary.",
  },
  {
    href: "/admin/requests",
    icon: LogIcon,
    label: "Requests",
    description: "Review pending requests.",
  },
  {
    href: "/admin/vehicles",
    icon: ManageIcon,
    label: "Vehicles",
    description: "Manage the fleet.",
  },
  {
    href: "/admin/privileges",
    icon: SettingsIcon,
    label: "Privileges",
    description: "Set booking policy.",
  },
  {
    href: "/admin/members",
    icon: UserIcon,
    label: "Members",
    description: "Manage access.",
  },
];

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Panel className="overflow-hidden p-4" variant="elevated">
      <div className="border-b border-[var(--border-subtle)] px-2 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-600)]">
          Admin
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          Operations
        </h2>
      </div>

      <nav className="mt-4 flex flex-col gap-2" aria-label="Admin navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              className={joinClasses(
                "rounded-[20px] border px-4 py-3.5 transition-all duration-200",
                isActive
                  ? "border-[var(--brand-500)]/16 bg-[var(--brand-100)]/80 shadow-[0_12px_28px_rgba(17,122,108,0.12)]"
                  : "border-transparent bg-[var(--bg-surface-tint)] hover:border-[var(--border-subtle)] hover:bg-white"
              )}
              href={item.href}
              key={item.href}
            >
              <div className="flex items-start gap-3">
                <span
                  className={joinClasses(
                    "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl",
                    isActive
                      ? "bg-white text-[var(--brand-600)]"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p
                    className={joinClasses(
                      "text-sm font-semibold",
                      isActive
                        ? "text-[var(--brand-600)]"
                        : "text-[var(--text-primary)]"
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm leading-6 text-[var(--text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </Panel>
  );
}

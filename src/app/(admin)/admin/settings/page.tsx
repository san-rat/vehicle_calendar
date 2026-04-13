import Link from "next/link";
import { Badge, PageHeader, interactiveCardClassName } from "@/components/ui";
import {
  FleetIcon,
  LogIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";

const settingsLinks = [
  {
    description: "Review requested bookings and identify conflicts.",
    href: "/admin/requests",
    icon: LogIcon,
    title: "Requests",
  },
  {
    description: "Add, edit, deactivate, or safely delete fleet vehicles.",
    href: "/admin/vehicles",
    icon: FleetIcon,
    title: "Vehicles",
  },
  {
    description: "Manage global booking limits and approval rules.",
    href: "/admin/privileges",
    icon: SettingsIcon,
    title: "Privileges",
  },
  {
    description: "Create members, reset passwords, and manage roles.",
    href: "/admin/members",
    icon: UserIcon,
    title: "Members",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Choose the admin area you want to manage."
        eyebrow="Settings"
        title="Admin Settings"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {settingsLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className={interactiveCardClassName()}
              href={item.href}
              key={item.href}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Icon className="h-6 w-6" />
                </span>
                <Badge tone="neutral">Open</Badge>
              </div>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {item.description}
              </p>
              <span className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary)]">
                Manage
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

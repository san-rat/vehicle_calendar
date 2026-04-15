import Link from "next/link";
import { PageHeader, interactiveCardClassName } from "@/components/ui";
import {
  ManageIcon,
  LogIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";

const settingsLinks = [
  {
    href: "/admin/requests",
    icon: LogIcon,
    title: "Requests",
  },
  {
    href: "/admin/vehicles",
    icon: ManageIcon,
    title: "Vehicles",
  },
  {
    href: "/admin/privileges",
    icon: SettingsIcon,
    title: "Privileges",
  },
  {
    href: "/admin/members",
    icon: UserIcon,
    title: "Members",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Admin Settings" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {settingsLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className={interactiveCardClassName("overflow-hidden")}
              href={item.href}
              key={item.href}
            >
              <div className="mb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <h2 className="text-lg font-semibold">{item.title}</h2>
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

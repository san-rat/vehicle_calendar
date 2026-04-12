import Link from "next/link";

const settingsLinks = [
  {
    description: "Review requested bookings and identify conflicts.",
    href: "/admin/requests",
    title: "Requests",
  },
  {
    description: "Add, edit, deactivate, or safely delete fleet vehicles.",
    href: "/admin/vehicles",
    title: "Vehicles",
  },
  {
    description: "Manage global booking limits and approval rules.",
    href: "/admin/privileges",
    title: "Privileges",
  },
  {
    description: "Create members, reset passwords, and manage roles.",
    href: "/admin/members",
    title: "Members",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Choose the admin area you want to manage.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {settingsLinks.map((item) => (
          <Link
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]"
            href={item.href}
            key={item.href}
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

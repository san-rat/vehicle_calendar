import Link from "next/link";
import {
  Badge,
  PageHeader,
  StatCard,
  interactiveCardClassName,
} from "@/components/ui";
import {
  CalendarIcon,
  LogIcon,
  ManageIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";
import { requireAdminAppUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SettingsCard = {
  description: string;
  detail: string;
  href: string;
  icon: typeof ManageIcon;
  metadata: string;
  title: string;
  tone: "info" | "primary" | "success" | "warning";
};

async function getSettingsSummary() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const [
    { count: requestCount, error: requestError },
    { count: vehicleCount, error: vehicleError },
    { count: memberCount, error: memberError },
    { data: privilegeConfig, error: privilegeError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "requested"),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("privilege_config")
      .select("allow_booking_freedom, max_days_in_future, require_reason")
      .maybeSingle<{
        allow_booking_freedom: boolean;
        max_days_in_future: number;
        require_reason: boolean;
      }>(),
  ]);

  if (requestError || vehicleError || memberError || privilegeError || !privilegeConfig) {
    throw new Error("Unable to load admin settings summary.");
  }

  return {
    activeMemberCount: memberCount ?? 0,
    activeVehicleCount: vehicleCount ?? 0,
    pendingRequestCount: requestCount ?? 0,
    privilegeConfig,
  };
}

export default async function AdminSettingsPage() {
  const {
    activeMemberCount,
    activeVehicleCount,
    pendingRequestCount,
    privilegeConfig,
  } = await getSettingsSummary();

  const settingsCards: SettingsCard[] = [
    {
      href: "/admin/requests",
      icon: LogIcon,
      title: "Requests",
      description: "Review pending requests.",
      metadata: `${pendingRequestCount} pending approvals`,
      detail:
        pendingRequestCount > 0
          ? "Needs review."
          : "Queue clear.",
      tone: pendingRequestCount > 0 ? "warning" : "success",
    },
    {
      href: "/admin/vehicles",
      icon: ManageIcon,
      title: "Vehicles",
      description: "Manage fleet records.",
      metadata: `${activeVehicleCount} active vehicles`,
      detail: "Edit status and inventory.",
      tone: "primary",
    },
    {
      href: "/admin/privileges",
      icon: SettingsIcon,
      title: "Privileges",
      description: "Set booking policy.",
      metadata: privilegeConfig.allow_booking_freedom
        ? "Auto-confirm enabled"
        : "Approval required",
      detail: `${privilegeConfig.max_days_in_future}-day window · ${
        privilegeConfig.require_reason ? "reason required" : "reason optional"
      }`,
      tone: "info",
    },
    {
      href: "/admin/members",
      icon: UserIcon,
      title: "Members",
      description: "Manage access and roles.",
      metadata: `${activeMemberCount} active accounts`,
      detail: "Reset passwords and status.",
      tone: "primary",
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        action={<Badge tone="primary">Admin controls</Badge>}
        description="Approvals, policy, fleet, and access."
        eyebrow="Settings"
        title="Admin Settings"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={LogIcon}
          label="Pending"
          tone={pendingRequestCount > 0 ? "warning" : "success"}
          value={pendingRequestCount}
        />
        <StatCard
          icon={CalendarIcon}
          label="Active vehicles"
          tone="primary"
          value={activeVehicleCount}
        />
        <StatCard
          icon={UserIcon}
          label="Active members"
          tone="info"
          value={activeMemberCount}
        />
        <StatCard
          icon={SettingsIcon}
          label="Policy"
          tone="neutral"
          value={privilegeConfig.allow_booking_freedom ? "Auto" : "Approval"}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className={interactiveCardClassName(
                "overflow-hidden border-white/75 p-0"
              )}
              href={item.href}
              key={item.href}
            >
              <div className="border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(246,251,250,0.96),rgba(255,255,255,0.92))] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--brand-100)] text-[var(--brand-600)]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                        {item.title}
                      </h2>
                      <p className="mt-1.5 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Badge tone={item.tone}>{item.metadata}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {item.detail}
                </p>
                <span className="rounded-full bg-[var(--brand-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-600)]">
                  Open
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

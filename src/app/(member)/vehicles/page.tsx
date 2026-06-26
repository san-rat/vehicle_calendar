import Link from "next/link";
import {
  Badge,
  ButtonLink,
  CompactMetric,
  EmptyState,
  PageHeader,
  Panel,
  interactiveCardClassName,
} from "@/components/ui";
import {
  CalendarIcon,
  EmptyStateIcon,
  LogIcon,
  ManageIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireCurrentAppUser } from "@/lib/auth/user";
import {
  addDays,
  getBusinessHour,
  getBusinessToday,
  getCalendarMonth,
  parseIsoDate,
} from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type VehicleRecord = {
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
};

type BookingRecord = {
  date: string;
  id: string;
  status: "confirmed" | "requested";
  vehicle_id: string;
};

type DashboardVehicle = VehicleRecord & {
  confirmedThisMonth: number;
  confirmedThisWeek: number;
  isAvailableToday: boolean;
  nextBooking: BookingRecord | null;
  requestedCount: number;
};

function getGreetingLabel(hour: number, name: string) {
  if (hour < 12) {
    return `Good morning, ${name}`;
  }

  if (hour < 17) {
    return `Good afternoon, ${name}`;
  }

  return `Good evening, ${name}`;
}

function formatDateLabel(value: string) {
  const parts = parseIsoDate(value);

  if (!parts) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

async function getVehicleDashboardData() {
  const currentUser = await requireCurrentAppUser();
  const today = getBusinessToday();
  const thisWeekEnd = addDays(today, 6);
  const futureWindowEnd = addDays(today, 30);
  const currentMonth = getCalendarMonth(today.slice(0, 7));

  if (!currentMonth) {
    throw new Error("Unable to resolve the current month.");
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: vehicles, error: vehiclesError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("id, name, type, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("bookings")
        .select("id, vehicle_id, date, status")
        .gte("date", currentMonth.startDate)
        .lte("date", futureWindowEnd)
        .in("status", ["confirmed", "requested"])
        .order("date", { ascending: true }),
    ]);

  if (vehiclesError) {
    throw new Error("Unable to load vehicles.");
  }

  if (bookingsError) {
    throw new Error("Unable to load booking summaries.");
  }

  let activeMemberCount: number | null = null;
  let pendingRequestCount: number | null = null;

  if (currentUser.role === "super_admin") {
    const [
      { count: membersCount, error: membersError },
      { count: requestsCount, error: requestsError },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "requested")
        .gte("date", today),
    ]);

    if (membersError) {
      throw new Error("Unable to load member summaries.");
    }

    if (requestsError) {
      throw new Error("Unable to load request summaries.");
    }

    activeMemberCount = membersCount ?? 0;
    pendingRequestCount = requestsCount ?? 0;
  }

  const bookingsByVehicle = new Map<string, BookingRecord[]>();

  for (const booking of (bookings ?? []) as BookingRecord[]) {
    const vehicleBookings = bookingsByVehicle.get(booking.vehicle_id) ?? [];
    vehicleBookings.push(booking);
    bookingsByVehicle.set(booking.vehicle_id, vehicleBookings);
  }

  const activeVehicles: DashboardVehicle[] = ((vehicles ?? []) as VehicleRecord[]).map((vehicle) => {
    const vehicleBookings = bookingsByVehicle.get(vehicle.id) ?? [];
    const confirmedToday = vehicleBookings.filter(
      (booking) => booking.status === "confirmed" && booking.date === today
    );
    const upcoming = vehicleBookings.find((booking) => booking.date >= today) ?? null;
    const confirmedThisWeek = vehicleBookings.filter(
      (booking) =>
        booking.status === "confirmed" &&
        booking.date >= today &&
        booking.date <= thisWeekEnd
    ).length;
    const confirmedThisMonth = vehicleBookings.filter(
      (booking) =>
        booking.status === "confirmed" &&
        booking.date >= currentMonth.startDate &&
        booking.date <= currentMonth.endDate
    ).length;
    const requestedCount = vehicleBookings.filter(
      (booking) => booking.status === "requested" && booking.date >= today
    ).length;

    return {
      ...vehicle,
      confirmedThisMonth,
      confirmedThisWeek,
      isAvailableToday: confirmedToday.length === 0,
      nextBooking: upcoming,
      requestedCount,
    };
  });

  const availableTodayCount = activeVehicles.filter(
    (vehicle) => vehicle.isAvailableToday
  ).length;
  const confirmedTodayCount = activeVehicles.reduce(
    (sum, vehicle) => sum + (vehicle.isAvailableToday ? 0 : 1),
    0
  );
  const upcomingThisWeekCount = activeVehicles.reduce(
    (sum, vehicle) => sum + vehicle.confirmedThisWeek,
    0
  );
  const todayBookings = activeVehicles.filter(
    (vehicle) => !vehicle.isAvailableToday
  );
  const upcomingBookings = activeVehicles
    .filter((vehicle) => vehicle.nextBooking)
    .sort((first, second) =>
      (first.nextBooking?.date ?? "").localeCompare(second.nextBooking?.date ?? "")
    )
    .slice(0, 4);

  return {
    activeMemberCount,
    availableTodayCount,
    confirmedTodayCount,
    currentUser,
    pendingRequestCount,
    today,
    todayBookings,
    upcomingBookings,
    upcomingThisWeekCount,
    vehicles: activeVehicles,
  };
}

export default async function VehiclesPage() {
  const {
    activeMemberCount,
    availableTodayCount,
    confirmedTodayCount,
    currentUser,
    pendingRequestCount,
    today,
    todayBookings,
    upcomingBookings,
    upcomingThisWeekCount,
    vehicles,
  } = await getVehicleDashboardData();
  const greetingLabel = getGreetingLabel(getBusinessHour(), currentUser.name);
  const quickActions =
    currentUser.role === "super_admin"
      ? [
          { href: "/admin/requests", icon: LogIcon, label: "Requests" },
          { href: "/admin/vehicles", icon: ManageIcon, label: "Vehicles" },
          { href: "/admin/members", icon: UserIcon, label: "Members" },
          { href: "/admin/settings", icon: SettingsIcon, label: "Settings" },
        ]
      : [];

  return (
    <div className="page-stack">
      <PageHeader
        action={
          <Badge tone="primary">
            {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} ready
          </Badge>
        }
        title={greetingLabel}
      />

      {quickActions.length > 0 ? (
        <section className="grid gap-2.5 md:hidden">
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  className="flex min-h-12 items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[0_10px_22px_rgba(15,23,42,0.05)] transition-all hover:border-[var(--brand-500)]/18 hover:bg-white"
                  href={action.href}
                  key={action.href}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[var(--brand-100)] text-[var(--brand-600)]">
                    <Icon className="h-[1.125rem] w-[1.125rem]" />
                  </span>
                  {action.label}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="hidden gap-3 md:grid md:grid-cols-4">
        <CompactMetric
          label="Fleet ready"
          tone="primary"
          value={vehicles.length}
        />
        <CompactMetric
          label="Available today"
          tone="success"
          value={availableTodayCount}
        />
        <CompactMetric
          label="Trips this week"
          tone="info"
          value={upcomingThisWeekCount}
        />
        <CompactMetric
          label={currentUser.role === "super_admin" ? "Active members" : "Busy today"}
          tone="warning"
          value={
            currentUser.role === "super_admin"
              ? activeMemberCount ?? 0
              : confirmedTodayCount
          }
        />
      </section>

      {currentUser.role === "super_admin" && pendingRequestCount !== null ? (
        <Panel className="p-4 md:p-5" variant={pendingRequestCount > 0 ? "danger" : "base"}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Needs approval
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {pendingRequestCount > 0
                  ? "Review pending booking requests before they block schedules."
                  : "No booking requests are waiting for review."}
              </p>
            </div>
            <Badge tone={pendingRequestCount > 0 ? "warning" : "success"}>
              {pendingRequestCount} pending request
              {pendingRequestCount === 1 ? "" : "s"}
            </Badge>
          </div>
          {pendingRequestCount > 0 ? (
            <div className="mt-4">
              <ButtonLink href="/admin/requests" size="sm" tone="warning">
                Review requests
              </ButtonLink>
            </div>
          ) : null}
        </Panel>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel className="p-4 md:p-5" variant="elevated">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Today
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {availableTodayCount} of {vehicles.length} vehicles available
              </p>
            </div>
            <Badge tone={confirmedTodayCount > 0 ? "warning" : "success"}>
              {confirmedTodayCount} busy
            </Badge>
          </div>
          <div className="mt-4 space-y-2">
            {todayBookings.length > 0 ? (
              todayBookings.map((vehicle) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3"
                  key={vehicle.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {vehicle.name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">Booked today</p>
                  </div>
                  <ButtonLink
                    href={`/vehicles/${vehicle.id}/date/${today}`}
                    size="sm"
                    tone="secondary"
                  >
                    View day
                  </ButtonLink>
                </div>
              ))
            ) : (
              <p className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3 text-sm text-[var(--text-secondary)]">
                All active vehicles are open today.
              </p>
            )}
          </div>
        </Panel>

        <Panel className="p-4 md:p-5" variant="elevated">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Upcoming bookings
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Next scheduled vehicle activity
              </p>
            </div>
            <Badge tone="neutral">{upcomingBookings.length} shown</Badge>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((vehicle) => (
                <ButtonLink
                  className="justify-between rounded-[16px] px-3.5 py-3"
                  href={`/vehicles/${vehicle.id}/date/${vehicle.nextBooking?.date}`}
                  key={`${vehicle.id}-${vehicle.nextBooking?.id}`}
                  size="sm"
                  tone="secondary"
                >
                  <span className="min-w-0 text-left">
                    <span className="block truncate">{vehicle.name}</span>
                    <span className="block text-xs font-medium text-[var(--text-secondary)]">
                      {vehicle.nextBooking?.status === "confirmed"
                        ? "Confirmed"
                        : "Requested"}{" "}
                      · {formatDateLabel(vehicle.nextBooking?.date ?? "")}
                    </span>
                  </span>
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                </ButtonLink>
              ))
            ) : (
              <p className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3 text-sm text-[var(--text-secondary)] sm:col-span-2">
                No upcoming bookings in the current window.
              </p>
            )}
          </div>
        </Panel>
      </section>

      {vehicles.length === 0 ? (
        <EmptyState
          action={
            currentUser.role === "super_admin" ? (
              <Link
                className="inline-flex min-h-12 items-center rounded-[14px] bg-[var(--brand-500)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(17,122,108,0.22)]"
                href="/admin/vehicles"
              >
                Add a vehicle
              </Link>
            ) : null
          }
          description="No active vehicles are available yet."
          icon={EmptyStateIcon}
          title="No vehicles ready"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <article
              className={interactiveCardClassName(
                "overflow-hidden border-white/70 p-0"
              )}
              key={vehicle.id}
            >
              <div className="md:hidden">
                <div className="space-y-3 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[var(--brand-100)] text-[var(--brand-600)]">
                      <ManageIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                          {vehicle.name}
                        </h2>
                        <Badge tone={vehicle.isAvailableToday ? "success" : "warning"}>
                          {vehicle.isAvailableToday ? "Available" : "Busy today"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {getVehicleTypeLabel(vehicle.type)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Next activity
                    </p>
                    {vehicle.nextBooking ? (
                      <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                        {vehicle.nextBooking.status === "confirmed"
                          ? "Confirmed booking"
                          : "Pending request"}{" "}
                        · {formatDateLabel(vehicle.nextBooking.date)}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No upcoming activity.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] pt-3">
                    <ButtonLink
                      href={`/vehicles/${vehicle.id}/calendar`}
                      size="sm"
                      tone="secondary"
                    >
                      View schedule
                    </ButtonLink>
                    <ButtonLink
                      href={`/vehicles/${vehicle.id}/date/${today}`}
                      size="sm"
                      tone="primary"
                    >
                      Book
                    </ButtonLink>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(246,251,250,0.96),rgba(255,255,255,0.92))] px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--brand-100)] text-[var(--brand-600)]">
                        <ManageIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                          {vehicle.name}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {getVehicleTypeLabel(vehicle.type)}
                        </p>
                      </div>
                    </div>
                    <Badge tone={vehicle.isAvailableToday ? "success" : "warning"}>
                      {vehicle.isAvailableToday ? "Available" : "Busy today"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-3">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Week
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                        {vehicle.confirmedThisWeek}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-3">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Month
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                        {vehicle.confirmedThisMonth}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-3">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Requests
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                        {vehicle.requestedCount}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[var(--border-subtle)] bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Next activity
                    </p>
                    {vehicle.nextBooking ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {vehicle.nextBooking.status === "confirmed"
                              ? "Confirmed booking"
                              : "Pending request"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {formatDateLabel(vehicle.nextBooking.date)}
                          </p>
                        </div>
                        <Badge
                          tone={
                            vehicle.nextBooking.status === "confirmed"
                              ? "success"
                              : "warning"
                          }
                        >
                          {vehicle.nextBooking.status}
                        </Badge>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No upcoming activity.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                    <ButtonLink
                      href={`/vehicles/${vehicle.id}/calendar`}
                      size="sm"
                      tone="secondary"
                    >
                      View schedule
                    </ButtonLink>
                    <ButtonLink
                      href={`/vehicles/${vehicle.id}/date/${today}`}
                      size="sm"
                      tone="primary"
                    >
                      Book
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

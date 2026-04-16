import Link from "next/link";
import {
  Badge,
  EmptyState,
  PageHeader,
  StatCard,
  interactiveCardClassName,
} from "@/components/ui";
import {
  CalendarIcon,
  EmptyStateIcon,
  LogIcon,
  ManageIcon,
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

  const activeVehicles = ((vehicles ?? []) as VehicleRecord[]).map((vehicle) => {
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

  return {
    activeMemberCount,
    availableTodayCount,
    confirmedTodayCount,
    currentUser,
    pendingRequestCount,
    today,
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
    upcomingThisWeekCount,
    vehicles,
  } = await getVehicleDashboardData();
  const greetingLabel = getGreetingLabel(getBusinessHour(), currentUser.name);

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ManageIcon}
          label="Fleet ready"
          tone="primary"
          value={vehicles.length}
        />
        <StatCard
          icon={CalendarIcon}
          label="Available today"
          tone="success"
          value={availableTodayCount}
        />
        <StatCard
          icon={LogIcon}
          label="Trips this week"
          tone="info"
          value={upcomingThisWeekCount}
        />
        <StatCard
          icon={currentUser.role === "super_admin" ? UserIcon : CalendarIcon}
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
        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Approval queue
            </p>
            <Badge tone={pendingRequestCount > 0 ? "warning" : "success"}>
              {pendingRequestCount} pending request
              {pendingRequestCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      ) : null}

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
            <Link
              className={interactiveCardClassName(
                "overflow-hidden border-white/70 p-0"
              )}
              href={`/vehicles/${vehicle.id}/calendar`}
              key={vehicle.id}
            >
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

                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      View schedule
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--brand-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-600)]">
                    Open
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

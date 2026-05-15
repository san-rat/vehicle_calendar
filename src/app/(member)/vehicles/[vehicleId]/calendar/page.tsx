import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { RouteTransition } from "@/components/RouteTransition";
import {
  Badge,
  BreadcrumbNav,
  ButtonLink,
  PageHeader,
  Panel,
  StatCard,
} from "@/components/ui";
import {
  CalendarIcon,
  ClockIcon,
  LogIcon,
  ManageIcon,
} from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireCurrentAppUser } from "@/lib/auth/user";
import {
  getBusinessToday,
  isDateWithinBookingWindow,
  resolveCalendarMonth,
  type CalendarMonth,
} from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CalendarPageProps = {
  params: Promise<{ vehicleId: string }>;
  searchParams?: Promise<{ month?: string }>;
};

type VehicleRecord = {
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
};

type PrivilegeConfigRecord = {
  max_days_in_future: number;
};

type BookingRecord = {
  booking_user:
    | { color_hex: string; name: string }
    | { color_hex: string; name: string }[]
    | null;
  date: string;
  id: string;
  status: "confirmed" | "requested";
};

type BookingIndicator = {
  colorHex: string;
  id: string;
  userName: string;
};

type DateSummary = {
  confirmedIndicators: BookingIndicator[];
  requestedCount: number;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const userColorDotClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

function getBookingUser(booking: BookingRecord) {
  if (Array.isArray(booking.booking_user)) {
    return booking.booking_user[0] ?? null;
  }

  return booking.booking_user;
}

function getUserColorDotClass(colorHex: string) {
  return userColorDotClasses[colorHex.toUpperCase()] ?? "bg-[var(--brand-500)]";
}

function getBookingSummaryByDate(bookings: BookingRecord[]) {
  const summaryByDate = new Map<string, DateSummary>();

  bookings.forEach((booking) => {
    const existingSummary = summaryByDate.get(booking.date) ?? {
      confirmedIndicators: [],
      requestedCount: 0,
    };

    if (booking.status === "confirmed") {
      const user = getBookingUser(booking);

      existingSummary.confirmedIndicators.push({
        colorHex: user?.color_hex ?? "#3B82F6",
        id: booking.id,
        userName: user?.name ?? "Unknown user",
      });
    } else {
      existingSummary.requestedCount += 1;
    }

    summaryByDate.set(booking.date, existingSummary);
  });

  return summaryByDate;
}

async function getCalendarData(vehicleId: string, month: CalendarMonth) {
  await requireCurrentAppUser();

  const supabase = createSupabaseAdminClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, name, type, is_active")
    .eq("id", vehicleId)
    .eq("is_active", true)
    .maybeSingle<VehicleRecord>();

  if (vehicleError || !vehicle) {
    notFound();
  }

  const { data: config, error: configError } = await supabase
    .from("privilege_config")
    .select("max_days_in_future")
    .maybeSingle<PrivilegeConfigRecord>();

  if (configError || !config) {
    throw new Error("Privilege configuration is missing. Run the seed file.");
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, date, status, booking_user:users!bookings_user_id_fkey(name, color_hex)"
    )
    .eq("vehicle_id", vehicleId)
    .gte("date", month.startDate)
    .lte("date", month.endDate)
    .in("status", ["confirmed", "requested"])
    .order("date", { ascending: true });

  if (bookingsError) {
    throw new Error("Unable to load vehicle bookings.");
  }

  return {
    bookings: (bookings ?? []) as BookingRecord[],
    config,
    vehicle,
  };
}

export default async function VehicleCalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const { vehicleId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const today = getBusinessToday();
  const month = resolveCalendarMonth(resolvedSearchParams.month, today);

  if (!month) {
    notFound();
  }

  const { bookings, config, vehicle } = await getCalendarData(vehicleId, month);
  const summaryByDate = getBookingSummaryByDate(bookings);
  const breadcrumbs = [
    { href: "/vehicles", label: "Vehicles" },
    { label: vehicle.name },
  ];
  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;
  const requestedCount = bookings.filter(
    (booking) => booking.status === "requested"
  ).length;
  const bookableDays = month.days.filter((date) =>
    isDateWithinBookingWindow({
      date,
      maxDaysInFuture: config.max_days_in_future,
      today,
    })
  ).length;

  return (
    <>
      <AutoRefresh />
      <RouteTransition transitionKey={`calendar-${month.value}`}>
        <div className="page-stack">
          <div className="page-section">
            <BreadcrumbNav items={breadcrumbs} />
            <PageHeader
              action={
                <Badge className="w-fit" tone="primary">
                  {month.label}
                </Badge>
              }
              eyebrow="Schedule"
              meta={
                <>
                  <Badge tone="secondary">{getVehicleTypeLabel(vehicle.type)}</Badge>
                  <Badge tone="neutral">
                    Booking window: {config.max_days_in_future} days
                  </Badge>
                </>
              }
              title={vehicle.name}
            />
          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarIcon}
              label="Confirmed"
              tone="success"
              value={confirmedCount}
            />
            <StatCard
              icon={LogIcon}
              label="Requested"
              tone="warning"
              value={requestedCount}
            />
            <StatCard
              icon={ClockIcon}
              label="Bookable days"
              tone="primary"
              value={bookableDays}
            />
            <StatCard
              icon={ManageIcon}
              label="View mode"
              tone="info"
              value="Month"
            />
          </section>

          <Panel className="overflow-hidden" variant="elevated">
            <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                  {month.label}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink
                  href={`/vehicles/${vehicle.id}/calendar?month=${month.prevMonth}`}
                  size="sm"
                  tone="secondary"
                >
                  Previous
                </ButtonLink>
                <ButtonLink
                  href={`/vehicles/${vehicle.id}/calendar?month=${month.nextMonth}`}
                  size="sm"
                  tone="secondary"
                >
                  Next
                </ButtonLink>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                <span className="h-2.5 w-6 rounded-full bg-[var(--brand-500)]" />
                Confirmed occupancy
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                <span className="h-2.5 w-6 rounded-full border border-dashed border-[var(--warning)] bg-[var(--warning-soft)]" />
                Pending requests
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--brand-500)] bg-white" />
                Today
              </span>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2">
              {weekdayLabels.map((label) => (
                <div
                  className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
                  key={label}
                >
                  {label}
                </div>
              ))}

              {Array.from({ length: month.firstWeekday }, (_, index) => (
                <div aria-hidden="true" key={`blank-${index}`} />
              ))}

              {month.days.map((date) => {
                const dayNumber = Number(date.slice(-2));
                const isToday = date === today;
                const isBookable = isDateWithinBookingWindow({
                  date,
                  maxDaysInFuture: config.max_days_in_future,
                  today,
                });
                const summary = summaryByDate.get(date) ?? {
                  confirmedIndicators: [],
                  requestedCount: 0,
                };
                const visibleIndicators = summary.confirmedIndicators.slice(0, 3);
                const hiddenIndicatorCount =
                  summary.confirmedIndicators.length - visibleIndicators.length;
                const totalSignals =
                  summary.confirmedIndicators.length + summary.requestedCount;
                const cellClass = [
                  "flex min-h-[110px] flex-col rounded-[20px] border px-3 py-3 text-left transition-all duration-200 sm:min-h-[132px]",
                  isBookable
                    ? "bg-white shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:-translate-y-[2px] hover:border-[var(--brand-500)]/25 hover:shadow-[0_18px_34px_rgba(15,23,42,0.1)]"
                    : "bg-[var(--bg-surface-inset)] text-[var(--text-muted)] opacity-72",
                  isToday ? "border-[var(--brand-500)]/45" : "border-[var(--border-subtle)]",
                ].join(" ");
                const cellContent = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <span
                          className={[
                            "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                            isToday
                              ? "border-2 border-[var(--brand-500)] bg-white text-[var(--brand-600)]"
                              : "bg-[var(--bg-surface-tint)] text-[var(--text-primary)]",
                          ].join(" ")}
                        >
                          {dayNumber}
                        </span>
                        {isToday ? (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-600)]">
                            Today
                          </p>
                        ) : null}
                      </div>
                      {totalSignals > 0 ? (
                        <span className="rounded-full bg-[var(--bg-surface-tint)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                          {totalSignals}
                        </span>
                      ) : null}
                    </div>

                    {summary.confirmedIndicators.length > 0 ||
                    summary.requestedCount > 0 ? (
                      <div className="mt-auto space-y-2 pt-4">
                        {summary.confirmedIndicators.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                              Confirmed
                            </p>
                            <div className="flex gap-1.5">
                              {visibleIndicators.map((indicator) => (
                                <span
                                  aria-label={`Confirmed booking for ${indicator.userName}`}
                                  className={`h-2.5 flex-1 rounded-full ${getUserColorDotClass(
                                    indicator.colorHex
                                  )}`}
                                  key={indicator.id}
                                  title={`Confirmed booking for ${indicator.userName}`}
                                />
                              ))}
                              {hiddenIndicatorCount > 0 ? (
                                <span className="rounded-full bg-[var(--bg-surface-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                                  +{hiddenIndicatorCount}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {summary.requestedCount > 0 ? (
                          <div className="rounded-full border border-dashed border-[var(--warning)]/50 bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--warning)]">
                            {summary.requestedCount} request
                            {summary.requestedCount === 1 ? "" : "s"}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                );

                return isBookable ? (
                  <Link
                    aria-label={`Open booking page for ${date}`}
                    className={cellClass}
                    href={`/vehicles/${vehicle.id}/date/${date}`}
                    key={date}
                  >
                    {cellContent}
                  </Link>
                ) : (
                  <div aria-disabled="true" className={cellClass} key={date}>
                    {cellContent}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </RouteTransition>
    </>
  );
}

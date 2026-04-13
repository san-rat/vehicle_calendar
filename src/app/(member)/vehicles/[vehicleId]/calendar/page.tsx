import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { RouteTransition } from "@/components/RouteTransition";
import { Badge, BreadcrumbNav, ButtonLink, PageHeader, Panel } from "@/components/ui";
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
  return userColorDotClasses[colorHex.toUpperCase()] ?? "bg-[var(--primary)]";
}

function getBookingIndicatorsByDate(bookings: BookingRecord[]) {
  const indicatorsByDate = new Map<string, BookingIndicator[]>();

  bookings
    .filter((booking) => booking.status === "confirmed")
    .forEach((booking) => {
      const user = getBookingUser(booking);
      const indicators = indicatorsByDate.get(booking.date) ?? [];

      indicators.push({
        colorHex: user?.color_hex ?? "#3B82F6",
        id: booking.id,
        userName: user?.name ?? "Unknown user",
      });
      indicatorsByDate.set(booking.date, indicators);
    });

  return indicatorsByDate;
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
  const indicatorsByDate = getBookingIndicatorsByDate(bookings);
  const breadcrumbs = [
    { href: "/vehicles", label: "Vehicles" },
    { label: vehicle.name },
  ];

  return (
    <>
      <AutoRefresh />
      <RouteTransition transitionKey={`calendar-${month.value}`}>
        <div className="space-y-6">
          <div className="space-y-3">
            <BreadcrumbNav items={breadcrumbs} />
            <PageHeader
              action={
                <Badge className="w-fit" tone="neutral">
                  Booking window: {config.max_days_in_future} days
                </Badge>
              }
              description={`${getVehicleTypeLabel(
                vehicle.type
              )} calendar. Confirmed bookings appear as colored dots.`}
              title={vehicle.name}
            />
          </div>

          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <ButtonLink
                href={`/vehicles/${vehicle.id}/calendar?month=${month.prevMonth}`}
                size="sm"
                tone="secondary"
              >
                Previous
              </ButtonLink>
              <div className="text-center">
                <h2 className="text-lg font-semibold">{month.label}</h2>
                <p className="text-xs text-[var(--muted)]">
                  Requested trips do not block availability.
                </p>
              </div>
              <ButtonLink
                href={`/vehicles/${vehicle.id}/calendar?month=${month.nextMonth}`}
                size="sm"
                tone="secondary"
              >
                Next
              </ButtonLink>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekdayLabels.map((label) => (
                <div
                  className="py-2 text-center text-xs font-semibold uppercase text-[var(--muted)]"
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
                const isBookable = isDateWithinBookingWindow({
                  date,
                  maxDaysInFuture: config.max_days_in_future,
                  today,
                });
                const indicators = indicatorsByDate.get(date) ?? [];
                const visibleIndicators = indicators.slice(0, 4);
                const hiddenIndicatorCount =
                  indicators.length - visibleIndicators.length;
                const cellClass = `flex min-h-16 flex-col rounded-md border p-2 text-left sm:min-h-24 ${
                  isBookable
                    ? "cursor-pointer border-[var(--border)] bg-white transition-colors duration-200 ease-in-out [@media(hover:hover)]:hover:border-[var(--primary)] [@media(hover:hover)]:hover:bg-gray-100/50 active:bg-gray-200/50"
                    : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] opacity-60"
                }`;
                const cellContent = (
                  <>
                    <span className="text-sm font-semibold">{dayNumber}</span>
                    {visibleIndicators.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-1 pt-4">
                        {visibleIndicators.map((indicator) => (
                          <span
                            aria-label={`Confirmed booking for ${indicator.userName}`}
                            className={`h-2.5 w-2.5 rounded-full ${getUserColorDotClass(
                              indicator.colorHex
                            )}`}
                            key={indicator.id}
                            title={`Confirmed booking for ${indicator.userName}`}
                          />
                        ))}
                        {hiddenIndicatorCount > 0 ? (
                          <span className="text-xs font-semibold text-[var(--muted)]">
                            +{hiddenIndicatorCount}
                          </span>
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

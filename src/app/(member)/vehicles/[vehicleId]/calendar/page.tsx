import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  CalendarWorkspace,
  type CalendarBookingSummary,
  type CalendarDaySummary,
} from "@/components/CalendarWorkspace";
import { RouteTransition } from "@/components/RouteTransition";
import {
  Badge,
  BreadcrumbNav,
  CompactMetric,
  PageHeader,
} from "@/components/ui";
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
  end_time: string;
  id: string;
  is_all_day: boolean;
  start_time: string;
  status: "confirmed" | "requested";
};

function getBookingUser(booking: BookingRecord) {
  if (Array.isArray(booking.booking_user)) {
    return booking.booking_user[0] ?? null;
  }

  return booking.booking_user;
}

function getBookingSummaryByDate(bookings: BookingRecord[]) {
  const summaryByDate = new Map<string, CalendarBookingSummary[]>();

  bookings.forEach((booking) => {
    const user = getBookingUser(booking);
    const existingSummary = summaryByDate.get(booking.date) ?? [];

    existingSummary.push({
      colorHex: user?.color_hex ?? "#3B82F6",
      date: booking.date,
      endTime: booking.end_time,
      id: booking.id,
      isAllDay: booking.is_all_day,
      startTime: booking.start_time,
      status: booking.status,
      userName: user?.name ?? "Unknown user",
    });

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
      "id, date, start_time, end_time, is_all_day, status, booking_user:users!bookings_user_id_fkey(name, color_hex)"
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
  const calendarDays: CalendarDaySummary[] = month.days.map((date) => ({
    bookings: summaryByDate.get(date) ?? [],
    date,
    isBookable: isDateWithinBookingWindow({
      date,
      maxDaysInFuture: config.max_days_in_future,
      today,
    }),
    isToday: date === today,
  }));

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

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CompactMetric
              label="Confirmed"
              tone="success"
              value={confirmedCount}
            />
            <CompactMetric
              label="Requested"
              tone="warning"
              value={requestedCount}
            />
            <CompactMetric
              label="Bookable days"
              tone="primary"
              value={bookableDays}
            />
            <CompactMetric
              label="View mode"
              tone="info"
              value="Month"
            />
          </section>

          <CalendarWorkspace
            days={calendarDays}
            firstWeekday={month.firstWeekday}
            monthLabel={month.label}
            nextMonthHref={`/vehicles/${vehicle.id}/calendar?month=${month.nextMonth}`}
            prevMonthHref={`/vehicles/${vehicle.id}/calendar?month=${month.prevMonth}`}
            vehicleId={vehicle.id}
          />
        </div>
      </RouteTransition>
    </>
  );
}

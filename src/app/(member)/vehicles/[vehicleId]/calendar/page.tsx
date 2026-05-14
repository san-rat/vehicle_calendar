import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  type CalendarDateSummary,
  VehicleCalendarSurface,
} from "@/components/VehicleCalendarSurface";
import { RouteTransition } from "@/components/RouteTransition";
import {
  Badge,
  BreadcrumbNav,
  MobileBackHeader,
  PageHeader,
} from "@/components/ui";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireCurrentAppUser } from "@/lib/auth/user";
import { filterVisibleBookingSummaries } from "@/lib/booking/visibility";
import {
  getBusinessToday,
  isDateWithinBookingWindow,
  resolveCalendarMonth,
  type CalendarMonth,
} from "@/lib/booking/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  allow_booking_freedom: boolean;
  max_days_in_future: number;
};

type BookingRecord = {
  date: string;
  id: string;
  status: "confirmed" | "requested";
  user_id: string;
};

function getBookingSummaryByDate(bookings: BookingRecord[]) {
  return bookings.reduce<Record<string, CalendarDateSummary>>((summary, booking) => {
    const currentSummary = summary[booking.date] ?? {
      confirmedCount: 0,
      requestedCount: 0,
    };

    summary[booking.date] = {
      confirmedCount:
        currentSummary.confirmedCount + (booking.status === "confirmed" ? 1 : 0),
      requestedCount:
        currentSummary.requestedCount + (booking.status === "requested" ? 1 : 0),
    };

    return summary;
  }, {});
}

async function getCalendarData(vehicleId: string, month: CalendarMonth) {
  const currentUser = await requireCurrentAppUser();

  const supabase = await createSupabaseServerClient();
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
    .select("allow_booking_freedom, max_days_in_future")
    .maybeSingle<PrivilegeConfigRecord>();

  if (configError || !config) {
    throw new Error("Privilege configuration is missing. Run the seed file.");
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, date, status, user_id")
    .eq("vehicle_id", vehicleId)
    .gte("date", month.startDate)
    .lte("date", month.endDate)
    .in("status", ["confirmed", "requested"])
    .order("date", { ascending: true });

  if (bookingsError) {
    throw new Error("Unable to load vehicle bookings.");
  }

  return {
    bookings: filterVisibleBookingSummaries(
      (bookings ?? []) as BookingRecord[],
      currentUser
    ),
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
  const vehicleTypeLabel = getVehicleTypeLabel(vehicle.type);
  const mobileSubtitle = `${vehicleTypeLabel} · ${config.max_days_in_future}-day booking window`;

  return (
    <>
      <AutoRefresh />
      <RouteTransition transitionKey={`calendar-${month.value}`}>
        <div className="page-stack">
          <MobileBackHeader
            backHref="/vehicles"
            subtitle={mobileSubtitle}
            title={vehicle.name}
          />

          <div className="page-section hidden md:flex">
            <BreadcrumbNav
              items={[
                { href: "/vehicles", label: "Vehicles" },
                { label: vehicle.name },
              ]}
            />
            <PageHeader
              action={<Badge tone="primary">Schedule</Badge>}
              meta={
                <>
                  <Badge tone="secondary">{vehicleTypeLabel}</Badge>
                  <Badge tone="neutral">
                    {config.max_days_in_future}-day booking window
                  </Badge>
                </>
              }
              title={vehicle.name}
            />
          </div>

          <VehicleCalendarSurface
            allowBookingFreedom={config.allow_booking_freedom}
            bookableDays={bookableDays}
            confirmedCount={confirmedCount}
            maxDaysInFuture={config.max_days_in_future}
            month={month}
            requestedCount={requestedCount}
            summaryByDate={summaryByDate}
            today={today}
            vehicleId={vehicle.id}
          />
        </div>
      </RouteTransition>
    </>
  );
}

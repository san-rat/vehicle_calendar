import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  BookingWorkspace,
  type TimelineBooking,
} from "@/components/BookingWorkspace";
import { FloatingLogButton } from "@/components/FloatingLogButton";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireCurrentAppUser, type AppUser } from "@/lib/auth/user";
import {
  getBookingStatusForFreedom,
  getThirtyMinuteTimeOptions,
  type BookingStatus,
} from "@/lib/booking/bookings";
import {
  getBusinessToday,
  isDateWithinBookingWindow,
  parseIsoDate,
} from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createBooking } from "./actions";

type BookingPageProps = {
  params: Promise<{ date: string; vehicleId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
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
  require_reason: boolean;
  time_limit_minutes: number | null;
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
  reason: string | null;
  start_time: string;
  status: BookingStatus;
  user_id: string;
};

const userColorFallback = "#3B82F6";

function getBookingUser(booking: BookingRecord) {
  if (Array.isArray(booking.booking_user)) {
    return booking.booking_user[0] ?? null;
  }

  return booking.booking_user;
}

function toTimelineBooking(booking: BookingRecord): TimelineBooking {
  const user = getBookingUser(booking);

  return {
    colorHex: user?.color_hex ?? userColorFallback,
    endTime: booking.end_time,
    id: booking.id,
    isAllDay: booking.is_all_day,
    reason: booking.reason,
    startTime: booking.start_time,
    status: booking.status,
    userName: user?.name ?? "Unknown user",
  };
}

function getDateLabel(date: string) {
  const parts = parseIsoDate(date);

  if (!parts) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

async function getBookingPageData(input: {
  currentUser: AppUser;
  date: string;
  vehicleId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, name, type, is_active")
    .eq("id", input.vehicleId)
    .eq("is_active", true)
    .maybeSingle<VehicleRecord>();

  if (vehicleError || !vehicle) {
    notFound();
  }

  const { data: config, error: configError } = await supabase
    .from("privilege_config")
    .select(
      "time_limit_minutes, allow_booking_freedom, max_days_in_future, require_reason"
    )
    .maybeSingle<PrivilegeConfigRecord>();

  if (configError || !config) {
    throw new Error("Privilege configuration is missing. Run the seed file.");
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, user_id, date, start_time, end_time, is_all_day, reason, status, booking_user:users!bookings_user_id_fkey(name, color_hex)"
    )
    .eq("vehicle_id", input.vehicleId)
    .eq("date", input.date)
    .in("status", ["confirmed", "requested"])
    .order("start_time", { ascending: true });

  if (bookingsError) {
    throw new Error("Unable to load bookings.");
  }

  const visibleBookings = ((bookings ?? []) as BookingRecord[]).filter(
    (booking) =>
      booking.status === "confirmed" ||
      input.currentUser.role === "super_admin" ||
      booking.user_id === input.currentUser.id
  );

  return {
    bookings: visibleBookings.map(toTimelineBooking),
    config,
    vehicle,
  };
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const currentUser = await requireCurrentAppUser();
  const { date, vehicleId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!parseIsoDate(date)) {
    notFound();
  }

  const { bookings, config, vehicle } = await getBookingPageData({
    currentUser,
    date,
    vehicleId,
  });
  const today = getBusinessToday();
  const isInsideBookingWindow = isDateWithinBookingWindow({
    date,
    maxDaysInFuture: config.max_days_in_future,
    today,
  });
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";
  const createBookingAction = createBooking.bind(null, vehicle.id, date);
  const bookingStatus = getBookingStatusForFreedom(
    config.allow_booking_freedom
  );
  const formDisabledMessage = isInsideBookingWindow
    ? null
    : "This date is outside the allowed booking window.";

  return (
    <>
      <AutoRefresh />
      <div className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="text-sm font-semibold text-[var(--primary)]"
              href={`/vehicles/${vehicle.id}/calendar?month=${date.slice(0, 7)}`}
            >
              Calendar
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Booking</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {vehicle.name} · {getVehicleTypeLabel(vehicle.type)} ·{" "}
              {getDateLabel(date)}
            </p>
          </div>
          <span className="w-fit rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">
            {bookingStatus === "confirmed" ? "Auto-confirm" : "Requires approval"}
          </span>
        </header>

        {statusMessage ? (
          <p
            className={`rounded-md border px-4 py-3 text-sm ${
              statusTone === "error"
                ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
                : "border-[var(--success)]/30 bg-[var(--success)]/10 text-green-700"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}

        <BookingWorkspace
          allDayDisabled={config.time_limit_minutes !== null}
          bookings={bookings}
          formAction={createBookingAction}
          formDisabledMessage={formDisabledMessage}
          reasonRequired={config.require_reason}
          submitLabel={
            bookingStatus === "confirmed" ? "Book Trip" : "Request Booking"
          }
          timeLimitMinutes={config.time_limit_minutes}
          timeOptions={getThirtyMinuteTimeOptions()}
        />
      </div>
      <FloatingLogButton />
    </>
  );
}

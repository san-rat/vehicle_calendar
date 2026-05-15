import {
  Badge,
  BreadcrumbNav,
  ButtonLink,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { EmptyStateIcon, LogIcon } from "@/components/ui/icons";
import type { VehicleType } from "@/lib/admin/vehicles";
import { requireAdminAppUser } from "@/lib/auth/user";
import {
  getApprovalTimingProblem,
  getBusinessTimeMinutes,
  getConfirmedBookingConflicts,
  normalizeDbTime,
  type BookingTimeWindow,
} from "@/lib/booking/bookings";
import { getBusinessToday } from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RequestReviewList } from "@/components/admin/RequestReviewList";
import { approveBookingRequest, rejectBookingRequest } from "./actions";

type JoinedUser = {
  color_hex: string;
  is_active: boolean;
  name: string;
};

type JoinedVehicle = {
  is_active: boolean;
  name: string;
  type: VehicleType;
};

type RequestedBookingRecord = BookingTimeWindow & {
  booking_user: JoinedUser | JoinedUser[] | null;
  booking_vehicle: JoinedVehicle | JoinedVehicle[] | null;
  created_at: string;
  date: string;
  id: string;
  is_all_day: boolean;
  reason: string | null;
  user_id: string;
  vehicle_id: string;
};

type ConfirmedBookingRecord = BookingTimeWindow & {
  booking_user:
    | Pick<JoinedUser, "color_hex" | "name">
    | Pick<JoinedUser, "color_hex" | "name">[]
    | null;
  date: string;
  id: string;
  is_all_day: boolean;
  user_id: string;
  vehicle_id: string;
};

type RequestWithReviewState = RequestedBookingRecord & {
  approvalProblem: string | null;
  conflicts: ConfirmedBookingRecord[];
};

function getJoinedOne<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function compareRequests(
  first: RequestedBookingRecord,
  second: RequestedBookingRecord
) {
  const firstVehicle = getJoinedOne(first.booking_vehicle)?.name ?? "";
  const secondVehicle = getJoinedOne(second.booking_vehicle)?.name ?? "";

  return (
    first.date.localeCompare(second.date) ||
    normalizeDbTime(first.start_time).localeCompare(
      normalizeDbTime(second.start_time)
    ) ||
    firstVehicle.localeCompare(secondVehicle) ||
    first.created_at.localeCompare(second.created_at)
  );
}

async function getRequestReviewData() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const { data: requestRows, error: requestsError } = await supabase
    .from("bookings")
    .select(
      "id, user_id, vehicle_id, date, start_time, end_time, is_all_day, reason, created_at, booking_user:users!bookings_user_id_fkey(name, color_hex, is_active), booking_vehicle:vehicles!bookings_vehicle_id_fkey(name, type, is_active)"
    )
    .eq("status", "requested")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (requestsError) {
    throw new Error("Unable to load booking requests.");
  }

  const requests = ((requestRows ?? []) as RequestedBookingRecord[]).sort(
    compareRequests
  );
  const vehicleIds = Array.from(
    new Set(requests.map((request) => request.vehicle_id))
  );
  const dates = Array.from(new Set(requests.map((request) => request.date)));
  let confirmedBookings: ConfirmedBookingRecord[] = [];

  if (vehicleIds.length > 0 && dates.length > 0) {
    const { data: confirmedRows, error: confirmedError } = await supabase
      .from("bookings")
      .select(
        "id, user_id, vehicle_id, date, start_time, end_time, is_all_day, booking_user:users!bookings_user_id_fkey(name, color_hex)"
      )
      .eq("status", "confirmed")
      .in("vehicle_id", vehicleIds)
      .in("date", dates);

    if (confirmedError) {
      throw new Error("Unable to load confirmed bookings for request review.");
    }

    confirmedBookings = (confirmedRows ?? []) as ConfirmedBookingRecord[];
  }

  const today = getBusinessToday();
  const currentTimeMinutes = getBusinessTimeMinutes();
  const requestsWithReviewState: RequestWithReviewState[] = requests.map(
    (request) => {
      const sameVehicleDateConfirmed = confirmedBookings.filter(
        (booking) =>
          booking.vehicle_id === request.vehicle_id && booking.date === request.date
      );

      return {
        ...request,
        approvalProblem: getApprovalTimingProblem({
          currentTimeMinutes,
          date: request.date,
          startTime: request.start_time,
          today,
        }),
        conflicts: getConfirmedBookingConflicts(
          request,
          sameVehicleDateConfirmed
        ),
      };
    }
  );

  return requestsWithReviewState;
}

export default async function AdminRequestsPage() {
  const requests = await getRequestReviewData();
  const blockedRequests = requests.filter((request) => request.approvalProblem).length;
  const conflictRequests = requests.filter(
    (request) => request.conflicts.length > 0
  ).length;
  const readyRequests = requests.filter(
    (request) => !request.approvalProblem && request.conflicts.length === 0
  ).length;

  return (
    <div className="page-stack">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Requests" },
        ]}
      />
      <PageHeader
        action={<Badge tone="primary">Approval queue</Badge>}
        eyebrow="Admin"
        title="Booking Requests"
      />

      <section className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={LogIcon}
          label="Pending"
          tone={requests.length > 0 ? "warning" : "success"}
          value={requests.length}
        />
        <StatCard
          icon={LogIcon}
          label="Ready"
          tone="success"
          value={readyRequests}
        />
        <StatCard
          icon={LogIcon}
          label="Conflicts"
          tone="warning"
          value={conflictRequests}
        />
        <StatCard
          icon={LogIcon}
          label="Blocked"
          tone="info"
          value={blockedRequests}
        />
      </section>

      {requests.length === 0 ? (
        <EmptyState
          action={
            <ButtonLink href="/admin/privileges" tone="secondary">
              Review privilege settings
            </ButtonLink>
          }
          description="No booking requests are waiting for review."
          icon={EmptyStateIcon}
          title="No pending requests"
        />
      ) : (
        <RequestReviewList
          approveBookingRequestAction={approveBookingRequest}
          rejectBookingRequestAction={rejectBookingRequest}
          requests={requests}
        />
      )}
    </div>
  );
}

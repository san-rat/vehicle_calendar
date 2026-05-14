import type { AppUserRole } from "@/lib/auth/user";

export type VisibleBookingRecord = {
  status: "confirmed" | "requested";
  user_id: string;
};

export function canSeeBookingSummary(
  booking: VisibleBookingRecord,
  currentUser: { id: string; role: AppUserRole }
) {
  return (
    booking.status === "confirmed" ||
    currentUser.role === "super_admin" ||
    booking.user_id === currentUser.id
  );
}

export function filterVisibleBookingSummaries<T extends VisibleBookingRecord>(
  bookings: T[],
  currentUser: { id: string; role: AppUserRole }
) {
  return bookings.filter((booking) =>
    canSeeBookingSummary(booking, currentUser)
  );
}

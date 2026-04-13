import type { BookingStatus } from "@/lib/booking/bookings";

export const LOG_PAGE_SIZE = 50;
export const LOG_RETENTION_DAYS = 30;
export const LOG_TIME_ZONE = "Asia/Colombo";

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export type LogActionType =
  | "booking_requested"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_overridden"
  | "vehicle_created"
  | "vehicle_updated"
  | "vehicle_deleted"
  | "member_created"
  | "member_updated"
  | "member_deleted"
  | "member_role_changed"
  | "member_password_reset"
  | "privilege_updated";

export type LogActionTone =
  | "danger"
  | "info"
  | "primary"
  | "success"
  | "warning";

const actionLabels: Record<LogActionType, string> = {
  booking_cancelled: "Booking cancelled",
  booking_confirmed: "Booking confirmed",
  booking_overridden: "Booking overridden",
  booking_rejected: "Booking rejected",
  booking_requested: "Booking requested",
  member_created: "Member created",
  member_deleted: "Member deleted",
  member_password_reset: "Member password reset",
  member_role_changed: "Member role changed",
  member_updated: "Member updated",
  privilege_updated: "Privileges updated",
  vehicle_created: "Vehicle created",
  vehicle_deleted: "Vehicle deleted",
  vehicle_updated: "Vehicle updated",
};

const actionTones: Record<LogActionType, LogActionTone> = {
  booking_cancelled: "danger",
  booking_confirmed: "success",
  booking_overridden: "warning",
  booking_rejected: "danger",
  booking_requested: "info",
  member_created: "success",
  member_deleted: "danger",
  member_password_reset: "warning",
  member_role_changed: "warning",
  member_updated: "info",
  privilege_updated: "info",
  vehicle_created: "success",
  vehicle_deleted: "danger",
  vehicle_updated: "info",
};

const bookingActionStatuses: Partial<Record<LogActionType, BookingStatus>> = {
  booking_cancelled: "cancelled",
  booking_confirmed: "confirmed",
  booking_overridden: "overridden",
  booking_rejected: "rejected",
  booking_requested: "requested",
};

const colorHexPattern = /^#[0-9A-Fa-f]{6}$/;

const logColorDotClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

export function getLogActionLabel(actionType: string) {
  if (actionType in actionLabels) {
    return actionLabels[actionType as LogActionType];
  }

  return actionType
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getLogActionTone(actionType: string): LogActionTone {
  if (actionType in actionTones) {
    return actionTones[actionType as LogActionType];
  }

  return "primary";
}

export function getLogBookingStatus(actionType: string): BookingStatus | null {
  if (actionType in bookingActionStatuses) {
    return bookingActionStatuses[actionType as LogActionType] ?? null;
  }

  return null;
}

export function getSafeLogColor(colorHex: string | null | undefined) {
  return colorHex && colorHexPattern.test(colorHex) ? colorHex : "#3B82F6";
}

export function getLogColorDotClass(colorHex: string | null | undefined) {
  return (
    logColorDotClasses[getSafeLogColor(colorHex).toUpperCase()] ??
    "bg-[var(--primary)]"
  );
}

export function formatLogActionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "short",
      timeZone: LOG_TIME_ZONE,
      year: "numeric",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );

  return `${parts.month} ${parts.day}, ${parts.year}, ${parts.hour}:${parts.minute} ${LOG_TIME_ZONE}`;
}

export function formatRelativeLogTime(value: string, now = new Date()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absoluteDiffSeconds = Math.abs(diffSeconds);

  if (absoluteDiffSeconds < 45) {
    return "Just now";
  }

  if (absoluteDiffSeconds < 60 * 60) {
    return relativeTimeFormatter.format(
      Math.round(diffSeconds / 60),
      "minute"
    );
  }

  if (absoluteDiffSeconds < 60 * 60 * 24) {
    return relativeTimeFormatter.format(
      Math.round(diffSeconds / (60 * 60)),
      "hour"
    );
  }

  return relativeTimeFormatter.format(
    Math.round(diffSeconds / (60 * 60 * 24)),
    "day"
  );
}

export function getLogRetentionCutoffIso(
  now = new Date(),
  retentionDays = LOG_RETENTION_DAYS
) {
  return new Date(
    now.getTime() - retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();
}

export function getLogPageNumber(
  value: string | string[] | null | undefined
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number(rawValue);

  if (!rawValue || !Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

export function normalizeLogQuery(
  value: string | string[] | null | undefined
) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return "";
  }

  return rawValue.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function getLogSearchPattern(query: string) {
  const normalizedQuery = normalizeLogQuery(query);

  if (!normalizedQuery) {
    return null;
  }

  return `%${normalizedQuery.replaceAll(",", " ")}%`;
}

export function getLogPaginationWindow(
  page: number,
  pageSize = LOG_PAGE_SIZE
) {
  const safePage = Math.max(1, Math.trunc(page));
  const from = (safePage - 1) * pageSize;

  return {
    from,
    page: safePage,
    to: from + pageSize - 1,
  };
}

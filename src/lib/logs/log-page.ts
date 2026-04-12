export const LOG_PAGE_SIZE = 50;
export const LOG_RETENTION_DAYS = 30;
export const LOG_TIME_ZONE = "Asia/Colombo";

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

type NamedEntity = {
  name?: string | null;
};

type LogTargetSummaryInput = {
  actionType: string;
  bookingId?: string | null;
  snapshot?: unknown;
  targetUser?: NamedEntity | null;
  targetUserId?: string | null;
  targetVehicle?: NamedEntity | null;
  targetVehicleId?: string | null;
};

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

const colorHexPattern = /^#[0-9A-Fa-f]{6}$/;
const logColorDotClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getName(value: NamedEntity | null | undefined) {
  const name = value?.name?.trim();

  return name ? name : null;
}

function getSnapshotEntityName(snapshot: unknown) {
  if (!isRecord(snapshot)) {
    return null;
  }

  for (const key of ["after", "before", "target"]) {
    const value = snapshot[key];

    if (!isRecord(value)) {
      continue;
    }

    const name = value.name;

    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return null;
}

function formatShortId(id: string) {
  return id.slice(0, 8);
}

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

export function getLogTargetSummary(input: LogTargetSummaryInput) {
  if (input.actionType === "privilege_updated") {
    return "Booking privileges";
  }

  if (input.actionType.startsWith("member_")) {
    const memberName =
      getName(input.targetUser) ?? getSnapshotEntityName(input.snapshot);

    return `Member: ${
      memberName ?? (input.targetUserId ? "Unknown member" : "Unavailable member")
    }`;
  }

  if (input.actionType.startsWith("vehicle_")) {
    const vehicleName =
      getName(input.targetVehicle) ?? getSnapshotEntityName(input.snapshot);

    return `Vehicle: ${
      vehicleName ??
      (input.targetVehicleId ? "Unknown vehicle" : "Unavailable vehicle")
    }`;
  }

  const parts: string[] = [];
  const targetUserName = getName(input.targetUser);
  const targetVehicleName = getName(input.targetVehicle);

  if (targetUserName) {
    parts.push(`Member: ${targetUserName}`);
  } else if (input.targetUserId) {
    parts.push("Member: Unknown member");
  }

  if (targetVehicleName) {
    parts.push(`Vehicle: ${targetVehicleName}`);
  } else if (input.targetVehicleId) {
    parts.push("Vehicle: Unknown vehicle");
  }

  if (input.bookingId) {
    parts.push(`Booking: ${formatShortId(input.bookingId)}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "System action";
}

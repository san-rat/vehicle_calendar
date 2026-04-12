export type ValidPrivilegeInput = {
  allow_booking_freedom: boolean;
  max_days_in_future: number;
  require_reason: boolean;
  time_limit_minutes: number | null;
};

export type PrivilegeValidationResult =
  | { ok: true; value: ValidPrivilegeInput }
  | { error: string; ok: false };

export function parsePrivilegeBoolean(value: string | boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function parseWholeNumber(value: string) {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  return Number(trimmed);
}

export function validatePrivilegeInput(input: {
  allowBookingFreedom: string | boolean;
  maxDaysInFuture: string;
  requireReason: string | boolean;
  timeLimitMinutes: string;
}): PrivilegeValidationResult {
  const allowBookingFreedom = parsePrivilegeBoolean(input.allowBookingFreedom);
  const requireReason = parsePrivilegeBoolean(input.requireReason);
  const maxDaysInFuture = parseWholeNumber(input.maxDaysInFuture);
  const trimmedTimeLimit = input.timeLimitMinutes.trim();
  const timeLimitMinutes =
    trimmedTimeLimit === "" ? null : parseWholeNumber(trimmedTimeLimit);

  if (allowBookingFreedom === null) {
    return { error: "Choose a valid booking freedom value.", ok: false };
  }

  if (requireReason === null) {
    return { error: "Choose a valid require reason value.", ok: false };
  }

  if (maxDaysInFuture === null) {
    return { error: "Future booking window must be a whole number.", ok: false };
  }

  if (maxDaysInFuture < 0 || maxDaysInFuture > 365) {
    return {
      error: "Future booking window must be between 0 and 365 days.",
      ok: false,
    };
  }

  if (trimmedTimeLimit !== "" && timeLimitMinutes === null) {
    return { error: "Time limit must be a whole number.", ok: false };
  }

  if (
    timeLimitMinutes !== null &&
    (timeLimitMinutes < 1 || timeLimitMinutes > 1440)
  ) {
    return { error: "Time limit must be between 1 and 1440 minutes.", ok: false };
  }

  return {
    ok: true,
    value: {
      allow_booking_freedom: allowBookingFreedom,
      max_days_in_future: maxDaysInFuture,
      require_reason: requireReason,
      time_limit_minutes: timeLimitMinutes,
    },
  };
}

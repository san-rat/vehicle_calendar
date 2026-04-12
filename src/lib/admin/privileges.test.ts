import { describe, expect, it } from "vitest";
import {
  parsePrivilegeBoolean,
  validatePrivilegeInput,
} from "./privileges";

describe("privilege admin helpers", () => {
  it("accepts practical privilege bounds", () => {
    expect(
      validatePrivilegeInput({
        allowBookingFreedom: "true",
        maxDaysInFuture: "365",
        requireReason: "false",
        timeLimitMinutes: "1440",
      })
    ).toEqual({
      ok: true,
      value: {
        allow_booking_freedom: true,
        max_days_in_future: 365,
        require_reason: false,
        time_limit_minutes: 1440,
      },
    });
  });

  it("allows empty time limit as null", () => {
    expect(
      validatePrivilegeInput({
        allowBookingFreedom: false,
        maxDaysInFuture: "30",
        requireReason: true,
        timeLimitMinutes: " ",
      })
    ).toEqual({
      ok: true,
      value: {
        allow_booking_freedom: false,
        max_days_in_future: 30,
        require_reason: true,
        time_limit_minutes: null,
      },
    });
  });

  it("rejects invalid boolean fields", () => {
    expect(parsePrivilegeBoolean("yes")).toBeNull();

    expect(
      validatePrivilegeInput({
        allowBookingFreedom: "yes",
        maxDaysInFuture: "30",
        requireReason: "false",
        timeLimitMinutes: "",
      })
    ).toEqual({
      error: "Choose a valid booking freedom value.",
      ok: false,
    });
  });

  it("rejects out-of-range future windows", () => {
    expect(
      validatePrivilegeInput({
        allowBookingFreedom: "false",
        maxDaysInFuture: "366",
        requireReason: "false",
        timeLimitMinutes: "",
      })
    ).toEqual({
      error: "Future booking window must be between 0 and 365 days.",
      ok: false,
    });
  });

  it("rejects out-of-range and non-whole-number time limits", () => {
    expect(
      validatePrivilegeInput({
        allowBookingFreedom: "false",
        maxDaysInFuture: "30",
        requireReason: "false",
        timeLimitMinutes: "0",
      })
    ).toEqual({
      error: "Time limit must be between 1 and 1440 minutes.",
      ok: false,
    });

    expect(
      validatePrivilegeInput({
        allowBookingFreedom: "false",
        maxDaysInFuture: "30",
        requireReason: "false",
        timeLimitMinutes: "1.5",
      })
    ).toEqual({
      error: "Time limit must be a whole number.",
      ok: false,
    });
  });
});

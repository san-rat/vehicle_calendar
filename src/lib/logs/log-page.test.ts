import { describe, expect, it } from "vitest";
import {
  formatLogActionTime,
  formatLogSnapshotJson,
  getLogActionLabel,
  getLogBookingStatus,
  getLogActionTone,
  getLogBookingDayHref,
  getLogColorDotClass,
  getLogPageNumber,
  getLogPaginationWindow,
  getLogRetentionCutoffIso,
  getLogSnapshotHighlights,
  getLogTargetSummary,
  getSafeLogColor,
} from "./log-page";

describe("log page helpers", () => {
  it("labels known and unknown action types", () => {
    expect(getLogActionLabel("booking_confirmed")).toBe("Booking confirmed");
    expect(getLogActionLabel("member_role_changed")).toBe(
      "Member role changed"
    );
    expect(getLogActionLabel("custom_action")).toBe("Custom Action");
  });

  it("maps action types to badge tones", () => {
    expect(getLogActionTone("booking_confirmed")).toBe("success");
    expect(getLogActionTone("booking_overridden")).toBe("warning");
    expect(getLogActionTone("booking_rejected")).toBe("danger");
    expect(getLogActionTone("vehicle_updated")).toBe("info");
    expect(getLogActionTone("custom_action")).toBe("primary");
  });

  it("maps booking log actions to booking statuses", () => {
    expect(getLogBookingStatus("booking_confirmed")).toBe("confirmed");
    expect(getLogBookingStatus("booking_requested")).toBe("requested");
    expect(getLogBookingStatus("booking_rejected")).toBe("rejected");
    expect(getLogBookingStatus("booking_overridden")).toBe("overridden");
    expect(getLogBookingStatus("vehicle_updated")).toBeNull();
  });

  it("formats action times in Asia/Colombo", () => {
    expect(formatLogActionTime("2026-04-11T18:30:00.000Z")).toBe(
      "Apr 12, 2026, 00:00 Asia/Colombo"
    );
  });

  it("builds the 30-day retention cutoff from created_at", () => {
    expect(
      getLogRetentionCutoffIso(new Date("2026-04-12T00:00:00.000Z"))
    ).toBe("2026-03-13T00:00:00.000Z");
  });

  it("normalizes pagination params and builds Supabase ranges", () => {
    expect(getLogPageNumber(undefined)).toBe(1);
    expect(getLogPageNumber("0")).toBe(1);
    expect(getLogPageNumber("2.5")).toBe(1);
    expect(getLogPageNumber(["3"])).toBe(3);
    expect(getLogPaginationWindow(3)).toEqual({
      from: 100,
      page: 3,
      to: 149,
    });
  });

  it("uses safe color fallbacks", () => {
    expect(getSafeLogColor("#10B981")).toBe("#10B981");
    expect(getSafeLogColor("green")).toBe("#3B82F6");
    expect(getSafeLogColor(null)).toBe("#3B82F6");
    expect(getLogColorDotClass("#10B981")).toBe("bg-[#10B981]");
    expect(getLogColorDotClass("green")).toBe("bg-[#3B82F6]");
  });

  it("summarizes targets with readable fallbacks", () => {
    expect(
      getLogTargetSummary({
        actionType: "booking_confirmed",
        bookingId: "12345678-1111-2222-3333-444444444444",
        targetUser: { name: "Mina" },
        targetVehicle: { name: "Pool Car" },
      })
    ).toBe("Member: Mina | Vehicle: Pool Car | Booking: 12345678");

    expect(
      getLogTargetSummary({
        actionType: "vehicle_deleted",
        snapshot: { before: { name: "Old Van" } },
      })
    ).toBe("Vehicle: Old Van");

    expect(getLogTargetSummary({ actionType: "privilege_updated" })).toBe(
      "Booking privileges"
    );
  });

  it("builds readable snapshot highlights from before and after data", () => {
    expect(
      getLogSnapshotHighlights({
        after: {
          date: "2026-04-12",
          status: "confirmed",
        },
        before: {
          date: "2026-04-12",
          status: "requested",
        },
        overridden_booking_ids: ["12345678-1111-2222-3333-444444444444"],
        override_note: "Urgent trip",
      })
    ).toEqual([
      {
        copyValue: "requested -> confirmed",
        label: "Status",
        value: "requested -> confirmed",
      },
      {
        copyValue: "Urgent trip",
        label: "Override note",
        value: "Urgent trip",
      },
      {
        copyValue: "12345678-1111-2222-3333-444444444444",
        label: "Overridden bookings",
        value: "12345678",
      },
    ]);
  });

  it("keeps full ids in snapshot highlight copy payloads", () => {
    expect(
      getLogSnapshotHighlights({
        approved_request_id: "87654321-1111-2222-3333-444444444444",
      })
    ).toEqual([
      {
        copyValue: "87654321-1111-2222-3333-444444444444",
        label: "Approved request",
        value: "87654321",
      },
    ]);
  });

  it("formats raw snapshot JSON", () => {
    expect(formatLogSnapshotJson({ after: { status: "confirmed" } })).toBe(
      '{\n  "after": {\n    "status": "confirmed"\n  }\n}'
    );
  });

  it("builds booking day links only for booking logs with date and vehicle", () => {
    expect(
      getLogBookingDayHref({
        actionType: "booking_confirmed",
        snapshot: {
          after: {
            date: "2026-04-12",
            vehicle_id: "vehicle-1",
          },
        },
      })
    ).toBe("/vehicles/vehicle-1/date/2026-04-12");

    expect(
      getLogBookingDayHref({
        actionType: "vehicle_updated",
        snapshot: {
          after: {
            date: "2026-04-12",
            vehicle_id: "vehicle-1",
          },
        },
      })
    ).toBeNull();

    expect(
      getLogBookingDayHref({
        actionType: "booking_confirmed",
        snapshot: {
          after: {
            status: "confirmed",
          },
        },
      })
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  canSeeBookingSummary,
  filterVisibleBookingSummaries,
} from "./visibility";

const memberUser = { id: "member-1", role: "member" } as const;
const adminUser = { id: "admin-1", role: "super_admin" } as const;

describe("booking visibility helpers", () => {
  it("lets members see confirmed bookings and their own pending requests", () => {
    expect(
      canSeeBookingSummary(
        { status: "confirmed", user_id: "member-2" },
        memberUser
      )
    ).toBe(true);
    expect(
      canSeeBookingSummary(
        { status: "requested", user_id: "member-1" },
        memberUser
      )
    ).toBe(true);
  });

  it("hides other members' pending requests from members", () => {
    expect(
      canSeeBookingSummary(
        { status: "requested", user_id: "member-2" },
        memberUser
      )
    ).toBe(false);
  });

  it("lets admins see all pending booking summaries", () => {
    expect(
      canSeeBookingSummary(
        { status: "requested", user_id: "member-2" },
        adminUser
      )
    ).toBe(true);
  });

  it("filters mixed booking lists consistently", () => {
    expect(
      filterVisibleBookingSummaries(
        [
          { id: "confirmed", status: "confirmed", user_id: "member-2" },
          { id: "own-request", status: "requested", user_id: "member-1" },
          { id: "hidden-request", status: "requested", user_id: "member-2" },
        ],
        memberUser
      ).map((booking) => booking.id)
    ).toEqual(["confirmed", "own-request"]);
  });
});

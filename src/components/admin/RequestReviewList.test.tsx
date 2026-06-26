import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RequestReviewList, type RequestWithReviewState } from "./RequestReviewList";

const baseRequest: RequestWithReviewState = {
  approvalProblem: null,
  booking_user: {
    color_hex: "#3B82F6",
    is_active: true,
    name: "Alex",
  },
  booking_vehicle: {
    is_active: true,
    name: "Pool Car",
    type: "car",
  },
  conflicts: [],
  created_at: "2026-04-12T00:00:00Z",
  date: "2026-04-13",
  end_time: "10:00",
  id: "request-1",
  is_all_day: false,
  reason: "School run",
  start_time: "09:00",
  user_id: "user-1",
  vehicle_id: "vehicle-1",
};

describe("RequestReviewList", () => {
  it("shows ready requests and enabled approval controls", () => {
    render(
      <RequestReviewList
        approveBookingRequestAction={vi.fn()}
        rejectBookingRequestAction={vi.fn()}
        requests={[baseRequest]}
      />
    );

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getAllByText("Pool Car").length).toBeGreaterThan(0);
    expect(screen.getByText("Ready to approve.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("shows override controls for conflicting requests", () => {
    render(
      <RequestReviewList
        approveBookingRequestAction={vi.fn()}
        rejectBookingRequestAction={vi.fn()}
        requests={[
          {
            ...baseRequest,
            conflicts: [
              {
                booking_user: { color_hex: "#10B981", name: "Bea" },
                date: "2026-04-13",
                end_time: "10:30",
                id: "conflict-1",
                is_all_day: false,
                start_time: "09:30",
                user_id: "user-2",
                vehicle_id: "vehicle-1",
              },
            ],
          },
        ]}
      />
    );

    expect(
      screen.getAllByText("Override required because this request conflicts with confirmed bookings.")[0]
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Approve with override" })).toBeInTheDocument();
  });

  it("filters blocked requests in the mobile filter controls", async () => {
    const user = userEvent.setup();
    render(
      <RequestReviewList
        approveBookingRequestAction={vi.fn()}
        rejectBookingRequestAction={vi.fn()}
        requests={[
          baseRequest,
          {
            ...baseRequest,
            approvalProblem: "This request date has already passed.",
            id: "request-2",
          },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: /Blocked/ }));

    expect(
      screen.getAllByText("This request date has already passed.").length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Ready to approve.")).not.toBeInTheDocument();
  });
});

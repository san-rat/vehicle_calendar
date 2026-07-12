import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VehicleManagerList } from "./VehicleManagerList";

const vehicles = [
  {
    confirmedTripCount: 2,
    created_at: "2026-04-01T00:00:00Z",
    id: "vehicle-1",
    is_active: true,
    lastConfirmedDate: "2026-04-10",
    name: "Pool Car",
    nextActivityDate: "2026-04-13",
    pendingRequestCount: 1,
    type: "car" as const,
    updated_at: "2026-04-12T00:00:00Z",
  },
  {
    confirmedTripCount: 0,
    created_at: "2026-04-01T00:00:00Z",
    id: "vehicle-2",
    is_active: false,
    lastConfirmedDate: null,
    name: "Cargo Van",
    nextActivityDate: null,
    pendingRequestCount: 0,
    type: "van" as const,
    updated_at: "2026-04-12T00:00:00Z",
  },
];

describe("VehicleManagerList", () => {
  it("filters vehicles by search and status", async () => {
    const user = userEvent.setup();
    render(
      <VehicleManagerList
        deleteVehicleAction={vi.fn()}
        updateVehicleAction={vi.fn()}
        vehicles={vehicles}
      />
    );

    await user.type(screen.getByPlaceholderText("Search by vehicle name or type"), "cargo");
    expect(screen.getAllByText("Cargo Van").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pool Car")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByDisplayValue("All statuses"), "active");
    expect(screen.queryByText("Cargo Van")).not.toBeInTheDocument();
  });

  it("opens management controls for a selected vehicle", async () => {
    const user = userEvent.setup();
    render(
      <VehicleManagerList
        deleteVehicleAction={vi.fn()}
        updateVehicleAction={vi.fn()}
        vehicles={vehicles}
      />
    );

    await user.click(screen.getAllByRole("button", { name: /manage/i })[0]);

    expect(screen.getByRole("dialog", { name: "Manage Pool Car" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete vehicle" })).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import {
  getVehicleTypeLabel,
  isVehicleType,
  parseVehicleActiveState,
  validateVehicleInput,
  VEHICLE_TYPES,
} from "./vehicles";

describe("vehicle admin helpers", () => {
  it("accepts every supported vehicle type", () => {
    expect(VEHICLE_TYPES.every(isVehicleType)).toBe(true);
    expect(getVehicleTypeLabel("suv")).toBe("SUV");
  });

  it("rejects unsupported vehicle types", () => {
    expect(isVehicleType("truck")).toBe(false);

    const result = validateVehicleInput({
      isActive: "true",
      name: "Pool Truck",
      type: "truck",
    });

    expect(result).toEqual({
      error: "Choose a valid vehicle type.",
      ok: false,
    });
  });

  it("trims names and parses active state", () => {
    const result = validateVehicleInput({
      isActive: "false",
      name: "  Pool Car 1  ",
      type: "car",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        is_active: false,
        name: "Pool Car 1",
        type: "car",
      },
    });
  });

  it("enforces vehicle name bounds", () => {
    expect(
      validateVehicleInput({ isActive: true, name: "A", type: "car" })
    ).toEqual({
      error: "Vehicle name must be at least 2 characters.",
      ok: false,
    });

    expect(
      validateVehicleInput({
        isActive: true,
        name: "A".repeat(81),
        type: "car",
      })
    ).toEqual({
      error: "Vehicle name must be 80 characters or fewer.",
      ok: false,
    });
  });

  it("parses only explicit active state values", () => {
    expect(parseVehicleActiveState(true)).toBe(true);
    expect(parseVehicleActiveState(false)).toBe(false);
    expect(parseVehicleActiveState("true")).toBe(true);
    expect(parseVehicleActiveState("false")).toBe(false);
    expect(parseVehicleActiveState("active")).toBeNull();
  });
});

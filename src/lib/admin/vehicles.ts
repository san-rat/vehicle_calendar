export const VEHICLE_TYPES = ["car", "van", "jeep", "bike", "suv", "other"] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export type ValidVehicleInput = {
  is_active: boolean;
  name: string;
  type: VehicleType;
};

export type VehicleValidationResult =
  | { ok: true; value: ValidVehicleInput }
  | { error: string; ok: false };

const vehicleTypeLabels: Record<VehicleType, string> = {
  bike: "Bike",
  car: "Car",
  jeep: "Jeep",
  other: "Other",
  suv: "SUV",
  van: "Van",
};

export function isVehicleType(value: string): value is VehicleType {
  return VEHICLE_TYPES.includes(value as VehicleType);
}

export function getVehicleTypeLabel(type: VehicleType) {
  return vehicleTypeLabels[type];
}

export function parseVehicleActiveState(value: string | boolean) {
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

export function validateVehicleInput(input: {
  isActive: string | boolean;
  name: string;
  type: string;
}): VehicleValidationResult {
  const name = input.name.trim();
  const type = input.type.trim();
  const isActive = parseVehicleActiveState(input.isActive);

  if (name.length < 2) {
    return { error: "Vehicle name must be at least 2 characters.", ok: false };
  }

  if (name.length > 80) {
    return { error: "Vehicle name must be 80 characters or fewer.", ok: false };
  }

  if (!isVehicleType(type)) {
    return { error: "Choose a valid vehicle type.", ok: false };
  }

  if (isActive === null) {
    return { error: "Choose a valid active state.", ok: false };
  }

  return {
    ok: true,
    value: {
      is_active: isActive,
      name,
      type,
    },
  };
}

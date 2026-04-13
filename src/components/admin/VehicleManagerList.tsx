"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  Panel,
  inputClassName,
} from "@/components/ui";
import { ManageIcon } from "@/components/ui/icons";
import { ResponsiveOverlay } from "@/components/ui/ResponsiveOverlay";
import {
  getVehicleTypeLabel,
  VEHICLE_TYPES,
  type VehicleType,
} from "@/lib/admin/vehicles";

type VehicleRecord = {
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
  updated_at: string;
};

type VehicleManagerListProps = {
  deleteVehicleAction: (formData: FormData) => void | Promise<void>;
  updateVehicleAction: (formData: FormData) => void | Promise<void>;
  vehicles: VehicleRecord[];
};

const inputClass = inputClassName();

export function VehicleManagerList({
  deleteVehicleAction,
  updateVehicleAction,
  vehicles,
}: VehicleManagerListProps) {
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const activeVehicle =
    vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null;

  return (
    <>
      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <Panel as="article" className="p-3 sm:p-4" key={vehicle.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[var(--text)]">
                    {vehicle.name}
                  </h3>
                  <Badge tone={vehicle.is_active ? "success" : "neutral"}>
                    {vehicle.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {getVehicleTypeLabel(vehicle.type)}
                </p>
              </div>

              <Button
                className="sm:self-center"
                onClick={() => setActiveVehicleId(vehicle.id)}
                size="sm"
                tone="secondary"
                type="button"
              >
                <ManageIcon className="h-4 w-4" />
                Manage
              </Button>
            </div>
          </Panel>
        ))}
      </div>

      <ResponsiveOverlay
        onClose={() => setActiveVehicleId(null)}
        open={activeVehicle !== null}
        title={activeVehicle ? `Manage ${activeVehicle.name}` : "Manage vehicle"}
      >
        {activeVehicle ? (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Vehicle details
              </h3>

              <form
                action={updateVehicleAction}
                className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeVehicle.id} />

                <Field htmlFor={`vehicle-name-${activeVehicle.id}`} label="Name">
                  <input
                    className={inputClass}
                    defaultValue={activeVehicle.name}
                    id={`vehicle-name-${activeVehicle.id}`}
                    maxLength={80}
                    minLength={2}
                    name="name"
                    required
                  />
                </Field>

                <Field htmlFor={`vehicle-type-${activeVehicle.id}`} label="Type">
                  <select
                    className={inputClass}
                    defaultValue={activeVehicle.type}
                    id={`vehicle-type-${activeVehicle.id}`}
                    name="type"
                    required
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {getVehicleTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  htmlFor={`vehicle-active-${activeVehicle.id}`}
                  label="Status"
                >
                  <select
                    className={inputClass}
                    defaultValue={String(activeVehicle.is_active)}
                    id={`vehicle-active-${activeVehicle.id}`}
                    name="is_active"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </Field>

                <Button type="submit" tone="primary">
                  Save changes
                </Button>
              </form>
            </section>

            <section className="rounded-2xl border border-[var(--danger)]/15 bg-[var(--danger)]/5 p-4">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Delete vehicle
              </h3>

              <form
                action={deleteVehicleAction}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeVehicle.id} />

                <Field
                  htmlFor={`vehicle-delete-${activeVehicle.id}`}
                  label="Type vehicle name to hard delete"
                >
                  <input
                    className={inputClass}
                    id={`vehicle-delete-${activeVehicle.id}`}
                    name="confirmation"
                    placeholder={activeVehicle.name}
                  />
                </Field>

                <Button type="submit" tone="danger">
                  Delete vehicle
                </Button>
              </form>
            </section>
          </div>
        ) : null}
      </ResponsiveOverlay>
    </>
  );
}

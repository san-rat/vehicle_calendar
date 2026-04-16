"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Panel,
  inputClassName,
} from "@/components/ui";
import { ManageIcon, SearchIcon } from "@/components/ui/icons";
import { ResponsiveOverlay } from "@/components/ui/ResponsiveOverlay";
import {
  getVehicleTypeLabel,
  VEHICLE_TYPES,
  type VehicleType,
} from "@/lib/admin/vehicles";

type VehicleRecord = {
  confirmedTripCount: number;
  created_at: string;
  id: string;
  is_active: boolean;
  lastConfirmedDate: string | null;
  name: string;
  nextActivityDate: string | null;
  pendingRequestCount: number;
  type: VehicleType;
  updated_at: string;
};

type VehicleManagerListProps = {
  deleteVehicleAction: (formData: FormData) => void | Promise<void>;
  updateVehicleAction: (formData: FormData) => void | Promise<void>;
  vehicles: VehicleRecord[];
};

const inputClass = inputClassName();

function formatDate(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function VehicleManagerList({
  deleteVehicleAction,
  updateVehicleAction,
  vehicles,
}: VehicleManagerListProps) {
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "inactive">(
    "all"
  );
  const activeVehicle =
    vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null;

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesQuery =
        !normalizedQuery ||
        vehicle.name.toLowerCase().includes(normalizedQuery) ||
        getVehicleTypeLabel(vehicle.type).toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? vehicle.is_active : !vehicle.is_active);

      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, vehicles]);

  return (
    <>
      <Panel className="p-4 sm:p-5" variant="inset">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className={inputClassName("pl-11")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by vehicle name or type"
              type="search"
              value={query}
            />
          </div>
          <select
            className={inputClass}
            onChange={(event) =>
              setStatusFilter(event.target.value as "active" | "all" | "inactive")
            }
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </Panel>

      <div className="space-y-3">
        {filteredVehicles.map((vehicle) => (
          <Panel as="article" className="p-4 sm:p-5" key={vehicle.id} variant="elevated">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    {vehicle.name}
                  </h3>
                  <Badge tone={vehicle.is_active ? "success" : "neutral"}>
                    {vehicle.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {vehicle.pendingRequestCount > 0 ? (
                    <Badge tone="warning">
                      {vehicle.pendingRequestCount} pending
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {getVehicleTypeLabel(vehicle.type)}
                </p>
              </div>

              <Button
                className="xl:self-start"
                onClick={() => setActiveVehicleId(vehicle.id)}
                size="sm"
                tone="secondary"
                type="button"
              >
                <ManageIcon className="h-4 w-4" />
                Manage
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Confirmed trips
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  {vehicle.confirmedTripCount}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Next activity
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(vehicle.nextActivityDate)}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Last confirmed
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(vehicle.lastConfirmedDate)}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Updated
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {new Intl.DateTimeFormat("en-US", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                    year: "numeric",
                  }).format(new Date(vehicle.updated_at))}
                </p>
              </div>
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
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
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

                <Field htmlFor={`vehicle-active-${activeVehicle.id}`} label="Status">
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

            <section className="rounded-[24px] border border-[var(--danger)]/16 bg-[var(--danger-soft)] p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Delete vehicle
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                This permanently removes the vehicle. Booking history must already
                be clear.
              </p>

              <form
                action={deleteVehicleAction}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeVehicle.id} />

                <Field
                  description="Type the exact vehicle name."
                  htmlFor={`vehicle-delete-${activeVehicle.id}`}
                  label="Confirmation"
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

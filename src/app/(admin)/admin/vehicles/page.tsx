import { requireAdminAppUser } from "@/lib/auth/user";
import {
  getVehicleTypeLabel,
  VEHICLE_TYPES,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createVehicle, deleteVehicle, updateVehicle } from "./actions";

type AdminVehiclesPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

type VehicleRecord = {
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
  updated_at: string;
};

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]";

const labelClass = "text-xs font-semibold uppercase text-[var(--muted)]";

async function getVehicles() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, type, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load vehicles.");
  }

  return (data ?? []) as VehicleRecord[];
}

export default async function AdminVehiclesPage({
  searchParams,
}: AdminVehiclesPageProps) {
  const vehicles = await getVehicles();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--primary)]">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold">Admin Vehicles</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Add vehicles, edit their type, and mark them inactive when they should
          not appear in booking flows. Hard delete is blocked once bookings
          exist.
        </p>
      </header>

      {statusMessage ? (
        <p
          className={`rounded-md border px-4 py-3 text-sm ${
            statusTone === "error"
              ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
              : "border-[var(--success)]/30 bg-[var(--success)]/10 text-green-700"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold">Add Vehicle</h2>
        <form action={createVehicle} className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end">
          <label className="space-y-2">
            <span className={labelClass}>Name</span>
            <input
              className={inputClass}
              maxLength={80}
              minLength={2}
              name="name"
              placeholder="Pool Car 2"
              required
            />
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Type</span>
            <select className={inputClass} name="type" required>
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getVehicleTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Status</span>
            <select className={inputClass} defaultValue="true" name="is_active">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>

          <button
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            type="submit"
          >
            Add Vehicle
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Vehicles</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Showing active and inactive vehicles.
            </p>
          </div>
          <span className="rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">
            {vehicles.length} total
          </span>
        </div>

        {vehicles.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
            No vehicles have been added yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {vehicles.map((vehicle) => (
              <article
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
                key={vehicle.id}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{vehicle.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {getVehicleTypeLabel(vehicle.type)}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${
                      vehicle.is_active
                        ? "bg-[var(--success)]/10 text-green-700"
                        : "bg-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {vehicle.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <form
                  action={updateVehicle}
                  className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
                >
                  <input name="id" type="hidden" value={vehicle.id} />
                  <label className="space-y-2">
                    <span className={labelClass}>Name</span>
                    <input
                      className={inputClass}
                      defaultValue={vehicle.name}
                      maxLength={80}
                      minLength={2}
                      name="name"
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className={labelClass}>Type</span>
                    <select
                      className={inputClass}
                      defaultValue={vehicle.type}
                      name="type"
                      required
                    >
                      {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {getVehicleTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className={labelClass}>Status</span>
                    <select
                      className={inputClass}
                      defaultValue={String(vehicle.is_active)}
                      name="is_active"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </label>

                  <button
                    className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]"
                    type="submit"
                  >
                    Save
                  </button>
                </form>

                <form
                  action={deleteVehicle}
                  className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                >
                  <input name="id" type="hidden" value={vehicle.id} />
                  <label className="space-y-2">
                    <span className={labelClass}>
                      Type vehicle name to hard delete
                    </span>
                    <input
                      className={inputClass}
                      name="confirmation"
                      placeholder={vehicle.name}
                    />
                  </label>
                  <button
                    className="rounded-md border border-[var(--danger)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                    type="submit"
                  >
                    Delete
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

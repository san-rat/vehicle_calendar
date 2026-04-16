import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  BreadcrumbNav,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatCard,
  inputClassName,
} from "@/components/ui";
import { VehicleManagerList } from "@/components/admin/VehicleManagerList";
import { EmptyStateIcon, ManageIcon } from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  VEHICLE_TYPES,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBusinessToday } from "@/lib/booking/dates";
import { createVehicle, deleteVehicle, updateVehicle } from "./actions";

type BaseVehicleRecord = {
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
  updated_at: string;
};

type BookingSummaryRecord = {
  date: string;
  status: "confirmed" | "requested";
  vehicle_id: string;
};

const inputClass = inputClassName();

async function getVehicles() {
  await requireAdminAppUser();
  const today = getBusinessToday();

  const supabase = createSupabaseAdminClient();
  const [{ data: vehicles, error: vehiclesError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("id, name, type, is_active, created_at, updated_at")
        .order("name", { ascending: true }),
      supabase
        .from("bookings")
        .select("vehicle_id, date, status")
        .in("status", ["confirmed", "requested"])
        .order("date", { ascending: true }),
    ]);

  if (vehiclesError) {
    throw new Error("Unable to load vehicles.");
  }

  if (bookingsError) {
    throw new Error("Unable to load vehicle activity.");
  }

  const bookingMap = new Map<string, BookingSummaryRecord[]>();

  for (const booking of (bookings ?? []) as BookingSummaryRecord[]) {
    const current = bookingMap.get(booking.vehicle_id) ?? [];
    current.push(booking);
    bookingMap.set(booking.vehicle_id, current);
  }

  return ((vehicles ?? []) as BaseVehicleRecord[]).map((vehicle) => {
      const vehicleBookings = bookingMap.get(vehicle.id) ?? [];
      const confirmedBookings = vehicleBookings.filter(
        (booking) => booking.status === "confirmed"
      );
      const requestedBookings = vehicleBookings.filter(
        (booking) => booking.status === "requested"
      );

      return {
        ...vehicle,
        confirmedTripCount: confirmedBookings.length,
        lastConfirmedDate:
          confirmedBookings.length > 0
            ? confirmedBookings[confirmedBookings.length - 1]?.date ?? null
            : null,
        nextActivityDate:
          vehicleBookings.find((booking) => booking.date >= today)?.date ??
          vehicleBookings[0]?.date ??
          null,
        pendingRequestCount: requestedBookings.length,
      };
    });
}

export default async function AdminVehiclesPage() {
  const vehicles = await getVehicles();
  const activeVehicles = vehicles.filter((vehicle) => vehicle.is_active).length;
  const pendingRequestVehicles = vehicles.filter(
    (vehicle) => vehicle.pendingRequestCount > 0
  ).length;
  const confirmedTrips = vehicles.reduce(
    (sum, vehicle) => sum + vehicle.confirmedTripCount,
    0
  );

  return (
    <div className="page-stack">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Vehicles" },
        ]}
      />
      <PageHeader
        action={<Badge tone="primary">Fleet controls</Badge>}
        eyebrow="Settings"
        title="Admin Vehicles"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ManageIcon}
          label="Active fleet"
          tone="primary"
          value={activeVehicles}
        />
        <StatCard
          icon={ManageIcon}
          label="Total records"
          tone="neutral"
          value={vehicles.length}
        />
        <StatCard
          icon={ManageIcon}
          label="Pending review"
          tone={pendingRequestVehicles > 0 ? "warning" : "success"}
          value={pendingRequestVehicles}
        />
        <StatCard
          icon={ManageIcon}
          label="Confirmed trips"
          tone="info"
          value={confirmedTrips}
        />
      </section>

      <Panel className="overflow-hidden" variant="elevated">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
            <ManageIcon className="h-5 w-5" />
          </span>
          <h2 className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Add vehicle
          </h2>
        </div>
        <form
          action={createVehicle}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
        >
          <Field htmlFor="vehicle-create-name" label="Name">
            <input
              className={inputClass}
              id="vehicle-create-name"
              maxLength={80}
              minLength={2}
              name="name"
              placeholder="Pool Car 2"
              required
            />
          </Field>

          <Field htmlFor="vehicle-create-type" label="Type">
            <select
              className={inputClass}
              id="vehicle-create-type"
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

          <Field htmlFor="vehicle-create-active" label="Status">
            <select
              className={inputClass}
              defaultValue="true"
              id="vehicle-create-active"
              name="is_active"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>

          <Button type="submit" tone="primary">
            Add vehicle
          </Button>
        </form>
      </Panel>

      <section className="page-section">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Fleet inventory
          </h2>
          <Badge tone="neutral">{vehicles.length} total</Badge>
        </div>

        {vehicles.length === 0 ? (
          <EmptyState
            description="Add the first vehicle to make it available for booking."
            icon={EmptyStateIcon}
            title="No vehicles yet"
          />
        ) : (
          <VehicleManagerList
            deleteVehicleAction={deleteVehicle}
            updateVehicleAction={updateVehicle}
            vehicles={vehicles}
          />
        )}
      </section>
    </div>
  );
}

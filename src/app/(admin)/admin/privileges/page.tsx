import { requireAdminAppUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updatePrivileges } from "./actions";

type AdminPrivilegesPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

type PrivilegeConfigRecord = {
  allow_booking_freedom: boolean;
  created_at: string;
  id: string;
  max_days_in_future: number;
  require_reason: boolean;
  time_limit_minutes: number | null;
  updated_at: string;
};

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]";

const labelClass = "text-xs font-semibold uppercase text-[var(--muted)]";

async function getPrivilegeConfig() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("privilege_config")
    .select(
      "id, time_limit_minutes, allow_booking_freedom, max_days_in_future, require_reason, created_at, updated_at"
    )
    .maybeSingle<PrivilegeConfigRecord>();

  if (error || !data) {
    throw new Error("Privilege configuration is missing. Run the seed file.");
  }

  return data;
}

function getTimeLimitSummary(minutes: number | null) {
  return minutes === null ? "No time limit" : `${minutes} minutes`;
}

export default async function AdminPrivilegesPage({
  searchParams,
}: AdminPrivilegesPageProps) {
  const config = await getPrivilegeConfig();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--primary)]">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold">Admin Privileges</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Control whether bookings are confirmed immediately, how far ahead
          members can book, whether reasons are required, and whether a time
          limit disables all-day bookings.
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

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className={labelClass}>Booking Freedom</p>
          <p className="mt-2 text-lg font-semibold">
            {config.allow_booking_freedom ? "Auto-confirm" : "Requires approval"}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className={labelClass}>Time Limit</p>
          <p className="mt-2 text-lg font-semibold">
            {getTimeLimitSummary(config.time_limit_minutes)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className={labelClass}>Future Window</p>
          <p className="mt-2 text-lg font-semibold">
            {config.max_days_in_future} days
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className={labelClass}>Reason</p>
          <p className="mt-2 text-lg font-semibold">
            {config.require_reason ? "Required" : "Optional"}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold">Update Privileges</h2>
        <form action={updatePrivileges} className="mt-4 grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={config.id} />

          <label className="space-y-2">
            <span className={labelClass}>Booking Freedom</span>
            <select
              className={inputClass}
              defaultValue={String(config.allow_booking_freedom)}
              name="allow_booking_freedom"
            >
              <option value="true">Auto-confirm bookings</option>
              <option value="false">Require admin approval</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Require Reason</span>
            <select
              className={inputClass}
              defaultValue={String(config.require_reason)}
              name="require_reason"
            >
              <option value="true">Reason required</option>
              <option value="false">Reason optional</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Time Limit Minutes</span>
            <input
              className={inputClass}
              defaultValue={config.time_limit_minutes ?? ""}
              max={1440}
              min={1}
              name="time_limit_minutes"
              placeholder="No limit"
              type="number"
            />
            <span className="block text-xs text-[var(--muted)]">
              Leave blank to allow all-day bookings.
            </span>
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Future Booking Window</span>
            <input
              className={inputClass}
              defaultValue={config.max_days_in_future}
              max={365}
              min={0}
              name="max_days_in_future"
              required
              type="number"
            />
            <span className="block text-xs text-[var(--muted)]">
              Use 0 to allow bookings only for today.
            </span>
          </label>

          <div className="md:col-span-2">
            <button
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              Save Privileges
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

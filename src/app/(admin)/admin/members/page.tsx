import {
  getMemberRoleLabel,
  MEMBER_ROLES,
  type MemberRole,
} from "@/lib/admin/members";
import { requireAdminAppUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createMember,
  deleteMember,
  resetMemberPassword,
  updateMember,
} from "./actions";

type AdminMembersPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

type MemberRecord = {
  color_hex: string;
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  role: MemberRole;
  updated_at: string;
};

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]";

const labelClass = "text-xs font-semibold uppercase text-[var(--muted)]";

async function getMembers() {
  const currentUser = await requireAdminAppUser();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, color_hex, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load members.");
  }

  return {
    currentUser,
    members: (data ?? []) as MemberRecord[],
  };
}

export default async function AdminMembersPage({
  searchParams,
}: AdminMembersPageProps) {
  const { currentUser, members } = await getMembers();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--primary)]">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold">Admin Members</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Create members with name-only login, manage roles and access, reset
          passwords, and safely remove accounts that do not own bookings.
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
        <h2 className="text-lg font-semibold">Add Member</h2>
        <form
          action={createMember}
          className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_170px_150px_1fr_1fr_auto] lg:items-end"
        >
          <label className="space-y-2">
            <span className={labelClass}>Name</span>
            <input
              className={inputClass}
              maxLength={60}
              minLength={2}
              name="name"
              placeholder="New Member"
              required
            />
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Role</span>
            <select className={inputClass} name="role" required>
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {getMemberRoleLabel(role)}
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

          <label className="space-y-2">
            <span className={labelClass}>Password</span>
            <input
              className={inputClass}
              minLength={8}
              name="password"
              placeholder="Minimum 8 characters"
              required
              type="password"
            />
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Confirm Password</span>
            <input
              className={inputClass}
              minLength={8}
              name="password_confirmation"
              placeholder="Repeat password"
              required
              type="password"
            />
          </label>

          <button
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            type="submit"
          >
            Add Member
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Showing active and inactive accounts.
            </p>
          </div>
          <span className="rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">
            {members.length} total
          </span>
        </div>

        {members.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
            No members have been added yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {members.map((member) => {
              const isSelf = member.id === currentUser.id;

              return (
                <article
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
                  key={member.id}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                        {member.color_hex}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold">
                          {member.name}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-medium text-[var(--muted)]">
                              You
                            </span>
                          ) : null}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {getMemberRoleLabel(member.role)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-md px-3 py-1 text-xs font-semibold ${
                        member.is_active
                          ? "bg-[var(--success)]/10 text-green-700"
                          : "bg-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <form
                    action={updateMember}
                    className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={member.id} />
                    <label className="space-y-2">
                      <span className={labelClass}>Name</span>
                      <input
                        className={inputClass}
                        defaultValue={member.name}
                        maxLength={60}
                        minLength={2}
                        name="name"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={labelClass}>Role</span>
                      <select
                        className={inputClass}
                        defaultValue={member.role}
                        name="role"
                        required
                      >
                        {MEMBER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {getMemberRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className={labelClass}>Status</span>
                      <select
                        className={inputClass}
                        defaultValue={String(member.is_active)}
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
                    action={resetMemberPassword}
                    className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={member.id} />
                    <label className="space-y-2">
                      <span className={labelClass}>New Password</span>
                      <input
                        className={inputClass}
                        minLength={8}
                        name="password"
                        placeholder="Minimum 8 characters"
                        type="password"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={labelClass}>Confirm Password</span>
                      <input
                        className={inputClass}
                        minLength={8}
                        name="password_confirmation"
                        placeholder="Repeat password"
                        type="password"
                      />
                    </label>
                    <button
                      className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]"
                      type="submit"
                    >
                      Reset Password
                    </button>
                  </form>

                  <form
                    action={deleteMember}
                    className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={member.id} />
                    <label className="space-y-2">
                      <span className={labelClass}>
                        Type member name to hard delete
                      </span>
                      <input
                        className={inputClass}
                        name="confirmation"
                        placeholder={member.name}
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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

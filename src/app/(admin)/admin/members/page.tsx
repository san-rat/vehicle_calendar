import {
  getMemberRoleLabel,
  MEMBER_ROLES,
  type MemberRole,
} from "@/lib/admin/members";
import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Panel,
  inputClassName,
} from "@/components/ui";
import { EmptyStateIcon, UserIcon } from "@/components/ui/icons";
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

const inputClass = inputClassName();

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
      <PageHeader
        description="Create members with name-only login, manage roles and access, reset passwords, and safely remove accounts that do not own bookings."
        eyebrow="Settings"
        title="Admin Members"
      />

      {statusMessage ? (
        <Notice tone={statusTone === "error" ? "danger" : "success"}>
          {statusMessage}
        </Notice>
      ) : null}

      <Panel>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
            <UserIcon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Add Member</h2>
        </div>
        <form
          action={createMember}
          className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_170px_150px_1fr_1fr_auto] lg:items-end"
        >
          <Field htmlFor="member-create-name" label="Name">
            <input
              className={inputClass}
              id="member-create-name"
              maxLength={60}
              minLength={2}
              name="name"
              placeholder="New Member"
              required
            />
          </Field>

          <Field htmlFor="member-create-role" label="Role">
            <select
              className={inputClass}
              id="member-create-role"
              name="role"
              required
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {getMemberRoleLabel(role)}
                </option>
              ))}
            </select>
          </Field>

          <Field htmlFor="member-create-active" label="Status">
            <select
              className={inputClass}
              defaultValue="true"
              id="member-create-active"
              name="is_active"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>

          <Field htmlFor="member-create-password" label="Password">
            <input
              className={inputClass}
              id="member-create-password"
              minLength={8}
              name="password"
              placeholder="Minimum 8 characters"
              required
              type="password"
            />
          </Field>

          <Field
            htmlFor="member-create-password-confirmation"
            label="Confirm Password"
          >
            <input
              className={inputClass}
              id="member-create-password-confirmation"
              minLength={8}
              name="password_confirmation"
              placeholder="Repeat password"
              required
              type="password"
            />
          </Field>

          <Button type="submit" tone="primary">
            Add Member
          </Button>
        </form>
      </Panel>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Showing active and inactive accounts.
            </p>
          </div>
          <Badge tone="neutral">
            {members.length} total
          </Badge>
        </div>

        {members.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              description="Add the first member to give someone access to FleetTime."
              icon={EmptyStateIcon}
              title="No members yet"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {members.map((member) => {
              const isSelf = member.id === currentUser.id;

              return (
                <Panel as="article" key={member.id}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge tone="neutral">
                        {member.color_hex}
                      </Badge>
                      <div>
                        <h3 className="text-base font-semibold">
                          {member.name}
                          {isSelf ? (
                            <Badge className="ml-2" tone="info">
                              You
                            </Badge>
                          ) : null}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {getMemberRoleLabel(member.role)}
                        </p>
                      </div>
                    </div>
                    <Badge tone={member.is_active ? "success" : "neutral"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <form
                    action={updateMember}
                    className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={member.id} />
                    <Field htmlFor={`member-name-${member.id}`} label="Name">
                      <input
                        className={inputClass}
                        defaultValue={member.name}
                        id={`member-name-${member.id}`}
                        maxLength={60}
                        minLength={2}
                        name="name"
                        required
                      />
                    </Field>

                    <Field htmlFor={`member-role-${member.id}`} label="Role">
                      <select
                        className={inputClass}
                        defaultValue={member.role}
                        id={`member-role-${member.id}`}
                        name="role"
                        required
                      >
                        {MEMBER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {getMemberRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field htmlFor={`member-active-${member.id}`} label="Status">
                      <select
                        className={inputClass}
                        defaultValue={String(member.is_active)}
                        id={`member-active-${member.id}`}
                        name="is_active"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </Field>

                    <Button type="submit" tone="secondary">
                      Save
                    </Button>
                  </form>

                  <form
                    action={resetMemberPassword}
                    className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={member.id} />
                    <Field
                      htmlFor={`member-password-${member.id}`}
                      label="New Password"
                    >
                      <input
                        className={inputClass}
                        id={`member-password-${member.id}`}
                        minLength={8}
                        name="password"
                        placeholder="Minimum 8 characters"
                        type="password"
                      />
                    </Field>
                    <Field
                      htmlFor={`member-password-confirmation-${member.id}`}
                      label="Confirm Password"
                    >
                      <input
                        className={inputClass}
                        id={`member-password-confirmation-${member.id}`}
                        minLength={8}
                        name="password_confirmation"
                        placeholder="Repeat password"
                        type="password"
                      />
                    </Field>
                    <Button type="submit" tone="secondary">
                      Reset Password
                    </Button>
                  </form>

                  <form
                    action={deleteMember}
                    className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={member.id} />
                    <Field
                      htmlFor={`member-delete-${member.id}`}
                      label="Type member name to hard delete"
                    >
                      <input
                        className={inputClass}
                        id={`member-delete-${member.id}`}
                        name="confirmation"
                        placeholder={member.name}
                      />
                    </Field>
                    <Button type="submit" tone="danger">
                      Delete
                    </Button>
                  </form>
                </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

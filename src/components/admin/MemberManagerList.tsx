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
  getMemberRoleLabel,
  MEMBER_ROLES,
  type MemberRole,
} from "@/lib/admin/members";

type MemberRecord = {
  color_hex: string;
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  role: MemberRole;
  updated_at: string;
};

type MemberManagerListProps = {
  currentUserId: string;
  deleteMemberAction: (formData: FormData) => void | Promise<void>;
  members: MemberRecord[];
  resetMemberPasswordAction: (formData: FormData) => void | Promise<void>;
  updateMemberAction: (formData: FormData) => void | Promise<void>;
};

const memberColorClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

const inputClass = inputClassName();

function getMemberColorClass(colorHex: string) {
  return memberColorClasses[colorHex.toUpperCase()] ?? "bg-[var(--primary)]";
}

export function MemberManagerList({
  currentUserId,
  deleteMemberAction,
  members,
  resetMemberPasswordAction,
  updateMemberAction,
}: MemberManagerListProps) {
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const activeMember =
    members.find((member) => member.id === activeMemberId) ?? null;

  return (
    <>
      <div className="space-y-3">
        {members.map((member) => {
          const isSelf = member.id === currentUserId;

          return (
            <Panel as="article" className="p-3 sm:p-4" key={member.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-3 w-3 rounded-full ${getMemberColorClass(
                        member.color_hex
                      )}`}
                    />
                    <h3 className="text-base font-semibold text-[var(--text)]">
                      {member.name}
                    </h3>
                    {isSelf ? <Badge tone="info">You</Badge> : null}
                    <Badge tone={member.is_active ? "success" : "neutral"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {getMemberRoleLabel(member.role)}
                  </p>
                </div>

                <Button
                  className="sm:self-center"
                  onClick={() => setActiveMemberId(member.id)}
                  size="sm"
                  tone="secondary"
                  type="button"
                >
                  <ManageIcon className="h-4 w-4" />
                  Manage
                </Button>
              </div>
            </Panel>
          );
        })}
      </div>

      <ResponsiveOverlay
        onClose={() => setActiveMemberId(null)}
        open={activeMember !== null}
        title={activeMember ? `Manage ${activeMember.name}` : "Manage member"}
      >
        {activeMember ? (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Account details
              </h3>

              <form
                action={updateMemberAction}
                className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeMember.id} />

                <Field htmlFor={`member-name-${activeMember.id}`} label="Name">
                  <input
                    className={inputClass}
                    defaultValue={activeMember.name}
                    id={`member-name-${activeMember.id}`}
                    maxLength={60}
                    minLength={2}
                    name="name"
                    required
                  />
                </Field>

                <Field htmlFor={`member-role-${activeMember.id}`} label="Role">
                  <select
                    className={inputClass}
                    defaultValue={activeMember.role}
                    id={`member-role-${activeMember.id}`}
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

                <Field htmlFor={`member-active-${activeMember.id}`} label="Status">
                  <select
                    className={inputClass}
                    defaultValue={String(activeMember.is_active)}
                    id={`member-active-${activeMember.id}`}
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

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/75 p-4">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Reset password
              </h3>

              <form
                action={resetMemberPasswordAction}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeMember.id} />

                <Field
                  htmlFor={`member-password-${activeMember.id}`}
                  label="New Password"
                >
                  <input
                    className={inputClass}
                    id={`member-password-${activeMember.id}`}
                    minLength={8}
                    name="password"
                    placeholder="Minimum 8 characters"
                    type="password"
                  />
                </Field>

                <Field
                  htmlFor={`member-password-confirmation-${activeMember.id}`}
                  label="Confirm Password"
                >
                  <input
                    className={inputClass}
                    id={`member-password-confirmation-${activeMember.id}`}
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
            </section>

            <section className="rounded-2xl border border-[var(--danger)]/15 bg-[var(--danger)]/5 p-4">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Delete member
              </h3>

              <form
                action={deleteMemberAction}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeMember.id} />

                <Field
                  htmlFor={`member-delete-${activeMember.id}`}
                  label="Type member name to hard delete"
                >
                  <input
                    className={inputClass}
                    id={`member-delete-${activeMember.id}`}
                    name="confirmation"
                    placeholder={activeMember.name}
                  />
                </Field>

                <Button type="submit" tone="danger">
                  Delete member
                </Button>
              </form>
            </section>
          </div>
        ) : null}
      </ResponsiveOverlay>
    </>
  );
}

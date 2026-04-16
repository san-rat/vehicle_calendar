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
  return memberColorClasses[colorHex.toUpperCase()] ?? "bg-[var(--brand-500)]";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function MemberManagerList({
  currentUserId,
  deleteMemberAction,
  members,
  resetMemberPasswordAction,
  updateMemberAction,
}: MemberManagerListProps) {
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "inactive">(
    "all"
  );
  const activeMember =
    members.find((member) => member.id === activeMemberId) ?? null;

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter((member) => {
      const matchesQuery =
        !normalizedQuery ||
        member.name.toLowerCase().includes(normalizedQuery) ||
        getMemberRoleLabel(member.role).toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? member.is_active : !member.is_active);

      return matchesQuery && matchesStatus;
    });
  }, [members, query, statusFilter]);

  return (
    <>
      <Panel className="p-3.5 md:p-5" variant="inset">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className={inputClassName("pl-11")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by member name or role"
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
        {filteredMembers.map((member) => {
          const isSelf = member.id === currentUserId;

          return (
            <Panel as="article" className="p-4 md:p-5" key={member.id} variant="elevated">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getMemberColorClass(
                        member.color_hex
                      )}`}
                    >
                      {member.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part.charAt(0).toUpperCase())
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                          {member.name}
                        </h3>
                        {isSelf ? <Badge tone="info">You</Badge> : null}
                        <Badge tone={member.is_active ? "success" : "neutral"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {getMemberRoleLabel(member.role)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full justify-center md:w-auto xl:self-start"
                  onClick={() => setActiveMemberId(member.id)}
                  size="sm"
                  tone="secondary"
                  type="button"
                >
                  <ManageIcon className="h-4 w-4" />
                  Manage
                </Button>
              </div>

              <div className="mt-5 hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Role
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {getMemberRoleLabel(member.role)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {formatDate(member.created_at)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {formatDate(member.updated_at)}
                  </p>
                </div>
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
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Role
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {getMemberRoleLabel(activeMember.role)}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Created
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(activeMember.created_at)}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Updated
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(activeMember.updated_at)}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
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

            <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Reset password
              </h3>

              <form
                action={resetMemberPasswordAction}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeMember.id} />

                <Field
                  htmlFor={`member-password-${activeMember.id}`}
                  label="New password"
                >
                  <input
                    className={inputClass}
                    id={`member-password-${activeMember.id}`}
                    minLength={8}
                    name="password"
                    placeholder="Min 8 characters"
                    type="password"
                  />
                </Field>

                <Field
                  htmlFor={`member-password-confirmation-${activeMember.id}`}
                  label="Confirm password"
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
                  Reset password
                </Button>
              </form>
            </section>

            <section className="rounded-[24px] border border-[var(--danger)]/16 bg-[var(--danger-soft)] p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Delete member
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                This permanently removes the account. Audit logs remain.
              </p>

              <form
                action={deleteMemberAction}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
              >
                <input name="id" type="hidden" value={activeMember.id} />

                <Field
                  description="Type the exact member name."
                  htmlFor={`member-delete-${activeMember.id}`}
                  label="Confirmation"
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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemberManagerList } from "./MemberManagerList";

const members = [
  {
    color_hex: "#3B82F6",
    created_at: "2026-04-01T00:00:00Z",
    id: "admin-1",
    is_active: true,
    name: "Super Admin",
    role: "super_admin" as const,
    updated_at: "2026-04-12T00:00:00Z",
  },
  {
    color_hex: "#10B981",
    created_at: "2026-04-01T00:00:00Z",
    id: "member-1",
    is_active: false,
    name: "Member One",
    role: "member" as const,
    updated_at: "2026-04-12T00:00:00Z",
  },
];

describe("MemberManagerList", () => {
  it("marks the current user and filters members", async () => {
    const user = userEvent.setup();
    render(
      <MemberManagerList
        currentUserId="admin-1"
        deleteMemberAction={vi.fn()}
        members={members}
        resetMemberPasswordAction={vi.fn()}
        updateMemberAction={vi.fn()}
      />
    );

    expect(screen.getAllByText("You").length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText("Search by member name or role"), "member one");
    expect(screen.getAllByText("Member One").length).toBeGreaterThan(0);
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });

  it("opens account, password, and delete controls", async () => {
    const user = userEvent.setup();
    render(
      <MemberManagerList
        currentUserId="admin-1"
        deleteMemberAction={vi.fn()}
        members={members}
        resetMemberPasswordAction={vi.fn()}
        updateMemberAction={vi.fn()}
      />
    );

    await user.click(screen.getAllByRole("button", { name: /manage/i })[1]);

    expect(screen.getByRole("dialog", { name: "Manage Member One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete member" })).toBeInTheDocument();
  });
});

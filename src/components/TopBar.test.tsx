import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "./TopBar";

let pathname = "/vehicles";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

const currentUser = {
  name: "FT_TMP_Admin",
  role: "super_admin" as const,
};

describe("TopBar", () => {
  beforeEach(() => {
    pathname = "/vehicles";
  });

  it("traps focus in the mobile drawer and restores focus on Escape", async () => {
    const user = userEvent.setup();
    render(<TopBar currentUser={currentUser} showAdminActions />);

    const opener = screen.getByRole("button", { name: "Open navigation menu" });

    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    const closeButton = within(dialog).getByRole("button", {
      name: "Close navigation menu",
    });

    await waitFor(() => expect(closeButton).toHaveFocus());

    const logoutButton = within(dialog).getByRole("button", { name: "Logout" });
    const brandLink = within(dialog).getByRole("link", { name: /fleet\s*time/i });

    logoutButton.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(brandLink).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(logoutButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Navigation menu" })).not.toBeInTheDocument()
    );
    expect(opener).toHaveFocus();
  });

  it("closes the mobile drawer when the backdrop is pressed", async () => {
    const user = userEvent.setup();
    render(<TopBar currentUser={currentUser} showAdminActions />);

    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));

    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    fireEvent.pointerDown(dialog);

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Navigation menu" })).not.toBeInTheDocument()
    );
  });
});

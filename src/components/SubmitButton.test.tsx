import { render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import { describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./SubmitButton";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    useFormStatus: vi.fn(),
  };
});

const mockedUseFormStatus = vi.mocked(useFormStatus);

describe("SubmitButton", () => {
  it("renders as an enabled submit button while idle", () => {
    mockedUseFormStatus.mockReturnValue({
      action: null,
      data: null,
      method: null,
      pending: false,
    });

    render(<SubmitButton tone="primary">Save changes</SubmitButton>);

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).not.toBeDisabled();
  });

  it("uses the loading state and pending label while submitting", () => {
    mockedUseFormStatus.mockReturnValue({
      action: "/save",
      data: new FormData(),
      method: "post",
      pending: true,
    });

    render(
      <SubmitButton pendingLabel="Saving" tone="primary">
        Save changes
      </SubmitButton>
    );

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
  });
});

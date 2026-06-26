import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastViewport } from "./ToastViewport";

const replace = vi.fn();
const router = { replace };
let pathname = "/vehicles";
let searchParams = new URLSearchParams("success=Saved");

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

describe("ToastViewport", () => {
  beforeEach(() => {
    replace.mockClear();
    pathname = "/vehicles";
    searchParams = new URLSearchParams("success=Saved");
  });

  it("shows success messages and strips query params from the URL", () => {
    render(<ToastViewport />);

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(replace).toHaveBeenCalledWith("/vehicles", { scroll: false });
  });

  it("shows error messages and preserves unrelated query params", () => {
    searchParams = new URLSearchParams("page=2&error=Failed");

    render(<ToastViewport />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
    expect(replace).toHaveBeenCalledWith("/vehicles?page=2", { scroll: false });
  });

  it("does not show toasts on the login page", () => {
    pathname = "/login";

    render(<ToastViewport />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

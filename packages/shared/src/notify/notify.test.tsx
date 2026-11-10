import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { findAxeViolations, renderWithProviders } from "../test";
import { notify } from "./notify";

afterEach(() => {
  act(() => {
    notify.dismissAll();
  });
});

describe("notify (N-8, X-4)", () => {
  it("X-4: a failure toast has role alert", async () => {
    renderWithProviders(<div />);
    act(() => {
      notify.error("Could not save");
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save"
    );
  });

  it("X-4: a success toast has role status", async () => {
    renderWithProviders(<div />);
    act(() => {
      notify.success("Saved");
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
  });

  it("N-8: toasts are dismissible", async () => {
    const user = userEvent.setup();
    renderWithProviders(<div />);
    act(() => {
      notify.error("Could not save");
    });
    await screen.findByRole("alert");
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" })
    );
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("X-4: toasts have no axe violations", async () => {
    const { container } = renderWithProviders(<div />);
    act(() => {
      notify.error("Could not save");
      notify.success("Saved");
    });
    await screen.findByRole("alert");
    expect(await findAxeViolations(document.body)).toEqual([]);
    expect(container).toBeDefined();
  });
});

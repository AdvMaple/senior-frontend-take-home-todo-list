import { ApiError, createInMemoryApi, type User } from "@app/shared";
import { renderWithProviders } from "@app/shared/test";
import { axe } from "vitest-axe";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateUserForm } from "./create-user-form";

describe("CreateUserForm", () => {
  it("A11y: has no accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(<CreateUserForm />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("U-1/U-2/X-1/X-2: validates Username with inline error and focuses the field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateUserForm />);

    const input = screen.getByLabelText("Username");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "username-error");
  });

  it("U-1: calls onCreated(user) after a successful create", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn<(created: User) => void>();

    renderWithProviders(<CreateUserForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText("Username"), "new_user");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
    expect(onCreated.mock.calls[0]?.[0].id).toMatch(/^user-/);
  });

  it("U-3: duplicate username shows inline error and keeps input value", async () => {
    const user = userEvent.setup();
    const { api } = renderWithProviders(<CreateUserForm />);

    await api.createUser({ username: "taken_name" });

    const input = screen.getByLabelText("Username");
    await user.type(input, "taken_name");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(
      await screen.findByText("That username is already taken", {
        selector: "#username-error",
      })
    ).toBeInTheDocument();
    expect(input).toHaveValue("taken_name");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("U-7: RATE_LIMITED shows retry hint inline", async () => {
    const user = userEvent.setup();
    const api = createInMemoryApi({ profile: "small", latencyMs: 0 });
    api.failNext("createUser", new ApiError("RATE_LIMITED", "Too many", 2_000));

    renderWithProviders(<CreateUserForm />, { api });

    await user.type(screen.getByLabelText("Username"), "retry_user");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(
      await screen.findByText("Try again in 2 seconds.", {
        selector: "#username-retry-hint",
      })
    ).toBeInTheDocument();
  });
});

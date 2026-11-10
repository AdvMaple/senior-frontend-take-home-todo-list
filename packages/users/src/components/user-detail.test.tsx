import {
  ApiError,
  createInMemoryApi,
  selectedUserIdAtom,
  themeAtom,
} from "@app/shared";
import { renderWithProviders } from "@app/shared/test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { UserDetail } from "./user-detail";

describe("UserDetail", () => {
  it("U-4/U-8: shows user metadata, todos slot, and theme control", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(
      <UserDetail userId="user-1" todosSlot={<div>todos-slot</div>} />
    );

    expect(await screen.findByText("User detail")).toBeInTheDocument();
    expect(screen.getByText("todos-slot")).toBeInTheDocument();
    expect(screen.getByText("user-1")).toBeInTheDocument();
    expect(store.get(selectedUserIdAtom)).toBe("user-1");

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(store.get(themeAtom)).toBe("dark");
  });

  it("U-6: shows loading status while request is pending", () => {
    const api = createInMemoryApi({ profile: "small", latencyMs: 50 });
    renderWithProviders(<UserDetail userId="user-1" todosSlot={<div />} />, {
      api,
    });

    expect(screen.getByRole("status")).toHaveTextContent("Loading user");
  });

  it("U-5: shows not-found state with custom link slot", async () => {
    renderWithProviders(
      <UserDetail
        userId="missing-user"
        todosSlot={<div />}
        notFoundLinkSlot={<a href="/users/new">Back to create user</a>}
      />
    );

    expect(await screen.findByText("User not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to create user" })
    ).toBeInTheDocument();
  });

  it("U-6: non-404 error renders Try again and recovers after refetch", async () => {
    const user = userEvent.setup();
    const api = createInMemoryApi({ profile: "small", latencyMs: 0 });
    api.failNext("getUser", new ApiError("UNKNOWN", "Network down"));

    renderWithProviders(<UserDetail userId="user-1" todosSlot={<div />} />, {
      api,
    });

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByText("User detail")).toBeInTheDocument();
    });
  });
});

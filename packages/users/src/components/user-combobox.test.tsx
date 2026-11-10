import { renderWithProviders } from "@app/shared/test";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { USER_SEARCH_DEBOUNCE_MS } from "../hooks/useUsersInfinite";
import { UserCombobox } from "./user-combobox";

afterEach(() => {
  vi.useRealTimers();
});

describe("UserCombobox", () => {
  it("Q2/X-2: keyboard can open combobox and select an assignee", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithProviders(
      <UserCombobox
        value={null}
        onValueChange={onValueChange}
        label="Assignee"
      />
    );

    const trigger = screen.getByRole("combobox", { name: "Assignee" });
    trigger.focus();
    await user.keyboard("{Enter}");

    await user.click(
      await screen.findByRole("option", { name: "alice_johnson" })
    );

    expect(onValueChange).toHaveBeenCalledWith("user-1");
  });

  it("Q2: lazy load more appends additional users", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <UserCombobox value={null} onValueChange={() => undefined} limit={1} />
    );

    await user.click(screen.getByRole("combobox", { name: "Assignee" }));
    expect(
      await screen.findByRole("option", { name: "alice_johnson" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more users" }));

    expect(
      await screen.findByRole("option", { name: "bob_johnson" })
    ).toBeInTheDocument();
  });

  it("Q2: resolves a selected user outside the initial options page", async () => {
    renderWithProviders(
      <UserCombobox value="user-2" onValueChange={() => undefined} limit={1} />
    );

    const trigger = screen.getByRole("combobox", { name: "Assignee" });
    expect(trigger).not.toHaveTextContent("user-2");
    expect(await screen.findByText("bob_johnson")).toBeInTheDocument();
  });

  it("Q2: debounced search filters options", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <UserCombobox value={null} onValueChange={() => undefined} />
    );

    await user.click(screen.getByRole("combobox", { name: "Assignee" }));
    const search = await screen.findByPlaceholderText("Search users");
    await user.type(search, "bob");

    act(() => {
      vi.advanceTimersByTime(USER_SEARCH_DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "bob_johnson" })
      ).toBeInTheDocument();
    });
  });
});

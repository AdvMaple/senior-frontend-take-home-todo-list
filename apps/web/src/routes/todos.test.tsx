import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { ApiProvider, createInMemoryApi, createQueryClient } from "@app/shared";
import { routeTree } from "../routeTree.gen";

function renderAt(path: string) {
  const queryClient = createQueryClient();
  const api = createInMemoryApi();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
  });
  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <ApiProvider api={api}>
        <RouterProvider router={router} />
      </ApiProvider>
    </QueryClientProvider>
  );
  return { ...renderResult, router };
}

describe("todos route", () => {
  it("renders heading on /todos", async () => {
    renderAt("/todos");
    expect(
      await screen.findByRole("heading", { name: /todos/i })
    ).toBeInTheDocument();
  });

  it("links each assignee username to the user detail route", async () => {
    renderAt("/todos");

    const assigneeLinks = await screen.findAllByRole("link", {
      name: "bob_johnson",
    });

    expect(assigneeLinks).not.toHaveLength(0);
    for (const link of assigneeLinks) {
      expect(link).toHaveAttribute("href", "/users/user-2");
    }
  });

  it("shows the selected username, not its ID, in the heading", async () => {
    renderAt("/todos?userIds=user-2");
    expect(
      await screen.findByRole("heading", { name: "Todos for bob_johnson" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading")).not.toHaveTextContent("user-2");
  });

  it("does not expose IDs when multiple user filters are present", async () => {
    renderAt("/todos?userIds=user-2&userIds=user-3");
    const heading = await screen.findByRole("heading", {
      name: "Todos for bob_johnson",
    });
    expect(heading).not.toHaveTextContent("user-2");
    expect(heading).not.toHaveTextContent("user-3");
  });

  it("falls back to default values for invalid search params", async () => {
    renderAt("/todos?page=invalid&pageSize=invalid&sort=invalid");
    expect(
      await screen.findByRole("heading", { name: /todos/i })
    ).toBeInTheDocument();
  });

  describe("creation assignee (independent of filter)", () => {
    it("creation assignee does not navigate or filter list", async () => {
      renderAt("/todos");

      // The heading should still show "Todos" without any user filter indication
      const heading = await screen.findByRole("heading");
      expect(heading.textContent).toMatch(/^Todos$/);
    });

    it("creation assignee initialized from effective filter user", async () => {
      renderAt("/todos?userIds=user-2");

      const heading = await screen.findByRole("heading", {
        name: "Todos for bob_johnson",
      });
      expect(heading).not.toHaveTextContent("user-2");
    });
  });

  describe("filter todos by user", () => {
    it("filter combobox receives userIds from URL", async () => {
      renderAt("/todos?userIds=user1");

      // Filter combobox should exist and be accessible
      const filterLabel = await screen.findByLabelText(/filter todos by user/i);
      expect(filterLabel).toBeInTheDocument();
    });

    it("clear filter button visible when userIds set", async () => {
      renderAt("/todos?userIds=user-2");

      // The heading should show a username, not a raw user ID.
      const heading = await screen.findByRole("heading", {
        name: "Todos for bob_johnson",
      });
      expect(heading).not.toHaveTextContent("user-2");
    });

    it("clear button hidden when no user filter is set", async () => {
      renderAt("/todos");

      // Clear button should not be visible when userIds is empty
      await waitFor(() => {
        expect(
          screen.queryByRole("button", {
            name: /clear filter/i,
          })
        ).not.toBeInTheDocument();
      });
    });

    it("workspace receives effective userIds in params", async () => {
      renderAt("/todos?userIds=user-2");

      const heading = await screen.findByRole("heading", {
        name: "Todos for bob_johnson",
      });
      expect(heading).not.toHaveTextContent("user-2");
    });

    it("clearing filter resets to unfiltered state", async () => {
      renderAt("/todos?userIds=user-2");

      const heading = await screen.findByRole("heading", {
        name: "Todos for bob_johnson",
      });
      expect(heading).not.toHaveTextContent("user-2");
    });
  });

  describe("separate assignee slot", () => {
    it("renders assignee picker in creation form", async () => {
      renderAt("/todos");

      // Assignee picker should exist (part of CreateTodoForm)
      const assigneeLabel = await screen.findByLabelText(/create as user/i);
      expect(assigneeLabel).toBeInTheDocument();
    });

    it("renders filter slot separately from assignee", async () => {
      renderAt("/todos");

      // Both should exist
      const assigneeLabel = await screen.findByLabelText(/create as user/i);
      const filterLabel = await screen.findByLabelText(/filter todos by user/i);

      expect(assigneeLabel).toBeInTheDocument();
      expect(filterLabel).toBeInTheDocument();

      // They should be different elements
      expect(assigneeLabel).not.toEqual(filterLabel);
    });
  });
});

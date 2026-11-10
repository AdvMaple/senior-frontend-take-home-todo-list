import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { render, screen } from "@testing-library/react";
import { ApiProvider, createInMemoryApi } from "@app/shared";
import { routeTree } from "../routeTree.gen";

function renderAt(path: string) {
  const queryClient = new QueryClient();
  const api = createInMemoryApi({ profile: "demo" });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ApiProvider api={api}>
        <JotaiProvider>
          <RouterProvider router={router} />
        </JotaiProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}

describe("U-4/U-5: user detail page routing and presentation", () => {
  it("renders user detail for a valid user ID", async () => {
    renderAt("/users/user-1");
    expect(
      await screen.findByText(/user detail/i)
    ).toBeInTheDocument();
  });

  it("displays user information when data loads", async () => {
    renderAt("/users/user-1");
    expect(
      await screen.findByText(/username/i)
    ).toBeInTheDocument();
  });

  it("links to todos for the current user with correct search params", async () => {
    renderAt("/users/user-1");
    const todosLink = await screen.findByRole("link", {
      name: /view todos for this user/i,
    });
    expect(todosLink).toHaveAttribute("href");
    const href = todosLink.getAttribute("href");
    expect(href).toContain("/todos");
    expect(href).toContain("userIds");
  });

  it("has semantic heading for accessibility", async () => {
    renderAt("/users/user-1");
    await screen.findByText(/user detail/i);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
  });
});

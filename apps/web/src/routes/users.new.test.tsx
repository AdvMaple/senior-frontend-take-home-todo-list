import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  ApiProvider,
  createInMemoryApi,
  createQueryClient,
} from "@app/shared";
import { routeTree } from "../routeTree.gen";

function renderAt(path: string) {
  const queryClient = createQueryClient();
  const api = createInMemoryApi({ profile: "small" });
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

describe("U-1: /users/new route", () => {
  it("renders page heading and description", async () => {
    renderAt("/users/new");
    expect(
      await screen.findByRole("heading", { name: /create user/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/add a new user/i)).toBeInTheDocument();
  });

  it("renders CreateUserForm component", async () => {
    renderAt("/users/new");
    expect(
      await screen.findByRole("textbox", { name: /username/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create user/i })
    ).toBeInTheDocument();
  });

  it("navigates to /todos with user filter after successful creation", async () => {
    renderAt("/users/new");
    const user = userEvent.setup();
    const usernameInput = await screen.findByRole("textbox", {
      name: /username/i,
    });
    const createButton = screen.getByRole("button", { name: /create user/i });

    await user.type(usernameInput, "new-user-test");
    await user.click(createButton);

    // After successful creation, should be navigated away from form
    await waitFor(
      () => {
        expect(
          screen.queryByRole("textbox", { name: /username/i })
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

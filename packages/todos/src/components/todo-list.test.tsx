import { renderWithProviders } from "@app/shared/test";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TodoListItem } from "../todo.types";
import { TodoList } from "./todo-list";

function createTodo(
  id: string,
  title: string,
  done = false,
  isPending = false,
  assigneeId = "user-1",
  assigneeUsername = "ada_lovelace"
): TodoListItem {
  return {
    id,
    title,
    done,
    isPending,
    assigneeId,
    assigneeUsername,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("TodoList", () => {
  it("shows the title and assignee while retaining one status checkbox", () => {
    renderWithProviders(
      <TodoList
        items={[
          createTodo(
            "todo-1",
            "Learn React",
            false,
            false,
            "user-7",
            "grace_hopper"
          ),
        ]}
        onToggleDone={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Learn React")).toBeInTheDocument();
    expect(screen.getByText("Assignee: grace_hopper")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: "Mark as done: Learn React" })
    ).toBeInTheDocument();
  });

  it("renders the assignee as a provided navigation link", () => {
    renderWithProviders(
      <TodoList
        items={[
          createTodo(
            "todo-1",
            "Learn React",
            false,
            false,
            "user-7",
            "grace_hopper"
          ),
        ]}
        onToggleDone={vi.fn()}
        onDelete={vi.fn()}
        renderAssignee={(item) => (
          <a href={`/users/${item.assigneeId}`}>{item.assigneeUsername}</a>
        )}
      />
    );

    expect(screen.getByRole("link", { name: "grace_hopper" })).toHaveAttribute(
      "href",
      "/users/user-7"
    );
  });

  it("truncates a 120-character title without expanding the row", () => {
    const longTitle = "a".repeat(120);

    renderWithProviders(
      <TodoList
        items={[createTodo("todo-1", longTitle)]}
        onToggleDone={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const row = screen.getByTestId("todo-row-todo-1");
    const title = screen.getByText(longTitle);

    expect(title).toHaveClass("truncate");
    expect(title.parentElement).toHaveClass("min-w-0", "flex-1");
    expect(row).toHaveClass("gap-3");
  });

  it("T-16: toggles a todo's done state", async () => {
    const user = userEvent.setup();
    const onToggleDone = vi.fn<(item: TodoListItem) => void>();

    renderWithProviders(
      <TodoList
        items={[createTodo("todo-1", "Learn React")]}
        onToggleDone={onToggleDone}
        onDelete={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Mark as done: Learn React" })
    );

    expect(onToggleDone).toHaveBeenCalledWith(
      expect.objectContaining({ id: "todo-1", done: true })
    );
  });

  it("shows a right-aligned trash action and calls onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn<(item: TodoListItem) => void>();
    const todo = createTodo("todo-1", "Completed task", true);

    renderWithProviders(
      <TodoList items={[todo]} onToggleDone={vi.fn()} onDelete={onDelete} />
    );

    await user.click(
      screen.getByRole("button", { name: "Delete todo: Completed task" })
    );

    expect(onDelete).toHaveBeenCalledWith(todo);
  });

  it("disables deletion until a todo is completed", () => {
    renderWithProviders(
      <TodoList
        items={[createTodo("todo-1", "Incomplete task")]}
        onToggleDone={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Delete todo: Incomplete task" })
    ).toBeDisabled();
  });

  it("marks pending rows busy and disables both row actions", () => {
    renderWithProviders(
      <TodoList
        items={[createTodo("todo-1", "Pending task", false, true)]}
        onToggleDone={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const row = screen.getByTestId("todo-row-todo-1");
    expect(row).toHaveAttribute("aria-busy", "true");
    expect(
      within(row).getByRole("checkbox", { name: "Mark as done: Pending task" })
    ).toBeDisabled();
    expect(
      within(row).getByRole("button", { name: "Delete todo: Pending task" })
    ).toBeDisabled();
  });

  it("renders an accessible empty state", () => {
    renderWithProviders(
      <TodoList
        items={[]}
        onToggleDone={vi.fn()}
        onDelete={vi.fn()}
        emptyMessage="No todos to display"
      />
    );

    expect(
      screen.getByRole("status", { name: "Empty todos list" })
    ).toHaveTextContent("No todos to display");
  });
});

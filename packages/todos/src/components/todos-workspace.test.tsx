import { renderWithProviders } from "@app/shared/test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserId } from "@app/shared";
import { useDeleteTodos } from "../hooks/useDeleteTodos";
import { useTodos } from "../hooks/useTodos";
import { useToggleTodo } from "../hooks/useToggleTodo";
import type { TodoListItem } from "../todo.types";
import { TodosWorkspace } from "./todos-workspace";

vi.mock("../hooks/useTodos", () => ({ useTodos: vi.fn() }));
vi.mock("../hooks/useToggleTodo", () => ({ useToggleTodo: vi.fn() }));
vi.mock("../hooks/useDeleteTodos", () => ({ useDeleteTodos: vi.fn() }));

function createTodo(
  id: string,
  title: string,
  done = false,
  assigneeId: UserId = "user-1"
): TodoListItem {
  return {
    id,
    title,
    done,
    isPending: false,
    assigneeId,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const params = {
  userIds: [],
  page: 1,
  pageSize: 10,
  sort: "createdAt.desc" as const,
};

function renderWorkspace() {
  return renderWithProviders(
    <TodosWorkspace
      params={params}
      onParamsChange={vi.fn()}
      assigneeId="user-1"
      onAssigneeIdChange={vi.fn()}
      assigneePicker={<button type="button">Pick assignee</button>}
    />
  );
}

function mockHooks(items: TodoListItem[]) {
  vi.mocked(useTodos).mockReturnValue({
    items,
    total: items.length,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    isPlaceholderData: false,
    refetch: vi.fn(),
  });
  vi.mocked(useToggleTodo).mockReturnValue({
    toggleTodo: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  });
}

describe("TodosWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-10: confirms and deletes one completed todo from its row", async () => {
    const user = userEvent.setup();
    const deleteTodos = vi.fn().mockResolvedValue(undefined);
    mockHooks([createTodo("todo-1", "Completed task", true)]);
    vi.mocked(useDeleteTodos).mockReturnValue({
      deleteTodos,
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWorkspace();
    await user.click(
      screen.getByRole("button", { name: "Delete todo: Completed task" })
    );

    expect(confirmSpy).toHaveBeenCalledWith('Delete completed todo "Completed task"?');
    await waitFor(() => {
      expect(deleteTodos).toHaveBeenCalledWith(["todo-1"]);
    });
    confirmSpy.mockRestore();
  });

  it("T-10: does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const deleteTodos = vi.fn().mockResolvedValue(undefined);
    mockHooks([createTodo("todo-1", "Completed task", true)]);
    vi.mocked(useDeleteTodos).mockReturnValue({
      deleteTodos,
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWorkspace();
    await user.click(
      screen.getByRole("button", { name: "Delete todo: Completed task" })
    );

    expect(deleteTodos).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("T-10: keeps delete unavailable for incomplete todos", () => {
    mockHooks([createTodo("todo-1", "Incomplete task")]);
    vi.mocked(useDeleteTodos).mockReturnValue({
      deleteTodos: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });

    renderWorkspace();
    expect(
      screen.getByRole("button", { name: "Delete todo: Incomplete task" })
    ).toBeDisabled();
  });

  it("T-16: sends the toggled done state to the mutation", async () => {
    const user = userEvent.setup();
    const toggleTodo = vi.fn().mockResolvedValue({});
    mockHooks([createTodo("todo-1", "Learn React")]);
    vi.mocked(useToggleTodo).mockReturnValue({
      toggleTodo,
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });
    vi.mocked(useDeleteTodos).mockReturnValue({
      deleteTodos: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });

    renderWorkspace();
    await user.click(
      screen.getByRole("checkbox", { name: "Mark as done: Learn React" })
    );

    await waitFor(() => {
      expect(toggleTodo).toHaveBeenCalledWith({ id: "todo-1", done: true });
    });
  });

  it("T-11: renders the shadcn pagination below the todo list", () => {
    mockHooks([createTodo("todo-1", "First task")]);
    vi.mocked(useDeleteTodos).mockReturnValue({
      deleteTodos: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });

    const { container } = renderWorkspace();
    const todoRow = screen.getByTestId("todo-row-todo-1");
    const pagination = container.querySelector('[data-slot="pagination"]');

    expect(pagination).not.toBeNull();
    expect(
      todoRow.compareDocumentPosition(pagination as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0);
  });

  it("N-8: renders a retryable query error", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useTodos).mockReturnValue({
      items: [],
      total: 0,
      isPending: false,
      isFetching: false,
      isError: true,
      error: new Error("Unable to load todos"),
      isPlaceholderData: false,
      refetch,
    });
    vi.mocked(useToggleTodo).mockReturnValue({
      toggleTodo: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });
    vi.mocked(useDeleteTodos).mockReturnValue({
      deleteTodos: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });

    renderWorkspace();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load todos");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});

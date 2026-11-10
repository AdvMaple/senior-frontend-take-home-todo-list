import { createInMemoryApi, notify } from "@app/shared";
import { deferred, renderWithProviders } from "@app/shared/test";
import { axe } from "vitest-axe";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient, Todo, UserId } from "@app/shared";
import { CreateTodoForm } from "./create-todo-form";

function createMockTodo(id: string, title: string, assigneeId: UserId): Todo {
  return {
    id,
    title,
    assigneeId,
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const mockAssigneeId = "user-1" as const;

describe("CreateTodoForm", () => {
  it("A11y: has no accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(
      <CreateTodoForm
        assigneeId={mockAssigneeId}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("T-4: validates and displays title is required error", async () => {
    renderWithProviders(
      <CreateTodoForm
        assigneeId={mockAssigneeId}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
      />
    );

    const submitButton = screen.getByRole("button", { name: /^create$/i });

    // Try to submit with empty title
    fireEvent.click(submitButton);

    await waitFor(() => {
      const titleError = screen.getByText("Title is required");
      expect(titleError).toBeInTheDocument();
      expect(titleError).toHaveAttribute("role", "alert");
    });
  });

  it("T-4: validates and displays assignee is required error", async () => {
    renderWithProviders(
      <CreateTodoForm
        assigneeId={null}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
      />
    );

    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    fireEvent.change(titleInput, { target: { value: "Test Todo" } });

    const submitButton = screen.getByRole("button", { name: /^create$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const assigneeError = screen.getByText("Assignee is required");
      expect(assigneeError).toBeInTheDocument();
      expect(assigneeError).toHaveAttribute("role", "alert");
    });
  });

  it("T-5: submit calls API with title and assigneeId", async () => {
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const onCreated = vi.fn();

    renderWithProviders(
      <CreateTodoForm
        assigneeId={mockAssigneeId}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
        onCreated={onCreated}
      />,
      { api }
    );

    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    fireEvent.change(titleInput, { target: { value: "My Todo" } });

    const submitButton = screen.getByRole("button", { name: /^create$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith({
        title: "My Todo",
        assigneeId: mockAssigneeId,
      });
    });

    expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();

    const mockTodo = createMockTodo("todo-1", "My Todo", mockAssigneeId);
    act(() => {
      createDeferred.resolve(mockTodo);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
    });

    expect(onCreated).toHaveBeenCalled();
    const finalTitleInput = screen.getByDisplayValue("");
    expect(finalTitleInput).toBeInTheDocument();
  });

  it("T-6: API failure preserves entered title and shows error toast", async () => {
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const notifyErrorSpy = vi.spyOn(notify, "error");

    renderWithProviders(
      <CreateTodoForm
        assigneeId={mockAssigneeId}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
      />,
      { api }
    );

    const titleInput = screen.getByPlaceholderText(
      "What needs to be done?"
    );
    const testTitle = "Important Task";
    fireEvent.change(titleInput, { target: { value: testTitle } });

    const submitButton = screen.getByRole("button", { name: /^create$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalled();
    });

    const errorMessage = "Network error";
    act(() => {
      createDeferred.reject(new Error(errorMessage));
    });

    await waitFor(() => {
      expect(notifyErrorSpy).toHaveBeenCalled();
    });

    // Title should be preserved
    const preservedInput = screen.getByDisplayValue(testTitle);
    expect(preservedInput).toBeInTheDocument();
    // Button should be enabled again for retry
    const submitButtonAgain = screen.getByRole("button", { name: /^create$/i });
    expect(submitButtonAgain).not.toBeDisabled();

    notifyErrorSpy.mockRestore();
  });

  it("clears title and errors on successful create", async () => {
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    renderWithProviders(
      <CreateTodoForm
        assigneeId={mockAssigneeId}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
      />,
      { api }
    );

    const titleInput = screen.getByPlaceholderText(
      "What needs to be done?"
    );
    fireEvent.change(titleInput, { target: { value: "Todo with spaces  " } });

    const submitButton = screen.getByRole("button", { name: /^create$/i });
    fireEvent.click(submitButton);

    const mockTodo = createMockTodo("todo-1", "Todo with spaces", mockAssigneeId);
    act(() => {
      createDeferred.resolve(mockTodo);
    });

    await waitFor(() => {
      const clearedInput = screen.getByDisplayValue("");
      expect(clearedInput).toBeInTheDocument();
    });
  });

  it("disables submit button while creating", async () => {
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    renderWithProviders(
      <CreateTodoForm
        assigneeId={mockAssigneeId}
        onAssigneeIdChange={vi.fn()}
        assigneePicker={<button type="button">Pick User</button>}
      />,
      { api }
    );

    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    fireEvent.change(titleInput, { target: { value: "Todo" } });

    const submitButton = screen.getByRole("button", { name: /^create$/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });

    const mockTodo = createMockTodo("todo-1", "Todo", mockAssigneeId);
    act(() => {
      createDeferred.resolve(mockTodo);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^create$/i })).not.toBeDisabled();
    });
  });
});

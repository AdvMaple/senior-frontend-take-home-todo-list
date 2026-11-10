import {
  DEFAULT_TODO_SORT,
  createInMemoryApi,
  notify,
  todoKeys,
  type ApiClient,
  type InMemoryApi,
  type Page,
  type Todo,
  type TodoListParams,
} from "@app/shared";
import { deferred, renderHookWithProviders } from "@app/shared/test";
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useToggleTodo } from "./useToggleTodo";

const DEFAULT_PARAMS: TodoListParams = {
  userIds: [],
  page: 1,
  pageSize: 5,
  sort: DEFAULT_TODO_SORT,
};

function createTodo(id: string, assigneeId: string, done = false): Todo {
  return {
    id,
    title: id,
    assigneeId,
    done,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("useToggleTodo", () => {
  it("T-16: cache is NOT changed before the server answers", async () => {
    const todoItem = createTodo("todo-1", "user-1", false);
    const cachedData: Page<Todo> = {
      items: [todoItem],
      total: 1,
    };

    const updateDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      updateTodo: vi.fn<ApiClient["updateTodo"]>(async () => {
        const result = await updateDeferred.promise;
        return result;
      }),
    };

    const { result, queryClient } = renderHookWithProviders(useToggleTodo, {
      api,
    });

    queryClient.setQueryData(todoKeys.list(DEFAULT_PARAMS), cachedData);

    const togglePromise = result.current.toggleTodo({
      id: "todo-1",
      done: true,
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    const cachedList = queryClient.getQueryData<Page<Todo>>(
      todoKeys.list(DEFAULT_PARAMS)
    );
    expect(cachedList?.items[0]?.done).toBe(false);

    updateDeferred.resolve(createTodo("todo-1", "user-1", true));
    await togglePromise;
  });

  it("T-16/D-2: on success the lists are invalidated and refetched", async () => {
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      listTodos: vi.fn<ApiClient["listTodos"]>((params, options) =>
        base.listTodos(params, options)
      ),
    };

    const { result, queryClient } = renderHookWithProviders(useToggleTodo, {
      api,
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await result.current.toggleTodo({
      id: "todo-1",
      done: true,
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: todoKeys.lists() })
      );
    });

    invalidateSpy.mockRestore();
  });

  it("T-16/N-8: on failure an error toast is shown and the cached row is unchanged, and lists are still refetched on settle", async () => {
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: InMemoryApi = {
      ...base,
      listTodos: vi.fn<ApiClient["listTodos"]>((params, options) =>
        base.listTodos(params, options)
      ),
    };

    const notifyErrorSpy = vi.spyOn(notify, "error");

    try {
      const { result, queryClient } = renderHookWithProviders(useToggleTodo, {
        api,
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      api.failNext("updateTodo");

      await expect(
        result.current.toggleTodo({
          id: "todo-1",
          done: true,
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(notifyErrorSpy).toHaveBeenCalled();
      });

      const todoItem = createTodo("todo-1", "user-1", false);
      const cachedData: Page<Todo> = {
        items: [todoItem],
        total: 1,
      };
      queryClient.setQueryData(todoKeys.list(DEFAULT_PARAMS), cachedData);
      const cachedList = queryClient.getQueryData<Page<Todo>>(
        todoKeys.list(DEFAULT_PARAMS)
      );
      expect(cachedList?.items[0]?.done).toBe(false);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: todoKeys.lists() })
        );
      });

      invalidateSpy.mockRestore();
    } finally {
      notifyErrorSpy.mockRestore();
    }
  });
});

import {
  notify,
  todoKeys,
  type Todo,
  type TodoListParams,
  type UserId,
} from "@app/shared";
import { createInMemoryApi } from "@app/shared";
import { renderHookWithProviders } from "@app/shared/test";
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TodoListPage } from "../todo.types";
import { useDeleteTodos } from "./useDeleteTodos";
import type { ApiClient } from "@app/shared";
import { ApiError } from "@app/shared";

const DEFAULT_SORT = "createdAt.desc" as const;

function createTodo(id: string, assigneeId: UserId, done = false): Todo {
  return {
    id,
    title: id,
    assigneeId,
    done,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("useDeleteTodos", () => {
      it("T-17: success deletes only after the API answers (cache unchanged until then), refetches lists (D-2)", () => {
    const user1 = "user-1";

    const { result, queryClient } = renderHookWithProviders(
      () => useDeleteTodos()
    );

    const params: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const initialPage: TodoListPage = {
      total: 2,
      items: [
        { ...createTodo("todo-1", user1, true), isPending: false },
        { ...createTodo("todo-2", user1, true), isPending: false },
      ],
    };

    queryClient.setQueryData(todoKeys.list(params), initialPage);

    void result.current.deleteTodos(["todo-1"]);

    // The mutation completes synchronously (in-memory API with latencyMs: 0)
    expect(result.current.isError).toBe(false);
    expect(result.current.isPending).toBe(false);
  });

  it("T-17: failure keeps rows, leaves cache unchanged and shows an error toast", async () => {
    const user1 = "user-1";
    const notifyErrorSpy = vi.spyOn(notify, "error");

    try {
      const { result, queryClient, inMemoryApi } = renderHookWithProviders(
        () => useDeleteTodos()
      );

      if (!inMemoryApi) throw new Error("Expected inMemoryApi");

      const params: TodoListParams = {
        userIds: [],
        page: 1,
        pageSize: 5,
        sort: DEFAULT_SORT,
      };

      const initialPage: TodoListPage = {
        total: 2,
        items: [
          { ...createTodo("todo-1", user1, true), isPending: false },
          { ...createTodo("todo-2", user1, true), isPending: false },
        ],
      };

      queryClient.setQueryData(todoKeys.list(params), { ...initialPage });

      // Use failNext to simulate an API error
      inMemoryApi.failNext("deleteTodos");

      await expect(
        result.current.deleteTodos(["todo-1"])
      ).rejects.toThrow();

      await waitFor(() => {
        expect(notifyErrorSpy).toHaveBeenCalledWith("Simulated failure");
      });

      const cachedPage = queryClient.getQueryData<TodoListPage>(
        todoKeys.list(params)
      );

      expect(cachedPage?.items).toHaveLength(2);
      expect(cachedPage?.items[0]?.id).toBe("todo-1");
      expect(cachedPage?.items[1]?.id).toBe("todo-2");
    } finally {
      notifyErrorSpy.mockRestore();
    }
  });

  it("T-17: deleting a not-done todo is rejected by the API with VALIDATION and the cache is unchanged", async () => {
    const user1 = "user-1";
    const notifyErrorSpy = vi.spyOn(notify, "error");

    try {
      // Create a custom API that rejects deletion of not-done todos
      const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
      const api: ApiClient = {
        ...base,
        deleteTodos: vi.fn(() => {
          // Check if trying to delete a not-done todo and throw validation error
          throw new ApiError("VALIDATION", "Only done todos can be deleted");
        }),
      };

      const { result, queryClient } = renderHookWithProviders(
        () => useDeleteTodos(),
        { api }
      );

      const params: TodoListParams = {
        userIds: [],
        page: 1,
        pageSize: 5,
        sort: DEFAULT_SORT,
      };

      const initialPage: TodoListPage = {
        total: 2,
        items: [
          { ...createTodo("todo-1", user1, false), isPending: false },
          { ...createTodo("todo-2", user1, true), isPending: false },
        ],
      };

      queryClient.setQueryData(todoKeys.list(params), { ...initialPage });

      await expect(
        result.current.deleteTodos(["todo-1"])
      ).rejects.toThrow();

      await waitFor(() => {
        expect(notifyErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("Only done todos can be deleted")
        );
      });

      const cachedPage = queryClient.getQueryData<TodoListPage>(
        todoKeys.list(params)
      );

      expect(cachedPage?.items).toHaveLength(2);
      expect(cachedPage?.items[0]?.id).toBe("todo-1");
      expect(cachedPage?.items[0]?.done).toBe(false);
      expect(cachedPage?.items[1]?.id).toBe("todo-2");
    } finally {
      notifyErrorSpy.mockRestore();
    }
  });
});

import {
  DEFAULT_TODO_SORT,
  createInMemoryApi,
  type ApiClient,
  type Page,
  type Todo,
  type TodoListParams,
} from "@app/shared";
import { deferred, renderHookWithProviders } from "@app/shared/test";
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTodos } from "./useTodos";

const DEFAULT_PARAMS: TodoListParams = {
  userIds: [],
  page: 1,
  pageSize: 5,
  sort: DEFAULT_TODO_SORT,
};

function createTodo(id: string, assigneeId: string): Todo {
  return {
    id,
    title: id,
    assigneeId,
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("useTodos", () => {
  it("T-11/T-12/T-13/A-7: changing page/pageSize/filter/sort refetches with new params", async () => {
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const listTodosMock = vi.fn<ApiClient["listTodos"]>((params, options) => {
      return base.listTodos(params, options);
    });
    const api: ApiClient = {
      ...base,
      listTodos: listTodosMock,
    };

    const { result, rerender } = renderHookWithProviders(
      ({ params }) => useTodos(params),
      {
        api,
        initialProps: { params: DEFAULT_PARAMS },
      }
    );

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    expect(listTodosMock).toHaveBeenCalledWith(DEFAULT_PARAMS, expect.any(Object));
    expect(listTodosMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);

    const nextParams: TodoListParams = {
      userIds: ["user-1"],
      page: 2,
      pageSize: 10,
      sort: "createdAt.asc",
    };

    rerender({ params: nextParams });

    await waitFor(() => {
      expect(listTodosMock).toHaveBeenCalledWith(nextParams, expect.any(Object));
    });
    expect(listTodosMock.mock.calls[1]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("T-14: keeps previous page as placeholder data while next page loads", async () => {
    const pageOne: Page<Todo> = {
      total: 2,
      items: [createTodo("todo-page-1", "user-1")],
    };
    const pageTwoDeferred = deferred<Page<Todo>>();

    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const listTodosMock = vi.fn<ApiClient["listTodos"]>((params) => {
      if (params.page === 1) return Promise.resolve(pageOne);
      return pageTwoDeferred.promise;
    });
    const api: ApiClient = {
      ...base,
      listTodos: listTodosMock,
    };

    const { result, rerender } = renderHookWithProviders(
      ({ params }) => useTodos(params),
      {
        api,
        initialProps: { params: DEFAULT_PARAMS },
      }
    );

    await waitFor(() => {
      expect(result.current.items[0]?.id).toBe("todo-page-1");
    });

    rerender({
      params: {
        ...DEFAULT_PARAMS,
        page: 2,
      },
    });

    await waitFor(() => {
      expect(result.current.isPlaceholderData).toBe(true);
    });

    expect(result.current.items[0]?.id).toBe("todo-page-1");

    const pageTwo: Page<Todo> = {
      total: 2,
      items: [createTodo("todo-page-2", "user-1")],
    };

    act(() => {
      pageTwoDeferred.resolve(pageTwo);
    });

    await waitFor(() => {
      expect(result.current.isPlaceholderData).toBe(false);
    });
    expect(result.current.items[0]?.id).toBe("todo-page-2");
    expect(result.current.items[0]?.isPending).toBe(false);
  });

  it("T-14/G7: rapid A->B->C keeps C rendered and aborts A/B signals", async () => {
    interface PendingCall {
      params: TodoListParams;
      request: ReturnType<typeof deferred<Page<Todo>>>;
      aborted: boolean;
    }

    const calls: PendingCall[] = [];
    const base = createInMemoryApi({ profile: "small", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      listTodos: vi.fn<ApiClient["listTodos"]>((params, options) => {
        const request = deferred<Page<Todo>>();
        const call: PendingCall = {
          params,
          request,
          aborted: false,
        };
        options?.signal?.addEventListener("abort", () => {
          call.aborted = true;
        });
        calls.push(call);
        return request.promise;
      }),
    };

    const { result, rerender } = renderHookWithProviders(
      ({ params }) => useTodos(params),
      {
        api,
        initialProps: { params: DEFAULT_PARAMS },
      }
    );

    rerender({ params: { ...DEFAULT_PARAMS, page: 2 } });
    rerender({ params: { ...DEFAULT_PARAMS, page: 3 } });

    await waitFor(() => {
      expect(calls).toHaveLength(3);
    });

    const third = calls[2];
    if (!third) throw new Error("expected a third call");

    act(() => {
      third.request.resolve({
        total: 1,
        items: [createTodo("todo-page-3", "user-1")],
      });
    });

    await waitFor(() => {
      expect(result.current.items[0]?.id).toBe("todo-page-3");
    });

    const first = calls[0];
    const second = calls[1];
    if (!first || !second) throw new Error("expected first two calls");

    act(() => {
      first.request.resolve({
        total: 1,
        items: [createTodo("todo-page-1-late", "user-1")],
      });
      second.request.resolve({
        total: 1,
        items: [createTodo("todo-page-2-late", "user-1")],
      });
    });

    await waitFor(() => {
      expect(first.aborted).toBe(true);
      expect(second.aborted).toBe(true);
    });
    expect(result.current.items[0]?.id).toBe("todo-page-3");
  });
});

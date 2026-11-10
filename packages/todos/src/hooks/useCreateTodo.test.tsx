import {
  createInMemoryApi,
  notify,
  todoKeys,
  type ApiClient,
  type CreateTodoInput,
  type Todo,
  type TodoListParams,
  type UserId,
} from "@app/shared";
import { deferred, renderHookWithProviders } from "@app/shared/test";
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TodoListItem, TodoListPage } from "../todo.types";
import { useCreateTodo } from "./useCreateTodo";

const DEFAULT_SORT = "createdAt.desc" as const;

function createTodo(id: string, assigneeId: UserId): Todo {
  return {
    id,
    title: id,
    assigneeId,
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function todoListItem(todo: Todo): TodoListItem {
  return { ...todo, isPending: false };
}

describe("useCreateTodo", () => {
  it("T-5/T-15: optimistic temp item appears first with isPending before API resolves", async () => {
    const user1 = "user-1";
    const user2 = "user-2";
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const { result, queryClient } = renderHookWithProviders(
      () => useCreateTodo(),
      {
        api,
      }
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
        todoListItem(createTodo("todo-1", user1)),
        todoListItem(createTodo("todo-2", user2)),
      ],
    };

    queryClient.setQueryData(todoKeys.list(params), initialPage);

    const input: CreateTodoInput = { title: "new todo", assigneeId: user1 };

    const mutation = result.current.createTodo(input);
    act(() => {
      void mutation;
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    const cachedPage = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(params)
    );

    expect(cachedPage).toBeDefined();
    expect(cachedPage?.total).toBe(3);
    expect(cachedPage?.items).toHaveLength(3);
    const firstItem = cachedPage?.items[0];
    expect(firstItem).toBeDefined();
    expect(firstItem).toMatchObject({
      title: "new todo",
      assigneeId: user1,
      isPending: true,
    });
    expect(firstItem?.id).toMatch(/^temp-todo-/);

    if (firstItem?.id) {
      const serverId = firstItem.id.replace(/^temp-/, "server-");
      act(() => {
        createDeferred.resolve(createTodo(serverId, user1));
      });
    }

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("T-7: server id replaces temp id, exactly one item, lists refetched (D-2)", async () => {
    const user1 = "user-1";
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const { result, queryClient } = renderHookWithProviders(
      () => useCreateTodo(),
      {
        api,
      }
    );

    const params: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const initialPage: TodoListPage = {
      total: 1,
      items: [todoListItem(createTodo("todo-1", user1))],
    };

    queryClient.setQueryData(todoKeys.list(params), initialPage);

    const input: CreateTodoInput = { title: "new todo", assigneeId: user1 };

    const mutation = result.current.createTodo(input);
    act(() => {
      void mutation;
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    const tempItem = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(params)
    )?.items[0];
    expect(tempItem?.isPending).toBe(true);

    const serverId = "server-todo-123";
    const serverTodo: Todo = {
      id: serverId,
      title: "new todo",
      assigneeId: user1,
      done: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    act(() => {
      createDeferred.resolve(serverTodo);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const finalPage = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(params)
    );

    expect(finalPage?.items).toHaveLength(2);
    expect(finalPage?.total).toBe(2);
    expect(finalPage?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: serverId, isPending: false }),
      ])
    );
    expect(
      finalPage?.items.filter((item) => item.title === "new todo")
    ).toHaveLength(1);
  });

  it("T-6: on failure, touched lists restored to pre-submit snapshot, notify.error called", async () => {
    const user1 = "user-1";
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const notifyErrorSpy = vi.spyOn(notify, "error");

    const { result, queryClient } = renderHookWithProviders(
      () => useCreateTodo(),
      {
        api,
      }
    );

    const params: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const originalItem = todoListItem(createTodo("todo-1", user1));
    const initialPage: TodoListPage = {
      total: 1,
      items: [originalItem],
    };

    queryClient.setQueryData(todoKeys.list(params), { ...initialPage });

    const input: CreateTodoInput = { title: "new todo", assigneeId: user1 };

    const mutation = result.current.createTodo(input);
    mutation.catch(() => {
      // Handled by mutation.onError
    });
    act(() => {
      void mutation;
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    const errorMessage = "Server error";
    act(() => {
      createDeferred.reject(new Error(errorMessage));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const restoredPage = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(params)
    );

    expect(restoredPage?.items).toEqual([originalItem]);
    expect(restoredPage?.total).toBe(1);
    expect(notifyErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Could not create todo")
    );

    notifyErrorSpy.mockRestore();
  });

  it("T-8/T-15: temp item not inserted into filtered lists, page 2, or asc-sort lists", async () => {
    const user1 = "user-1";
    const user2 = "user-2";
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const { result, queryClient } = renderHookWithProviders(
      () => useCreateTodo(),
      {
        api,
      }
    );

    const paramsPage1Desc: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const paramsPage2Desc: TodoListParams = {
      userIds: [],
      page: 2,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const paramsPage1Asc: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: "createdAt.asc",
    };

    const paramsFilteredUser2: TodoListParams = {
      userIds: [user2],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const initialPage: TodoListPage = {
      total: 1,
      items: [todoListItem(createTodo("todo-1", user2))],
    };

    queryClient.setQueryData(todoKeys.list(paramsPage1Desc), {
      total: 1,
      items: [todoListItem(createTodo("todo-1", user1))],
    });
    queryClient.setQueryData(todoKeys.list(paramsPage2Desc), {
      total: 2,
      items: [todoListItem(createTodo("todo-2", user1))],
    });
    queryClient.setQueryData(todoKeys.list(paramsPage1Asc), {
      total: 1,
      items: [todoListItem(createTodo("todo-1", user1))],
    });
    queryClient.setQueryData(todoKeys.list(paramsFilteredUser2), {
      ...initialPage,
    });

    const input: CreateTodoInput = { title: "new todo", assigneeId: user1 };

    const mutation = result.current.createTodo(input);
    act(() => {
      void mutation;
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    const page1Desc = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(paramsPage1Desc)
    );
    const page2Desc = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(paramsPage2Desc)
    );
    const page1Asc = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(paramsPage1Asc)
    );
    const filteredUser2 = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(paramsFilteredUser2)
    );

    expect(page1Desc?.items[0]?.isPending).toBe(true);
    expect(page1Desc?.items[0]?.assigneeId).toBe(user1);

    expect(page2Desc?.items).toHaveLength(1);
    expect(page2Desc?.items.every((item) => !item.isPending)).toBe(true);

    expect(page1Asc?.items).toHaveLength(1);
    expect(page1Asc?.items.every((item) => !item.isPending)).toBe(true);

    expect(filteredUser2?.items).toEqual([initialPage.items[0]]);

    act(() => {
      createDeferred.resolve(createTodo("server-123", user1));
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("T-9: two overlapping creates where second fails - first persists, second rolled back independently", async () => {
    const user1 = "user-1";
    const createDeferred1 = deferred<Todo>();
    const createDeferred2 = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });

    let createCallCount = 0;
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(() => {
        createCallCount += 1;
        if (createCallCount === 1) return createDeferred1.promise;
        return createDeferred2.promise;
      }),
    };

    const { result, queryClient } = renderHookWithProviders(
      () => useCreateTodo(),
      {
        api,
      }
    );

    const params: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const initialPage: TodoListPage = {
      total: 0,
      items: [],
    };

    queryClient.setQueryData(todoKeys.list(params), { ...initialPage });

    const input1: CreateTodoInput = { title: "first todo", assigneeId: user1 };
    const input2: CreateTodoInput = {
      title: "second todo",
      assigneeId: user1,
    };

    const mutation1 = result.current.createTodo(input1);
    mutation1.catch(() => {
      // Handled by mutation.onError
    });
    act(() => {
      void mutation1;
    });

    await waitFor(() => {
      const page = queryClient.getQueryData<TodoListPage>(
        todoKeys.list(params)
      );
      expect(page?.items).toHaveLength(1);
    });

    const mutation2 = result.current.createTodo(input2);
    mutation2.catch(() => {
      // Handled by mutation.onError
    });
    act(() => {
      void mutation2;
    });

    await waitFor(() => {
      const page = queryClient.getQueryData<TodoListPage>(
        todoKeys.list(params)
      );
      expect(page?.items).toHaveLength(2);
    });

    const page2Items = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(params)
    )?.items;
    const tempId2 = page2Items?.[0]?.id;

    const serverTodo1: Todo = {
      id: "server-1",
      title: "first todo",
      assigneeId: user1,
      done: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    act(() => {
      createDeferred1.resolve(serverTodo1);
    });

    await waitFor(() => {
      const page = queryClient.getQueryData<TodoListPage>(
        todoKeys.list(params)
      );
      expect(page?.items.some((item) => item.id === "server-1")).toBe(true);
    });

    const errorMessage = "Failed";
    act(() => {
      createDeferred2.reject(new Error(errorMessage));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const finalPage = queryClient.getQueryData<TodoListPage>(
      todoKeys.list(params)
    );

    // T-9: Exact final cache state assertions after overlapping mutations
    expect(finalPage).toBeDefined();
    expect(finalPage?.total).toBe(1);
    expect(finalPage?.items).toHaveLength(1);
    expect(finalPage?.items[0]).toEqual(
      expect.objectContaining({
        id: "server-1",
        title: "first todo",
        assigneeId: user1,
        isPending: false,
      })
    );
    // Ensure tempId2 is removed
    expect(finalPage?.items.some((item) => item.id === tempId2)).toBe(false);
    // Ensure no temporary items remain
    expect(
      finalPage?.items.some((item) => item.id.startsWith("temp-"))
    ).toBe(false);
    // Ensure second todo is not present
    expect(
      finalPage?.items.some((item) => item.title === "second todo")
    ).toBe(false);
  });

  it("D-2: onSettled invalidates todoKeys.lists()", async () => {
    const user1 = "user-1";
    const createDeferred = deferred<Todo>();
    const base = createInMemoryApi({ profile: "demo", latencyMs: 0 });
    const api: ApiClient = {
      ...base,
      createTodo: vi.fn<ApiClient["createTodo"]>(
        () => createDeferred.promise
      ),
    };

    const { result, queryClient } = renderHookWithProviders(
      () => useCreateTodo(),
      {
        api,
      }
    );

    const params: TodoListParams = {
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: DEFAULT_SORT,
    };

    const initialPage: TodoListPage = {
      total: 1,
      items: [todoListItem(createTodo("todo-1", user1))],
    };

    queryClient.setQueryData(todoKeys.list(params), initialPage);

    const input: CreateTodoInput = { title: "new todo", assigneeId: user1 };

    const invalidateQuerySpy = vi.spyOn(queryClient, "invalidateQueries");

    const mutation = result.current.createTodo(input);
    act(() => {
      void mutation;
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    act(() => {
      createDeferred.resolve(createTodo("server-123", user1));
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    await waitFor(() => {
      expect(invalidateQuerySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: todoKeys.lists(),
        })
      );
    });

    invalidateQuerySpy.mockRestore();
  });
});

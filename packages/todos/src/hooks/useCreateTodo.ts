import { isApiError, notify, todoKeys, useApi } from "@app/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTodoInput,
  Todo,
  TodoListParams,
  TodoSort,
  UserId,
} from "@app/shared";
import type { QueryKey } from "@tanstack/react-query";
import type { TodoListItem, TodoListPage } from "../todo.types";
import type {
  CreateTodoMutationContext,
  TodoListKeyParams,
  TodoListSnapshot,
  UseCreateTodoResult,
} from "./useCreateTodo.types";

const DEFAULT_SORT: TodoSort = "createdAt.desc";
const LIST_KEY_ROOT = todoKeys.lists();
let optimisticTodoCounter = 0;

function nextTempId(): string {
  optimisticTodoCounter += 1;
  return `temp-todo-${String(optimisticTodoCounter)}`;
}

function cloneListPage(page: TodoListPage | undefined): TodoListPage | undefined {
  if (!page) return undefined;
  return {
    total: page.total,
    items: page.items.map((item) => ({ ...item })),
  };
}

function isTodoSort(value: unknown): value is TodoSort {
  return value === "createdAt.asc" || value === "createdAt.desc";
}

function isTodoListKeyParams(value: unknown): value is TodoListKeyParams {
  if (typeof value !== "object" || value === null) return false;

  const maybe = value as Record<string, unknown>;
  return (
    Array.isArray(maybe.userIds) &&
    maybe.userIds.every((id) => typeof id === "string") &&
    typeof maybe.page === "number" &&
    Number.isInteger(maybe.page) &&
    typeof maybe.pageSize === "number" &&
    Number.isInteger(maybe.pageSize) &&
    isTodoSort(maybe.sort)
  );
}

function readListParams(queryKey: QueryKey): TodoListParams | null {
  if (!Array.isArray(queryKey)) return null;

  const [root, listToken, maybeParams] = queryKey as readonly unknown[];
  if (root !== LIST_KEY_ROOT[0] || listToken !== LIST_KEY_ROOT[1]) return null;
  if (!isTodoListKeyParams(maybeParams)) return null;

  return {
    userIds: maybeParams.userIds,
    page: maybeParams.page,
    pageSize: maybeParams.pageSize,
    sort: maybeParams.sort,
  };
}

function shouldOptimisticallyInsert(
  params: TodoListParams,
  assigneeId: UserId
): boolean {
  const includesAssignee =
    params.userIds.length === 0 || params.userIds.includes(assigneeId);
  return includesAssignee && params.page === 1 && params.sort === DEFAULT_SORT;
}

function buildOptimisticTodo(input: CreateTodoInput, tempId: string): TodoListItem {
  return {
    id: tempId,
    title: input.title.trim(),
    assigneeId: input.assigneeId,
    done: false,
    createdAt: new Date().toISOString(),
    isPending: true,
  };
}

function insertOptimisticTodo(
  page: TodoListPage,
  optimisticTodo: TodoListItem,
  pageSize: number
): TodoListPage {
  const items = [optimisticTodo, ...page.items].slice(0, pageSize);
  return {
    total: page.total + 1,
    items,
  };
}

function toPersistedTodo(todo: Todo): TodoListItem {
  return {
    ...todo,
    isPending: false,
  };
}

function replaceTempTodo(
  page: TodoListPage,
  tempId: string,
  persisted: TodoListItem
): TodoListPage {
  return {
    ...page,
    items: page.items.map((item) =>
      item.id === tempId ? persisted : item
    ),
  };
}

function rollbackOptimisticTodo(
  queryClient: ReturnType<typeof useQueryClient>,
  tempId: string,
  touchedQueryKeys: readonly QueryKey[]
): void {
  for (const queryKey of touchedQueryKeys) {
    queryClient.setQueryData<TodoListPage>(queryKey, (currentPage) => {
      if (!currentPage) {
        return currentPage;
      }
      const hasTemp = currentPage.items.some((item) => item.id === tempId);
      if (!hasTemp) {
        return currentPage;
      }
      return {
        total: currentPage.total - 1,
        items: currentPage.items.filter((item) => item.id !== tempId),
      };
    });
  }
}

function messageOf(error: unknown): string {
  if (isApiError(error)) return error.message;
  return "Could not create todo";
}

/** T-5..T-9/T-15: optimistic create with selective list updates and full rollback snapshots. */
export function useCreateTodo(): UseCreateTodoResult {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Todo, unknown, CreateTodoInput, CreateTodoMutationContext>({
    mutationFn: (input) => api.createTodo(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const snapshots: TodoListSnapshot[] = queryClient
        .getQueriesData<TodoListPage>({ queryKey: todoKeys.lists() })
        .map(([queryKey, page]) => ({
          queryKey,
          page: cloneListPage(page),
        }));

      const tempId = nextTempId();
      const optimisticTodo = buildOptimisticTodo(input, tempId);
      const touchedQueryKeys: QueryKey[] = [];

      for (const snapshot of snapshots) {
        const params = readListParams(snapshot.queryKey);
        if (!params) continue;
        if (!shouldOptimisticallyInsert(params, input.assigneeId)) continue;

        queryClient.setQueryData<TodoListPage>(
          snapshot.queryKey,
          (currentPage: TodoListPage | undefined = {} as TodoListPage) => {
            touchedQueryKeys.push(snapshot.queryKey);
            return insertOptimisticTodo(
              currentPage,
              optimisticTodo,
              params.pageSize
            );
          }
        );
      }

      return {
        snapshots,
        touchedQueryKeys,
        tempId,
      };
    },
    onSuccess: (todo, _input, context) => {
      const persistedTodo = toPersistedTodo(todo);
      for (const queryKey of context.touchedQueryKeys) {
        queryClient.setQueryData<TodoListPage>(queryKey, (currentPage: TodoListPage | undefined = {} as TodoListPage) => {
          return replaceTempTodo(currentPage, context.tempId, persistedTodo);
        });
      }
    },
    onError: (error, _input, context) => {
      if (context) {
        rollbackOptimisticTodo(queryClient, context.tempId, context.touchedQueryKeys);
      }
      notify.error(messageOf(error));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });

  return {
    createTodo: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

import { todoKeys, useApi } from "@app/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { TodoListParams } from "@app/shared";
import type { TodoListPage } from "../todo.types";
import type { UseTodosResult } from "./useTodos.types";

function toListPage(data: Awaited<ReturnType<ReturnType<typeof useApi>["listTodos"]>>): TodoListPage {
  return {
    total: data.total,
    items: data.items.map((item) => ({ ...item, isPending: false })),
  };
}

/** T-12/T-14: todo list query with typed placeholder handling. */
export function useTodos(params: TodoListParams): UseTodosResult {
  const api = useApi();
  const query = useQuery({
    queryKey: todoKeys.list(params),
    queryFn: async ({ signal }) => {
      const page = await api.listTodos(params, { signal });
      return toListPage(page);
    },
    placeholderData: keepPreviousData,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };
}

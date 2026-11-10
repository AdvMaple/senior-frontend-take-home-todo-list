import type { TodoListParams } from "@app/shared";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TodoListItem, TodoListPage } from "../todo.types";

export interface UseTodosOptions {
  params: TodoListParams;
}

export interface UseTodosResult {
  items: TodoListItem[];
  total: number;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  isPlaceholderData: boolean;
  refetch: UseQueryResult<TodoListPage, unknown>["refetch"];
}

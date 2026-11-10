import type {
  CreateTodoInput,
  Todo,
  TodoListParams,
  TodoSort,
  UserId,
} from "@app/shared";
import type { QueryKey } from "@tanstack/react-query";
import type { TodoListPage } from "../todo.types";

export interface UseCreateTodoResult {
  createTodo: (input: CreateTodoInput) => Promise<Todo>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

export interface TodoListSnapshot {
  queryKey: QueryKey;
  page: TodoListPage | undefined;
}

export interface CreateTodoMutationContext {
  snapshots: TodoListSnapshot[];
  touchedQueryKeys: QueryKey[];
  tempId: string;
}

export interface TodoListKeyParams {
  userIds: readonly UserId[];
  page: number;
  pageSize: number;
  sort: TodoSort;
}

export interface OptimisticTodoSeed {
  id: string;
  title: string;
  assigneeId: UserId;
  createdAt: string;
}

export interface OptimisticTarget {
  queryKey: QueryKey;
  params: TodoListParams;
}

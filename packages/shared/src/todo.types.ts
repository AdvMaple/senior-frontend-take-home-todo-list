import type { PAGE_SIZES, TODO_SORTS } from "./todo.constants";
import type { UserId } from "./user.types";

export type TodoId = string;
export type PageSize = (typeof PAGE_SIZES)[number];
export type TodoSort = (typeof TODO_SORTS)[number];

export interface Todo {
  id: TodoId;
  title: string;
  assigneeId: UserId;
  assigneeUsername?: string;
  done: boolean;
  createdAt: string;
}

export interface CreateTodoInput {
  title: string;
  assigneeId: UserId;
}

export interface UpdateTodoInput {
  id: TodoId;
  done: boolean;
}

/** Server-side list query. An empty `userIds` list means all users. */
export interface TodoListParams {
  userIds: readonly UserId[];
  page: number;
  pageSize: number;
  sort: TodoSort;
}

/** Validated `/todos` URL search state (R-2). */
export interface TodosSearch extends TodoListParams {
  userIds: UserId[];
  pageSize: PageSize;
}

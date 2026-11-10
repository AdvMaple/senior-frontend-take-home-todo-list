import type { Page, Todo } from "@app/shared";

/** Todo shape consumed by UI hooks: server todo plus optimistic marker. */
export interface TodoListItem extends Todo {
  isPending: boolean;
}

/** Cached todo list page in this feature package. */
export type TodoListPage = Page<TodoListItem>;

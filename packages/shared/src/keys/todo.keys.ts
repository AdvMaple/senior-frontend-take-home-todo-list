import type { TodoId, TodoListParams } from "../todo.types";

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (params: TodoListParams) =>
    [
      ...todoKeys.lists(),
      {
        userIds: [...new Set(params.userIds)].sort(),
        page: params.page,
        pageSize: params.pageSize,
        sort: params.sort,
      },
    ] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: TodoId) => [...todoKeys.details(), id] as const,
};

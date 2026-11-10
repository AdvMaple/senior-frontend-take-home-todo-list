import type { UserId, UserListFilters } from "../user.types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserListFilters) =>
    [
      ...userKeys.lists(),
      { search: filters.search, limit: filters.limit },
    ] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: UserId) => [...userKeys.details(), id] as const,
};

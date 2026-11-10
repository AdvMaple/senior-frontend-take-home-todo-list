import type { User } from "@app/shared";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

export interface UseUsersInfiniteOptions {
  search: string;
  limit: number;
}

export interface UseUsersInfiniteResult {
  users: User[];
  debouncedSearch: string;
  isPending: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: unknown;
  refetch: UseInfiniteQueryResult<unknown, unknown>["refetch"];
  loadMore: () => Promise<void>;
}

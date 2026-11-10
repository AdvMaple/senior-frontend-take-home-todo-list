import { useApi, useDebouncedValue, userKeys } from "@app/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  UseUsersInfiniteOptions,
  UseUsersInfiniteResult,
} from "./useUsersInfinite.types";

export const USER_SEARCH_DEBOUNCE_MS = 250;

/** Q2/A-7: cursor-based users query for lazy dropdown loading. */
export function useUsersInfinite({
  search,
  limit,
}: UseUsersInfiniteOptions): UseUsersInfiniteResult {
  const api = useApi();
  const debouncedSearch = useDebouncedValue(
    search.trim(),
    USER_SEARCH_DEBOUNCE_MS
  );

  const query = useInfiniteQuery({
    queryKey: userKeys.list({ search: debouncedSearch, limit }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      api.listUsers(
        {
          search: debouncedSearch,
          limit,
          cursor: pageParam,
        },
        { signal }
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const users = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  async function loadMore(): Promise<void> {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    await query.fetchNextPage();
  }

  return {
    users,
    debouncedSearch,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
    refetch: query.refetch,
    loadMore,
  };
}

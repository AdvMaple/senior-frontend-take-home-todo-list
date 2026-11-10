import { isApiError, useApi, userKeys } from "@app/shared";
import { useQuery } from "@tanstack/react-query";
import type { UserId } from "@app/shared";
import type { NotFoundApiError, UseUserResult } from "./useUser.types";

function toNotFoundError(error: unknown): NotFoundApiError | null {
  if (!isApiError(error) || error.code !== "NOT_FOUND") return null;
  return error as NotFoundApiError;
}

/** U-4/U-5: fetches one user and exposes a typed NOT_FOUND branch. */
export function useUser(userId: UserId | null): UseUserResult {
  const api = useApi();
  const query = useQuery({
    queryKey:
      userId === null
        ? (["users", "detail", "unselected"] as const)
        : userKeys.detail(userId),
    queryFn: ({ signal }) => {
      if (userId === null) throw new Error("A user ID is required");
      return api.getUser(userId, { signal });
    },
    enabled: userId !== null,
  });

  const notFoundError = toNotFoundError(query.error);

  return {
    data: query.data,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    isNotFound: notFoundError !== null,
    notFoundError,
  };
}

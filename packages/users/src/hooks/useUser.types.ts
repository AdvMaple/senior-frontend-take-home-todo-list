import type { ApiError, User } from "@app/shared";
import type { UseQueryResult } from "@tanstack/react-query";

export interface NotFoundApiError extends ApiError {
  code: "NOT_FOUND";
}

export interface UseUserResult {
  data: User | undefined;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  refetch: UseQueryResult<User, unknown>["refetch"];
  isNotFound: boolean;
  notFoundError: NotFoundApiError | null;
}

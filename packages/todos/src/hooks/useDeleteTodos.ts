import { isApiError, notify, todoKeys, useApi } from "@app/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TodoId } from "@app/shared";
import type { UseDeleteTodosResult } from "./useDeleteTodos.types";

function messageOf(error: unknown): string {
  if (isApiError(error)) return error.message;
  return "Could not delete todos";
}

/** T-17: non-optimistic delete, then refetch lists on settle. */
export function useDeleteTodos(): UseDeleteTodosResult {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<undefined, unknown, readonly TodoId[]>({
    mutationFn: async (ids) => {
      await api.deleteTodos(ids);
      return undefined;
    },
    onError: (error) => {
      notify.error(messageOf(error));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });

  return {
    deleteTodos: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

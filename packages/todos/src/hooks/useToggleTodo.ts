import { isApiError, notify, todoKeys, useApi } from "@app/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Todo, UpdateTodoInput } from "@app/shared";
import type { UseToggleTodoResult } from "./useToggleTodo.types";

function messageOf(error: unknown): string {
  if (isApiError(error)) return error.message;
  return "Could not update todo";
}

/** T-16: non-optimistic toggle, then refetch list/detail on settle. */
export function useToggleTodo(): UseToggleTodoResult {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Todo, unknown, UpdateTodoInput>({
    mutationFn: (input) => api.updateTodo(input),
    onError: (error) => {
      notify.error(messageOf(error));
    },
    onSettled: async (_todo, _error, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: todoKeys.detail(input.id) }),
      ]);
    },
  });

  return {
    toggleTodo: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

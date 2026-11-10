import type { Todo, UpdateTodoInput } from "@app/shared";

export interface UseToggleTodoResult {
  toggleTodo: (input: UpdateTodoInput) => Promise<Todo>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

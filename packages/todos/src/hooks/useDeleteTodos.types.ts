import type { TodoId } from "@app/shared";

export interface UseDeleteTodosResult {
  deleteTodos: (ids: readonly TodoId[]) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

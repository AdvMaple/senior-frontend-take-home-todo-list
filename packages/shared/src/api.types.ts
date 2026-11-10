import type {
  CreateTodoInput,
  Todo,
  TodoId,
  TodoListParams,
  UpdateTodoInput,
} from "./todo.types";
import type {
  CreateUserInput,
  User,
  UserId,
  UserListParams,
} from "./user.types";

export type ApiErrorCode =
  "CONFLICT" | "NOT_FOUND" | "VALIDATION" | "RATE_LIMITED" | "UNKNOWN";

export type ApiOperation =
  | "createUser"
  | "getUser"
  | "listUsers"
  | "createTodo"
  | "listTodos"
  | "updateTodo"
  | "deleteTodos";

/** Offset page used by the todo list (page numbers). */
export interface Page<T> {
  items: T[];
  total: number;
}

/** Cursor page used by the assignee picker (load more). */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiCallOptions {
  signal?: AbortSignal;
}

export interface ApiClient {
  createUser: (
    input: CreateUserInput,
    options?: ApiCallOptions
  ) => Promise<User>;
  getUser: (id: UserId, options?: ApiCallOptions) => Promise<User>;
  listUsers: (
    params: UserListParams,
    options?: ApiCallOptions
  ) => Promise<CursorPage<User>>;
  createTodo: (
    input: CreateTodoInput,
    options?: ApiCallOptions
  ) => Promise<Todo>;
  listTodos: (
    params: TodoListParams,
    options?: ApiCallOptions
  ) => Promise<Page<Todo>>;
  updateTodo: (
    input: UpdateTodoInput,
    options?: ApiCallOptions
  ) => Promise<Todo>;
  deleteTodos: (
    ids: readonly TodoId[],
    options?: ApiCallOptions
  ) => Promise<void>;
}

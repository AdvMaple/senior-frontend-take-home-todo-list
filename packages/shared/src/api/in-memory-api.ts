import type {
  ApiCallOptions,
  ApiOperation,
  CursorPage,
  Page,
} from "../api.types";
import { createTodoSchema } from "../schemas/todo.schema";
import { createUserSchema } from "../schemas/user.schema";
import { TODO_SORTS } from "../todo.constants";
import type {
  CreateTodoInput,
  Todo,
  TodoId,
  TodoListParams,
  UpdateTodoInput,
} from "../todo.types";
import type {
  CreateUserInput,
  User,
  UserId,
  UserListParams,
} from "../user.types";
import { ApiError, createAbortError } from "./api-error";
import { DATASET_SEED, generateDataset } from "./dataset";
import type {
  InMemoryApi,
  InMemoryApiOptions,
  LatencyRange,
  TodoRecord,
} from "./in-memory-api.types";
import { createPrng } from "./prng";

export const RATE_LIMIT_MAX_CREATES = 3;
export const RATE_LIMIT_WINDOW_MS = 10_000;

const DEFAULT_USER_LIMIT = 20;
const MAX_LIMIT = 100;

function compareRecords(a: TodoRecord, b: TodoRecord): number {
  return a.createdAtMs - b.createdAtMs || a.seq - b.seq;
}

/** First index whose record sorts at or after `record`. */
function lowerBound(list: TodoRecord[], record: TodoRecord): number {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    const candidate = list[middle];
    if (candidate && compareRecords(candidate, record) < 0) low = middle + 1;
    else high = middle;
  }
  return low;
}

function insertSorted(list: TodoRecord[], record: TodoRecord): void {
  list.splice(lowerBound(list, record), 0, record);
}

function removeSorted(list: TodoRecord[], record: TodoRecord): void {
  const index = lowerBound(list, record);
  if (list[index] === record) list.splice(index, 1);
}

function toUser(user: User): User {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

function toTodo(record: TodoRecord): Todo {
  return {
    id: record.id,
    title: record.title,
    assigneeId: record.assigneeId,
    done: record.done,
    createdAt: record.createdAt,
  };
}

function validation(message: string): ApiError {
  return new ApiError("VALIDATION", message);
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw createAbortError();
}

function wait(ms: number, signal: AbortSignal | undefined): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(createAbortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Typed in-memory backend. Filtering, sorting and slicing happen here, like on
 * a real server. Data is generated lazily on the first call.
 */
export function createInMemoryApi(
  options: InMemoryApiOptions = {}
): InMemoryApi {
  const { profile = "small", latencyMs = 0, now = Date.now } = options;
  const latencyRandom = createPrng(DATASET_SEED + 1);
  const pendingFailures = new Map<ApiOperation, ApiError[]>();
  const createTimes: number[] = [];

  const users: User[] = [];
  const usersById = new Map<UserId, User>();
  const userIdsByLowerName = new Map<string, UserId>();
  const todosById = new Map<TodoId, TodoRecord>();
  /** All todos, ascending by (createdAtMs, seq). Descending reads walk it backwards. */
  const allTodos: TodoRecord[] = [];
  const todosByUser = new Map<UserId, TodoRecord[]>();
  let nextUserNumber = 1;
  let nextTodoNumber = 1;
  let nextSeq = 0;
  let seeded = false;

  function userTodos(id: UserId): TodoRecord[] {
    const existing = todosByUser.get(id);
    if (existing) return existing;
    const created: TodoRecord[] = [];
    todosByUser.set(id, created);
    return created;
  }

  function addUser(user: User): void {
    users.push(user);
    usersById.set(user.id, user);
    userIdsByLowerName.set(user.username.toLowerCase(), user.id);
    todosByUser.set(user.id, []);
  }

  function addTodo(record: TodoRecord): void {
    todosById.set(record.id, record);
    insertSorted(allTodos, record);
    insertSorted(userTodos(record.assigneeId), record);
  }

  function ensureSeeded(): void {
    if (seeded) return;
    seeded = true;
    const dataset = generateDataset(profile);
    for (const user of dataset.users) addUser(user);
    for (const todo of dataset.todos) {
      addTodo({ ...todo, seq: nextSeq++ });
    }
    nextUserNumber = dataset.users.length + 1;
    nextTodoNumber = dataset.todos.length + 1;
  }

  function latencyFor(range: number | LatencyRange): number {
    if (typeof range === "number") return range;
    return (
      range.minMs +
      Math.floor(latencyRandom() * (range.maxMs - range.minMs + 1))
    );
  }

  /** Simulates a request: failure is chosen on call, effects happen on "arrival". */
  async function execute<T>(
    operation: ApiOperation,
    callOptions: ApiCallOptions | undefined,
    work: () => T
  ): Promise<T> {
    const signal = callOptions?.signal;
    const injected = pendingFailures.get(operation)?.shift();
    throwIfAborted(signal);
    await wait(latencyFor(latencyMs), signal);
    throwIfAborted(signal);
    if (injected) throw injected;
    ensureSeeded();
    return work();
  }

  function requireUser(id: UserId): User {
    const user = usersById.get(id);
    if (!user) throw new ApiError("NOT_FOUND", "No user with that ID");
    return user;
  }

  function checkRateLimit(): void {
    const current = now();
    while ((createTimes[0] ?? Infinity) <= current - RATE_LIMIT_WINDOW_MS) {
      createTimes.shift();
    }
    const oldest = createTimes[0];
    if (oldest !== undefined && createTimes.length >= RATE_LIMIT_MAX_CREATES) {
      const retryAfterMs = oldest + RATE_LIMIT_WINDOW_MS - current;
      throw new ApiError(
        "RATE_LIMITED",
        `Too many users created. Try again in ${String(Math.ceil(retryAfterMs / 1000))} seconds`,
        retryAfterMs
      );
    }
  }

  function createUser(input: CreateUserInput): User {
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      throw validation(parsed.error.issues[0]?.message ?? "Invalid username");
    }
    const { username } = parsed.data;
    checkRateLimit();
    if (userIdsByLowerName.has(username.toLowerCase())) {
      throw new ApiError("CONFLICT", "That username is already taken");
    }
    const current = now();
    const user: User = {
      id: `user-${String(nextUserNumber++)}`,
      username,
      createdAt: new Date(current).toISOString(),
    };
    addUser(user);
    createTimes.push(current);
    return toUser(user);
  }

  function listUsers(params: UserListParams): CursorPage<User> {
    const limit = params.limit ?? DEFAULT_USER_LIMIT;
    if (!isPositiveInteger(limit) || limit > MAX_LIMIT) {
      throw validation(
        `limit must be an integer from 1 to ${String(MAX_LIMIT)}`
      );
    }
    const cursor = params.cursor ?? "0";
    if (!/^\d+$/.test(cursor)) throw validation("Invalid cursor");
    const term = (params.search ?? "").trim().toLowerCase();
    const matches = (user: User) =>
      term === "" || user.username.toLowerCase().includes(term);

    const items: User[] = [];
    let index = Number(cursor);
    for (; index < users.length && items.length < limit; index++) {
      const user = users[index];
      if (user && matches(user)) items.push(toUser(user));
    }
    while (index < users.length) {
      const user = users[index];
      if (user && matches(user)) break;
      index++;
    }
    const hasMore = index < users.length;
    return { items, nextCursor: hasMore ? String(index) : null, hasMore };
  }

  function createTodo(input: CreateTodoInput): Todo {
    const parsed = createTodoSchema.safeParse(input);
    if (!parsed.success) {
      throw validation(parsed.error.issues[0]?.message ?? "Invalid todo");
    }
    const { title, assigneeId } = parsed.data;
    requireUser(assigneeId);
    const current = now();
    const record: TodoRecord = {
      id: `todo-${String(nextTodoNumber++)}`,
      title,
      assigneeId,
      done: false,
      createdAt: new Date(current).toISOString(),
      createdAtMs: current,
      seq: nextSeq++,
    };
    addTodo(record);
    return {
      ...toTodo(record),
      assigneeUsername: requireUser(assigneeId).username,
    };
  }

  function listTodos(params: TodoListParams): Page<Todo> {
    const { page, pageSize, sort } = params;
    if (!isPositiveInteger(page))
      throw validation("page must be an integer >= 1");
    if (!isPositiveInteger(pageSize) || pageSize > MAX_LIMIT) {
      throw validation(
        `pageSize must be an integer from 1 to ${String(MAX_LIMIT)}`
      );
    }
    if (!TODO_SORTS.includes(sort)) throw validation("Invalid sort");

    const ids = [...new Set(params.userIds)];
    const [firstId] = ids;
    let source: TodoRecord[];
    if (firstId === undefined) source = allTodos;
    else if (ids.length === 1) source = todosByUser.get(firstId) ?? [];
    else
      source = ids
        .flatMap((id) => todosByUser.get(id) ?? [])
        .sort(compareRecords);

    const total = source.length;
    const offset = (page - 1) * pageSize;
    let records: TodoRecord[];
    if (sort === "createdAt.asc") {
      records = source.slice(offset, offset + pageSize);
    } else {
      const end = total - offset;
      records =
        end <= 0
          ? []
          : source.slice(Math.max(0, end - pageSize), end).reverse();
    }
    return {
      items: records.map((record) => ({
        ...toTodo(record),
        assigneeUsername: requireUser(record.assigneeId).username,
      })),
      total,
    };
  }

  function updateTodo(input: UpdateTodoInput): Todo {
    const record = todosById.get(input.id);
    if (!record) throw new ApiError("NOT_FOUND", "No todo with that ID");
    record.done = input.done;
    return {
      ...toTodo(record),
      assigneeUsername: requireUser(record.assigneeId).username,
    };
  }

  function deleteTodos(ids: readonly TodoId[]): void {
    const records = [...new Set(ids)].map((id) => {
      const record = todosById.get(id);
      if (!record) throw new ApiError("NOT_FOUND", "No todo with that ID");
      return record;
    });
    if (records.some((record) => !record.done)) {
      throw validation("Only done todos can be deleted");
    }
    for (const record of records) {
      todosById.delete(record.id);
      removeSorted(allTodos, record);
      removeSorted(userTodos(record.assigneeId), record);
    }
  }

  return {
    createUser: (input, callOptions) =>
      execute("createUser", callOptions, () => createUser(input)),
    getUser: (id, callOptions) =>
      execute("getUser", callOptions, () => toUser(requireUser(id))),
    listUsers: (params, callOptions) =>
      execute("listUsers", callOptions, () => listUsers(params)),
    createTodo: (input, callOptions) =>
      execute("createTodo", callOptions, () => createTodo(input)),
    listTodos: (params, callOptions) =>
      execute("listTodos", callOptions, () => listTodos(params)),
    updateTodo: (input, callOptions) =>
      execute("updateTodo", callOptions, () => updateTodo(input)),
    deleteTodos: (ids, callOptions) =>
      execute("deleteTodos", callOptions, () => {
        deleteTodos(ids);
      }),
    failNext: (
      operation,
      error = new ApiError("UNKNOWN", "Simulated failure")
    ) => {
      pendingFailures.set(operation, [
        ...(pendingFailures.get(operation) ?? []),
        error,
      ]);
    },
  };
}

// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ApiError, isApiError } from "./api-error";
import {
  RATE_LIMIT_MAX_CREATES,
  RATE_LIMIT_WINDOW_MS,
  createInMemoryApi,
} from "./in-memory-api";
import type { InMemoryApiOptions } from "./in-memory-api.types";

const START = Date.UTC(2026, 5, 1);

function createTestApi(options: InMemoryApiOptions = {}) {
  const clock = { now: START };
  const api = createInMemoryApi({
    profile: "small",
    latencyMs: 0,
    now: () => clock.now,
    ...options,
  });
  return { api, clock };
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return isApiError(error) ? error.code : String(error);
  }
  return "RESOLVED";
}

async function nameOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return error instanceof Error ? error.name : String(error);
  }
  return "RESOLVED";
}

describe("createUser", () => {
  it("U-1: returns a user with id, trimmed username and createdAt", async () => {
    const { api } = createTestApi();
    const user = await api.createUser({ username: "  carol  " });
    expect(user.id).toEqual(expect.any(String));
    expect(user.username).toBe("carol");
    expect(user.createdAt).toBe(new Date(START).toISOString());
    expect(await api.getUser(user.id)).toEqual(user);
  });

  it("U-2: rejects an invalid username with VALIDATION", async () => {
    const { api } = createTestApi();
    expect(await codeOf(api.createUser({ username: "a" }))).toBe("VALIDATION");
  });

  it("U-3: rejects a duplicate username case-insensitively with CONFLICT", async () => {
    const { api } = createTestApi();
    await api.createUser({ username: "Carol" });
    expect(await codeOf(api.createUser({ username: "cAROL" }))).toBe(
      "CONFLICT"
    );
    expect(await codeOf(api.createUser({ username: "ALICE_JOHNSON" }))).toBe(
      "CONFLICT"
    );
  });

  it("U-7: rejects the 4th creation inside the window with RATE_LIMITED", async () => {
    const { api } = createTestApi();
    for (let index = 0; index < RATE_LIMIT_MAX_CREATES; index++) {
      await api.createUser({ username: `user-${String(index)}` });
    }
    const rejection = api.createUser({ username: "one-too-many" });
    expect(await codeOf(rejection)).toBe("RATE_LIMITED");
    const error = await rejection.catch((caught: unknown) => caught);
    expect(isApiError(error) ? error.retryAfterMs : undefined).toBe(
      RATE_LIMIT_WINDOW_MS
    );
  });

  it("U-7: recovers after the window passes", async () => {
    const { api, clock } = createTestApi();
    for (let index = 0; index < RATE_LIMIT_MAX_CREATES; index++) {
      await api.createUser({ username: `user-${String(index)}` });
      clock.now += 1000;
    }
    expect(await codeOf(api.createUser({ username: "later" }))).toBe(
      "RATE_LIMITED"
    );
    clock.now = START + RATE_LIMIT_WINDOW_MS;
    expect((await api.createUser({ username: "later" })).username).toBe(
      "later"
    );
  });

  it("U-7: a rejected creation does not mutate state", async () => {
    const { api } = createTestApi();
    for (let index = 0; index < RATE_LIMIT_MAX_CREATES; index++) {
      await api.createUser({ username: `user-${String(index)}` });
    }
    await codeOf(api.createUser({ username: "blocked" }));
    const page = await api.listUsers({ search: "blocked" });
    expect(page.items).toEqual([]);
  });
});

describe("getUser", () => {
  it("U-5: rejects an unknown id with NOT_FOUND", async () => {
    const { api } = createTestApi();
    expect(await codeOf(api.getUser("missing"))).toBe("NOT_FOUND");
  });
});

describe("listUsers", () => {
  it("Q2: paginates with a cursor, reports hasMore and keeps a stable order", async () => {
    const { api } = createTestApi({ profile: "demo" });
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await api.listUsers({ cursor, limit: 10 });
      expect(page.items.length).toBeLessThanOrEqual(10);
      expect(page.hasMore).toBe(page.nextCursor !== null);
      seen.push(...page.items.map((user) => user.id));
      cursor = page.nextCursor;
      pages++;
    } while (cursor !== null);
    expect(pages).toBe(3);
    expect(seen).toHaveLength(25);
    expect(new Set(seen).size).toBe(25);
    const again = await api.listUsers({ limit: 25 });
    expect(again.items.map((user) => user.id)).toEqual(seen);
    expect(again.hasMore).toBe(false);
    expect(again.nextCursor).toBeNull();
  });

  it("Q2: filters by a case-insensitive search term and paginates the matches", async () => {
    const { api } = createTestApi({ profile: "demo" });
    const all = await api.listUsers({ limit: 100 });
    const term = "JOHN";
    const expected = all.items.filter((user) =>
      user.username.toLowerCase().includes(term.toLowerCase())
    );
    expect(expected.length).toBeGreaterThan(1);
    const first = await api.listUsers({ search: term, limit: 1 });
    expect(first.items).toEqual(expected.slice(0, 1));
    expect(first.hasMore).toBe(true);
    const second = await api.listUsers({
      search: term,
      limit: expected.length,
      cursor: first.nextCursor,
    });
    expect(second.items).toEqual(expected.slice(1));
    expect(second.hasMore).toBe(false);
  });

  it("Q2: rejects an invalid cursor or limit with VALIDATION", async () => {
    const { api } = createTestApi();
    expect(await codeOf(api.listUsers({ cursor: "abc" }))).toBe("VALIDATION");
    expect(await codeOf(api.listUsers({ limit: 0 }))).toBe("VALIDATION");
    expect(await codeOf(api.listUsers({ limit: 101 }))).toBe("VALIDATION");
  });

  it("Q2: lists newly created users after the seeded ones", async () => {
    const { api } = createTestApi();
    const created = await api.createUser({ username: "zed" });
    const page = await api.listUsers({});
    expect(page.items.map((user) => user.id).at(-1)).toBe(created.id);
  });
});

describe("createTodo", () => {
  it("T-1: creates a not-done todo for an existing assignee", async () => {
    const { api } = createTestApi();
    const user = await api.createUser({ username: "dave" });
    const todo = await api.createTodo({
      title: "  Ship it ",
      assigneeId: user.id,
    });
    expect(todo).toMatchObject({
      title: "Ship it",
      assigneeId: user.id,
      done: false,
      createdAt: new Date(START).toISOString(),
    });
    const page = await api.listTodos({
      userIds: [user.id],
      page: 1,
      pageSize: 5,
      sort: "createdAt.desc",
    });
    expect(page).toEqual({ items: [todo], total: 1 });
  });

  it("T-2: rejects an invalid title with VALIDATION", async () => {
    const { api } = createTestApi();
    const user = await api.createUser({ username: "dave" });
    expect(
      await codeOf(api.createTodo({ title: " ", assigneeId: user.id }))
    ).toBe("VALIDATION");
  });

  it("T-3: rejects an unknown assignee with NOT_FOUND", async () => {
    const { api } = createTestApi();
    expect(
      await codeOf(api.createTodo({ title: "x", assigneeId: "ghost" }))
    ).toBe("NOT_FOUND");
  });
});

describe("listTodos", () => {
  const desc = "createdAt.desc" as const;
  const asc = "createdAt.asc" as const;

  async function allTodos(api: ReturnType<typeof createTestApi>["api"]) {
    const first = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 100,
      sort: desc,
    });
    const rest = await api.listTodos({
      userIds: [],
      page: 2,
      pageSize: 100,
      sort: desc,
    });
    return { items: [...first.items, ...rest.items], total: first.total };
  }

  it("T-4, T-11: empty filter returns all todos; one or many userIds filter", async () => {
    const { api } = createTestApi({ profile: "demo" });
    const everything = await allTodos(api);
    expect(everything.total).toBe(120);
    const first = "user-1";
    const second = "user-2";
    const one = await api.listTodos({
      userIds: [first],
      page: 1,
      pageSize: 100,
      sort: desc,
    });
    expect(one.items.every((todo) => todo.assigneeId === first)).toBe(true);
    expect(one.total).toBe(
      everything.items.filter((todo) => todo.assigneeId === first).length
    );
    const both = await api.listTodos({
      userIds: [second, first],
      page: 1,
      pageSize: 100,
      sort: desc,
    });
    expect(both.total).toBe(
      everything.items.filter(
        (todo) => todo.assigneeId === first || todo.assigneeId === second
      ).length
    );
    const unknown = await api.listTodos({
      userIds: ["ghost"],
      page: 1,
      pageSize: 5,
      sort: desc,
    });
    expect(unknown).toEqual({ items: [], total: 0 });
  });

  it("T-13: sorts by createdAt desc by default and asc on request; asc is the reverse of desc", async () => {
    const { api } = createTestApi({ profile: "demo" });
    const newestFirst = (await allTodos(api)).items;
    for (let index = 1; index < newestFirst.length; index++) {
      const previous = newestFirst[index - 1]?.createdAt ?? "";
      const current = newestFirst[index]?.createdAt ?? "";
      expect(previous >= current).toBe(true);
    }
    const oldestFirst = [];
    for (let page = 1; page <= 5; page++) {
      const result = await api.listTodos({
        userIds: [],
        page,
        pageSize: 25,
        sort: asc,
      });
      oldestFirst.push(...result.items);
    }
    expect(oldestFirst.map((todo) => todo.id)).toEqual(
      newestFirst.map((todo) => todo.id).reverse()
    );
  });

  it("T-13: ties keep a stable order across calls and pages", async () => {
    const { api } = createTestApi({ profile: "load" });
    const full = (await allTodos(api)).items;
    const paged: string[] = [];
    for (let page = 1; page <= 20; page++) {
      const result = await api.listTodos({
        userIds: [],
        page,
        pageSize: 5,
        sort: desc,
      });
      paged.push(...result.items.map((todo) => todo.id));
    }
    expect(paged).toEqual(full.slice(0, 100).map((todo) => todo.id));
  });

  it("T-12: returns the page slice and the total", async () => {
    const { api } = createTestApi({ profile: "demo" });
    const full = (await allTodos(api)).items;
    const page3 = await api.listTodos({
      userIds: [],
      page: 3,
      pageSize: 10,
      sort: desc,
    });
    expect(page3.total).toBe(120);
    expect(page3.items.map((todo) => todo.id)).toEqual(
      full.slice(20, 30).map((todo) => todo.id)
    );
    const last = await api.listTodos({
      userIds: [],
      page: 5,
      pageSize: 25,
      sort: desc,
    });
    expect(last.items).toHaveLength(120 - 100);
  });

  it("T-12: a page past the end returns empty items with the real total", async () => {
    const { api } = createTestApi();
    const result = await api.listTodos({
      userIds: [],
      page: 99,
      pageSize: 5,
      sort: desc,
    });
    expect(result).toEqual({ items: [], total: 6 });
  });

  it("T-12: rejects an invalid page or pageSize with VALIDATION", async () => {
    const { api } = createTestApi();
    for (const bad of [
      { page: 0, pageSize: 5 },
      { page: 1.5, pageSize: 5 },
      { page: 1, pageSize: 0 },
      { page: 1, pageSize: 101 },
    ]) {
      expect(
        await codeOf(api.listTodos({ userIds: [], sort: desc, ...bad }))
      ).toBe("VALIDATION");
    }
  });

  it("T-12: the new todo is first in the newest-first list and last in oldest-first", async () => {
    const { api } = createTestApi();
    const user = await api.createUser({ username: "erin" });
    const todo = await api.createTodo({ title: "fresh", assigneeId: user.id });
    const newest = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: desc,
    });
    expect(newest.items[0]).toEqual(todo);
    expect(newest.total).toBe(7);
    const oldest = await api.listTodos({
      userIds: [],
      page: 2,
      pageSize: 5,
      sort: asc,
    });
    expect(oldest.items.at(-1)).toEqual(todo);
  });
});

describe("updateTodo and deleteTodos", () => {
  async function firstTodo(api: ReturnType<typeof createTestApi>["api"]) {
    const page = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: "createdAt.desc",
    });
    const todo = page.items[0];
    if (!todo) throw new Error("expected a seeded todo");
    return todo;
  }

  it("T-16: updateTodo sets done and returns the updated todo", async () => {
    const { api } = createTestApi();
    const todo = await firstTodo(api);
    const updated = await api.updateTodo({ id: todo.id, done: !todo.done });
    expect(updated).toEqual({ ...todo, done: !todo.done });
    expect((await firstTodo(api)).done).toBe(!todo.done);
    const reverted = await api.updateTodo({ id: todo.id, done: todo.done });
    expect(reverted.done).toBe(todo.done);
  });

  it("T-16: updateTodo on an unknown id rejects with NOT_FOUND", async () => {
    const { api } = createTestApi();
    expect(await codeOf(api.updateTodo({ id: "ghost", done: true }))).toBe(
      "NOT_FOUND"
    );
  });

  it("T-17: deleteTodos removes done todos", async () => {
    const { api } = createTestApi();
    const todo = await firstTodo(api);
    await api.updateTodo({ id: todo.id, done: true });
    await api.deleteTodos([todo.id]);
    const page = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 25,
      sort: "createdAt.desc",
    });
    expect(page.total).toBe(5);
    expect(page.items.some((item) => item.id === todo.id)).toBe(false);
    const byUser = await api.listTodos({
      userIds: [todo.assigneeId],
      page: 1,
      pageSize: 25,
      sort: "createdAt.desc",
    });
    expect(byUser.items.some((item) => item.id === todo.id)).toBe(false);
  });

  it("T-17: deleteTodos with a not-done todo rejects with VALIDATION and deletes nothing", async () => {
    const { api } = createTestApi();
    const todo = await firstTodo(api);
    await api.updateTodo({ id: todo.id, done: true });
    const pending = (
      await api.listTodos({
        userIds: [],
        page: 1,
        pageSize: 25,
        sort: "createdAt.desc",
      })
    ).items.find((item) => !item.done);
    if (!pending) throw new Error("expected a pending todo");
    expect(await codeOf(api.deleteTodos([todo.id, pending.id]))).toBe(
      "VALIDATION"
    );
    expect(
      (
        await api.listTodos({
          userIds: [],
          page: 1,
          pageSize: 25,
          sort: "createdAt.desc",
        })
      ).total
    ).toBe(6);
  });

  it("T-17: deleteTodos with an unknown id rejects with NOT_FOUND", async () => {
    const { api } = createTestApi();
    expect(await codeOf(api.deleteTodos(["ghost"]))).toBe("NOT_FOUND");
  });
});

describe("failure injection", () => {
  it("A-4, T-6: failNext(op) fails exactly one call of that op and does not mutate", async () => {
    const { api } = createTestApi();
    const user = await api.createUser({ username: "frank" });
    api.failNext("createTodo");
    expect(
      await codeOf(api.createTodo({ title: "boom", assigneeId: user.id }))
    ).toBe("UNKNOWN");
    const afterFailure = await api.listTodos({
      userIds: [user.id],
      page: 1,
      pageSize: 5,
      sort: "createdAt.desc",
    });
    expect(afterFailure.total).toBe(0);
    const ok = await api.createTodo({ title: "fine", assigneeId: user.id });
    expect(ok.title).toBe("fine");
  });

  it("A-4: failNext only affects the named operation", async () => {
    const { api } = createTestApi();
    api.failNext("createTodo");
    await expect(api.listUsers({})).resolves.toBeDefined();
    expect(
      await codeOf(api.createTodo({ title: "x", assigneeId: "user-1" }))
    ).toBe("UNKNOWN");
  });

  it("A-4: failNext calls queue up and accept a custom error", async () => {
    const { api } = createTestApi();
    api.failNext("getUser", new ApiError("NOT_FOUND", "x"));
    api.failNext("getUser");
    expect(await codeOf(api.getUser("user-1"))).toBe("NOT_FOUND");
    expect(await codeOf(api.getUser("user-1"))).toBe("UNKNOWN");
    expect((await api.getUser("user-1")).id).toBe("user-1");
  });
});

describe("AbortSignal", () => {
  it("T-14: an already aborted signal rejects with AbortError on every operation", async () => {
    const { api } = createTestApi();
    const controller = new AbortController();
    controller.abort();
    const options = { signal: controller.signal };
    const calls = [
      api.createUser({ username: "gina" }, options),
      api.getUser("user-1", options),
      api.listUsers({}, options),
      api.createTodo({ title: "x", assigneeId: "user-1" }, options),
      api.listTodos(
        { userIds: [], page: 1, pageSize: 5, sort: "createdAt.desc" },
        options
      ),
      api.updateTodo({ id: "todo-1", done: true }, options),
      api.deleteTodos(["todo-1"], options),
    ];
    for (const call of calls) expect(await nameOf(call)).toBe("AbortError");
  });

  it("T-14: aborting an in-flight mutation rejects and does not mutate state", async () => {
    const { api } = createTestApi();
    const controller = new AbortController();
    const pending = api.createUser(
      { username: "hank" },
      { signal: controller.signal }
    );
    controller.abort();
    expect(await nameOf(pending)).toBe("AbortError");
    expect((await api.listUsers({ search: "hank" })).items).toEqual([]);
  });

  it("T-14: aborting during simulated latency rejects immediately", async () => {
    const { api } = createTestApi({ latencyMs: 60_000 });
    const controller = new AbortController();
    const pending = api.listTodos(
      { userIds: [], page: 1, pageSize: 5, sort: "createdAt.desc" },
      { signal: controller.signal }
    );
    controller.abort();
    expect(await nameOf(pending)).toBe("AbortError");
  });

  it("T-14: an aborted create does not consume the rate limit", async () => {
    const { api } = createTestApi();
    for (let index = 0; index < RATE_LIMIT_MAX_CREATES; index++) {
      const controller = new AbortController();
      const pending = api.createUser(
        { username: `user-${String(index)}` },
        { signal: controller.signal }
      );
      controller.abort();
      await nameOf(pending);
    }
    expect((await api.createUser({ username: "real" })).username).toBe("real");
  });
});

describe("latency and lazy generation", () => {
  it("N-7: honours a fixed latency", async () => {
    const { api } = createTestApi({ latencyMs: 40 });
    const start = performance.now();
    await api.getUser("user-1");
    expect(performance.now() - start).toBeGreaterThanOrEqual(30);
  });

  it("N-7: honours a latency range", async () => {
    const { api } = createTestApi({ latencyMs: { minMs: 20, maxMs: 40 } });
    const start = performance.now();
    await api.getUser("user-1");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(15);
    expect(elapsed).toBeLessThan(500);
  });

  it("N-7: the load profile serves its first request quickly (lazy generation under 200 ms)", async () => {
    const start = performance.now();
    const { api } = createTestApi({ profile: "load" });
    expect(performance.now() - start).toBeLessThan(20);
    const page = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 25,
      sort: "createdAt.desc",
    });
    expect(performance.now() - start).toBeLessThan(200);
    expect(page.total).toBe(10_000);
    expect(page.items).toHaveLength(25);
  });

  it("N-7: the default profile is small", async () => {
    const api = createInMemoryApi({ latencyMs: 0 });
    expect((await api.listUsers({ limit: 100 })).items).toHaveLength(2);
  });
});

describe("copies", () => {
  it("A-4: returned objects are copies; mutating them does not change stored data", async () => {
    const { api } = createTestApi();
    const user = await api.getUser("user-1");
    user.username = "hacked";
    expect((await api.getUser("user-1")).username).not.toBe("hacked");
    const page = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: "createdAt.desc",
    });
    const first = page.items[0];
    if (!first) throw new Error("expected a todo");
    first.done = !first.done;
    first.title = "hacked";
    page.items.length = 0;
    const again = await api.listTodos({
      userIds: [],
      page: 1,
      pageSize: 5,
      sort: "createdAt.desc",
    });
    expect(again.items).toHaveLength(5);
    expect(again.items[0]?.title).not.toBe("hacked");
    expect(again.items[0]?.done).not.toBe(first.done);
  });
});

import { describe, expect, it } from "vitest";
import { usernameSchema } from "../schemas/user.schema";
import { DATASET_SIZES, generateDataset } from "./dataset";

function countByUser(todos: { assigneeId: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const todo of todos) {
    counts.set(todo.assigneeId, (counts.get(todo.assigneeId) ?? 0) + 1);
  }
  return counts;
}

describe("generateDataset", () => {
  it("N-7: small, demo and load have the specified sizes", () => {
    expect(DATASET_SIZES).toEqual({
      small: { users: 2, todos: 6 },
      demo: { users: 25, todos: 120 },
      load: { users: 1000, todos: 10000 },
    });
    for (const profile of ["small", "demo", "load"] as const) {
      const dataset = generateDataset(profile);
      expect(dataset.users).toHaveLength(DATASET_SIZES[profile].users);
      expect(dataset.todos).toHaveLength(DATASET_SIZES[profile].todos);
    }
  });

  it("N-7: is deterministic (seed 42) across runs", () => {
    expect(generateDataset("demo")).toEqual(generateDataset("demo"));
  });

  it("N-7: generates the load profile in under 200 ms", () => {
    const start = performance.now();
    generateDataset("load");
    expect(performance.now() - start).toBeLessThan(200);
  });

  it("N-7: usernames are unique and pass the username schema", () => {
    const { users } = generateDataset("load");
    expect(new Set(users.map((user) => user.username.toLowerCase())).size).toBe(
      users.length
    );
    for (const user of users) {
      expect(usernameSchema.safeParse(user.username).success).toBe(true);
    }
  });

  it("N-7: ids are unique and every todo has an existing assignee", () => {
    const { users, todos } = generateDataset("load");
    const userIds = new Set(users.map((user) => user.id));
    expect(userIds.size).toBe(users.length);
    expect(new Set(todos.map((todo) => todo.id)).size).toBe(todos.length);
    for (const todo of todos) expect(userIds.has(todo.assigneeId)).toBe(true);
  });

  it("N-7: load distribution is skewed (empty users, heavy users, mostly small)", () => {
    const { users, todos } = generateDataset("load");
    const counts = countByUser(todos);
    const perUser = users.map((user) => counts.get(user.id) ?? 0);
    expect(perUser.filter((count) => count === 0).length).toBeGreaterThan(0);
    expect(
      perUser.filter((count) => count >= 200).length
    ).toBeGreaterThanOrEqual(3);
    expect(perUser.filter((count) => count < 10).length).toBeGreaterThan(
      users.length / 2
    );
  });

  it("N-7: about 30% of todos are done", () => {
    const { todos } = generateDataset("load");
    const ratio = todos.filter((todo) => todo.done).length / todos.length;
    expect(ratio).toBeGreaterThan(0.27);
    expect(ratio).toBeLessThan(0.33);
  });

  it("N-7: createdAt spans about two years and contains ties", () => {
    for (const profile of ["small", "load"] as const) {
      const { todos } = generateDataset(profile);
      const times = todos.map((todo) => todo.createdAtMs);
      const tied = times.length - new Set(times).size;
      expect(tied).toBeGreaterThan(0);
      for (const todo of todos) {
        expect(todo.createdAt).toBe(new Date(todo.createdAtMs).toISOString());
      }
    }
    const times = generateDataset("load").todos.map((todo) => todo.createdAtMs);
    const spanDays = (Math.max(...times) - Math.min(...times)) / 86_400_000;
    expect(spanDays).toBeGreaterThan(600);
    expect(spanDays).toBeLessThanOrEqual(731);
  });
});

import { describe, expect, it } from "vitest";
import {
  assigneeIdSchema,
  createTodoSchema,
  todoTitleSchema,
  todosSearchSchema,
} from "./todo.schema";

describe("todoTitleSchema", () => {
  it("T-2: requires a title after trim", () => {
    for (const value of ["", "   "]) {
      const result = todoTitleSchema.safeParse(value);
      expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
        "Title is required"
      );
    }
  });

  it("T-2: accepts 1 to 120 characters after trim", () => {
    expect(todoTitleSchema.parse("  Buy milk ")).toBe("Buy milk");
    expect(todoTitleSchema.parse("a".repeat(120))).toBe("a".repeat(120));
    expect(todoTitleSchema.parse(` ${"a".repeat(120)} `)).toBe("a".repeat(120));
  });

  it("T-2: rejects more than 120 characters", () => {
    const result = todoTitleSchema.safeParse("a".repeat(121));
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      "Title must be at most 120 characters"
    );
  });
});

describe("assigneeIdSchema", () => {
  it("T-2: requires an assignee id", () => {
    const result = assigneeIdSchema.safeParse("  ");
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      "Assignee is required"
    );
  });

  it("T-2: rejects ids with an invalid format", () => {
    const result = assigneeIdSchema.safeParse("not valid!");
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      "Use a valid user ID"
    );
  });

  it("T-2: accepts and trims a valid id", () => {
    expect(assigneeIdSchema.parse(" user-12 ")).toBe("user-12");
  });

  it("T-2: createTodoSchema parses a form value", () => {
    expect(
      createTodoSchema.parse({ title: " Write ", assigneeId: "user-1" })
    ).toEqual({ title: "Write", assigneeId: "user-1" });
  });
});

describe("todosSearchSchema", () => {
  const defaults = {
    userIds: [],
    page: 1,
    pageSize: 5,
    sort: "createdAt.desc",
  };

  it("R-2: applies defaults for an empty search", () => {
    expect(todosSearchSchema.parse({})).toEqual(defaults);
  });

  it("R-2: falls back to defaults for non-object input", () => {
    expect(todosSearchSchema.parse(undefined)).toEqual(defaults);
    expect(todosSearchSchema.parse("garbage")).toEqual(defaults);
  });

  it("T-11: accepts userIds as an array, a single value or a number", () => {
    expect(todosSearchSchema.parse({ userIds: ["a", "b"] }).userIds).toEqual([
      "a",
      "b",
    ]);
    expect(todosSearchSchema.parse({ userIds: "a" }).userIds).toEqual(["a"]);
    expect(todosSearchSchema.parse({ userIds: 12 }).userIds).toEqual(["12"]);
  });

  it("R-2: drops invalid userIds and falls back to an empty list for garbage", () => {
    expect(
      todosSearchSchema.parse({ userIds: ["a", "bad id!", null, {}, "a", "b"] })
        .userIds
    ).toEqual(["a", "b"]);
    expect(todosSearchSchema.parse({ userIds: { x: 1 } }).userIds).toEqual([]);
    expect(todosSearchSchema.parse({ userIds: null }).userIds).toEqual([]);
  });

  it("T-12: page must be an integer >= 1, else falls back to 1", () => {
    expect(todosSearchSchema.parse({ page: 3 }).page).toBe(3);
    expect(todosSearchSchema.parse({ page: "4" }).page).toBe(4);
    for (const page of [0, -2, 1.5, "abc", null, NaN]) {
      expect(todosSearchSchema.parse({ page }).page).toBe(1);
    }
  });

  it("T-12: pageSize must be 5, 10 or 25, else falls back to 5", () => {
    for (const pageSize of [5, 10, 25]) {
      expect(todosSearchSchema.parse({ pageSize }).pageSize).toBe(pageSize);
    }
    expect(todosSearchSchema.parse({ pageSize: "10" }).pageSize).toBe(10);
    for (const pageSize of [0, 7, 100, "abc", null]) {
      expect(todosSearchSchema.parse({ pageSize }).pageSize).toBe(5);
    }
  });

  it("T-13: sort accepts createdAt.desc and createdAt.asc, else desc", () => {
    expect(todosSearchSchema.parse({ sort: "createdAt.asc" }).sort).toBe(
      "createdAt.asc"
    );
    expect(todosSearchSchema.parse({ sort: "title.asc" }).sort).toBe(
      "createdAt.desc"
    );
    expect(todosSearchSchema.parse({ sort: 3 }).sort).toBe("createdAt.desc");
  });

  it("R-2: strips unknown keys", () => {
    expect(todosSearchSchema.parse({ extra: 1 })).toEqual(defaults);
  });
});

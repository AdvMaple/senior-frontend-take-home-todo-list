import { describe, expect, it } from "vitest";
import { hashKey } from "@tanstack/react-query";
import { todoKeys } from "./todo.keys";
import { userKeys } from "./user.keys";

function startsWith(key: readonly unknown[], prefix: readonly unknown[]) {
  return prefix.every(
    (part, index) => hashKey([part]) === hashKey([key[index]])
  );
}

describe("todoKeys", () => {
  const params = {
    userIds: ["b", "a"],
    page: 2,
    pageSize: 10,
    sort: "createdAt.desc",
  } as const;

  it("A-7: is hierarchical (all > lists > list, all > details > detail)", () => {
    expect(startsWith(todoKeys.lists(), todoKeys.all)).toBe(true);
    expect(startsWith(todoKeys.list(params), todoKeys.lists())).toBe(true);
    expect(startsWith(todoKeys.details(), todoKeys.all)).toBe(true);
    expect(startsWith(todoKeys.detail("t1"), todoKeys.details())).toBe(true);
    expect(startsWith(todoKeys.detail("t1"), todoKeys.lists())).toBe(false);
  });

  it("A-7: is deterministic regardless of userIds order and duplicates", () => {
    const reordered = { ...params, userIds: ["a", "b", "a"] };
    expect(hashKey(todoKeys.list(params))).toBe(
      hashKey(todoKeys.list(reordered))
    );
  });

  it("A-7: differs when any filter changes", () => {
    const base = hashKey(todoKeys.list(params));
    expect(hashKey(todoKeys.list({ ...params, page: 3 }))).not.toBe(base);
    expect(hashKey(todoKeys.list({ ...params, pageSize: 5 }))).not.toBe(base);
    expect(
      hashKey(todoKeys.list({ ...params, sort: "createdAt.asc" }))
    ).not.toBe(base);
    expect(hashKey(todoKeys.list({ ...params, userIds: ["a"] }))).not.toBe(
      base
    );
  });

  it("A-7: does not mutate the caller's userIds", () => {
    const userIds = ["b", "a"];
    todoKeys.list({ ...params, userIds });
    expect(userIds).toEqual(["b", "a"]);
  });
});

describe("userKeys", () => {
  it("A-7: is hierarchical (all > lists > list, all > details > detail)", () => {
    const filters = { search: "al", limit: 20 };
    expect(startsWith(userKeys.lists(), userKeys.all)).toBe(true);
    expect(startsWith(userKeys.list(filters), userKeys.lists())).toBe(true);
    expect(startsWith(userKeys.details(), userKeys.all)).toBe(true);
    expect(startsWith(userKeys.detail("u1"), userKeys.details())).toBe(true);
  });

  it("A-7: is deterministic for equal filters and differs otherwise", () => {
    expect(hashKey(userKeys.list({ search: "a", limit: 20 }))).toBe(
      hashKey(userKeys.list({ limit: 20, search: "a" }))
    );
    expect(hashKey(userKeys.list({ search: "a", limit: 20 }))).not.toBe(
      hashKey(userKeys.list({ search: "b", limit: 20 }))
    );
  });

  it("A-7: user and todo key roots do not overlap", () => {
    expect(userKeys.all).not.toEqual(todoKeys.all);
  });
});

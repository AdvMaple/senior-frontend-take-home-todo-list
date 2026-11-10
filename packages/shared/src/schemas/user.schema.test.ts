import { describe, expect, it } from "vitest";
import { createUserSchema, usernameSchema } from "./user.schema";

function firstMessage(value: unknown): string | undefined {
  const result = usernameSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("usernameSchema", () => {
  it("U-2: rejects an empty or blank username as required", () => {
    expect(firstMessage("")).toBe("Username is required");
    expect(firstMessage("   ")).toBe("Username is required");
  });

  it("U-2: rejects fewer than 3 characters", () => {
    expect(firstMessage("ab")).toBe("Username must be at least 3 characters");
  });

  it("U-2: rejects more than 20 characters", () => {
    expect(firstMessage("a".repeat(21))).toBe(
      "Username must be at most 20 characters"
    );
  });

  it("U-2: rejects characters other than letters, digits, - and _", () => {
    for (const value of ["bad name", "bad.name", "naïve", "a@bcd"]) {
      expect(firstMessage(value)).toBe("Use letters, numbers, - or _ only");
    }
  });

  it("U-2: reports exactly one issue per invalid value", () => {
    const result = usernameSchema.safeParse("!");
    expect(result.success ? 0 : result.error.issues).toHaveLength(1);
  });

  it("U-2: accepts boundary lengths and allowed characters", () => {
    expect(usernameSchema.parse("abc")).toBe("abc");
    expect(usernameSchema.parse("a".repeat(20))).toBe("a".repeat(20));
    expect(usernameSchema.parse("Ab_c-9")).toBe("Ab_c-9");
  });

  it("U-2: trims surrounding whitespace before validating", () => {
    expect(usernameSchema.parse("  alice  ")).toBe("alice");
    expect(firstMessage(" ab ")).toBe("Username must be at least 3 characters");
  });

  it("U-2: createUserSchema parses a form value", () => {
    expect(createUserSchema.parse({ username: " bob " })).toEqual({
      username: "bob",
    });
  });
});

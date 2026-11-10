import { z } from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TODO_SORT,
  PAGE_SIZES,
  TITLE_MAX_LENGTH,
  TODO_SORTS,
} from "../todo.constants";
import type { TodosSearch } from "../todo.types";

export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const todoTitleSchema = z
  .string()
  .trim()
  .min(1, { error: "Title is required", abort: true })
  .max(TITLE_MAX_LENGTH, {
    error: `Title must be at most ${String(TITLE_MAX_LENGTH)} characters`,
  });

export const assigneeIdSchema = z
  .string()
  .trim()
  .min(1, { error: "Assignee is required", abort: true })
  .regex(ID_PATTERN, { error: "Use a valid user ID" });

export const createTodoSchema = z.object({
  title: todoTitleSchema,
  assigneeId: assigneeIdSchema,
});

/** Keeps string and number ids with a valid format; drops anything else. */
function normalizeUserIds(value: unknown): string[] {
  const candidates: unknown[] = Array.isArray(value) ? value : [value];
  const ids = new Set<string>();
  for (const candidate of candidates) {
    if (typeof candidate !== "string" && typeof candidate !== "number")
      continue;
    const id = String(candidate);
    if (ID_PATTERN.test(id)) ids.add(id);
  }
  return [...ids];
}

const searchObjectSchema = z.object({
  userIds: z.unknown().optional().transform(normalizeUserIds),
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .pipe(z.literal(PAGE_SIZES))
    .catch(DEFAULT_PAGE_SIZE),
  sort: z.enum(TODO_SORTS).catch(DEFAULT_TODO_SORT),
});

/** `/todos` search params; every invalid value falls back to its default (R-2). */
export const todosSearchSchema = z
  .unknown()
  .transform((value) =>
    typeof value === "object" && value !== null ? value : {}
  )
  .pipe(searchObjectSchema) satisfies z.ZodType<TodosSearch>;

import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1, { error: "Username is required", abort: true })
  .min(3, { error: "Username must be at least 3 characters", abort: true })
  .max(20, { error: "Username must be at most 20 characters", abort: true })
  .regex(/^[A-Za-z0-9_-]+$/, { error: "Use letters, numbers, - or _ only" });

export const createUserSchema = z.object({ username: usernameSchema });

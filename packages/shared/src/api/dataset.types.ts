import type { Todo } from "../todo.types";
import type { User } from "../user.types";

export type DatasetProfile = "small" | "demo" | "load";

export interface DatasetSize {
  users: number;
  todos: number;
}

export interface SeedTodo extends Todo {
  createdAtMs: number;
}

export interface Dataset {
  users: User[];
  todos: SeedTodo[];
}

import type { ReactNode } from "react";
import type { TodoListItem } from "../todo.types";

export interface TodoListProps {
  /** List of todos to display. */
  items: readonly TodoListItem[];
  /** Called when a todo's done state is toggled with the updated todo item. */
  onToggleDone: (item: TodoListItem) => void;
  /** Called after a user confirms deletion of a completed todo. */
  onDelete: (item: TodoListItem) => void;
  /** If true, disable done-toggle controls on all rows. */
  togglePending?: boolean;
  /** If true, disable delete controls on all rows. */
  deletePending?: boolean;
  /** Message to show when items list is empty. */
  emptyMessage?: string;
  /** Optional rendering slot for each todo's assignee. */
  renderAssignee?: (item: TodoListItem) => ReactNode;
  /** Optional CSS class to add to the container. */
  className?: string;
}
